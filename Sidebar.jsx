import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Map, 
  Truck, 
  ShieldCheck, 
  Fuel, 
  Users, 
  Wrench, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Logo from './Logo'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Map, label: 'Fleet Map', to: '/map' },
  { icon: Truck, label: 'Trucks', to: '/trucks' },
  { icon: ShieldCheck, label: 'Compliance', to: '/compliance' },
  { icon: Fuel, label: 'Fuel & Analytics', to: '/fuel' },
  { icon: Users, label: 'Driver Scores', to: '/drivers' },
  { icon: Wrench, label: 'Mechanics', to: '/mechanics' },
  { icon: MessageSquare, label: 'AI Assistant', to: '/assistant' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, user } = useApp()

  return (
    <aside 
      className="fixed left-0 top-0 h-full bg-bg-secondary border-r border-border z-50 transition-all duration-300 flex flex-col"
      style={{ width: sidebarOpen ? '240px' : '72px' }}
    >
      <div className="p-4 flex items-center justify-between">
        <Logo compact={!sidebarOpen} />
      </div>

      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-20 w-6 h-6 bg-accent-orange text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <nav className="mt-8 flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all group
              ${isActive 
                ? 'bg-accent-orange/10 text-accent-orange border-l-[3px] border-accent-orange' 
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
            `}
          >
            <item.icon size={20} className={sidebarOpen ? '' : 'mx-auto'} />
            {sidebarOpen && <span className="font-semibold text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {sidebarOpen && user && (
        <div className="p-4 border-t border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-orange/20 flex items-center justify-center text-accent-orange font-bold font-display">
            {user.name?.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-bold text-sm text-text-primary truncate">{user.name}</p>
            <p className="text-xs text-text-secondary truncate">{user.fleet_name}</p>
          </div>
        </div>
      )}
    </aside>
  )
}
