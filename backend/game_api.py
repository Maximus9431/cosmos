from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import asyncio

from models import (
    Player, PlayerCreate, PlayerUpdate,
    GameSession, GameSessionCreate, GameSessionUpdate,
    Score, ScoreCreate,
    LeaderboardEntry, LeaderboardResponse,
    Achievement, AchievementWithStatus,
    GameStats, DetailedStats
)
from database import (
    players_collection, game_sessions_collection, scores_collection,
    achievements_collection, player_achievements_collection,
    get_player_by_username, create_player, update_player,
    get_leaderboard, get_player_rank, check_achievements,
    get_player_achievements, get_game_stats, init_achievements
)

router = APIRouter()

# Initialize achievements on startup
asyncio.create_task(init_achievements())

@router.post("/players", response_model=Player)
async def create_or_get_player(player_data: PlayerCreate):
    """Create a new player or get existing player"""
    # Check if player exists
    existing_player = await get_player_by_username(player_data.username)
    if existing_player:
        return Player(**existing_player)
    
    # Create new player
    new_player = Player(**player_data.dict())
    await create_player(new_player.dict())
    return new_player

@router.get("/players/{player_id}", response_model=Player)
async def get_player(player_id: str):
    """Get player by ID"""
    player = await players_collection.find_one({"id": player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return Player(**player)

@router.put("/players/{player_id}", response_model=Player)
async def update_player_data(player_id: str, player_data: PlayerUpdate):
    """Update player data"""
    player = await players_collection.find_one({"id": player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    update_data = {k: v for k, v in player_data.dict().items() if v is not None}
    updated_player = await update_player(player_id, update_data)
    return Player(**updated_player)

@router.post("/games", response_model=GameSession)
async def start_game(game_data: GameSessionCreate):
    """Start a new game session"""
    # Verify player exists
    player = await players_collection.find_one({"id": game_data.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Create new game session
    new_game = GameSession(**game_data.dict())
    await game_sessions_collection.insert_one(new_game.dict())
    return new_game

@router.get("/games/{game_id}", response_model=GameSession)
async def get_game(game_id: str):
    """Get game session by ID"""
    game = await game_sessions_collection.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game session not found")
    return GameSession(**game)

@router.put("/games/{game_id}", response_model=GameSession)
async def update_game(game_id: str, game_data: GameSessionUpdate):
    """Update game session"""
    game = await game_sessions_collection.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game session not found")
    
    update_data = {k: v for k, v in game_data.dict().items() if v is not None}
    
    await game_sessions_collection.update_one(
        {"id": game_id},
        {"$set": update_data}
    )
    
    updated_game = await game_sessions_collection.find_one({"id": game_id})
    return GameSession(**updated_game)

@router.post("/games/{game_id}/end")
async def end_game(game_id: str, final_data: GameSessionUpdate):
    """End a game session and process final score"""
    game = await game_sessions_collection.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game session not found")
    
    # Update game session
    update_data = {
        **{k: v for k, v in final_data.dict().items() if v is not None},
        "end_time": datetime.utcnow(),
        "status": "completed"
    }
    
    await game_sessions_collection.update_one(
        {"id": game_id},
        {"$set": update_data}
    )
    
    # Get updated game session
    updated_game = await game_sessions_collection.find_one({"id": game_id})
    
    # Create score entry
    score_data = ScoreCreate(
        player_id=game["player_id"],
        player_username=game["player_username"],
        game_session_id=game_id,
        score=update_data.get("final_score", 0),
        wave=update_data.get("max_wave", 1),
        powerups_collected=update_data.get("powerups_collected", 0),
        enemies_destroyed=update_data.get("enemies_destroyed", 0),
        asteroids_destroyed=update_data.get("asteroids_destroyed", 0),
        game_duration=update_data.get("game_duration", 0)
    )
    
    new_score = Score(**score_data.dict())
    await scores_collection.insert_one(new_score.dict())
    
    # Update player statistics
    player = await players_collection.find_one({"id": game["player_id"]})
    if player:
        player_updates = {
            "total_games": player.get("total_games", 0) + 1,
            "total_score": player.get("total_score", 0) + update_data.get("final_score", 0),
            "total_playtime": player.get("total_playtime", 0) + update_data.get("game_duration", 0),
            "total_enemies_destroyed": player.get("total_enemies_destroyed", 0) + update_data.get("enemies_destroyed", 0),
            "total_asteroids_destroyed": player.get("total_asteroids_destroyed", 0) + update_data.get("asteroids_destroyed", 0),
            "total_powerups_collected": player.get("total_powerups_collected", 0) + update_data.get("powerups_collected", 0),
            "last_played": datetime.utcnow()
        }
        
        # Update best score if needed
        if update_data.get("final_score", 0) > player.get("best_score", 0):
            player_updates["best_score"] = update_data.get("final_score", 0)
        
        # Update best wave if needed
        if update_data.get("max_wave", 1) > player.get("best_wave", 1):
            player_updates["best_wave"] = update_data.get("max_wave", 1)
        
        await update_player(game["player_id"], player_updates)
    
    # Check for new achievements
    new_achievements = await check_achievements(game["player_id"], updated_game)
    
    # Get player's rank
    player_rank = await get_player_rank(game["player_id"])
    
    return {
        "game_session": GameSession(**updated_game),
        "score": new_score,
        "new_achievements": new_achievements,
        "player_rank": player_rank,
        "success": True
    }

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard_data(limit: int = 10, skip: int = 0, player_id: Optional[str] = None):
    """Get leaderboard with optional player rank"""
    # Get top scores
    top_scores = await get_leaderboard(limit, skip)
    
    # Convert to LeaderboardEntry objects
    entries = []
    for score in top_scores:
        entry = LeaderboardEntry(
            rank=score["rank"],
            player_id=score["player_id"],
            player_username=score["player_username"],
            score=score["score"],
            wave=score["wave"],
            game_duration=score["game_duration"],
            created_at=score["created_at"]
        )
        entries.append(entry)
    
    # Get total entries count
    total_entries = await scores_collection.count_documents({})
    
    # Get user rank if player_id provided
    user_rank = None
    user_best_score = None
    if player_id:
        user_rank = await get_player_rank(player_id)
        user_best = await scores_collection.find_one(
            {"player_id": player_id},
            sort=[("score", -1)]
        )
        if user_best:
            user_best_score = user_best["score"]
    
    return LeaderboardResponse(
        entries=entries,
        total_entries=total_entries,
        user_rank=user_rank,
        user_best_score=user_best_score
    )

@router.get("/players/{player_id}/stats", response_model=DetailedStats)
async def get_player_stats(player_id: str):
    """Get detailed player statistics"""
    player = await players_collection.find_one({"id": player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    stats = await get_game_stats(player_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Stats not found")
    
    return DetailedStats(
        player=Player(**player),
        game_stats=GameStats(**{k: v for k, v in stats.items() if k not in ["recent_games", "achievements"]}),
        powerup_stats=[],  # Can be implemented later
        recent_games=[GameSession(**game) for game in stats["recent_games"]],
        achievements=[AchievementWithStatus(**achievement) for achievement in stats["achievements"]]
    )

@router.get("/achievements", response_model=List[AchievementWithStatus])
async def get_achievements(player_id: Optional[str] = None):
    """Get all achievements, optionally with player progress"""
    if player_id:
        achievements = await get_player_achievements(player_id)
        return [AchievementWithStatus(**achievement) for achievement in achievements]
    else:
        achievements = await achievements_collection.find({}).to_list(length=None)
        return [AchievementWithStatus(**{**achievement, "unlocked": False}) for achievement in achievements]

@router.get("/players/{player_id}/achievements", response_model=List[AchievementWithStatus])
async def get_player_achievements_endpoint(player_id: str):
    """Get player's achievements with unlock status"""
    achievements = await get_player_achievements(player_id)
    return [AchievementWithStatus(**achievement) for achievement in achievements]