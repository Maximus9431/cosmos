import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
players_collection = db.players
game_sessions_collection = db.game_sessions
scores_collection = db.scores
achievements_collection = db.achievements
player_achievements_collection = db.player_achievements

async def init_achievements():
    """Initialize default achievements in the database"""
    
    # Check if achievements already exist
    existing_count = await achievements_collection.count_documents({})
    if existing_count > 0:
        return
    
    default_achievements = [
        {
            "id": "first_blood",
            "name": "First Blood",
            "description": "Destroy your first enemy",
            "icon": "🎯",
            "category": "combat",
            "requirement_type": "enemies_destroyed",
            "requirement_value": 1,
            "points": 10,
            "is_hidden": False,
            "created_at": datetime.utcnow()
        },
        {
            "id": "asteroid_crusher",
            "name": "Asteroid Crusher",
            "description": "Destroy 50 asteroids",
            "icon": "☄️",
            "category": "combat",
            "requirement_type": "asteroids_destroyed",
            "requirement_value": 50,
            "points": 25,
            "is_hidden": False,
            "created_at": datetime.utcnow()
        },
        {
            "id": "survivor",
            "name": "Survivor",
            "description": "Survive for 2 minutes",
            "icon": "⏱️",
            "category": "survival",
            "requirement_type": "game_duration",
            "requirement_value": 120,
            "points": 20,
            "is_hidden": False,
            "created_at": datetime.utcnow()
        },
        {
            "id": "power_collector",
            "name": "Power Collector",
            "description": "Collect 20 power-ups",
            "icon": "⚡",
            "category": "collection",
            "requirement_type": "powerups_collected",
            "requirement_value": 20,
            "points": 15,
            "is_hidden": False,
            "created_at": datetime.utcnow()
        },
        {
            "id": "score_master",
            "name": "Score Master",
            "description": "Reach 10,000 points",
            "icon": "🏆",
            "category": "score",
            "requirement_type": "score",
            "requirement_value": 10000,
            "points": 50,
            "is_hidden": False,
            "created_at": datetime.utcnow()
        },
        {
            "id": "legendary",
            "name": "Legendary",
            "description": "Reach 25,000 points",
            "icon": "👑",
            "category": "score",
            "requirement_type": "score",
            "requirement_value": 25000,
            "points": 100,
            "is_hidden": False,
            "created_at": datetime.utcnow()
        },
        {
            "id": "wave_warrior",
            "name": "Wave Warrior",
            "description": "Reach Wave 10",
            "icon": "🌊",
            "category": "survival",
            "requirement_type": "wave",
            "requirement_value": 10,
            "points": 40,
            "is_hidden": False,
            "created_at": datetime.utcnow()
        },
        {
            "id": "speed_demon",
            "name": "Speed Demon",
            "description": "Reach 5,000 points in under 3 minutes",
            "icon": "⚡",
            "category": "score",
            "requirement_type": "score_time",
            "requirement_value": 5000,
            "points": 60,
            "is_hidden": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": "untouchable",
            "name": "Untouchable",
            "description": "Complete a game without taking damage",
            "icon": "🛡️",
            "category": "survival",
            "requirement_type": "no_damage",
            "requirement_value": 1,
            "points": 75,
            "is_hidden": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": "destroyer",
            "name": "Destroyer",
            "description": "Destroy 100 enemies",
            "icon": "💥",
            "category": "combat",
            "requirement_type": "enemies_destroyed",
            "requirement_value": 100,
            "points": 50,
            "is_hidden": False,
            "created_at": datetime.utcnow()
        }
    ]
    
    await achievements_collection.insert_many(default_achievements)
    print("✅ Default achievements initialized")

async def get_player_by_username(username: str):
    """Get player by username"""
    return await players_collection.find_one({"username": username})

async def create_player(player_data: dict):
    """Create a new player"""
    result = await players_collection.insert_one(player_data)
    return await players_collection.find_one({"_id": result.inserted_id})

async def update_player(player_id: str, update_data: dict):
    """Update player data"""
    await players_collection.update_one(
        {"id": player_id},
        {"$set": update_data}
    )
    return await players_collection.find_one({"id": player_id})

