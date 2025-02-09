import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, SpotLight } from '@react-three/drei';
import * as THREE from 'three';

// Cassini Mission Constants (all distances in kilometers)
const SATURN_RADIUS = 60268; // Saturn's equatorial radius
const CASSINI_ORBITAL_DISTANCES = {
  MIN: 1100000, // Closest approach (1.1 million km)
  MAX: 1400000, // Furthest point (1.4 million km)
  TYPICAL: 1200000 // Typical orbital distance
};

// Cassini's orbital period around Saturn was approximately 16 Earth days
const ORBITAL_PERIOD = 16 * 24 * 60 * 60; // in seconds
const TIME_SCALE = 100000; // 1 second in visualization = 100,000 seconds real time

interface CassiniState {
  isTracking: boolean;
  currentPhase: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
    distance: number;
  };
  velocity: number;
  orbitNumber: number;
}

const Satellite: React.FC<any> = ({ position, setCurrentState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [state, setState] = useState<CassiniState>({
    isTracking: false,
    currentPhase: 'Orbital Science',
    coordinates: { x: 0, y: 0, z: 0, distance: 0 },
    velocity: 0,
    orbitNumber: 1
  });

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime() * TIME_SCALE;
      const orbit = CASSINI_ORBITAL_DISTANCES.TYPICAL;
      
      // Calculate elliptical orbit
      const eccentricity = 0.2;
      const angle = (time / ORBITAL_PERIOD) * 2 * Math.PI;
      const r = orbit * (1 - eccentricity * Math.cos(angle));
      
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle) * 0.8; // Slightly elliptical
      const y = r * Math.sin(angle * 0.5) * 0.1; // Small inclination

      meshRef.current.position.set(
        x / 10000,
        y / 10000,
        z / 10000
      );

      // Calculate velocity (km/s)
      const velocity = Math.sqrt(
        (6.674e-11 * 5.683e26) / r
      );

      const newState = {
        isTracking: state.isTracking,
        currentPhase: 'Orbital Science',
        coordinates: {
          x: x,
          y: y,
          z: z,
          distance: Math.sqrt(x * x + y * y + z * z)
        },
        velocity: velocity,
        orbitNumber: Math.floor(time / ORBITAL_PERIOD) + 1
      };

      setState(newState);
      setCurrentState(newState);
    }
  });

  return (
    <group>
      <mesh 
        ref={meshRef}
        onPointerOver={() => setShowInfo(true)}
        onPointerOut={() => setShowInfo(false)}
        castShadow
      >
        {/* Main body - bright gold color */}
        <boxGeometry args={[2, 2, 4]} />
        <meshStandardMaterial 
          color="#FFD700"  // Bright gold color
          metalness={0.9}
          roughness={0.1}
          emissive="#FFD700"
          emissiveIntensity={0.2}
        />
        
        {/* Solar panels - metallic blue */}
        <group position={[0, 0, 0]}>
          <mesh position={[4, 0, 0]} castShadow>
            <boxGeometry args={[6, 0.1, 2]} />
            <meshStandardMaterial 
              color="#4169E1"  // Royal blue
              metalness={0.8}
              roughness={0.2}
              emissive="#4169E1"
              emissiveIntensity={0.1}
            />
          </mesh>
          <mesh position={[-4, 0, 0]} castShadow>
            <boxGeometry args={[6, 0.1, 2]} />
            <meshStandardMaterial 
              color="#4169E1"  // Royal blue
              metalness={0.8}
              roughness={0.2}
              emissive="#4169E1"
              emissiveIntensity={0.1}
            />
          </mesh>
        </group>

        {showInfo && (
          <Html position={[4, 4, 0]}>
            <div className="bg-black bg-opacity-90 text-white p-4 rounded-lg text-sm whitespace-nowrap shadow-lg border border-gray-700">
              <div className="font-bold mb-2">Cassini Status</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-blue-400">X:</span>
                <span>{state.coordinates.x.toFixed(0)} km</span>
                <span className="text-green-400">Y:</span>
                <span>{state.coordinates.y.toFixed(0)} km</span>
                <span className="text-red-400">Z:</span>
                <span>{state.coordinates.z.toFixed(0)} km</span>
                <span className="text-yellow-400">Velocity:</span>
                <span>{state.velocity.toFixed(2)} km/s</span>
                <span className="text-purple-400">Orbit #:</span>
                <span>{state.orbitNumber}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Distance from Saturn: {state.coordinates.distance.toFixed(0)} km
              </div>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
};

const Saturn = () => {
  const saturnRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (saturnRef.current) {
      saturnRef.current.rotation.y += 0.0001; // Slow rotation
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 3;
    }
  });

  return (
    <group>
      {/* Saturn - white with subtle texture */}
      <mesh ref={saturnRef} castShadow receiveShadow>
        <sphereGeometry args={[SATURN_RADIUS / 10000, 64, 64]} />
        <meshStandardMaterial 
          color="#ffffff"
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Rings - white with transparency */}
      <mesh ref={ringRef} receiveShadow>
        <ringGeometry args={[
          (SATURN_RADIUS * 1.2) / 10000,
          (SATURN_RADIUS * 2.3) / 10000,
          128
        ]} />
        <meshStandardMaterial 
          color="#ffffff"
          side={THREE.DoubleSide}
          transparent
          opacity={0.6}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
};

