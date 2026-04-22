import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, Search, Filter, Truck, AlertTriangle, MapPin, ChevronRight, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'motion/react'

import { useApp } from '../context/AppContext'

// Icon setup
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
        ${status === 'active' ? `<div style="position: absolute; inset: -4px; border-radius: 50%; border: 1px solid ${color}; animation: pulse 2s infinite;"></div>` : ''}
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

function MapController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 })
  }, [center, zoom, map])
  return null
}

export default function FleetMap() {
  const { user } = useApp()
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [view, setView] = useState({ center: [20, 0], zoom: 3 })

  const fetchTrucks = async () => {
    if (!user) return
    try {
      const res = await axios.get('/api/trucks')
      setTrucks(res.data)
    } catch (err) {
      toast.error('Failed to load fleet locations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchTrucks()
  }, [user])

  const filteredTrucks = trucks.filter(t => {
    const matchesFilter = filter === 'All' || t.status === filter.toLowerCase()
    const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase()) || 
                          t.nickname?.toLowerCase().includes(search.toLowerCase()) ||
                          t.last_location?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const focusTruck = (truck) => {
    setView({ center: [truck.lat, truck.lng], zoom: 12 })
  }

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent-orange" size={40} />
    </div>
  )

  return (
    <div className="h-[calc(100vh-112px)] rounded-2xl overflow-hidden relative shadow-2xl border border-border">
      <MapContainer 
        center={view.center} 
        zoom={view.zoom} 
        className="h-full w-full grayscale-[0.6] invert-[0.9] hue-rotate-[180deg] brightness-[0.7]"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CartoDB'
        />
        <MapController center={view.center} zoom={view.zoom} />
        {filteredTrucks.map(truck => (
          <Marker 
            key={truck.id} 
            position={[truck.lat, truck.lng]} 
            icon={createTruckIcon(truck.status)}
          >
            <Popup className="custom-popup">
              <div className="p-2 space-y-3 w-56">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-accent-orange text-lg leading-tight">{truck.nickname}</h4>
                    <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{truck.id}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    truck.status === 'active' ? 'bg-green-500/10 text-green-500' : 
                    truck.status === 'alert' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {truck.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs leading-none">
                  <div className="space-y-1">
                    <p className="text-slate-500">Speed</p>
                    <p className="font-bold text-slate-200">{truck.speed} kph</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500">Fuel</p>
                    <p className={`font-bold ${truck.fuel < 20 ? 'text-red-500' : 'text-green-500'}`}>{truck.fuel}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500">Driver</p>
                    <p className="font-bold text-slate-200">{truck.driver}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500">Logged Today</p>
                    <p className="font-bold text-slate-200">{truck.km_today}km</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100/10">
                   <p className="text-[10px] text-slate-500 font-medium italic">
                     <MapPin size={10} className="inline mr-1" />
                     {truck.last_location}
                   </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Control Panel */}
      <div className="absolute top-6 left-6 z-[1000] w-80 max-h-[85%] flex flex-col pointer-events-none">
        <div className="glass p-6 pointer-events-auto shadow-2xl flex flex-col overflow-hidden border-white/10">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-2">
               <Activity className="text-accent-orange" size={20} />
               Global Operations
             </h3>
             <span className="bg-accent-orange/20 text-accent-orange px-2 py-0.5 rounded text-[9px] font-black">LIVE</span>
          </div>

          <div className="relative mb-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
             <input 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Identify unit ID..." 
               className="pl-9 py-2 text-xs h-10"
             />
          </div>

          <div className="flex gap-1 mb-6">
             {['All', 'Active', 'Alert', 'Offline'].map(f => (
               <button 
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                   filter === f ? 'bg-accent-orange border-accent-orange text-white' : 'bg-white/5 border-border text-text-secondary hover:text-white'
                 }`}
               >
                 {f}
               </button>
             ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
             <AnimatePresence>
               {filteredTrucks.map(truck => (
                 <motion.button 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   key={truck.id}
                   onClick={() => focusTruck(truck)}
                   className="w-full text-left p-3 rounded-xl bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-between group"
                 >
                   <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        truck.status === 'active' ? 'bg-green-500' : truck.status === 'alert' ? 'bg-red-500' : 'bg-slate-500'
                      }`} />
                      <div>
                         <p className="text-xs font-bold text-text-primary tracking-tight leading-none mb-1">{truck.nickname}</p>
                         <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest">{truck.id}</p>
                      </div>
                   </div>
                   <ChevronRight size={14} className="text-text-secondary group-hover:text-accent-orange group-hover:translate-x-1 transition-all" />
                 </motion.button>
               ))}
             </AnimatePresence>
             {filteredTrucks.length === 0 && (
               <p className="text-center py-10 text-xs text-text-secondary italic">No matching units found</p>
             )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper { background: #0D1B2A; color: #F0F4F8; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
        .custom-popup .leaflet-popup-tip { background: #0D1B2A; }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
