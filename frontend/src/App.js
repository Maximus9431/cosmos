import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainMenu from "./components/MainMenu";
import Instructions from "./components/Instructions";
import GameEngine from "./components/GameEngine";
import GameUI from "./components/GameUI";
import { saveScore } from "./data/mock";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";

function App() {
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'instructions', 'game'
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver'
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [powerUps, setPowerUps] = useState([]);
  const { toast } = useToast();

  // Game state handlers
  const handleStartGame = () => {
    setCurrentView('game');
    setGameState('playing');
    setScore(0);
    setHealth(100);
    setWave(1);
    setPowerUps([]);
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

  const handleRestartGame = () => {
    setGameState('playing');
    setScore(0);
    setHealth(100);
    setWave(1);
    setPowerUps([]);
  };

  const handleGameOver = async (finalScore) => {
    setGameState('gameOver');
    
    // Save score (using mock function for now)
    try {
      const result = await saveScore(finalScore);
      if (result.success) {
        toast({
          title: "Score Saved!",
          description: `You ranked #${result.rank} on the leaderboard!`,
        });
      }
    } catch (error) {
      console.error('Error saving score:', error);
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
