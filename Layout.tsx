import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Route, 
  BarChart3, 
  Settings, 
  Menu, 
  Search, 
  Bot,
  Gavel,
  LogOut,
  Trophy
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function Layout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-white/10 glass-panel flex flex-col z-50">
        <div className="p-6 flex items-center justify-center lg:justify-start">
          <span className="text-2xl font-black text-primary-orange tracking-tighter">AXORA</span>
        </div>
        
        <nav className="mt-8 flex-1 px-4 space-y-2">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/assets" icon={<Truck size={20} />} label="Fleet Assets" />
          <NavItem to="/leaderboard" icon={<Trophy size={20} />} label="Leaderboard" />
          <NavItem to="/logistics" icon={<Route size={20} />} label="Logistics" />
          <NavItem to="/analytics" icon={<BarChart3 size={20} />} label="Analytics" />
          <NavItem to="/compliance" icon={<Gavel size={20} />} label="Compliance" />
          <NavItem to="/assistant" icon={<Bot size={20} />} label="AI Assistant" />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
          <button className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group">
            <LogOut size={20} className="shrink-0" />
            <span className="ml-4 hidden lg:block font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between px-8 py-4 bg-[#070D14]/60 backdrop-blur-lg border-b border-white/5 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <Menu className="text-primary-orange cursor-pointer hover:opacity-70 transition-opacity" />
            <h1 className="text-lg font-bold text-white font-display uppercase tracking-widest hidden sm:block">Fleet Intelligence</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-[#122131] rounded-full px-4 py-1.5 border border-white/5">
              <Search size={14} className="text-slate-400 mr-2" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm text-slate-200 placeholder-slate-500 w-48 outline-none" 
                placeholder="Search assets..." 
              />
            </div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="flex flex-col items-end mr-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Profile</span>
                <span className="text-xs font-semibold text-white">Johnathon Doe</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-primary-orange overflow-hidden shadow-lg p-0.5">
                <img 
                  className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                  src="https://i.pravatar.cc/150?u=john" 
                  alt="Profile" 
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => cn(
        "flex items-center px-4 py-3 rounded-lg transition-all duration-200 group relative",
        isActive 
          ? "bg-primary-orange/10 text-primary-orange font-bold border-r-4 border-primary-orange" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <div className="shrink-0">{icon}</div>
      <span className="ml-4 hidden lg:block font-medium">{label}</span>
      {/* Tooltip for collapsed state would go here */}
    </NavLink>
  );
}