const OrbitPath = () => {
  const pathRef = useRef<THREE.Line>(null);
  const orbit = CASSINI_ORBITAL_DISTANCES.TYPICAL / 10000;

  const curve = new THREE.EllipseCurve(
    0, 0,
    orbit, orbit * 0.8,
    0, 2 * Math.PI,
    false,
    0
  );

  const points = curve.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <line ref={pathRef} geometry={geometry}>
      <lineBasicMaterial attach="material" color="#666666" opacity={0.5} transparent />
    </line>
  );
};

const SimulationInfo: React.FC<{ state: CassiniState }> = ({ state }) => {
  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-2">Cassini Mission Simulation</h3>
      <div className="space-y-2">
        <p><span className="text-gray-400">Current Phase:</span> {state.currentPhase}</p>
        <p><span className="text-gray-400">Orbit Number:</span> {state.orbitNumber}</p>
        <p><span className="text-gray-400">Velocity:</span> {state.velocity.toFixed(2)} km/s</p>
        <p><span className="text-gray-400">Distance:</span> {state.coordinates.distance.toFixed(0)} km</p>
      </div>
      <div className="mt-4 text-xs text-gray-400">
        <p>Time Scale: 1 second = {TIME_SCALE.toLocaleString()} seconds real time</p>
        <p>Orbital Period: {(ORBITAL_PERIOD / (24 * 60 * 60)).toFixed(1)} Earth days</p>
      </div>
    </div>
  );
};

interface SatelliteOrbitProps {
  satelliteData: {
    orbital_position_x_km: number;
    orbital_position_y_km: number;
    orbital_position_z_km: number;
  }[];
}

const SatelliteOrbit: React.FC<SatelliteOrbitProps> = () => {
  const [currentState, setCurrentState] = useState<CassiniState>({
    isTracking: false,
    currentPhase: 'Orbital Science',
    coordinates: { x: 0, y: 0, z: 0, distance: 0 },
    velocity: 0,
    orbitNumber: 1
  });

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 200, 350], fov: 60 }} shadows>
        <ambientLight intensity={0.4} />
        <pointLight position={[100, 100, 100]} intensity={1.5} castShadow />
        <pointLight position={[-100, -100, -100]} intensity={0.5} />
        <Stars radius={300} depth={100} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Saturn />
        <OrbitPath />
        <Satellite setCurrentState={setCurrentState} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          maxDistance={1000}
          minDistance={50}
        />
      </Canvas>
      
      <SimulationInfo state={currentState} />
    </div>
  );
};

export default SatelliteOrbit;