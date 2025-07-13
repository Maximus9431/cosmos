import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Player API
export const playerAPI = {
  // Create or get player
  createOrGetPlayer: async (username) => {
    try {
      const response = await apiClient.post('/game/players', { username });
      return response.data;
    } catch (error) {
      console.error('Error creating/getting player:', error);
      throw error;
    }
  },

  // Get player by ID
  getPlayer: async (playerId) => {
    try {
      const response = await apiClient.get(`/game/players/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting player:', error);
      throw error;
    }
  },

  // Update player
  updatePlayer: async (playerId, updateData) => {
    try {
      const response = await apiClient.put(`/game/players/${playerId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  },

  // Get player stats
  getPlayerStats: async (playerId) => {
    try {
      const response = await apiClient.get(`/game/players/${playerId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw error;
    }
  },

  // Get player achievements
  getPlayerAchievements: async (playerId) => {
    try {
      const response = await apiClient.get(`/game/players/${playerId}/achievements`);
      return response.data;
    } catch (error) {
      console.error('Error getting player achievements:', error);
      throw error;
    }
  }
};

// Game API
export const gameAPI = {
  // Start new game
  startGame: async (playerId, playerUsername) => {
    try {
      const response = await apiClient.post('/game/games', {
        player_id: playerId,
        player_username: playerUsername
      });
      return response.data;
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  },

  // Get game session
  getGame: async (gameId) => {
    try {
      const response = await apiClient.get(`/game/games/${gameId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting game:', error);
      throw error;
    }
  },

  // Update game session
  updateGame: async (gameId, updateData) => {
    try {
      const response = await apiClient.put(`/game/games/${gameId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  },

  // End game
  endGame: async (gameId, finalData) => {
    try {
      const response = await apiClient.post(`/game/games/${gameId}/end`, finalData);
      return response.data;
    } catch (error) {
      console.error('Error ending game:', error);
      throw error;
    }
  }
};

// Leaderboard API
export const leaderboardAPI = {
  // Get leaderboard
  getLeaderboard: async (limit = 10, skip = 0, playerId = null) => {
    try {
      const params = { limit, skip };
      if (playerId) params.player_id = playerId;
      
      const response = await apiClient.get('/game/leaderboard', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
};

// Achievement API
export const achievementAPI = {
  // Get all achievements
  getAchievements: async (playerId = null) => {
    try {
      const params = playerId ? { player_id: playerId } : {};
      const response = await apiClient.get('/game/achievements', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw error;
    }
  }
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      success: false,
      message: data.detail || `Server error: ${status}`,
      status
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      success: false,
      message: 'Network error: Unable to connect to server',
      status: 0
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: `Error: ${error.message}`,
      status: 0
    };
  }
};

// Test API connection
export const testConnection = async () => {
  try {
    const response = await apiClient.get('/health');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export default apiClient;