async def get_leaderboard(limit: int = 10, skip: int = 0):
    """Get leaderboard with top scores"""
    pipeline = [
        {"$sort": {"score": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    scores = await scores_collection.aggregate(pipeline).to_list(length=limit)
    
    # Add rank to each entry
    for idx, score in enumerate(scores):
        score['rank'] = skip + idx + 1
    
    return scores

async def get_player_rank(player_id: str):
    """Get player's rank on leaderboard"""
    player_best = await scores_collection.find_one(
        {"player_id": player_id}, 
        sort=[("score", -1)]
    )
    
    if not player_best:
        return None
    
    # Count how many scores are higher
    higher_scores = await scores_collection.count_documents(
        {"score": {"$gt": player_best["score"]}}
    )
    
    return higher_scores + 1

async def check_achievements(player_id: str, game_session: dict):
    """Check if player has unlocked any achievements"""
    player = await players_collection.find_one({"id": player_id})
    if not player:
        return []
    
    # Get all achievements
    achievements = await achievements_collection.find({}).to_list(length=None)
    
    # Get already unlocked achievements
    unlocked = await player_achievements_collection.find(
        {"player_id": player_id}
    ).to_list(length=None)
    
    unlocked_ids = [ua["achievement_id"] for ua in unlocked]
    new_achievements = []
    
    for achievement in achievements:
        if achievement["id"] in unlocked_ids:
            continue
        
        # Check if achievement is unlocked
        req_type = achievement["requirement_type"]
        req_value = achievement["requirement_value"]
        
        unlocked = False
        
        if req_type == "enemies_destroyed":
            unlocked = player.get("total_enemies_destroyed", 0) >= req_value
        elif req_type == "asteroids_destroyed":
            unlocked = player.get("total_asteroids_destroyed", 0) >= req_value
        elif req_type == "powerups_collected":
            unlocked = player.get("total_powerups_collected", 0) >= req_value
        elif req_type == "score":
            unlocked = player.get("best_score", 0) >= req_value
        elif req_type == "game_duration":
            unlocked = game_session.get("game_duration", 0) >= req_value
        elif req_type == "wave":
            unlocked = game_session.get("max_wave", 1) >= req_value
        elif req_type == "score_time":
            # Speed achievement: score in time
            if (game_session.get("final_score", 0) >= req_value and 
                game_session.get("game_duration", 0) <= 180):
                unlocked = True
        elif req_type == "no_damage":
            # Perfect game achievement
            if game_session.get("final_score", 0) > 0:
                unlocked = True  # Simplified for now
        
        if unlocked:
            # Add achievement to player
            achievement_data = {
                "player_id": player_id,
                "achievement_id": achievement["id"],
                "unlocked_at": datetime.utcnow(),
                "game_session_id": game_session.get("id")
            }
            
            await player_achievements_collection.insert_one(achievement_data)
            new_achievements.append(achievement)
    
    return new_achievements

async def get_player_achievements(player_id: str):
    """Get all achievements for a player with status"""
    # Get all achievements
    achievements = await achievements_collection.find({}).to_list(length=None)
    
    # Get player's unlocked achievements
    unlocked = await player_achievements_collection.find(
        {"player_id": player_id}
    ).to_list(length=None)
    
    unlocked_dict = {ua["achievement_id"]: ua for ua in unlocked}
    
    result = []
    for achievement in achievements:
        is_unlocked = achievement["id"] in unlocked_dict
        achievement_data = {
            **achievement,
            "unlocked": is_unlocked,
            "unlocked_at": unlocked_dict.get(achievement["id"], {}).get("unlocked_at") if is_unlocked else None
        }
        result.append(achievement_data)
    
    return result

async def get_game_stats(player_id: str):
    """Get comprehensive game statistics for a player"""
    player = await players_collection.find_one({"id": player_id})
    if not player:
        return None
    
    # Get recent games
    recent_games = await game_sessions_collection.find(
        {"player_id": player_id, "status": "completed"}
    ).sort("start_time", -1).limit(5).to_list(length=5)
    
    # Get achievements
    achievements = await get_player_achievements(player_id)
    unlocked_count = len([a for a in achievements if a["unlocked"]])
    
    # Calculate stats
    total_games = player.get("total_games", 0)
    total_score = player.get("total_score", 0)
    average_score = total_score / total_games if total_games > 0 else 0
    
    stats = {
        "total_games": total_games,
        "total_score": total_score,
        "best_score": player.get("best_score", 0),
        "average_score": average_score,
        "total_playtime": player.get("total_playtime", 0),
        "total_enemies_destroyed": player.get("total_enemies_destroyed", 0),
        "total_asteroids_destroyed": player.get("total_asteroids_destroyed", 0),
        "total_powerups_collected": player.get("total_powerups_collected", 0),
        "best_wave": player.get("best_wave", 1),
        "favorite_powerup": player.get("favorite_powerup"),
        "win_rate": 0.0,  # Can be calculated based on game outcomes
        "achievements_unlocked": unlocked_count,
        "total_achievements": len(achievements),
        "recent_games": recent_games,
        "achievements": achievements
    }
    
    return stats