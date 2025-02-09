import type { CassiniMissionData, SatelliteCoordinationData } from '../types/CassiniData';

interface SystemStatus {
  health: {
    thermal: string;
    propulsion: string;
    communication: string;
  };
  power: {
    consumption: number;
    batteryLevel: number;
  };
  storage: number;
  groundStation: string;
}

interface PerformanceData {
  timestamp: string;
  power: number;
  battery: number;
  storage: number;
}

interface TaskData {
  id: string;
  name: string;
  duration: number;
  priority: string;
  status: string;
  startTime: number;
  totalDuration: number;
}

interface SatelliteData {
  id: string;
  groundStation: string;
  bandwidth: {
    used: number;
    available: number;
  };
  status: {
    link: string;
    conflict: string;
    weather: string;
  };
  priority: string;
  throughput: number;
}

export class DataService {
  private cassiniData: CassiniMissionData[] = [];
  private satelliteData: SatelliteCoordinationData[] = [];
  private lastUpdateTime: number = Date.now();
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private updateInProgress: boolean = false;
  private errorCount: number = 0;
  private readonly MAX_RETRIES = 3;
  private readonly ERROR_RESET_INTERVAL = 60000; // 1 minute
  private updateInterval: NodeJS.Timeout | null = null;
  private activeTasks: Map<string, TaskData> = new Map();

  private taskTypes = [
    'Saturn Ring Analysis',
    'Saturn Atmospheric Study',
    'Titan Surface Mapping',
    'Enceladus Plume Analysis',
    'Magnetosphere Measurements',
    'Radio Science',
    'Infrared Spectroscopy',
    'Saturn Aurora Imaging',
    'Ring Particle Analysis',
    'Moon Orbital Dynamics'
  ];

  private groundStations = [
    'GS-ALPHA',
    'GS-BETA',
    'GS-GAMMA',
    'GS-DELTA',
    'GS-EPSILON'
  ];

  private weatherConditions = ['Clear', 'Rain', 'Storm'];
  private priorities = ['High', 'Medium', 'Low'];

  constructor() {
    // Initialize error count reset interval
    setInterval(() => {
      this.errorCount = 0;
    }, this.ERROR_RESET_INTERVAL);

    // Initialize task update interval
    setInterval(() => {
      this.updateTaskDurations();
    }, 1000);
  }

  private updateTaskDurations() {
    const now = Date.now();
    this.activeTasks.forEach((task, id) => {
      const elapsed = now - task.startTime;
      const remaining = Math.max(0, task.totalDuration * 60000 - elapsed);
      task.duration = Math.ceil(remaining / 60000);

      if (task.duration <= 0) {
        // Task completed, generate a new one
        this.activeTasks.delete(id);
        this.generateNewTask();
      }
    });
  }

  private generateNewTask(): TaskData {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalDuration = 30 + Math.floor(Math.random() * 90); // 30-120 minutes
    const task: TaskData = {
      id,
      name: this.taskTypes[Math.floor(Math.random() * this.taskTypes.length)],
      duration: totalDuration,
      priority: this.priorities[Math.floor(Math.random() * this.priorities.length)],
      status: 'Success',
      startTime: Date.now(),
      totalDuration
    };
    this.activeTasks.set(id, task);
    return task;
  }

  private generateRandomCassiniData(): CassiniMissionData[] {
    const now = Date.now();
    return Array(5).fill(null).map((_, index) => {
      const task = Array.from(this.activeTasks.values())[index] || this.generateNewTask();
      return {
        timestamp: new Date(now - index * 60000).toISOString(),
        power_consumption_w: 150 + Math.random() * 100,
        "battery_level_%": 70 + Math.random() * 30,
        data_storage_usage_mb: 4000 + Math.random() * 4000,
        thermal_health: Math.random() > 0.2 ? "Good" : "Warning",
        propulsion_health: Math.random() > 0.1 ? "Operational" : "Degraded",
        communication_health: Math.random() > 0.15 ? "Stable" : "Intermittent",
        attitude_control_health: "Normal",
        orbital_position_x_km: -1200000 + Math.random() * 2400000, // Saturn orbit range
        orbital_position_y_km: -1500000 + Math.random() * 3000000,
        orbital_position_z_km: -800000 + Math.random() * 1600000,
        ground_station_visibility: Math.random() > 0.1 ? "Available" : "Unavailable",
        task_id: parseInt(task.id.split('-')[1]),
        task_type: task.name,
        task_priority: task.priority,
        execution_duration_min: task.duration,
        power_used_w: 100 + Math.random() * 100,
        memory_used_mb: 100 + Math.random() * 200,
        bandwidth_used_mbps: 10 + Math.random() * 20,
        task_success: task.status,
        anomaly_id: Math.random() > 0.8 ? Math.floor(Math.random() * 100) : null,
        anomaly_type: null,
        duration_min: null,
        recovery_action: null,
        impact_on_tasks: null
      };
    });
  }

