#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Cosmic Defender Game
Tests all API endpoints including player management, game sessions, leaderboard, and achievements.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from environment
import os
from dotenv import load_dotenv
from pathlib import Path

# Load frontend .env to get backend URL
frontend_env_path = Path(__file__).parent / "frontend" / ".env"
if frontend_env_path.exists():
    load_dotenv(frontend_env_path)
    BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "http://localhost:8001")
else:
    BACKEND_URL = "http://localhost:8001"

API_BASE = f"{BACKEND_URL}/api"

class CosmicDefenderAPITester:
    def __init__(self):
        self.base_url = API_BASE
        self.test_results = []
        self.test_player_id = None
        self.test_game_id = None
        
    def log_test(self, test_name: str, success: bool, message: str, response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return response and success status"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, timeout=10)
            else:
                return None, False, f"Unsupported method: {method}"
                
            return response, True, None
        except requests.exceptions.RequestException as e:
            return None, False, str(e)
    
    def test_health_endpoints(self):
        """Test basic health and root endpoints"""
        print("\n=== Testing Health Endpoints ===")
        
        # Test root endpoint
        response, success, error = self.make_request("GET", "/")
        if success and response.status_code == 200:
            data = response.json()
            if "message" in data:
                self.log_test("Root Endpoint", True, f"Root endpoint working: {data['message']}")
            else:
                self.log_test("Root Endpoint", False, "Root endpoint missing message field")
        else:
            self.log_test("Root Endpoint", False, f"Root endpoint failed: {error or response.status_code}")
        
        # Test health endpoint
        response, success, error = self.make_request("GET", "/health")
        if success and response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                self.log_test("Health Check", True, f"Health check passed: {data}")
            else:
                self.log_test("Health Check", False, f"Health check returned unhealthy status: {data}")
        else:
            self.log_test("Health Check", False, f"Health endpoint failed: {error or response.status_code}")
    
    def test_player_management(self):
        """Test player creation, retrieval, and updates"""
        print("\n=== Testing Player Management ===")
        
        # Test player creation
        player_data = {"username": "CosmicWarrior2025"}
        response, success, error = self.make_request("POST", "/game/players", player_data)
        
        if success and response.status_code == 200:
            player = response.json()
            if "id" in player and "username" in player:
                self.test_player_id = player["id"]
                self.log_test("Create Player", True, f"Player created successfully: {player['username']} (ID: {player['id']})")
            else:
                self.log_test("Create Player", False, f"Player creation response missing required fields: {player}")
                return
        else:
            self.log_test("Create Player", False, f"Player creation failed: {error or response.status_code}")
            return
        
        # Test duplicate player creation (should return existing player)
        response, success, error = self.make_request("POST", "/game/players", player_data)
        if success and response.status_code == 200:
            duplicate_player = response.json()
            if duplicate_player["id"] == self.test_player_id:
                self.log_test("Duplicate Player Handling", True, "Duplicate player correctly returned existing player")
            else:
                self.log_test("Duplicate Player Handling", False, "Duplicate player created new ID instead of returning existing")
        else:
            self.log_test("Duplicate Player Handling", False, f"Duplicate player test failed: {error or response.status_code}")
        
        # Test get player by ID
        response, success, error = self.make_request("GET", f"/game/players/{self.test_player_id}")
        if success and response.status_code == 200:
            player = response.json()
            if player["id"] == self.test_player_id:
                self.log_test("Get Player by ID", True, f"Player retrieved successfully: {player['username']}")
            else:
                self.log_test("Get Player by ID", False, "Retrieved player has different ID")
        else:
            self.log_test("Get Player by ID", False, f"Get player failed: {error or response.status_code}")
        
        # Test get non-existent player
        response, success, error = self.make_request("GET", "/game/players/non-existent-id")
        if success and response.status_code == 404:
            self.log_test("Get Non-existent Player", True, "Non-existent player correctly returned 404")
        else:
            self.log_test("Get Non-existent Player", False, f"Non-existent player test failed: {response.status_code if success else error}")
        
        # Test player update
        update_data = {
            "total_games": 5,
            "best_score": 15000,
            "favorite_powerup": "shield"
        }
        response, success, error = self.make_request("PUT", f"/game/players/{self.test_player_id}", update_data)
        if success and response.status_code == 200:
            updated_player = response.json()
            if (updated_player.get("total_games") == 5 and 
                updated_player.get("best_score") == 15000 and
                updated_player.get("favorite_powerup") == "shield"):
                self.log_test("Update Player", True, "Player updated successfully")
            else:
                self.log_test("Update Player", False, f"Player update didn't apply correctly: {updated_player}")
        else:
            self.log_test("Update Player", False, f"Player update failed: {error or response.status_code}")
    
    def test_game_sessions(self):
        """Test game session management"""
        print("\n=== Testing Game Sessions ===")
        
        if not self.test_player_id:
            self.log_test("Game Sessions", False, "Cannot test game sessions without valid player ID")
            return
        
        # Test start game session
        game_data = {
            "player_id": self.test_player_id,
            "player_username": "CosmicWarrior2025"
        }
        response, success, error = self.make_request("POST", "/game/games", game_data)
        
        if success and response.status_code == 200:
            game = response.json()
            if "id" in game and game.get("status") == "active":
                self.test_game_id = game["id"]
                self.log_test("Start Game Session", True, f"Game session started: {game['id']}")
            else:
                self.log_test("Start Game Session", False, f"Game session response invalid: {game}")
                return
        else:
            self.log_test("Start Game Session", False, f"Start game failed: {error or response.status_code}")
            return
        
        # Test get game session
        response, success, error = self.make_request("GET", f"/game/games/{self.test_game_id}")
        if success and response.status_code == 200:
            game = response.json()
            if game["id"] == self.test_game_id:
                self.log_test("Get Game Session", True, f"Game session retrieved: {game['status']}")
            else:
                self.log_test("Get Game Session", False, "Retrieved game has different ID")
        else:
            self.log_test("Get Game Session", False, f"Get game failed: {error or response.status_code}")
        
        # Test update game session
        update_data = {
            "final_score": 8500,
            "max_wave": 7,
            "powerups_collected": 12,
            "enemies_destroyed": 45,
            "asteroids_destroyed": 23,
            "game_duration": 180
        }
        response, success, error = self.make_request("PUT", f"/game/games/{self.test_game_id}", update_data)
        if success and response.status_code == 200:
            updated_game = response.json()
            if updated_game.get("final_score") == 8500:
                self.log_test("Update Game Session", True, "Game session updated successfully")
            else:
                self.log_test("Update Game Session", False, f"Game update didn't apply: {updated_game}")
        else:
            self.log_test("Update Game Session", False, f"Game update failed: {error or response.status_code}")
        
        # Test end game session
        final_data = {
            "final_score": 12500,
            "max_wave": 9,
            "powerups_collected": 18,
            "enemies_destroyed": 67,
            "asteroids_destroyed": 34,
            "game_duration": 240
        }
        response, success, error = self.make_request("POST", f"/game/games/{self.test_game_id}/end", final_data)
        if success and response.status_code == 200:
            end_result = response.json()
            if (end_result.get("success") and 
                "game_session" in end_result and 
                "score" in end_result):
                self.log_test("End Game Session", True, f"Game ended successfully, score: {end_result['score']['score']}")
                
                # Check if achievements were unlocked
                if end_result.get("new_achievements"):
                    self.log_test("Achievement Unlocking", True, f"Achievements unlocked: {len(end_result['new_achievements'])}")
                else:
                    self.log_test("Achievement Unlocking", True, "No new achievements (expected for test data)")
                    
            else:
                self.log_test("End Game Session", False, f"End game response invalid: {end_result}")
        else:
            self.log_test("End Game Session", False, f"End game failed: {error or response.status_code}")
        
        # Test get non-existent game
        response, success, error = self.make_request("GET", "/game/games/non-existent-game")
        if success and response.status_code == 404:
            self.log_test("Get Non-existent Game", True, "Non-existent game correctly returned 404")
        else:
            self.log_test("Get Non-existent Game", False, f"Non-existent game test failed: {response.status_code if success else error}")
    
    def test_leaderboard(self):
        """Test leaderboard functionality"""
        print("\n=== Testing Leaderboard ===")
        
        # Test basic leaderboard
        response, success, error = self.make_request("GET", "/game/leaderboard")
        if success and response.status_code == 200:
            leaderboard = response.json()
            if ("entries" in leaderboard and 
                "total_entries" in leaderboard and
                isinstance(leaderboard["entries"], list)):
                self.log_test("Get Leaderboard", True, f"Leaderboard retrieved: {leaderboard['total_entries']} total entries")
            else:
                self.log_test("Get Leaderboard", False, f"Leaderboard response invalid: {leaderboard}")
        else:
            self.log_test("Get Leaderboard", False, f"Leaderboard failed: {error or response.status_code}")
        
        # Test leaderboard with parameters
        params = {"limit": 5, "skip": 0}
        response, success, error = self.make_request("GET", "/game/leaderboard", params=params)
        if success and response.status_code == 200:
            leaderboard = response.json()
            if len(leaderboard["entries"]) <= 5:
                self.log_test("Leaderboard with Limit", True, f"Limited leaderboard working: {len(leaderboard['entries'])} entries")
            else:
                self.log_test("Leaderboard with Limit", False, "Limit parameter not respected")
        else:
            self.log_test("Leaderboard with Limit", False, f"Limited leaderboard failed: {error or response.status_code}")
        
        # Test leaderboard with player rank
        if self.test_player_id:
            params = {"player_id": self.test_player_id}
            response, success, error = self.make_request("GET", "/game/leaderboard", params=params)
            if success and response.status_code == 200:
                leaderboard = response.json()
                if "user_rank" in leaderboard:
                    self.log_test("Leaderboard with Player Rank", True, f"Player rank retrieved: {leaderboard.get('user_rank')}")
                else:
                    self.log_test("Leaderboard with Player Rank", False, "Player rank not included in response")
            else:
                self.log_test("Leaderboard with Player Rank", False, f"Player rank leaderboard failed: {error or response.status_code}")
    
    def test_achievements(self):
        """Test achievement system"""
        print("\n=== Testing Achievements ===")
        
        # Test get all achievements
        response, success, error = self.make_request("GET", "/game/achievements")
        if success and response.status_code == 200:
            achievements = response.json()
            if isinstance(achievements, list) and len(achievements) > 0:
                self.log_test("Get All Achievements", True, f"Retrieved {len(achievements)} achievements")
            else:
                self.log_test("Get All Achievements", False, f"Invalid achievements response: {achievements}")
        else:
            self.log_test("Get All Achievements", False, f"Get achievements failed: {error or response.status_code}")
        
        # Test get achievements with player progress
        if self.test_player_id:
            params = {"player_id": self.test_player_id}
            response, success, error = self.make_request("GET", "/game/achievements", params=params)
            if success and response.status_code == 200:
                achievements = response.json()
                if isinstance(achievements, list):
                    unlocked_count = len([a for a in achievements if a.get("unlocked")])
                    self.log_test("Get Achievements with Progress", True, f"Player achievements: {unlocked_count} unlocked")
                else:
                    self.log_test("Get Achievements with Progress", False, "Invalid player achievements response")
            else:
                self.log_test("Get Achievements with Progress", False, f"Player achievements failed: {error or response.status_code}")
            
            # Test player-specific achievements endpoint
            response, success, error = self.make_request("GET", f"/game/players/{self.test_player_id}/achievements")
            if success and response.status_code == 200:
                achievements = response.json()
                if isinstance(achievements, list):
                    self.log_test("Get Player Achievements Endpoint", True, f"Player achievements endpoint working: {len(achievements)} achievements")
                else:
                    self.log_test("Get Player Achievements Endpoint", False, "Invalid player achievements endpoint response")
            else:
                self.log_test("Get Player Achievements Endpoint", False, f"Player achievements endpoint failed: {error or response.status_code}")
    
    def test_player_stats(self):
        """Test player statistics"""
        print("\n=== Testing Player Statistics ===")
        
        if not self.test_player_id:
            self.log_test("Player Stats", False, "Cannot test player stats without valid player ID")
            return
        
        response, success, error = self.make_request("GET", f"/game/players/{self.test_player_id}/stats")
        if success and response.status_code == 200:
            stats = response.json()
            required_fields = ["player", "game_stats", "recent_games", "achievements"]
            if all(field in stats for field in required_fields):
                game_stats = stats["game_stats"]
                self.log_test("Get Player Stats", True, 
                    f"Stats retrieved - Games: {game_stats.get('total_games')}, "
                    f"Best Score: {game_stats.get('best_score')}, "
                    f"Achievements: {game_stats.get('achievements_unlocked')}/{game_stats.get('total_achievements')}")
            else:
                missing = [f for f in required_fields if f not in stats]
                self.log_test("Get Player Stats", False, f"Missing required fields: {missing}")
        else:
            self.log_test("Get Player Stats", False, f"Get player stats failed: {error or response.status_code}")
        
        # Test stats for non-existent player
        response, success, error = self.make_request("GET", "/game/players/non-existent-id/stats")
        if success and response.status_code == 404:
            self.log_test("Get Non-existent Player Stats", True, "Non-existent player stats correctly returned 404")
        else:
            self.log_test("Get Non-existent Player Stats", False, f"Non-existent player stats test failed: {response.status_code if success else error}")
    
    def test_error_handling(self):
        """Test error handling for various scenarios"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid endpoints
        response, success, error = self.make_request("GET", "/game/invalid-endpoint")
        if success and response.status_code == 404:
            self.log_test("Invalid Endpoint", True, "Invalid endpoint correctly returned 404")
        else:
            self.log_test("Invalid Endpoint", False, f"Invalid endpoint test failed: {response.status_code if success else error}")
        
        # Test invalid player creation
        invalid_player_data = {}  # Missing username
        response, success, error = self.make_request("POST", "/game/players", invalid_player_data)
        if success and response.status_code == 422:
            self.log_test("Invalid Player Data", True, "Invalid player data correctly returned 422")
        else:
            self.log_test("Invalid Player Data", False, f"Invalid player data test failed: {response.status_code if success else error}")
        
        # Test game creation with invalid player
        invalid_game_data = {
            "player_id": "non-existent-player",
            "player_username": "test"
        }
        response, success, error = self.make_request("POST", "/game/games", invalid_game_data)
        if success and response.status_code == 404:
            self.log_test("Game with Invalid Player", True, "Game creation with invalid player correctly returned 404")
        else:
            self.log_test("Game with Invalid Player", False, f"Invalid player game test failed: {response.status_code if success else error}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print(f"🚀 Starting Cosmic Defender Backend API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_health_endpoints()
        self.test_player_management()
        self.test_game_sessions()
        self.test_leaderboard()
        self.test_achievements()
        self.test_player_stats()
        self.test_error_handling()
        
        end_time = time.time()
        
        # Generate summary
        self.generate_summary(end_time - start_time)
    
    def generate_summary(self, duration: float):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("🎯 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.test_results:
                if not test["success"]:
                    print(f"   • {test['test']}: {test['message']}")
        
        print(f"\n🎮 Test Player ID: {self.test_player_id}")
        print(f"🎯 Test Game ID: {self.test_game_id}")
        
        # Save detailed results
        with open("/app/backend_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed_tests": passed_tests,
                    "failed_tests": failed_tests,
                    "success_rate": (passed_tests/total_tests)*100,
                    "duration": duration,
                    "backend_url": self.base_url
                },
                "test_results": self.test_results
            }, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")

if __name__ == "__main__":
    tester = CosmicDefenderAPITester()
    tester.run_all_tests()