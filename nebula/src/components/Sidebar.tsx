import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Rocket, Database, Users, PlaySquare } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: <LayoutDashboard />, label: 'Dashboard' },
    { path: '/mission-control', icon: <Rocket />, label: 'Mission Control' },
    { path: '/resources', icon: <Database />, label: 'Resources' },
    { path: '/simulation', icon: <PlaySquare />, label: 'Simulation' }
  ];

  const teamMembers = [
    { name: 'Meghana Nagaraja', username: '@meghana_01', url: 'https://lablab.ai/u/@meghana_01' },
    { name: 'Yadidya Medepalli', username: '@Yadidya', url: 'https://lablab.ai/u/@Yadidya' },
    { name: 'Monica Jayakumar', username: '@Mon_mj', url: 'https://lablab.ai/u/@Mon_mj' },
  ];

  return (
    <div className="w-64 bg-indigo-900 text-white flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold">Nebula AI</h2>
      </div>
      <nav className="mt-6 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm ${
                isActive
                  ? 'bg-indigo-800 border-l-4 border-white'
                  : 'hover:bg-indigo-800'
              }`
            }
          >
            <span className="w-5 h-5">{item.icon}</span>
            <span className="ml-3">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-6 border-t border-indigo-800">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5" />
          <h3 className="ml-2 text-sm font-semibold">Team Members</h3>
        </div>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.username} className="text-sm">
              <div className="font-medium">{member.name}</div>
              <a
                href={member.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-white transition-colors text-xs"
              >
                {member.username}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;