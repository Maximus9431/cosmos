import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

const GameUI = ({ 
  gameState, 
  score, 
  health, 
  wave, 
  onStartGame, 
  onPauseGame, 
  onResumeGame, 
  onRestartGame,
  onShowLeaderboard,
  onShowMenu,
  powerUps 
}) => {
  
  const formatScore = (score) => {
    return score.toLocaleString();
  };

  // Game HUD during gameplay
  if (gameState === 'playing') {
    return (
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
        <div className="flex justify-between items-start">
          {/* Left side - Score and Wave */}
          <div className="flex flex-col gap-2">
            <Card className="bg-black bg-opacity-50 border-cyan-500 border-opacity-50 p-3 pointer-events-auto">
              <div className="text-cyan-400 text-sm font-mono">SCORE</div>
              <div className="text-white text-2xl font-bold font-mono">{formatScore(score)}</div>
            </Card>
            <Card className="bg-black bg-opacity-50 border-purple-500 border-opacity-50 p-3 pointer-events-auto">
              <div className="text-purple-400 text-sm font-mono">WAVE</div>
              <div className="text-white text-xl font-bold font-mono">{wave}</div>
            </Card>
          </div>
          
          {/* Right side - Health and Controls */}
          <div className="flex flex-col gap-2 items-end">
            <Card className="bg-black bg-opacity-50 border-red-500 border-opacity-50 p-3 pointer-events-auto">
              <div className="text-red-400 text-sm font-mono mb-1">HEALTH</div>
              <Progress 
                value={health} 
                className="w-32 h-2" 
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                }}
              />
              <div className="text-white text-sm font-mono mt-1">{health}%</div>
            </Card>
            
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onPauseGame}
              className="bg-black bg-opacity-50 border-white border-opacity-50 text-white hover:bg-white hover:bg-opacity-20 pointer-events-auto"
            >
              PAUSE
            </Button>
          </div>
        </div>
        
        {/* Power-ups indicator */}
        {powerUps.length > 0 && (
          <div className="absolute top-24 right-4">
            <Card className="bg-black bg-opacity-50 border-yellow-500 border-opacity-50 p-2 pointer-events-auto">
              <div className="text-yellow-400 text-xs font-mono mb-1">ACTIVE POWER-UPS</div>
              <div className="flex flex-col gap-1">
                {powerUps.map((powerUp, index) => (
                  <div key={index} className="text-white text-xs font-mono">
                    {powerUp.type.toUpperCase()} ({powerUp.duration}s)
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
        
        {/* Mobile instructions */}
        <div className="md:hidden absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <Card className="bg-black bg-opacity-50 border-white border-opacity-30 p-2">
            <div className="text-white text-xs font-mono text-center">
              Use joystick to move • Tap shoot button to fire
            </div>
          </Card>
        </div>
        
        {/* Desktop instructions */}
        <div className="hidden md:block absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <Card className="bg-black bg-opacity-50 border-white border-opacity-30 p-2">
            <div className="text-white text-xs font-mono text-center">
              WASD/Arrow Keys to move • SPACE to shoot • ESC to pause
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Paused state
  if (gameState === 'paused') {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20">
        <Card className="bg-gray-900 border-cyan-500 p-8 text-center max-w-md">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4 font-mono">GAME PAUSED</h2>
          <div className="text-white text-lg font-mono mb-2">Score: {formatScore(score)}</div>
          <div className="text-white text-lg font-mono mb-6">Wave: {wave}</div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={onResumeGame}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 px-6 font-mono"
            >
              RESUME GAME
            </Button>
            <Button 
              onClick={onRestartGame}
              variant="outline"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold py-3 px-6 font-mono"
            >
              RESTART
            </Button>
            <Button 
              onClick={onShowMenu}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black font-bold py-3 px-6 font-mono"
            >
              MAIN MENU
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Game over state
  if (gameState === 'gameOver') {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-20">
        <Card className="bg-gray-900 border-red-500 p-8 text-center max-w-md">
          <h2 className="text-4xl font-bold text-red-400 mb-4 font-mono">GAME OVER</h2>
          <div className="text-white text-2xl font-mono mb-2">Final Score</div>
          <div className="text-cyan-400 text-4xl font-bold font-mono mb-4">{formatScore(score)}</div>
          <div className="text-white text-lg font-mono mb-6">Wave Reached: {wave}</div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={onRestartGame}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 px-6 font-mono"
            >
              PLAY AGAIN
            </Button>
            <Button 
              onClick={onShowLeaderboard}
              variant="outline"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold py-3 px-6 font-mono"
            >
              LEADERBOARD
            </Button>
            <Button 
              onClick={onShowMenu}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black font-bold py-3 px-6 font-mono"
            >
              MAIN MENU
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default GameUI;