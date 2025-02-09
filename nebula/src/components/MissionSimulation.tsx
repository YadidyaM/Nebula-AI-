import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { AlertTriangle, Play, Pause, RotateCcw, Settings, FileDown, Clock, HelpCircle, X } from 'lucide-react';
import * as THREE from 'three';

interface SimulationState {
  time: number;
  velocity: THREE.Vector3;
  position: THREE.Vector3;
  fuel: number;
  systemHealth: {
    propulsion: number;
    navigation: number;
    communication: number;
    power: number;
  };
  anomalies: string[];
}

interface ScenarioConfig {
  name: string;
  description: string;
  initialConditions: {
    position: [number, number, number];
    velocity: [number, number, number];
    fuel: number;
  };
  anomalies?: {
    type: string;
    probability: number;
    severity: 'low' | 'medium' | 'high';
    timeRange: [number, number];
  }[];
}

const InfoCard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Mission Simulation Guide</h2>

        <div className="space-y-6 text-gray-300">
          <section>
            <h3 className="text-xl font-semibold text-indigo-400 mb-2">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Select a mission scenario from the dropdown menu</li>
              <li>Click the Play button to start the simulation</li>
              <li>Use the time scale selector to adjust simulation speed</li>
              <li>Monitor system health and anomalies in real-time</li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-indigo-400 mb-2">Available Scenarios</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-white">Saturn Orbit Insertion</h4>
                <p className="text-sm">Critical maneuver to enter Saturn's orbit. Watch for potential thruster malfunctions.</p>
              </div>
              <div>
                <h4 className="font-medium text-white">Titan Flyby</h4>
                <p className="text-sm">Close approach to Saturn's largest moon. Monitor navigation sensors during the approach.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-indigo-400 mb-2">Controls</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-white mb-1">Visualization</h4>
                <ul className="text-sm space-y-1">
                  <li>Left click + drag to rotate</li>
                  <li>Right click + drag to pan</li>
                  <li>Scroll to zoom in/out</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Simulation</h4>
                <ul className="text-sm space-y-1">
                  <li>Play/Pause - Start or pause simulation</li>
                  <li>Reset - Return to initial conditions</li>
                  <li>Time Scale - Adjust simulation speed</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-indigo-400 mb-2">System Health</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>80-100% - Optimal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>50-79% - Warning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>&lt;50% - Critical</span>
                </div>
              </div>
              <div className="text-sm">
                <p>System health degrades over time and can be affected by anomalies. Monitor all systems carefully.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const Spacecraft: React.FC<{ position: THREE.Vector3 }> = ({ position }) => {
  return (
    <group position={[position.x / 10000, position.y / 10000, position.z / 10000]}>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[5, 5, 10]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Solar panels */}
      <mesh position={[10, 0, 0]}>
        <boxGeometry args={[15, 0.5, 5]} />
        <meshStandardMaterial color="#4169E1" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-10, 0, 0]}>
        <boxGeometry args={[15, 0.5, 5]} />
        <meshStandardMaterial color="#4169E1" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Antenna */}
      <mesh position={[0, 3, -5]}>
        <cylinderGeometry args={[0.5, 0.5, 4]} />
        <meshStandardMaterial color="#A0A0A0" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
};

