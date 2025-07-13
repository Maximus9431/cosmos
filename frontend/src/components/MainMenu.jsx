import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { leaderboardAPI, playerAPI, achievementAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';

const MainMenu = ({ onStartGame, onShowInstructions, currentPlayer, apiConnected }) => {
  const [activeTab, setActiveTab] = useState('play');
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load data when tab changes or player changes
  useEffect(() => {
    if (apiConnected && currentPlayer) {
      loadData();
    }
  }, [activeTab, currentPlayer, apiConnected]);

  const loadData = async () => {
    if (!apiConnected || !currentPlayer) return;

    setLoading(true);
    try {
      switch (activeTab) {
        case 'leaderboard':
          await loadLeaderboard();
          break;
        case 'stats':
          await loadPlayerStats();
          break;
        case 'achievements':
          await loadAchievements();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await leaderboardAPI.getLeaderboard(10, 0, currentPlayer.id);
      setLeaderboard(data.entries || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load leaderboard data",
        variant: "destructive"
      });
    }
  };

  const loadPlayerStats = async () => {
    try {
      const data = await playerAPI.getPlayerStats(currentPlayer.id);
      setPlayerStats(data);
    } catch (error) {
      console.error('Error loading player stats:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load player statistics",
        variant: "destructive"
      });
    }
  };

  const loadAchievements = async () => {
    try {
      const data = await achievementAPI.getAchievements(currentPlayer.id);
      setAchievements(data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load achievements",
        variant: "destructive"
      });
    }
  };

  const formatScore = (score) => {
    return score?.toLocaleString() || '0';
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const renderLeaderboard = () => (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-cyan-400 font-mono mb-4">TOP PILOTS</h3>
      {loading ? (
        <div className="text-center text-gray-400 font-mono">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-gray-400 font-mono">No scores yet. Be the first to play!</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {leaderboard.map((entry, index) => (
            <Card key={entry.player_id} className="bg-gray-800 border-gray-600 p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-black' : 
                    index === 1 ? 'bg-gray-400 text-black' : 
                    index === 2 ? 'bg-orange-600 text-white' : 
                    'bg-gray-600 text-white'
                  }`}>
                    {entry.rank}
                  </div>
                  <div>
                    <div className="text-white font-mono font-bold">{entry.player_username}</div>
                    <div className="text-gray-400 text-sm font-mono">
                      Wave {entry.wave} • {formatTime(entry.game_duration)}
                    </div>
                  </div>
                </div>
                <div className="text-cyan-400 font-mono font-bold text-lg">
                  {formatScore(entry.score)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderStats = () => {
    if (loading) {
      return <div className="text-center text-gray-400 font-mono">Loading statistics...</div>;
    }

    if (!playerStats) {
      return <div className="text-center text-gray-400 font-mono">No statistics available</div>;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-cyan-400 font-mono mb-4">YOUR STATS</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gray-800 border-gray-600 p-4">
            <div className="text-gray-400 text-sm font-mono">GAMES PLAYED</div>
            <div className="text-white text-2xl font-bold font-mono">{playerStats.game_stats.total_games}</div>
          </Card>
          <Card className="bg-gray-800 border-gray-600 p-4">
            <div className="text-gray-400 text-sm font-mono">BEST SCORE</div>
            <div className="text-cyan-400 text-2xl font-bold font-mono">{formatScore(playerStats.game_stats.best_score)}</div>
          </Card>
          <Card className="bg-gray-800 border-gray-600 p-4">
            <div className="text-gray-400 text-sm font-mono">TOTAL SCORE</div>
            <div className="text-white text-2xl font-bold font-mono">{formatScore(playerStats.game_stats.total_score)}</div>
          </Card>
          <Card className="bg-gray-800 border-gray-600 p-4">
            <div className="text-gray-400 text-sm font-mono">AVERAGE</div>
            <div className="text-white text-2xl font-bold font-mono">{formatScore(Math.floor(playerStats.game_stats.average_score))}</div>
          </Card>
        </div>
        <Card className="bg-gray-800 border-gray-600 p-4">
          <div className="text-gray-400 text-sm font-mono">TOTAL PLAYTIME</div>
          <div className="text-white text-xl font-bold font-mono">{formatTime(playerStats.game_stats.total_playtime)}</div>
        </Card>
        <Card className="bg-gray-800 border-gray-600 p-4">
          <div className="text-gray-400 text-sm font-mono">BEST WAVE</div>
          <div className="text-yellow-400 text-xl font-bold font-mono">{playerStats.game_stats.best_wave}</div>
        </Card>
        <Card className="bg-gray-800 border-gray-600 p-4">
          <div className="text-gray-400 text-sm font-mono">ACHIEVEMENTS</div>
          <div className="text-green-400 text-xl font-bold font-mono">
            {playerStats.game_stats.achievements_unlocked} / {playerStats.game_stats.total_achievements}
          </div>
        </Card>
      </div>
    );
  };

  const renderAchievements = () => (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-cyan-400 font-mono mb-4">ACHIEVEMENTS</h3>
      {loading ? (
        <div className="text-center text-gray-400 font-mono">Loading achievements...</div>
      ) : achievements.length === 0 ? (
        <div className="text-center text-gray-400 font-mono">No achievements available</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className={`border p-4 ${
              achievement.unlocked 
                ? 'bg-gray-800 border-green-500' 
                : 'bg-gray-900 border-gray-600'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <div className={`font-mono font-bold ${
                      achievement.unlocked ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {achievement.name}
                    </div>
                    <div className="text-gray-400 text-sm font-mono">
                      {achievement.description}
                    </div>
                    {achievement.unlocked && achievement.unlocked_at && (
                      <div className="text-gray-500 text-xs font-mono">
                        Unlocked: {new Date(achievement.unlocked_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {achievement.unlocked ? (
                    <Badge className="bg-green-500 text-black font-mono">UNLOCKED</Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-600 text-gray-500 font-mono">LOCKED</Badge>
                  )}
                  <div className="text-yellow-400 text-sm font-mono">{achievement.points} pts</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Game Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono mb-2">
            COSMIC DEFENDER
          </h1>
          <p className="text-xl text-gray-300 font-mono">
            Defend the Galaxy • Destroy • Survive • Conquer
          </p>
          {currentPlayer && (
            <p className="text-sm text-gray-400 font-mono mt-2">
              Welcome, {currentPlayer.username}
            </p>
          )}
          {!apiConnected && (
            <p className="text-sm text-red-400 font-mono mt-2">
              ⚠️ Offline Mode - Limited functionality
            </p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border border-gray-600">
            <TabsTrigger 
              value="play" 
              className="font-mono data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              PLAY
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard" 
              className="font-mono data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              LEADERBOARD
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="font-mono data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              STATS
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="font-mono data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              ACHIEVEMENTS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="play" className="mt-6">
            <Card className="bg-gray-800 border-gray-600 p-8 text-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-cyan-400 font-mono mb-4">
                  READY FOR BATTLE?
                </h2>
                <p className="text-gray-300 font-mono text-lg">
                  Pilot your spaceship through waves of asteroids and enemy forces.
                  <br />
                  Collect power-ups and survive as long as possible!
                </p>
              </div>
              
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <Button 
                  onClick={onStartGame}
                  disabled={!currentPlayer}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-bold py-4 px-8 text-xl font-mono transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                >
                  START MISSION
                </Button>
                
                <Button 
                  onClick={onShowInstructions}
                  variant="outline"
                  className="border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black font-bold py-3 px-6 font-mono"
                >
                  HOW TO PLAY
                </Button>
              </div>
              
              {/* Feature highlights */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-yellow-400 text-2xl mb-2">⚡</div>
                  <div className="text-white font-mono font-bold">POWER-UPS</div>
                  <div className="text-gray-400 text-sm font-mono">Collect shields, rapid fire, and health boosts</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-red-400 text-2xl mb-2">🎯</div>
                  <div className="text-white font-mono font-bold">ENDLESS WAVES</div>
                  <div className="text-gray-400 text-sm font-mono">Face increasingly challenging enemy formations</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-cyan-400 text-2xl mb-2">🏆</div>
                  <div className="text-white font-mono font-bold">LEADERBOARDS</div>
                  <div className="text-gray-400 text-sm font-mono">Compete with players worldwide</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Card className="bg-gray-800 border-gray-600 p-6">
              {renderLeaderboard()}
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <Card className="bg-gray-800 border-gray-600 p-6">
              {renderStats()}
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <Card className="bg-gray-800 border-gray-600 p-6">
              {renderAchievements()}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainMenu;