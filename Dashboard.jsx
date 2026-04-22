import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'motion/react'
import { 
  Truck, 
  Fuel, 
  ShieldCheck, 
  Bell, 
  Star, 
  TrendingUp,
  MapPin,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Wrench,
  MessageSquare
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import FleetOnboarding from '../components/FleetOnboarding'

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createTruckIcon = (status) => {
  const color = status === 'active' ? '#27AE60' : status === 'alert' ? '#E74C3C' : '#8899AA';
  return L.divIcon({
    className: 'custom-truck-icon',
    html: `
      <div style="position: relative; width: 14px; height: 14px;">
        <div style="width: 14px; height: 14px; background: ${color}; border-radius: 50%; border: 3px solid #0D1B2A; box-shadow: 0 0 10px ${color}80;"></div>
        ${status === 'active' ? `<div style="position: absolute; inset: -3px; border-radius: 50%; border: 1px solid ${color}; animation: pulse 2s infinite;"></div>` : ''}
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [data, setData] = useState(null)
  const [axoraScore, setAxoraScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [dashRes, scoreRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/axora-score')
      ])
      setData(dashRes.data)
      setAxoraScore(scoreRes.data)
      setError(null)
    } catch (err) {
      console.error('Dashboard sync failure:', err)
      const detail = err.response?.data?.detail || err.message
      setError(`Neural network connectivity lost. Identity verification failed: ${detail}`)
      toast.error('Dashboard data synchronization failure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const resolveAlert = async (id) => {
    try {
      await axios.put(`/api/alerts/${id}/resolve`)
      toast.success('Alert resolved')
      fetchData()
    } catch (err) {
      toast.error('Failed to resolve alert')
    }
  }

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-accent-orange" size={40} />
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[3px]">Syncing Fleet Telemetry...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8 space-y-6">
      <div className="w-20 h-20 bg-accent-red/10 rounded-full flex items-center justify-center">
        <AlertTriangle className="text-accent-red" size={40} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white uppercase italic">System Synchronization Failed</h3>
        <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">{error}</p>
      </div>
      <button 
        onClick={fetchData}
        className="btn-primary px-8 py-3 text-xs font-black tracking-widest uppercase"
      >
        Retry Connection
      </button>
    </div>
  )

  if (!data) return null

  if (data.totalTrucks === 0) {
    return <FleetOnboarding onComplete={fetchData} user={user} />
  }

  const kpis = [
    { label: 'Active Trucks', value: `${data.activeTrucks}/${data.totalTrucks}`, icon: Truck, color: 'text-accent-green', bg: 'bg-accent-green/10' },
    { label: 'Monthly Fuel', value: `$${data.monthlyFuelCost}`, icon: Fuel, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    { label: 'Compliance', value: `${data.complianceScore}%`, icon: ShieldCheck, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
    { label: 'Active Alerts', value: data.alertCount, icon: Bell, color: 'text-accent-red', bg: 'bg-accent-red/10' },
    { label: 'Axora Score', value: `${axoraScore?.axoraScore}/100`, icon: Star, color: 'text-accent-yellow', bg: 'bg-accent-yellow/10' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Banner */}
      <section className="bg-bg-card border-l-4 border-accent-orange p-8 rounded-r-3xl bg-gradient-to-br from-bg-card via-bg-secondary/50 to-bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-orange/5 blur-3xl rounded-full -mr-32 -mt-32" />
        <h1 className="text-3xl font-black font-display text-white italic tracking-tighter uppercase">
          Welcome, {user?.name?.split(' ')[0] || 'Commander'}.
        </h1>
        <p className="text-text-secondary mt-2 font-medium tracking-tight">
          System Core v4.1 Initialized. Authorized for {user?.fleet_name || 'Global Fleet Operations'}.
        </p>
        <div className="flex flex-wrap gap-4 mt-8">
          <StatusPill color="red" label={`${data.alertCount} Neural Alerts`} />
          <StatusPill color="green" label={`${data.activeTrucks} Active Assets`} />
          <StatusPill color="blue" label={`Compliance Index: ${data.complianceScore}%`} />
        </div>
      </section>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card flex flex-col gap-4"
          >
            <div className={`w-10 h-10 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-[1px]">{kpi.label}</p>
              <h3 className="text-2xl font-black text-text-primary mt-1">{kpi.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sticky top-0">
        {/* Global Map */}
        <div className="lg:col-span-7 h-[500px] overflow-hidden rounded-2xl border border-border shadow-2xl relative">
          <div className="absolute top-4 left-4 z-10 glass px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-primary">
            World Deployment View
          </div>
          <MapContainer 
            center={[20, 0]} 
            zoom={2} 
            className="h-full w-full grayscale-[0.5] invert-[0.9] hue-rotate-[180deg] brightness-[0.8]"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CartoDB'
            />
            {data.trucks.map(truck => (
              <Marker 
                key={truck.id} 
                position={[truck.lat, truck.lng]} 
                icon={createTruckIcon(truck.status)}
              >
                <Popup className="custom-popup">
                  <div className="p-1 space-y-2">
                    <p className="font-bold text-sm text-accent-orange">{truck.nickname} <span className="text-[10px] text-slate-500 ml-1">({truck.id})</span></p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <p><span className="text-slate-400">Driver:</span> {truck.driver}</p>
                      <p><span className="text-slate-400">Speed:</span> {truck.speed}km/h</p>
                      <p><span className="text-slate-400">Fuel:</span> <span className={truck.fuel < 20 ? 'text-red-500' : 'text-green-500'}>{truck.fuel}%</span></p>
                      <p><span className="text-slate-400">KM:</span> {truck.km_today}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 italic mt-1 border-t border-slate-100 pt-1">Location: {truck.last_location}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Live Alerts */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display uppercase tracking-wider text-text-primary">Intelligence Feed</h3>
            <span className="text-[10px] font-black px-2 py-1 bg-accent-red/20 text-accent-red rounded">{data.alerts.length} NEW</span>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[440px] pr-2 custom-scrollbar">
            {data.alerts.length > 0 ? data.alerts.map((alert) => (
              <div key={alert.id} className={`glass p-4 border-l-4 ${alert.type === 'critical' ? 'border-accent-red' : alert.type === 'warning' ? 'border-accent-yellow' : 'border-accent-blue'} flex gap-4 animate-in slide-in-from-right duration-500`}>
                <div className={`p-2 rounded-lg shrink-0 h-fit ${alert.type === 'critical' ? 'bg-accent-red/10 text-accent-red' : alert.type === 'warning' ? 'bg-accent-yellow/10 text-accent-yellow' : 'bg-accent-blue/10 text-accent-blue'}`}>
                  {alert.type === 'critical' ? <AlertTriangle size={18} /> : alert.type === 'warning' ? <Info size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{alert.truck_id || 'SYSTEM'}</span>
                    <span className="text-[9px] text-text-secondary font-medium italic">Just now</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{alert.message}</p>
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    className="text-[10px] font-bold text-accent-orange hover:brightness-110 mt-2 flex items-center gap-1 group"
                  >
                    RESOLVE EVENT <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 glass opacity-50">
                <CheckCircle2 className="text-accent-green mb-4" size={48} />
                <p className="text-sm font-medium">All clear. No active alerts.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="card h-[400px]">
          <h4 className="text-sm font-bold font-display uppercase tracking-widest text-text-secondary mb-6">Fuel Usage: Expected (World Bank) vs Actual</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.weeklyFuel}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#8899AA', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#8899AA', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
              />
              <Bar dataKey="expected" fill="var(--color-accent-blue)" radius={[4, 4, 0, 0]} barSize={24} name="Target Load" />
              <Bar dataKey="actual" fill="var(--color-accent-orange)" radius={[4, 4, 0, 0]} barSize={24} name="Fuel Logged" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card h-[400px]">
          <h4 className="text-sm font-bold font-display uppercase tracking-widest text-text-secondary mb-6">Risk Profile Progression</h4>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={data.weeklyFuel}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent-orange)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-accent-orange)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#8899AA', fontSize: 13}} />
              <Area type="monotone" dataKey="actual" stroke="var(--color-accent-orange)" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
              <Tooltip 
                 contentStyle={{ background: '#0D1B2A', border: 'none', borderRadius: '12px' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionButton label="Schedule Service" onClick={() => navigate('/mechanics')} icon={Wrench} />
        <ActionButton label="View Compliance" onClick={() => navigate('/compliance')} icon={ShieldCheck} />
        <ActionButton label="Fuel Analysis" onClick={() => navigate('/fuel')} icon={TrendingUp} />
        <ActionButton label="Ask Axora AI" onClick={() => navigate('/assistant')} icon={MessageSquare} />
      </div>
    </div>
  )
}

function StatusPill({ color, label }) {
  const colors = {
    red: 'bg-accent-red/20 text-accent-red border-accent-red/20',
    green: 'bg-accent-green/20 text-accent-green border-accent-green/20',
    blue: 'bg-accent-blue/20 text-accent-blue border-accent-blue/20'
  }
  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${colors[color]}`}>
      {label}
    </span>
  )
}

function ActionButton({ label, onClick, icon: Icon }) {
  return (
    <button 
      onClick={onClick}
      className="glass p-5 flex flex-col items-center gap-3 group hover:border-accent-orange/50 transition-all active:scale-95"
    >
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-text-secondary group-hover:bg-accent-orange group-hover:text-white transition-all shadow-inner">
        <Icon size={24} />
      </div>
      <span className="text-xs font-bold text-text-primary tracking-tight">{label}</span>
    </button>
  )
}
