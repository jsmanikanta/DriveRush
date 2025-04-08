import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  PerspectiveCamera,
  OrbitControls,
} from "@react-three/drei";
import { Vector3, Euler } from "three";

// Game constants
const ROAD_WIDTH = 20;
const ROAD_LENGTH = 1000;
const CAR_WIDTH = 2;
const CAR_LENGTH = 4;
const CAR_HEIGHT = 1.2;
const MAX_SPEED = 50;
const ACCELERATION = 0.5;
const BRAKE_POWER = 0.8;
const TURN_SPEED = 0.1;
const FRICTION = 0.95;
const COLLISION_DISTANCE = 2.5;
const CAMERA_DISTANCE = 8;
const CAMERA_HEIGHT = 3;

// Background colors
const BACKGROUND_COLORS = [
  "#87CEEB", // Sky Blue
  "#FFA07A", // Light Salmon
  "#98FB98", // Pale Green
  "#DDA0DD", // Plum
  "#F0E68C", // Khaki
  "#E6E6FA", // Lavender
  "#FFB6C1", // Light Pink
  "#B0E0E6", // Powder Blue
  "#D8BFD8", // Thistle
  "#FFE4B5", // Moccasin
];

// Player car component with Dodge Challenger styling
const PlayerCar = ({ position }) => {
  return (
    <group position={position}>
      {/* Main body */}
      <mesh position={[0, CAR_HEIGHT / 2, 0]}>
        <boxGeometry args={[CAR_WIDTH, CAR_HEIGHT, CAR_LENGTH]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Front grille */}
      <mesh position={[0, CAR_HEIGHT / 2, -CAR_LENGTH / 2]}>
        <boxGeometry args={[CAR_WIDTH * 0.9, CAR_HEIGHT * 0.4, 0.2]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rear spoiler */}
      <mesh position={[0, CAR_HEIGHT + 0.3, CAR_LENGTH / 2]}>
        <boxGeometry args={[CAR_WIDTH * 1.1, 0.1, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Headlights */}
      <mesh position={[CAR_WIDTH / 2 - 0.2, CAR_HEIGHT / 2, -CAR_LENGTH / 2]}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1}
        />
      </mesh>
      <mesh position={[-CAR_WIDTH / 2 + 0.2, CAR_HEIGHT / 2, -CAR_LENGTH / 2]}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1}
        />
      </mesh>

      {/* Taillights */}
      <mesh position={[CAR_WIDTH / 2 - 0.2, CAR_HEIGHT / 2, CAR_LENGTH / 2]}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={1}
        />
      </mesh>
      <mesh position={[-CAR_WIDTH / 2 + 0.2, CAR_HEIGHT / 2, CAR_LENGTH / 2]}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={1}
        />
      </mesh>

      {/* Wheels */}
      {[
        [-CAR_WIDTH / 2, 0.3, -CAR_LENGTH / 3],
        [CAR_WIDTH / 2, 0.3, -CAR_LENGTH / 3],
        [-CAR_WIDTH / 2, 0.3, CAR_LENGTH / 3],
        [CAR_WIDTH / 2, 0.3, CAR_LENGTH / 3],
      ].map((pos, i) => (
        <group key={i} position={pos}>
          {/* Wheel rim */}
          <mesh>
            <cylinderGeometry
              args={[0.6, 0.6, 0.3, 32]}
              rotation={[0, Math.PI / 2, 0]}
            />
            <meshStandardMaterial
              color="#1a1a1a"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Tire */}
          <mesh>
            <cylinderGeometry
              args={[0.5, 0.5, 0.4, 32]}
              rotation={[0, Math.PI / 2, 0]}
            />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Traffic car component
const TrafficCar = ({ position, color = "#e74c3c" }) => (
  <group position={position}>
    {/* Car body */}
    <mesh position={[0, CAR_HEIGHT / 2, 0]}>
      <boxGeometry args={[CAR_WIDTH, CAR_HEIGHT, CAR_LENGTH]} />
      <meshStandardMaterial color={color} />
    </mesh>

    {/* Car roof */}
    <mesh position={[0, CAR_HEIGHT + 0.3, 0]}>
      <boxGeometry args={[CAR_WIDTH * 0.8, 0.3, CAR_LENGTH * 0.8]} />
      <meshStandardMaterial color={color} />
    </mesh>

    {/* Wheels */}
    {[
      [-CAR_WIDTH / 2, 0.3, -CAR_LENGTH / 3],
      [CAR_WIDTH / 2, 0.3, -CAR_LENGTH / 3],
      [-CAR_WIDTH / 2, 0.3, CAR_LENGTH / 3],
      [CAR_WIDTH / 2, 0.3, CAR_LENGTH / 3],
    ].map((pos, i) => (
      <mesh key={i} position={pos}>
        <cylinderGeometry
          args={[0.5, 0.5, 0.4, 32]}
          rotation={[0, Math.PI / 2, 0]}
        />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    ))}
  </group>
);

// Road component
const Road = ({ offset }) => (
  <group position={[0, 0, -offset]}>
    {/* Main road */}
    <mesh position={[0, -0.1, 0]}>
      <boxGeometry args={[ROAD_WIDTH, 0.1, ROAD_LENGTH * 2]} />
      <meshStandardMaterial color="#34495e" />
    </mesh>

    {/* Road shoulders */}
    <mesh position={[ROAD_WIDTH / 2 + 0.5, -0.05, 0]}>
      <boxGeometry args={[1, 0.1, ROAD_LENGTH * 2]} />
      <meshStandardMaterial color="#95a5a6" />
    </mesh>
    <mesh position={[-ROAD_WIDTH / 2 - 0.5, -0.05, 0]}>
      <boxGeometry args={[1, 0.1, ROAD_LENGTH * 2]} />
      <meshStandardMaterial color="#95a5a6" />
    </mesh>

    {/* Lane markers */}
    {Array.from({ length: Math.floor((ROAD_LENGTH * 2) / 5) }).map((_, i) => (
      <mesh key={i} position={[0, 0.01, -ROAD_LENGTH + i * 5]}>
        <boxGeometry args={[0.2, 0.11, 3]} />
        <meshStandardMaterial
          color="#f1c40f"
          emissive="#f1c40f"
          emissiveIntensity={0.5}
        />
      </mesh>
    ))}
  </group>
);

// Add touch controls component
const TouchControls = ({ onTouchStart, onTouchEnd }) => {
  return (
    <div className="touch-controls">
      <div className="control-buttons">
        <button
          className="control-button up"
          onTouchStart={() => onTouchStart("ArrowUp")}
          onTouchEnd={() => onTouchEnd("ArrowUp")}
        >
          ↑
        </button>
        <div className="horizontal-controls">
          <button
            className="control-button left"
            onTouchStart={() => onTouchStart("ArrowLeft")}
            onTouchEnd={() => onTouchEnd("ArrowLeft")}
          >
            ←
          </button>
          <button
            className="control-button right"
            onTouchStart={() => onTouchStart("ArrowRight")}
            onTouchEnd={() => onTouchEnd("ArrowRight")}
          >
            →
          </button>
        </div>
        <button
          className="control-button down"
          onTouchStart={() => onTouchStart("ArrowDown")}
          onTouchEnd={() => onTouchEnd("ArrowDown")}
        >
          ↓
        </button>
      </div>
    </div>
  );
};

// Main game component
const CarGame = () => {
  const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0.25, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [roadOffset, setRoadOffset] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [trafficCars, setTrafficCars] = useState(() =>
    Array.from({ length: 10 }, () => ({
      position: new Vector3(
        (Math.random() - 0.5) * (ROAD_WIDTH - CAR_WIDTH),
        0.25,
        -Math.random() * ROAD_LENGTH
      ),
      speed: 2 + Math.random() * 3,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    }))
  );

  // Define keys object in component scope
  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  };

  // Background color change effect - increased to 30 seconds
  useEffect(() => {
    const colorInterval = setInterval(() => {
      setBackgroundColor((prevColor) => {
        const currentIndex = BACKGROUND_COLORS.indexOf(prevColor);
        const nextIndex = (currentIndex + 1) % BACKGROUND_COLORS.length;
        return BACKGROUND_COLORS[nextIndex];
      });
    }, 30000); // Changed to 30 seconds

    return () => clearInterval(colorInterval);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const gameLoop = setInterval(() => {
      // Update speed
      if (keys.ArrowDown) {
        setSpeed((prev) => Math.min(prev + ACCELERATION, MAX_SPEED));
      } else if (keys.ArrowUp) {
        setSpeed((prev) => Math.max(prev - BRAKE_POWER, -MAX_SPEED / 2));
      } else {
        setSpeed((prev) => prev * FRICTION);
      }

      // Update rotation
      if (keys.ArrowLeft) {
        setPlayerRotation((prev) => prev + TURN_SPEED);
      } else if (keys.ArrowRight) {
        setPlayerRotation((prev) => prev - TURN_SPEED);
      }

      // Update position
      setPlayerPosition((prev) => {
        const newPosition = prev.clone();
        const moveSpeed = speed * 0.1;

        // Calculate movement based on rotation
        const moveX = Math.sin(playerRotation) * moveSpeed;
        const moveZ = Math.cos(playerRotation) * moveSpeed;

        newPosition.x += moveX;
        newPosition.z += moveZ;

        // Keep car within road boundaries
        const roadHalfWidth = ROAD_WIDTH / 2 - CAR_WIDTH;
        newPosition.x = Math.max(
          -roadHalfWidth,
          Math.min(roadHalfWidth, newPosition.x)
        );

        return newPosition;
      });

      // Update road offset
      setRoadOffset((prev) => {
        const newOffset = prev + speed * 0.1;
        if (Math.abs(newOffset) > ROAD_LENGTH) {
          return 0;
        }
        return newOffset;
      });

      // Check for collisions
      const playerCar = {
        position: playerPosition,
        width: CAR_WIDTH,
        length: CAR_LENGTH,
      };

      let collisionDetected = false;
      trafficCars.forEach((trafficCar) => {
        const dx = playerCar.position.x - trafficCar.position.x;
        const dz = playerCar.position.z - trafficCar.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < COLLISION_DISTANCE) {
          collisionDetected = true;
        }
      });

      if (collisionDetected) {
        alert("Collision! Resetting position...");
        setPlayerPosition(new Vector3(0, 0.25, 0));
        setPlayerRotation(0);
        setSpeed(0);
        // Reset traffic cars to new random positions
        setTrafficCars(
          Array.from({ length: 10 }, () => ({
            position: new Vector3(
              (Math.random() - 0.5) * (ROAD_WIDTH - CAR_WIDTH),
              0.25,
              -Math.random() * ROAD_LENGTH
            ),
            speed: 2 + Math.random() * 3,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          }))
        );
      }

      // Update traffic cars
      setTrafficCars((prev) =>
        prev.map((car) => {
          const newPosition = car.position.clone();
          newPosition.z += car.speed * 0.1;

          // Keep traffic cars within road boundaries
          const roadHalfWidth = ROAD_WIDTH / 2 - CAR_WIDTH;
          newPosition.x = Math.max(
            -roadHalfWidth,
            Math.min(roadHalfWidth, newPosition.x)
          );

          // Handle wrapping around for infinite road
          if (newPosition.z > ROAD_LENGTH) {
            newPosition.z = -ROAD_LENGTH;
            newPosition.x = (Math.random() - 0.5) * (ROAD_WIDTH - CAR_WIDTH);
          }

          return { ...car, position: newPosition };
        })
      );
    }, 16);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearInterval(gameLoop);
    };
  }, [playerRotation, speed, playerPosition, trafficCars]);

  // Handle touch controls
  const handleTouchStart = (key) => {
    if (keys.hasOwnProperty(key)) {
      keys[key] = true;
    }
  };

  const handleTouchEnd = (key) => {
    if (keys.hasOwnProperty(key)) {
      keys[key] = false;
    }
  };

  return (
    <div className="game-container">
      <Canvas
        style={{ background: backgroundColor, width: "100vw", height: "100vh" }}
      >
        <PerspectiveCamera
          makeDefault
          position={[
            playerPosition.x - Math.sin(playerRotation) * CAMERA_DISTANCE,
            CAMERA_HEIGHT,
            playerPosition.z - Math.cos(playerRotation) * CAMERA_DISTANCE,
          ]}
          rotation={[-0.2, playerRotation, 0]}
          fov={75}
        />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} />
        <hemisphereLight args={[backgroundColor, "#228B22", 0.4]} />
        <Environment preset="sunset" />

        {/* Road */}
        <Road offset={roadOffset} />

        {/* Traffic cars */}
        {trafficCars.map((car, index) => (
          <TrafficCar key={index} position={car.position} color={car.color} />
        ))}

        {/* Player car */}
        <group position={[0, 0.25, 0]} rotation={[0, playerRotation, 0]}>
          <PlayerCar position={playerPosition} />
        </group>
      </Canvas>
      <TouchControls
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

// Add styles for mobile controls
const styles = `
  .game-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .touch-controls {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 1000;
  }

  .control-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .horizontal-controls {
    display: flex;
    gap: 20px;
  }

  .control-button {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.5);
    color: white;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .control-button:active {
    background: rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    .control-button {
      width: 50px;
      height: 50px;
      font-size: 20px;
    }
  }`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default CarGame;
