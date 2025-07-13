from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

# Player Models
class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_games: int = 0
    total_score: int = 0
    best_score: int = 0
    total_playtime: int = 0  # in seconds
    games_won: int = 0
    favorite_powerup: Optional[str] = None
    last_played: Optional[datetime] = None

class PlayerCreate(BaseModel):
    username: str

class PlayerUpdate(BaseModel):
    total_games: Optional[int] = None
    total_score: Optional[int] = None
    best_score: Optional[int] = None
    total_playtime: Optional[int] = None
    games_won: Optional[int] = None
    favorite_powerup: Optional[str] = None
    last_played: Optional[datetime] = None

# Game Session Models
class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    player_username: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    final_score: int = 0
    max_wave: int = 1
    powerups_collected: int = 0
    enemies_destroyed: int = 0
    asteroids_destroyed: int = 0
    game_duration: int = 0  # in seconds
    status: str = "active"  # active, completed, abandoned

class GameSessionCreate(BaseModel):
    player_id: str
    player_username: str

class GameSessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    final_score: Optional[int] = None
    max_wave: Optional[int] = None
    powerups_collected: Optional[int] = None
    enemies_destroyed: Optional[int] = None
    asteroids_destroyed: Optional[int] = None
    game_duration: Optional[int] = None
    status: Optional[str] = None

# Score Models
class Score(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    player_username: str
    game_session_id: str
    score: int
    wave: int
    powerups_collected: int
    enemies_destroyed: int
    asteroids_destroyed: int
    game_duration: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ScoreCreate(BaseModel):
    player_id: str
    player_username: str
    game_session_id: str
    score: int
    wave: int
    powerups_collected: int = 0
    enemies_destroyed: int = 0
    asteroids_destroyed: int = 0
    game_duration: int = 0

# Leaderboard Models
class LeaderboardEntry(BaseModel):
    rank: int
    player_id: str
    player_username: str
    score: int
    wave: int
    game_duration: int
    created_at: datetime

class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    total_entries: int
    user_rank: Optional[int] = None
    user_best_score: Optional[int] = None

# Achievement Models
class Achievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    category: str  # combat, survival, collection, score
    requirement_type: str  # score, kills, time, powerups
    requirement_value: int
    points: int
    is_hidden: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AchievementCreate(BaseModel):
    name: str
    description: str
    icon: str
    category: str
    requirement_type: str
    requirement_value: int
    points: int
    is_hidden: bool = False

class PlayerAchievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    achievement_id: str
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    game_session_id: Optional[str] = None

class PlayerAchievementCreate(BaseModel):
    player_id: str
    achievement_id: str
    game_session_id: Optional[str] = None

class AchievementWithStatus(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    requirement_type: str
    requirement_value: int
    points: int
    is_hidden: bool
    unlocked: bool
    unlocked_at: Optional[datetime] = None
    progress: Optional[int] = None  # Current progress towards achievement

# Statistics Models
class GameStats(BaseModel):
    total_games: int
    total_score: int
    best_score: int
    average_score: float
    total_playtime: int
    total_enemies_destroyed: int
    total_asteroids_destroyed: int
    total_powerups_collected: int
    best_wave: int
    favorite_powerup: Optional[str] = None
    win_rate: float
    achievements_unlocked: int
    total_achievements: int

class PowerUpStats(BaseModel):
    type: str
    collected_count: int
    
class DetailedStats(BaseModel):
    player: Player
    game_stats: GameStats
    powerup_stats: List[PowerUpStats]
    recent_games: List[GameSession]
    achievements: List[AchievementWithStatus]