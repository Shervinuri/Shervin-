import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { GlassCard } from './components/GlassCard';
import { GlassButton } from './components/GlassButton';
import { GlassInput } from './components/GlassInput';
import { Search, Bell, User, Settings, Home, BarChart2, Calendar, Plus, Heart, Share2 } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen p-8 font-sans text-slate-800">
      <BackgroundBlobs />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <GlassCard className="h-full flex flex-col justify-between min-h-[80vh]">
            <div>
              <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  L
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                  Liquid UI
                </h1>
              </div>
              
              <nav className="space-y-4">
                {[
                  { icon: <Home size={20} />, label: 'Dashboard', active: true },
                  { icon: <BarChart2 size={20} />, label: 'Analytics' },
                  { icon: <Calendar size={20} />, label: 'Schedule' },
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
                  <p className="text-sm font-semibold">Pro Plan</p>
                  <p className="text-xs text-slate-500">Active until Dec</p>
                </div>
              </div>
              <GlassButton variant="secondary" size="sm" className="w-full text-xs">
                Upgrade Now
              </GlassButton>
            </GlassCard>
          </GlassCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Welcome back, Alex!</h2>
              <p className="text-slate-500">Here's what's happening today.</p>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <GlassInput 
                placeholder="Search projects..." 
                icon={<Search size={18} />} 
                className="w-full md:w-64"
              />
              <GlassButton variant="icon" className="bg-white/40">
                <Bell size={20} />
              </GlassButton>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 border-2 border-white shadow-md" />
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Revenue', value: '$45,231', change: '+20.1%', color: 'text-green-600' },
              { label: 'Active Users', value: '2,345', change: '+15.2%', color: 'text-blue-600' },
              { label: 'New Projects', value: '12', change: '+4.5%', color: 'text-orange-600' },
            ].map((stat, index) => (
              <GlassCard key={index} className="flex flex-col gap-2">
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                <span className={`text-sm font-semibold ${stat.color} bg-white/40 px-2 py-1 rounded-lg w-fit`}>
                  {stat.change} from last month
                </span>
              </GlassCard>
            ))}
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard className="min-h-[300px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Recent Activity</h3>
                <GlassButton variant="ghost" size="sm">View All</GlassButton>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/30 rounded-xl transition-colors cursor-pointer">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      i === 0 ? 'bg-blue-100 text-blue-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {i === 0 ? <Share2 size={18} /> : i === 1 ? <Heart size={18} /> : <Plus size={18} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Project Update {i + 1}</p>
                      <p className="text-sm text-slate-500">2 hours ago</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">Details</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="min-h-[300px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-0" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4">Create New Project</h3>
                <p className="text-slate-500 mb-6">Start a new journey with our premium tools.</p>
                
                <div className="space-y-4">
                  <GlassInput placeholder="Project Name" />
                  <div className="flex gap-4">
                    <GlassButton className="flex-1">Create Project</GlassButton>
                    <GlassButton variant="ghost" className="flex-1">Cancel</GlassButton>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
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
