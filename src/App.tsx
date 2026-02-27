import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { GlassCard } from './components/GlassCard';
import { GlassButton } from './components/GlassButton';
import { ConfigManager } from './components/ConfigManager';
import { Home, BarChart2, Calendar, Settings, User } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen p-8 font-sans text-slate-800">
      <BackgroundBlobs />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 hidden lg:block">
          <GlassCard className="h-full flex flex-col justify-between min-h-[80vh] sticky top-8">
            <div>
              <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  A
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                  Amnezia Mgr
                </h1>
              </div>
              
              <nav className="space-y-4">
                {[
                  { icon: <Home size={20} />, label: 'Config Manager', active: true },
                  { icon: <BarChart2 size={20} />, label: 'Analytics' },
                  { icon: <Calendar size={20} />, label: 'History' },
                  { icon: <Settings size={20} />, label: 'Settings' },
                ].map((item, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
                      item.active 
                        ? 'bg-white/40 shadow-sm text-blue-600 font-semibold' 
                        : 'hover:bg-white/20 text-slate-600'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            
            <GlassCard className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-white/20 mt-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/40 rounded-full">
                  <User size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Client Mode</p>
                  <p className="text-xs text-slate-500">Browser Only</p>
                </div>
              </div>
            </GlassCard>
          </GlassCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Config Manager</h2>
              <p className="text-slate-500">Import, obfuscate, and manage your VPN configs.</p>
            </div>
          </header>

          <ConfigManager />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
