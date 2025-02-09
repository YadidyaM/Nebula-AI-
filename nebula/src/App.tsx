import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MissionControl from './components/MissionControl';
import ResourceManager from './components/ResourceManager';
import MissionSimulation from './components/MissionSimulation';
import { Rocket } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm">
            <div className="px-6 py-4 flex items-center">
              <Rocket className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Nebula AI</h1>
            </div>
          </header>
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/mission-control" element={<MissionControl />} />
              <Route path="/resources" element={<ResourceManager />} />
              <Route path="/simulation" element={<MissionSimulation />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;