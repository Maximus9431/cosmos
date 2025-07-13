import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const Instructions = ({ onBack, onStartGame }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="bg-gray-800 border-gray-600 p-8">
          <h2 className="text-4xl font-bold text-cyan-400 font-mono mb-6 text-center">
            HOW TO PLAY
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Controls */}
            <div>
              <h3 className="text-2xl font-bold text-yellow-400 font-mono mb-4">CONTROLS</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-mono font-bold mb-2">DESKTOP</h4>
                  <div className="space-y-2 text-gray-300 font-mono">
                    <div>• <span className="text-cyan-400">WASD</span> or <span className="text-cyan-400">Arrow Keys</span> - Move spaceship</div>
                    <div>• <span className="text-cyan-400">SPACEBAR</span> - Shoot</div>
                    <div>• <span className="text-cyan-400">ESC</span> - Pause game</div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-mono font-bold mb-2">MOBILE</h4>
                  <div className="space-y-2 text-gray-300 font-mono">
                    <div>• <span className="text-cyan-400">Virtual Joystick</span> - Move spaceship</div>
                    <div>• <span className="text-cyan-400">Shoot Button</span> - Fire weapons</div>
                    <div>• <span className="text-cyan-400">Pause Button</span> - Pause game</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Game Objects */}
            <div>
              <h3 className="text-2xl font-bold text-yellow-400 font-mono mb-4">GAME OBJECTS</h3>
              
              <div className="space-y-3">
                <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    🚀
                  </div>
                  <div>
                    <div className="text-white font-mono font-bold">YOUR SPACESHIP</div>
                    <div className="text-gray-400 text-sm font-mono">Avoid collisions • Shoot enemies</div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                    ☄️
                  </div>
                  <div>
                    <div className="text-white font-mono font-bold">ASTEROIDS</div>
                    <div className="text-gray-400 text-sm font-mono">Destroy for points • Avoid collisions</div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    👾
                  </div>
                  <div>
                    <div className="text-white font-mono font-bold">ENEMY SHIPS</div>
                    <div className="text-gray-400 text-sm font-mono">Shoot back • More points • Avoid!</div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    ⚡
                  </div>
                  <div>
                    <div className="text-white font-mono font-bold">POWER-UPS</div>
                    <div className="text-gray-400 text-sm font-mono">Collect for special abilities</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Power-ups */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-yellow-400 font-mono mb-4">POWER-UPS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">❤️</div>
                <Badge className="bg-red-500 text-white font-mono mb-2">HEALTH</Badge>
                <div className="text-gray-300 text-sm font-mono">Restores 25 health points</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⚡</div>
                <Badge className="bg-yellow-500 text-black font-mono mb-2">RAPID FIRE</Badge>
                <div className="text-gray-300 text-sm font-mono">Faster shooting for 10 seconds</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🔥</div>
                <Badge className="bg-orange-500 text-white font-mono mb-2">MULTI-SHOT</Badge>
                <div className="text-gray-300 text-sm font-mono">Shoot 3 bullets at once</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🛡️</div>
                <Badge className="bg-blue-500 text-white font-mono mb-2">SHIELD</Badge>
                <div className="text-gray-300 text-sm font-mono">Temporary invincibility</div>
              </div>
            </div>
          </div>
          
          {/* Scoring */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-yellow-400 font-mono mb-4">SCORING</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl font-bold font-mono">10 pts</div>
                <div className="text-white font-mono">Destroy Asteroid</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl font-bold font-mono">50 pts</div>
                <div className="text-white font-mono">Destroy Enemy Ship</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl font-bold font-mono">25 pts</div>
                <div className="text-white font-mono">Collect Power-up</div>
              </div>
            </div>
          </div>
          
          {/* Tips */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-yellow-400 font-mono mb-4">SURVIVAL TIPS</h3>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 font-mono">
                <div>
                  <div className="text-cyan-400 font-bold">• Stay Mobile</div>
                  <div className="text-sm">Constant movement is key to survival</div>
                </div>
                <div>
                  <div className="text-cyan-400 font-bold">• Prioritize Health</div>
                  <div className="text-sm">Collect health power-ups when low</div>
                </div>
                <div>
                  <div className="text-cyan-400 font-bold">• Watch Your Flanks</div>
                  <div className="text-sm">Enemies can come from any direction</div>
                </div>
                <div>
                  <div className="text-cyan-400 font-bold">• Use Power-ups Wisely</div>
                  <div className="text-sm">Save shields for tough situations</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-8">
            <Button 
              onClick={onStartGame}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-bold py-3 px-8 text-lg font-mono transform hover:scale-105 transition-all duration-200"
            >
              START PLAYING
            </Button>
            <Button 
              onClick={onBack}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black font-bold py-3 px-6 font-mono"
            >
              BACK TO MENU
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Instructions;