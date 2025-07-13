import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';

const GameEngine = ({ 
  gameState, 
  onGameStateChange, 
  onScoreUpdate, 
  onHealthUpdate, 
  onPowerUpCollected,
  onGameOver 
}) => {
  const mountRef = useRef(null);
  const gameRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    spaceship: null,
    asteroids: [],
    enemies: [],
    powerUps: [],
    bullets: [],
    enemyBullets: [],
    score: 0,
    health: 100,
    wave: 1,
    animationId: null,
    keys: {},
    mousePosition: { x: 0, y: 0 },
    lastTime: 0,
    spawnTimer: 0,
    waveTimer: 0,
    powerUpTimer: 0
  });

  const [isMobile, setIsMobile] = useState(false);
  const [touchControls, setTouchControls] = useState({
    move: { x: 0, y: 0 },
    shoot: false
  });

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    const game = gameRef.current;
    
    // Scene setup
    game.scene = new THREE.Scene();
    game.scene.background = new THREE.Color(0x000011);
    
    // Camera setup - position camera to look down at the game area
    game.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    game.camera.position.set(0, 8, 12); // Higher up and further back
    game.camera.lookAt(0, 0, 0); // Look at center
    
    // Renderer setup
    game.renderer = new THREE.WebGLRenderer({ antialias: true });
    game.renderer.setSize(window.innerWidth, window.innerHeight);
    game.renderer.shadowMap.enabled = true;
    game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 200;     // x
      starPositions[i + 1] = (Math.random() - 0.5) * 200; // y
      starPositions[i + 2] = (Math.random() - 0.5) * 100 - 50; // z (behind camera)
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.8 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    game.scene.add(stars);
    
    // Lighting - Add more ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Increased intensity
    game.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    game.scene.add(directionalLight);
    
    // Add a point light for better object visibility
    const pointLight = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight.position.set(0, 10, 10);
    game.scene.add(pointLight);
    
    // Create spaceship
    createSpaceship();
    
    // Add some initial objects for testing
    createAsteroid(-3, 0, -5);
    createAsteroid(3, 2, -8);
    createEnemy(0, -2, -10);
    
    if (mountRef.current) {
      mountRef.current.appendChild(game.renderer.domElement);
    }
    
    console.log('✅ Scene initialized with camera at:', game.camera.position);
    console.log('✅ Scene object count:', game.scene.children.length);
    
    // Handle window resize
    const handleResize = () => {
      game.camera.aspect = window.innerWidth / window.innerHeight;
      game.camera.updateProjectionMatrix();
      game.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const createSpaceship = () => {
    const game = gameRef.current;
    
    // Create spaceship geometry
    const spaceshipGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const spaceshipMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ff88,
      shininess: 100,
      specular: 0x111111
    });
    
    game.spaceship = new THREE.Mesh(spaceshipGeometry, spaceshipMaterial);
    game.spaceship.position.set(0, 0, 0); // Position at center, closer to camera
    game.spaceship.rotation.x = Math.PI / 2; // Point forward
    game.spaceship.castShadow = true;
    game.scene.add(game.spaceship);
    
    // Add engine glow
    const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x0088ff,
      transparent: true,
      opacity: 0.6
    });
    
    const engineGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    engineGlow.position.set(0, 0, 1); // Behind the spaceship
    game.spaceship.add(engineGlow);
    
    console.log('✅ Spaceship created at position:', game.spaceship.position);
  };

  const createAsteroid = (x, y, z) => {
    const game = gameRef.current;
    
    const asteroidGeometry = new THREE.DodecahedronGeometry(Math.random() * 0.5 + 0.3);
    const asteroidMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8B4513,
      flatShading: true
    });
    
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.position.set(x, y, z);
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    asteroid.castShadow = true;
    asteroid.userData = { 
      type: 'asteroid',
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      speed: Math.random() * 0.02 + 0.01,
      health: 1
    };
    
    game.scene.add(asteroid);
    game.asteroids.push(asteroid);
  };

  const createEnemy = (x, y, z) => {
    const game = gameRef.current;
    
    const enemyGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    const enemyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff4444,
      shininess: 50
    });
    
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(x, y, z);
    enemy.castShadow = true;
    enemy.userData = { 
      type: 'enemy',
      speed: Math.random() * 0.015 + 0.01,
      health: 2,
      shootTimer: 0,
      shootInterval: Math.random() * 120 + 60
    };
    
    game.scene.add(enemy);
    game.enemies.push(enemy);
  };

  const createPowerUp = (x, y, z) => {
    const game = gameRef.current;
    
    const powerUpGeometry = new THREE.OctahedronGeometry(0.3);
    const powerUpMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffff00,
      emissive: 0x444400,
      transparent: true,
      opacity: 0.8
    });
    
    const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
    powerUp.position.set(x, y, z);
    powerUp.userData = { 
      type: 'powerUp',
      powerType: ['health', 'rapidFire', 'multiShot', 'shield'][Math.floor(Math.random() * 4)],
      rotationSpeed: 0.05,
      speed: 0.01
    };
    
    game.scene.add(powerUp);
    game.powerUps.push(powerUp);
  };

  const createBullet = (x, y, z, direction = 1) => {
    const game = gameRef.current;
    
    const bulletGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ 
      color: direction > 0 ? 0x00ffff : 0xff0000,
      emissive: direction > 0 ? 0x004444 : 0x440000
    });
    
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.set(x, y, z);
    bullet.userData = { 
      speed: direction * 0.3,
      damage: 1,
      owner: direction > 0 ? 'player' : 'enemy'
    };
    
    game.scene.add(bullet);
    
    if (direction > 0) {
      game.bullets.push(bullet);
    } else {
      game.enemyBullets.push(bullet);
    }
  };

  const updateGame = useCallback((currentTime) => {
    const game = gameRef.current;
    const deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;

    if (gameState !== 'playing') return;

    // Update spaceship position
    if (game.spaceship) {
      const moveSpeed = 0.1;
      
      if (isMobile) {
        // Mobile touch controls
        game.spaceship.position.x += touchControls.move.x * moveSpeed;
        game.spaceship.position.y += touchControls.move.y * moveSpeed;
      } else {
        // Desktop keyboard controls
        if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
          game.spaceship.position.x -= moveSpeed;
        }
        if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
          game.spaceship.position.x += moveSpeed;
        }
        if (game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) {
          game.spaceship.position.y += moveSpeed;
        }
        if (game.keys['ArrowDown'] || game.keys['s'] || game.keys['S']) {
          game.spaceship.position.y -= moveSpeed;
        }
      }
      
      // Keep spaceship within bounds
      game.spaceship.position.x = Math.max(-8, Math.min(8, game.spaceship.position.x));
      game.spaceship.position.y = Math.max(-5, Math.min(5, game.spaceship.position.y));
      
      // Shooting
      if ((game.keys[' '] || touchControls.shoot) && game.bullets.length < 20) {
        createBullet(
          game.spaceship.position.x,
          game.spaceship.position.y,
          game.spaceship.position.z - 1
        );
      }
    }

    // Update bullets
    game.bullets.forEach((bullet, index) => {
      bullet.position.z -= bullet.userData.speed;
      if (bullet.position.z < -20) {
        game.scene.remove(bullet);
        game.bullets.splice(index, 1);
      }
    });

    // Update enemy bullets
    game.enemyBullets.forEach((bullet, index) => {
      bullet.position.z -= bullet.userData.speed;
      if (bullet.position.z > 20) {
        game.scene.remove(bullet);
        game.enemyBullets.splice(index, 1);
      }
    });

    // Update asteroids
    game.asteroids.forEach((asteroid, index) => {
      asteroid.position.z += asteroid.userData.speed;
      asteroid.rotation.x += asteroid.userData.rotationSpeed;
      asteroid.rotation.y += asteroid.userData.rotationSpeed;
      
      if (asteroid.position.z > 15) {
        game.scene.remove(asteroid);
        game.asteroids.splice(index, 1);
      }
    });

    // Update enemies
    game.enemies.forEach((enemy, index) => {
      enemy.position.z += enemy.userData.speed;
      enemy.userData.shootTimer++;
      
      // Enemy shooting
      if (enemy.userData.shootTimer >= enemy.userData.shootInterval) {
        createBullet(enemy.position.x, enemy.position.y, enemy.position.z, -1);
        enemy.userData.shootTimer = 0;
      }
      
      if (enemy.position.z > 15) {
        game.scene.remove(enemy);
        game.enemies.splice(index, 1);
      }
    });

    // Update power-ups
    game.powerUps.forEach((powerUp, index) => {
      powerUp.position.z += powerUp.userData.speed;
      powerUp.rotation.x += powerUp.userData.rotationSpeed;
      powerUp.rotation.y += powerUp.userData.rotationSpeed;
      
      if (powerUp.position.z > 15) {
        game.scene.remove(powerUp);
        game.powerUps.splice(index, 1);
      }
    });

    // Collision detection
    checkCollisions();
    
    // Spawn objects
    game.spawnTimer += deltaTime;
    if (game.spawnTimer > 1000) {
      spawnObjects();
      game.spawnTimer = 0;
    }
    
    // Update wave
    game.waveTimer += deltaTime;
    if (game.waveTimer > 30000) {
      game.wave++;
      game.waveTimer = 0;
    }
  }, [gameState, isMobile, touchControls]);

  const checkCollisions = () => {
    const game = gameRef.current;
    
    // Bullet vs Asteroid collisions
    game.bullets.forEach((bullet, bulletIndex) => {
      game.asteroids.forEach((asteroid, asteroidIndex) => {
        if (bullet.position.distanceTo(asteroid.position) < 0.8) {
          // Remove bullet and asteroid
          game.scene.remove(bullet);
          game.scene.remove(asteroid);
          game.bullets.splice(bulletIndex, 1);
          game.asteroids.splice(asteroidIndex, 1);
          
          // Update score
          game.score += 10;
          onScoreUpdate(game.score);
        }
      });
    });

    // Bullet vs Enemy collisions
    game.bullets.forEach((bullet, bulletIndex) => {
      game.enemies.forEach((enemy, enemyIndex) => {
        if (bullet.position.distanceTo(enemy.position) < 1) {
          game.scene.remove(bullet);
          game.bullets.splice(bulletIndex, 1);
          
          enemy.userData.health--;
          if (enemy.userData.health <= 0) {
            game.scene.remove(enemy);
            game.enemies.splice(enemyIndex, 1);
            game.score += 50;
            onScoreUpdate(game.score);
          }
        }
      });
    });

    // Spaceship vs PowerUp collisions
    if (game.spaceship) {
      game.powerUps.forEach((powerUp, index) => {
        if (game.spaceship.position.distanceTo(powerUp.position) < 1) {
          game.scene.remove(powerUp);
          game.powerUps.splice(index, 1);
          
          // Apply power-up effect
          onPowerUpCollected(powerUp.userData.powerType);
          game.score += 25;
          onScoreUpdate(game.score);
        }
      });
    }

    // Enemy bullet vs Spaceship collisions
    if (game.spaceship) {
      game.enemyBullets.forEach((bullet, index) => {
        if (game.spaceship.position.distanceTo(bullet.position) < 1) {
          game.scene.remove(bullet);
          game.enemyBullets.splice(index, 1);
          
          game.health -= 10;
          onHealthUpdate(game.health);
          
          if (game.health <= 0) {
            onGameOver(game.score);
          }
        }
      });
    }

    // Spaceship vs Asteroid/Enemy collisions
    if (game.spaceship) {
      [...game.asteroids, ...game.enemies].forEach((object) => {
        if (game.spaceship.position.distanceTo(object.position) < 1) {
          game.health -= 20;
          onHealthUpdate(game.health);
          
          if (game.health <= 0) {
            onGameOver(game.score);
          }
        }
      });
    }
  };

  const spawnObjects = () => {
    const game = gameRef.current;
    
    // Spawn asteroids
    if (Math.random() < 0.7) {
      createAsteroid(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        -20
      );
    }
    
    // Spawn enemies
    if (Math.random() < 0.3 + (game.wave * 0.1)) {
      createEnemy(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        -20
      );
    }
    
    // Spawn power-ups
    if (Math.random() < 0.1) {
      createPowerUp(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        -20
      );
    }
  };

  const gameLoop = useCallback((currentTime) => {
    const game = gameRef.current;
    
    updateGame(currentTime);
    
    if (game.renderer && game.scene && game.camera) {
      game.renderer.render(game.scene, game.camera);
    }
    
    game.animationId = requestAnimationFrame(gameLoop);
  }, [updateGame]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event) => {
      gameRef.current.keys[event.key] = true;
      
      if (event.key === ' ') {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event) => {
      gameRef.current.keys[event.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch controls for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Initialize game when gameState changes to playing
  useEffect(() => {
    if (gameState === 'playing') {
      const game = gameRef.current;
      game.score = 0;
      game.health = 100;
      game.wave = 1;
      game.lastTime = performance.now();
      
      // Clear existing objects
      [...game.asteroids, ...game.enemies, ...game.powerUps, ...game.bullets, ...game.enemyBullets].forEach(obj => {
        game.scene.remove(obj);
      });
      game.asteroids = [];
      game.enemies = [];
      game.powerUps = [];
      game.bullets = [];
      game.enemyBullets = [];
      
      onScoreUpdate(0);
      onHealthUpdate(100);
      
      game.animationId = requestAnimationFrame(gameLoop);
    }
  }, [gameState, gameLoop, onScoreUpdate, onHealthUpdate]);

  // Initialize scene on mount
  useEffect(() => {
    initScene();
    
    return () => {
      const game = gameRef.current;
      if (game.animationId) {
        cancelAnimationFrame(game.animationId);
      }
      if (game.renderer) {
        game.renderer.dispose();
      }
    };
  }, [initScene]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Mobile touch controls */}
      {isMobile && gameState === 'playing' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Movement joystick */}
          <div 
            className="absolute bottom-4 left-4 w-24 h-24 bg-black bg-opacity-30 rounded-full border-2 border-white border-opacity-50 pointer-events-auto"
            onTouchStart={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              
              const handleTouchMove = (e) => {
                const touch = e.touches[0];
                const dx = (touch.clientX - centerX) / 48;
                const dy = (centerY - touch.clientY) / 48;
                
                const distance = Math.sqrt(dx * dx + dy * dy);
                const clampedDistance = Math.min(distance, 1);
                
                setTouchControls(prev => ({
                  ...prev,
                  move: {
                    x: dx * clampedDistance,
                    y: dy * clampedDistance
                  }
                }));
              };
              
              const handleTouchEnd = () => {
                setTouchControls(prev => ({ ...prev, move: { x: 0, y: 0 } }));
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('touchend', handleTouchEnd);
              };
              
              window.addEventListener('touchmove', handleTouchMove);
              window.addEventListener('touchend', handleTouchEnd);
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white bg-opacity-50 rounded-full"></div>
            </div>
          </div>
          
          {/* Shoot button */}
          <div 
            className="absolute bottom-4 right-4 w-16 h-16 bg-red-500 bg-opacity-70 rounded-full border-2 border-white border-opacity-50 pointer-events-auto flex items-center justify-center"
            onTouchStart={(e) => {
              e.preventDefault();
              setTouchControls(prev => ({ ...prev, shoot: true }));
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setTouchControls(prev => ({ ...prev, shoot: false }));
            }}
          >
            <div className="text-white text-xl font-bold">🔫</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameEngine;