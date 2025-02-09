export const cassiniMissionData = [
  {
    id: "CSN-001",
    timestamp: "2024-03-10T10:00:00Z",
    status: "nominal",
    subsystems: {
      propulsion: 98,
      power: 95,
      communication: 100,
      payload: 97
    },
    nextTask: "Saturn Ring Imaging",
    location: {
      latitude: 45.5,
      longitude: -122.6
    },
    resourceUsage: {
      power: 65,
      bandwidth: 45,
      storage: 72
    }
  },
  // Add more mock data as needed
];

export const satelliteCoordinationData = [
  {
    id: "SAT-001",
    timestamp: "2024-03-10T10:00:00Z",
    status: "nominal",
    groundStation: "GS-ALPHA",
    bandwidth: 85,
    nextDownlink: "2024-03-10T12:00:00Z",
    priority: "high",
    dataQueue: 256 // MB
  },
  // Add more mock data as needed
];