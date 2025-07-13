// Mock data for the 3D Space Shooter game

export const mockLeaderboard = [
  { id: 1, name: "SpaceAce", score: 15420, date: "2025-01-15" },
  { id: 2, name: "CosmicHero", score: 12350, date: "2025-01-14" },
  { id: 3, name: "StarDestroyer", score: 9870, date: "2025-01-13" },
  { id: 4, name: "GalaxyGuard", score: 8750, date: "2025-01-12" },
  { id: 5, name: "NebulaRunner", score: 7650, date: "2025-01-11" },
  { id: 6, name: "VoidHunter", score: 6540, date: "2025-01-10" },
  { id: 7, name: "PlanetDefender", score: 5890, date: "2025-01-09" },
  { id: 8, name: "StellarPilot", score: 4320, date: "2025-01-08" },
  { id: 9, name: "CosmicWarrior", score: 3210, date: "2025-01-07" },
  { id: 10, name: "SpaceExplorer", score: 2100, date: "2025-01-06" }
];

export const mockPlayerStats = {
  gamesPlayed: 47,
  bestScore: 8750,
  totalScore: 85420,
  averageScore: 1817,
  totalTimePlayed: "2h 34m",
  favoritePowerUp: "Rapid Fire"
};

export const mockAchievements = [
  { id: 1, name: "First Blood", description: "Destroy your first enemy", unlocked: true },
  { id: 2, name: "Asteroid Crusher", description: "Destroy 50 asteroids", unlocked: true },
  { id: 3, name: "Survivor", description: "Survive for 2 minutes", unlocked: true },
  { id: 4, name: "Power Collector", description: "Collect 20 power-ups", unlocked: false },
  { id: 5, name: "Score Master", description: "Reach 10,000 points", unlocked: false },
  { id: 6, name: "Legendary", description: "Reach 25,000 points", unlocked: false }
];

// Mock functions for game data
export const saveScore = (score) => {
  console.log(`Mock: Saving score ${score} to backend`);
  return Promise.resolve({ success: true, rank: Math.floor(Math.random() * 10) + 1 });
};

export const getLeaderboard = () => {
  console.log("Mock: Fetching leaderboard from backend");
  return Promise.resolve(mockLeaderboard);
};

export const getPlayerStats = () => {
  console.log("Mock: Fetching player stats from backend");
  return Promise.resolve(mockPlayerStats);
};

export const getAchievements = () => {
  console.log("Mock: Fetching achievements from backend");
  return Promise.resolve(mockAchievements);
};