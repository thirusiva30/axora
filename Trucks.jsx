import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Truck as TruckIcon, 
  User, 
  Activity, 
  Calendar, 
  AlertTriangle, 
  Loader2, 
  X, 
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  Wrench,
  CheckCircle2,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Trucks() {
  const navigate = useNavigate()
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [riskData, setRiskData] = useState(null)
  const [compliance, setCompliance] = useState([])
  const [modalLoading, setModalLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  // Edit form state
  const [editForm, setEditForm] = useState({ driver: '', status: '', next_service: '' })

  const { user } = useApp()

  useEffect(() => {
    if (user) fetchTrucks()
  }, [user])

  const fetchTrucks = async () => {
    if (!user) return
    try {
      const res = await axios.get('/api/trucks')
      setTrucks(res.data)
    } catch (err) {
      toast.error('Failed to load fleet')
    } finally {
      setLoading(false)
    }
  }

  const openDetails = async (truck) => {
    setSelectedTruck(truck)
    setEditForm({ 
      driver: truck.driver, 
      status: truck.status, 
      next_service: truck.next_service 
    })
    setModalLoading(true)
    try {
      const [riskRes, compRes] = await Promise.all([
        axios.get(`/api/breakdown-risk/${truck.id}`),
        axios.get(`/api/compliance?truck_id=${truck.id}`)
      ])
      setRiskData(riskRes.data)
      setCompliance(compRes.data)
    } catch (err) {
      toast.error('Failed to load unit analytics')
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`/api/trucks/${selectedTruck.id}`, editForm)
      toast.success('Unit manifest updated')
      fetchTrucks()
      setSelectedTruck(null)
    } catch (err) {
      toast.error('Update failed')
    }
  }

  const filteredTrucks = filterStatus === 'all' 
    ? trucks 
    : trucks.filter(t => t.status === filterStatus)

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent-orange" size={40} />
    </div>
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <h2 className="text-3xl font-bold font-display tracking-tight text-white">Fleet Assets</h2>
           <p className="text-text-secondary mt-1 font-medium">{trucks.length} Units Active Across Global Corridors</p>
        </div>
        
        <div className="flex glass p-1 rounded-xl border-white/5">
           {['all', 'active', 'alert', 'offline'].map((status) => (
             <button
               key={status}
               onClick={() => setFilterStatus(status)}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                 filterStatus === status 
                   ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               {status}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTrucks.map((truck) => (
          <motion.div 
            whileHover={{ y: -5 }}
            key={truck.id}
            onClick={() => openDetails(truck)}
            className="card cursor-pointer group relative overflow-hidden"
          >
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-accent-orange/10 text-accent-orange rounded-xl">
                      <TruckIcon size={24} />
                   </div>
                   <div>
                      <h4 className="text-lg font-bold font-display text-white">{truck.nickname}</h4>
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-[2px]">{truck.id}</p>
                   </div>
                </div>
                <StatusBadge status={truck.status} />
             </div>

             <div className="space-y-5">
                <div className="flex justify-between text-sm">
                   <div className="flex items-center gap-2 text-text-secondary">
                      <User size={14} />
                      <span>{truck.driver}</span>
                   </div>
                   <div className="flex items-center gap-2 text-text-secondary">
                      <Calendar size={14} />
                      <span>{truck.next_service}</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-text-secondary">Corridor Sync</span>
                      <span className="text-text-primary">{truck.km_today} KM TODAY</span>
                   </div>
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mt-1">
                      <span className="text-text-secondary">Fuel Reserve</span>
                      <span className={truck.fuel < 25 ? 'text-accent-red' : 'text-accent-green'}>{truck.fuel}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${truck.fuel < 25 ? 'bg-accent-red' : 'bg-accent-green'}`} 
                        style={{ width: `${truck.fuel}%` }}
                      />
                   </div>
                </div>
             </div>

             <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${truck.status === 'active' ? 'bg-accent-green' : 'bg-accent-red'}`} />
                   <span className="text-[10px] font-bold text-text-secondary uppercase group-hover:text-text-primary transition-colors italic">{truck.last_location}</span>
                </div>
                <ChevronRight size={16} className="text-accent-orange opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
             </div>
          </motion.div>
        ))}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedTruck && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedTruck(null)}
               className="absolute inset-0 bg-bg-primary/80 backdrop-blur-md"
             />

             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="glass w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] border-white/10"
             >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-accent-orange text-white rounded-xl shadow-lg shadow-accent-orange/20">
                         <TruckIcon size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold font-display text-white">{selectedTruck.nickname} Detail</h3>
                         <p className="text-[10px] font-black text-text-secondary tracking-[2px]">{selectedTruck.id} | {selectedTruck.last_location}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedTruck(null)} className="p-2 hover:bg-white/5 rounded-full text-text-secondary hover:text-white transition-all">
                      <X size={24} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                   {modalLoading ? (
                     <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-accent-orange" size={32} />
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Aggregating Unit Telemetry...</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Left Side: Stats & Edit */}
                        <div className="space-y-8">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-bg-secondary/50 border border-border p-5 rounded-2xl">
                                 <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Risk Assessment</p>
                                 <div className="flex items-end gap-2">
                                    <h4 className={`text-3xl font-black font-display ${riskData?.riskPercent >= 70 ? 'text-accent-red' : riskData?.riskPercent >= 40 ? 'text-accent-yellow' : 'text-accent-green'}`}>
                                       {riskData?.riskPercent}%
                                    </h4>
                                    <span className="text-[10px] font-bold text-text-secondary uppercase pb-1 tracking-tighter">({riskData?.riskLevel})</span>
                                 </div>
                              </div>
                              <div className="bg-bg-secondary/50 border border-border p-5 rounded-2xl">
                                 <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Fuel Economy</p>
                                 <div className="flex items-end gap-2">
                                    <h4 className="text-3xl font-black font-display text-accent-orange">8.4</h4>
                                    <span className="text-[10px] font-bold text-text-secondary uppercase pb-1 tracking-tighter">(MPG)</span>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[2px]">Environmental Recommendation</h4>
                              <div className={`p-4 rounded-xl border ${riskData?.riskPercent >= 40 ? 'bg-accent-red/5 border-accent-red/20' : 'bg-accent-green/5 border-accent-green/20'}`}>
                                 <p className="text-sm font-medium leading-relaxed italic">{riskData?.recommendation}</p>
                              </div>
                           </div>

                           <form onSubmit={handleUpdate} className="space-y-5 pt-4 border-t border-white/5">
                              <h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[2px]">Update Unit Logs</h4>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">Assigned Driver</label>
                                    <input value={editForm.driver} onChange={e => setEditForm({...editForm, driver: e.target.value})} />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">Operational State</label>
                                    <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                                       <option value="active">Active</option>
                                       <option value="alert">Alert</option>
                                       <option value="offline">Offline</option>
                                    </select>
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">Next Service Schedule</label>
                                 <input type="date" value={editForm.next_service} onChange={e => setEditForm({...editForm, next_service: e.target.value})} />
                              </div>
                              <div className="flex gap-4 pt-4">
                                 <button type="button" onClick={() => navigate('/mechanics')} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 px-0">
                                    <Wrench size={16} /> BOOK MECHANIC
                                 </button>
                                 <button type="submit" className="btn-primary flex-1 py-3 px-0 font-black tracking-widest text-xs">SAVE OVERRIDE</button>
                              </div>
                           </form>
                        </div>

                        {/* Right Side: Compliance & Risk Breakdown */}
                        <div className="space-y-8">
                           <div className="space-y-4">
                              <h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[2px] flex items-center gap-2">
                                 <ShieldCheck size={14} className="text-accent-blue" />
                                 Active Compliance Log
                              </h4>
                              <div className="bg-bg-secondary/30 rounded-2xl border border-border overflow-hidden">
                                 <table className="w-full text-left text-xs">
                                    <thead>
                                       <tr className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-text-secondary">
                                          <th className="px-4 py-3">Document Type</th>
                                          <th className="px-4 py-3">Expires</th>
                                          <th className="px-4 py-3 text-right">State</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                       {compliance.map((c) => (
                                          <tr key={c.id}>
                                             <td className="px-4 py-3 font-bold text-text-primary">{c.type}</td>
                                             <td className="px-4 py-3 text-text-secondary font-mono">{c.expiry}</td>
                                             <td className="px-4 py-3 text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                                   c.status === 'ok' ? 'bg-accent-green/10 text-accent-green' : 
                                                   c.status === 'critical' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-yellow/10 text-accent-yellow'
                                                }`}>
                                                   {c.status}
                                                </span>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[2px] flex items-center gap-2">
                                 <Activity size={14} className="text-accent-orange" />
                                 Breakdown Risk Matrix
                              </h4>
                              <div className="space-y-4 p-5 glass rounded-2xl bg-white/[0.02]">
                                 <RiskComponent label="Maintenance Delay" score={riskData?.breakdown.maintenanceRisk} />
                                 <RiskComponent label="Driver Habit Score" score={riskData?.breakdown.driverRisk} />
                                 <RiskComponent label="Fuel Variance Risk" score={riskData?.breakdown.fuelRisk} />
                              </div>
                           </div>

                           <div className="p-4 bg-accent-blue/5 rounded-xl border border-accent-blue/10 flex gap-3">
                              <Info size={16} className="text-accent-blue shrink-0" />
                              <p className="text-[10px] text-text-secondary leading-relaxed font-medium italic">
                                This assessment was generated by Axora Intelligence v4.2 based on real-time telemetry and historically logged maintenance records.
                              </p>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    alert: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    offline: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
  }
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status}
    </span>
  )
}

function RiskComponent({ label, score = 0 }) {
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          <span>{label}</span>
          <span className="text-text-primary">{score}%</span>
       </div>
       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
             className={`h-full transition-all duration-1000 ${score > 25 ? 'bg-accent-red' : score > 10 ? 'bg-accent-yellow' : 'bg-accent-orange'}`} 
             style={{ width: `${score}%` }}
          />
       </div>
    </div>
  )
}
