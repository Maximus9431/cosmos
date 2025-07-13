import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainMenu from "./components/MainMenu";
import Instructions from "./components/Instructions";
import GameEngine from "./components/GameEngine";
import GameUI from "./components/GameUI";
import { playerAPI, gameAPI, leaderboardAPI, achievementAPI, testConnection } from "./services/api";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";

function App() {
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'instructions', 'game'
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver'
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [powerUps, setPowerUps] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentGameSession, setCurrentGameSession] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const { toast } = useToast();

  // Initialize player and test API connection
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Test API connection
    const connectionTest = await testConnection();
    if (connectionTest.success) {
      setApiConnected(true);
      console.log('✅ API Connected:', connectionTest.data);
    } else {
      setApiConnected(false);
      console.error('❌ API Connection Failed:', connectionTest.error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to game servers. Using offline mode.",
        variant: "destructive"
      });
    }

    // Initialize player (using a default username for now)
    await initializePlayer();
  };

  const initializePlayer = async () => {
    try {
      // For now, use a default username. In a real app, this would come from Telegram user data
      const defaultUsername = `Player_${Date.now().toString().slice(-6)}`;
      const player = await playerAPI.createOrGetPlayer(defaultUsername);
      setCurrentPlayer(player);
      console.log('✅ Player initialized:', player);
    } catch (error) {
      console.error('❌ Failed to initialize player:', error);
      toast({
        title: "Player Error",
        description: "Failed to initialize player data",
        variant: "destructive"
      });
    }
  };

  // Game state handlers
  const handleStartGame = async () => {
    if (!currentPlayer) {
      toast({
        title: "Error",
        description: "Player not initialized. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Start new game session
      const gameSession = await gameAPI.startGame(currentPlayer.id, currentPlayer.username);
      setCurrentGameSession(gameSession);
      
      setCurrentView('game');
      setGameState('playing');
      setScore(0);
      setHealth(100);
      setWave(1);
      setPowerUps([]);
      
      console.log('✅ Game started:', gameSession);
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      toast({
        title: "Game Error",
        description: "Failed to start game session",
        variant: "destructive"
      });
    }
  };

  const handleShowInstructions = () => {
    setCurrentView('instructions');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setGameState('menu');
  };

  const handlePauseGame = () => {
    setGameState('paused');
  };

  const handleResumeGame = () => {
    setGameState('playing');
  };

  const handleRestartGame = async () => {
    await handleStartGame(); // This will create a new game session
  };

  const handleGameOver = async (finalScore) => {
    setGameState('gameOver');
    
    if (!currentGameSession || !currentPlayer) {
      console.error('❌ No game session or player data available');
      return;
    }

    try {
      // End the game session
      const endGameData = {
        final_score: finalScore,
        max_wave: wave,
        powerups_collected: powerUps.length,
        enemies_destroyed: 0, // Would be tracked in real game
        asteroids_destroyed: 0, // Would be tracked in real game
        game_duration: Math.floor((Date.now() - new Date(currentGameSession.start_time).getTime()) / 1000)
      };

      const result = await gameAPI.endGame(currentGameSession.id, endGameData);
      
      if (result.success) {
        // Show achievements if any were unlocked
        if (result.new_achievements && result.new_achievements.length > 0) {
          result.new_achievements.forEach(achievement => {
            toast({
              title: "Achievement Unlocked!",
              description: `${achievement.name}: ${achievement.description}`,
            });
          });
        }

        // Show rank if available
        if (result.player_rank) {
          toast({
            title: "Score Saved!",
            description: `You ranked #${result.player_rank} on the leaderboard!`,
          });
        }

        console.log('✅ Game ended successfully:', result);
      }
    } catch (error) {
      console.error('❌ Failed to end game:', error);
      toast({
        title: "Save Error",
        description: "Failed to save game results",
        variant: "destructive"
      });
    }
  };

  const handleScoreUpdate = (newScore) => {
    setScore(newScore);
  };

  const handleHealthUpdate = (newHealth) => {
    setHealth(Math.max(0, newHealth));
  };

  const handleWaveUpdate = (newWave) => {
    setWave(newWave);
  };

  const handlePowerUpCollected = (powerUpType) => {
    // Add power-up to active list
    const newPowerUp = {
      id: Date.now(),
      type: powerUpType,
      duration: 10, // 10 seconds
      startTime: Date.now()
    };
    
    setPowerUps(prev => [...prev, newPowerUp]);
    
    // Apply power-up effects
    switch (powerUpType) {
      case 'health':
        setHealth(prev => Math.min(100, prev + 25));
        toast({
          title: "Health Restored!",
          description: "+25 Health",
        });
        break;
      case 'rapidFire':
        toast({
          title: "Rapid Fire!",
          description: "Faster shooting for 10 seconds",
        });
        break;
      case 'multiShot':
        toast({
          title: "Multi-Shot!",
          description: "Triple bullets for 10 seconds",
        });
        break;
      case 'shield':
        toast({
          title: "Shield Active!",
          description: "Temporary invincibility",
        });
        break;
      default:
        break;
    }
    
    // Remove power-up after duration
    setTimeout(() => {
      setPowerUps(prev => prev.filter(p => p.id !== newPowerUp.id));
    }, 10000);
  };

  const handleShowLeaderboard = () => {
    setCurrentView('menu');
    setGameState('menu');
  };

  // Handle ESC key for pause
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && gameState === 'playing') {
        handlePauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <MainMenu 
            onStartGame={handleStartGame}
            onShowInstructions={handleShowInstructions}
            currentPlayer={currentPlayer}
            apiConnected={apiConnected}
          />
        );
      case 'instructions':
        return (
          <Instructions 
            onBack={handleBackToMenu}
            onStartGame={handleStartGame}
          />
        );
      case 'game':
        return (
          <div className="relative w-full h-screen bg-black overflow-hidden">
            <GameEngine 
              gameState={gameState}
              onGameStateChange={setGameState}
              onScoreUpdate={handleScoreUpdate}
              onHealthUpdate={handleHealthUpdate}
              onPowerUpCollected={handlePowerUpCollected}
              onGameOver={handleGameOver}
            />
            <GameUI 
              gameState={gameState}
              score={score}
              health={health}
              wave={wave}
              powerUps={powerUps}
              onStartGame={handleStartGame}
              onPauseGame={handlePauseGame}
              onResumeGame={handleResumeGame}
              onRestartGame={handleRestartGame}
              onShowLeaderboard={handleShowLeaderboard}
              onShowMenu={handleBackToMenu}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={renderCurrentView()} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