  private generateRandomSatelliteData(): SatelliteCoordinationData[] {
    return Array(5).fill(null).map((_, index) => ({
      timestamp: new Date().toISOString(),
      satellite_id: `SAT-${String(index + 1).padStart(3, '0')}`,
      ground_station: this.groundStations[Math.floor(Math.random() * this.groundStations.length)],
      inter_satellite_link: Math.random() > 0.1 ? "Available" : "Unavailable",
      bandwidth_used_mbps: 100 + Math.random() * 400,
      available_bandwidth_mbps: 600 + Math.random() * 400,
      conflict_status: Math.random() > 0.9 ? "Conflict" : "No Conflict",
      conflict_resolution: "Granted",
      weather_condition: this.weatherConditions[Math.floor(Math.random() * this.weatherConditions.length)],
      priority: this.priorities[Math.floor(Math.random() * this.priorities.length)],
      orbital_position_x_km: -20000 + Math.random() * 40000,
      orbital_position_y_km: -30000 + Math.random() * 60000,
      orbital_position_z_km: -15000 + Math.random() * 30000,
      throughput_mbps: 200 + Math.random() * 500
    }));
  }

  private async initializeData(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Generate initial tasks
      for (let i = 0; i < 5; i++) {
        this.generateNewTask();
      }

      // Generate initial data
      this.cassiniData = this.generateRandomCassiniData();
      this.satelliteData = this.generateRandomSatelliteData();
      
      this.isInitialized = true;
      this.lastUpdateTime = Date.now();

      // Start periodic updates
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }

      this.updateInterval = setInterval(() => {
        if (!this.updateInProgress) {
          this.updateData();
        }
      }, 1000);

    } catch (error) {
      console.error('Error during data service initialization:', error);
      this.isInitialized = false;
      throw new Error('Failed to initialize data service');
    }
  }

  private updateData() {
    if (!this.isInitialized || this.updateInProgress) return;

    try {
      this.updateInProgress = true;
      const now = Date.now();

      // Update Cassini data with new random values
      this.cassiniData = this.generateRandomCassiniData();
      this.satelliteData = this.generateRandomSatelliteData();

      this.lastUpdateTime = now;
      this.errorCount = 0; // Reset error count on successful update
    } catch (error) {
      console.error('Error updating data:', error);
      this.errorCount++;
      
      if (this.errorCount >= this.MAX_RETRIES) {
        this.isInitialized = false;
      }
    } finally {
      this.updateInProgress = false;
    }
  }

  // Public methods
  async loadData(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeData();
    }
    return this.initializationPromise;
  }

  getLatestSystemStatus(): SystemStatus | null {
    if (!this.isInitialized || this.cassiniData.length === 0) {
      return {
        health: {
          thermal: "Good",
          propulsion: "Operational",
          communication: "Stable",
        },
        power: {
          consumption: 150,
          batteryLevel: 85
        },
        storage: 5000,
        groundStation: "Available"
      };
    }

    try {
      const latest = this.cassiniData[0];
      return {
        health: {
          thermal: latest.thermal_health,
          propulsion: latest.propulsion_health,
          communication: latest.communication_health,
        },
        power: {
          consumption: latest.power_consumption_w,
          batteryLevel: latest["battery_level_%"]
        },
        storage: latest.data_storage_usage_mb,
        groundStation: latest.ground_station_visibility
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return null;
    }
  }

  getSystemPerformanceData(): PerformanceData[] {
    if (!this.isInitialized) {
      return [{
        timestamp: new Date().toLocaleTimeString(),
        power: 150,
        battery: 85,
        storage: 5000
      }];
    }

    try {
      return this.cassiniData.map(data => ({
        timestamp: new Date(data.timestamp).toLocaleTimeString(),
        power: data.power_consumption_w,
        battery: data["battery_level_%"],
        storage: data.data_storage_usage_mb
      }));
    } catch (error) {
      console.error('Error getting performance data:', error);
      return [];
    }
  }

  getActiveTasks(): TaskData[] {
    if (!this.isInitialized) {
      return [{
        id: "1",
        name: "System Initialization",
        duration: 60,
        priority: "High",
        status: "Success",
        startTime: Date.now(),
        totalDuration: 60
      }];
    }

    try {
      return Array.from(this.activeTasks.values());
    } catch (error) {
      console.error('Error getting active tasks:', error);
      return [];
    }
  }

  getSatelliteCoordination(): SatelliteData[] {
    if (!this.isInitialized) {
      return [{
        id: "SAT-001",
        groundStation: "GS-ALPHA",
        bandwidth: {
          used: 200,
          available: 500
        },
        status: {
          link: "Available",
          conflict: "No Conflict",
          weather: "Clear"
        },
        priority: "high",
        throughput: 300
      }];
    }

    try {
      return this.satelliteData.map(data => ({
        id: data.satellite_id,
        groundStation: data.ground_station,
        bandwidth: {
          used: data.bandwidth_used_mbps,
          available: data.available_bandwidth_mbps
        },
        status: {
          link: data.inter_satellite_link,
          conflict: data.conflict_status,
          weather: data.weather_condition
        },
        priority: data.priority.toLowerCase(),
        throughput: data.throughput_mbps
      }));
    } catch (error) {
      console.error('Error getting satellite coordination:', error);
      return [];
    }
  }
}