const Saturn: React.FC = () => {
  const ringGeometry = new THREE.RingGeometry(80000, 120000, 64);
  const saturnRef = React.useRef<THREE.Mesh>(null);
  const ringsRef = React.useRef<THREE.Mesh>(null);

  useEffect(() => {
    const animate = () => {
      if (saturnRef.current) {
        saturnRef.current.rotation.y += 0.001;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <group>
      {/* Saturn body */}
      <mesh ref={saturnRef}>
        <sphereGeometry args={[60268, 64, 64]} />
        <meshStandardMaterial
          color="#f4d03f"
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Rings */}
      <mesh ref={ringsRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[80000, 120000, 64]} />
        <meshStandardMaterial
          color="#d4b14f"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

const MissionSimulation: React.FC = () => {
  const [showInfo, setShowInfo] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [timeScale, setTimeScale] = useState(1);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null);
  const [simState, setSimState] = useState<SimulationState>({
    time: 0,
    velocity: new THREE.Vector3(),
    position: new THREE.Vector3(),
    fuel: 100,
    systemHealth: {
      propulsion: 95,
      navigation: 98,
      communication: 92,
      power: 97
    },
    anomalies: []
  });

  const scenarios: ScenarioConfig[] = [
    {
      name: "Saturn Orbit Insertion",
      description: "Critical maneuver to enter Saturn's orbit",
      initialConditions: {
        position: [0, 0, -1000000],
        velocity: [10, 0, 0],
        fuel: 100
      },
      anomalies: [
        {
          type: "Thruster Malfunction",
          probability: 0.15,
          severity: "high",
          timeRange: [300, 600]
        }
      ]
    },
    {
      name: "Titan Flyby",
      description: "Close approach to Saturn's largest moon",
      initialConditions: {
        position: [-500000, 200000, -800000],
        velocity: [15, -5, 8],
        fuel: 85
      },
      anomalies: [
        {
          type: "Navigation Sensor Error",
          probability: 0.2,
          severity: "medium",
          timeRange: [120, 480]
        }
      ]
    }
  ];

  useEffect(() => {
    let animationFrame: number;
    const updateSimulation = () => {
      if (isRunning) {
        setSimTime(prev => prev + (1/60) * timeScale);
        
        setSimState(prev => {
          const newState = { ...prev };
          
          // Update position and velocity
          const gravityForce = calculateGravity(newState.position);
          newState.velocity.add(gravityForce.multiplyScalar(1/60 * timeScale));
          newState.position.add(newState.velocity.clone().multiplyScalar(1/60 * timeScale));
          
          // Gradually degrade system health based on stress and time
          newState.systemHealth = {
            propulsion: degradeSystem(newState.systemHealth.propulsion, 0.01),
            navigation: degradeSystem(newState.systemHealth.navigation, 0.005),
            communication: degradeSystem(newState.systemHealth.communication, 0.008),
            power: degradeSystem(newState.systemHealth.power, 0.003)
          };
          
          // Check for anomalies
          if (selectedScenario?.anomalies) {
            selectedScenario.anomalies.forEach(anomaly => {
              if (simTime >= anomaly.timeRange[0] && simTime <= anomaly.timeRange[1]) {
                if (Math.random() < anomaly.probability / (60 * timeScale)) {
                  newState.anomalies.push(`${anomaly.type} at T+${simTime.toFixed(1)}s`);
                  applyAnomaly(newState, anomaly);
                }
              }
            });
          }
          
          return newState;
        });
        
        animationFrame = requestAnimationFrame(updateSimulation);
      }
    };
    
    if (isRunning) {
      animationFrame = requestAnimationFrame(updateSimulation);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRunning, timeScale, selectedScenario]);

  const degradeSystem = (value: number, rate: number): number => {
    const randomFactor = 1 + (Math.random() - 0.5) * 0.1;
    return Math.max(0, Math.min(100, value - rate * timeScale * randomFactor));
  };

  const calculateGravity = (position: THREE.Vector3): THREE.Vector3 => {
    const G = 6.67430e-11;
    const saturnMass = 5.683e26;
    const r = position.length();
    return position.clone().normalize().multiplyScalar(-G * saturnMass / (r * r));
  };

  const applyAnomaly = (state: SimulationState, anomaly: ScenarioConfig['anomalies'][0]) => {
    if (!anomaly) return;
    
    switch (anomaly.type) {
      case 'Thruster Malfunction':
        state.systemHealth.propulsion *= 0.7;
        break;
      case 'Navigation Sensor Error':
        state.systemHealth.navigation *= 0.8;
        break;
      default:
        break;
    }
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setSimTime(0);
    if (selectedScenario) {
      setSimState({
        time: 0,
        velocity: new THREE.Vector3(...selectedScenario.initialConditions.velocity),
        position: new THREE.Vector3(...selectedScenario.initialConditions.position),
        fuel: selectedScenario.initialConditions.fuel,
        systemHealth: {
          propulsion: 95 + Math.random() * 5,
          navigation: 95 + Math.random() * 5,
          communication: 95 + Math.random() * 5,
          power: 95 + Math.random() * 5
        },
        anomalies: []
      });
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <button
        onClick={() => setShowInfo(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 shadow-lg z-50"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {showInfo && <InfoCard onClose={() => setShowInfo(false)} />}

      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetSimulation}
              className="flex items-center px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedScenario?.name || ''}
              onChange={(e) => {
                const scenario = scenarios.find(s => s.name === e.target.value);
                setSelectedScenario(scenario || null);
                resetSimulation();
              }}
              className="bg-gray-700 text-white rounded-lg px-3 py-2"
            >
              <option value="">Select Scenario</option>
              {scenarios.map(scenario => (
                <option key={scenario.name} value={scenario.name}>
                  {scenario.name}
                </option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <select
                value={timeScale}
                onChange={(e) => setTimeScale(Number(e.target.value))}
                className="bg-gray-700 text-white rounded-lg px-3 py-2"
              >
                <option value={0.1}>0.1x Speed</option>
                <option value={1}>1x Speed</option>
                <option value={10}>10x Speed</option>
                <option value={100}>100x Speed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4">
        <div className="col-span-2 h-[600px] bg-black rounded-lg overflow-hidden">
          <Canvas camera={{ position: [0, 200, 400], fov: 60 }}>
            <ambientLight intensity={0.3} />
            <pointLight position={[100, 100, 100]} intensity={2} />
            <Stars radius={300} depth={100} count={5000} factor={4} saturation={0} />
            
            <Saturn />
            <Spacecraft position={simState.position} />
            
            <OrbitControls />
          </Canvas>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-bold mb-2">Mission Time</h3>
            <div className="text-2xl text-indigo-400 font-mono">
              T+{simTime.toFixed(1)}s
            </div>
            <div className="text-sm text-gray-400">
              Scenario: {selectedScenario?.name || 'None selected'}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-bold mb-2">System Health</h3>
            {Object.entries(simState.systemHealth).map(([system, health]) => (
              <div key={system} className="mb-2">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span className="capitalize">{system}</span>
                  <span>{health.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      health > 80 ? 'bg-green-500' :
                      health > 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${health}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-bold mb-2">Anomalies</h3>
            {simState.anomalies.length === 0 ? (
              <p className="text-gray-400 text-sm">No anomalies detected</p>
            ) : (
              <div className="space-y-2">
                {simState.anomalies.map((anomaly, index) => (
                  <div key={index} className="flex items-center text-yellow-500 text-sm">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {anomaly}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionSimulation;