import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Fuel as FuelIcon, 
  AlertCircle, 
  Activity, 
  Plus, 
  Loader2, 
  Info,
  CheckCircle2,
  TrendingUp,
  BarChart,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import toast from 'react-hot-toast'

import { useApp } from '../context/AppContext'

export default function Fuel() {
  const { user } = useApp()
  const [logs, setLogs] = useState([])
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTruck, setSelectedTruck] = useState('All')
  const [submitting, setSubmitting] = useState(false)

  // Log form state
  const [formData, setFormData] = useState({
    truck_id: '',
    day: 'Mon',
    expected_litres: '',
    actual_litres: ''
  })

  const fetchData = async () => {
    if (!user) return
    try {
      const [fuelRes, truckRes] = await Promise.all([
        axios.get('/api/fuel'),
        axios.get('/api/trucks')
      ])
      setLogs(fuelRes.data)
      setTrucks(truckRes.data)
      if (truckRes.data.length > 0) setFormData(prev => ({ ...prev, truck_id: truckRes.data[0].id }))
    } catch (err) {
      toast.error('Failed to sync fuel telemetry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await axios.post('/api/fuel', formData)
      toast.success(`Log recorded. Variance: ${res.data.variance}%`)
      if (res.data.anomaly) {
        toast.error('FUEL ANOMALY DETECTED: Intelligence report filed.', { duration: 5000 })
      }
      fetchData()
      setFormData({ ...formData, expected_litres: '', actual_litres: '' })
    } catch (err) {
      toast.error('Logging failed')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredLogs = selectedTruck === 'All' 
    ? logs 
    : logs.filter(l => l.truck_id === selectedTruck)

  const chartData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
    const dayLogs = filteredLogs.filter(l => l.day === day)
    return {
      day,
      expected: Math.round(dayLogs.reduce((s, l) => s + l.expected_litres, 0)),
      actual: Math.round(dayLogs.reduce((s, l) => s + l.actual_litres, 0))
    }
  })

  const anomalies = logs.filter(l => ((l.actual_litres - l.expected_litres) / l.expected_litres) * 100 > 20)

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent-orange" size={40} />
    </div>
  )

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-bold font-display tracking-tight text-white">Fuel Intelligence</h2>
           <p className="text-text-secondary mt-1 font-medium italic">Detecting global supply chain leakage and theft patterns.</p>
        </div>
        <div className="flex gap-4">
           <select 
             className="w-48 bg-bg-secondary border border-border rounded-xl text-xs font-bold uppercase tracking-widest px-4 py-2"
             value={selectedTruck}
             onChange={e => setSelectedTruck(e.target.value)}
           >
              <option value="All">Global Fleet</option>
              {trucks.map(t => <option key={t.id} value={t.id}>{t.nickname} ({t.id})</option>)}
           </select>
        </div>
      </div>

      {/* Anomaly Alerts */}
      <AnimatePresence>
        {anomalies.length > 0 && (
          <section className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
             {anomalies.map((a, i) => (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.1 }}
                 key={a.id}
                 className="flex-shrink-0 w-80 bg-accent-red/10 border border-accent-red/20 p-5 rounded-2xl relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <AlertCircle size={64} className="text-accent-red" />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black bg-accent-red text-white px-2 py-0.5 rounded uppercase tracking-widest">Anomaly</span>
                    <span className="text-[10px] font-bold text-accent-red uppercase tracking-widest">{a.truck_id}</span>
                  </div>
                  <p className="text-sm font-bold text-text-primary leading-tight">High Variance Detected on {a.day}</p>
                  <div className="flex items-end gap-3 mt-4">
                     <h3 className="text-3xl font-black font-display text-accent-red">+{Math.round(((a.actual_litres-a.expected_litres)/a.expected_litres)*100)}%</h3>
                     <p className="text-[10px] font-bold text-text-secondary mb-1">VARIANCE ABOVE TARGET</p>
                  </div>
               </motion.div>
             ))}
          </section>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Analytics Card */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           <div className="card h-[460px] flex flex-col p-8">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h4 className="text-sm font-black font-display uppercase tracking-[3px] text-text-secondary">Corridor Consumption Patterns</h4>
                    <p className="text-[10px] font-bold text-accent-blue uppercase mt-1">Expected vs Actual usage over last 7 events</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
                       <span className="text-[9px] font-black text-text-secondary uppercase">Baseline</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-accent-orange shadow-[0_0_8px_rgba(244,123,32,0.6)]" />
                       <span className="text-[9px] font-black text-text-secondary uppercase">Actual</span>
                    </div>
                 </div>
              </div>
              
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#8899AA', fontSize: 11, fontWeight: 'bold'}}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#8899AA', fontSize: 11}}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expected" 
                      stroke="var(--color-accent-blue)" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="var(--color-accent-orange)" 
                      strokeWidth={4} 
                      dot={{ fill: 'var(--color-accent-orange)', r: 4 }} 
                      activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
                    />
                 </LineChart>
              </ResponsiveContainer>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {trucks.slice(0, 2).map((t) => {
                const tLogs = logs.filter(l => l.truck_id === t.id)
                const variance = tLogs.length > 0 
                  ? tLogs.reduce((s, l) => s + Math.abs((l.actual_litres-l.expected_litres)/l.expected_litres)*100, 0) / tLogs.length
                  : 0
                return (
                  <div key={t.id} className="card bg-bg-secondary/40 border-white/5 p-6 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t.id}</p>
                           <h5 className="text-lg font-bold font-display text-white mt-1">{t.nickname}</h5>
                        </div>
                        <div className={`p-2 rounded-lg ${variance > 20 ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-green/10 text-accent-green'}`}>
                           {variance > 20 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                        </div>
                     </div>
                     <div className="mt-8 space-y-4">
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[9px] font-bold text-text-secondary uppercase">AVERAGE VARIANCE</p>
                              <p className={`text-2xl font-black font-display ${variance > 20 ? 'text-accent-red' : 'text-accent-green'}`}>
                                 {variance.toFixed(1)}%
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-bold text-text-secondary uppercase">EFFICIENCY</p>
                              <p className="text-sm font-black text-text-primary uppercase tracking-widest italic">{variance < 10 ? 'Elite' : variance < 20 ? 'Nominal' : 'Alert'}</p>
                           </div>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <div 
                              className={`h-full transition-all duration-1000 ${variance > 20 ? 'bg-accent-red' : 'bg-accent-green'}`} 
                              style={{ width: `${100 - variance}%` }}
                           />
                        </div>
                     </div>
                  </div>
                )
              })}
           </div>
        </div>

        {/* Form Card */}
        <div className="lg:col-span-4 space-y-8">
           <section className="glass p-8 rounded-2xl shadow-2xl relative overflow-hidden group border-white/10">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                 <Plus size={120} className="text-accent-orange" />
              </div>
              <h3 className="text-xl font-bold font-display text-white italic mb-8 relative z-10">Log Operations</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Asset Allocation</label>
                    <select 
                      value={formData.truck_id}
                      onChange={e => setFormData({...formData, truck_id: e.target.value})}
                      required
                    >
                       {trucks.map(t => <option key={t.id} value={t.id}>{t.nickname} — {t.id}</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Operational Day</label>
                       <select 
                         value={formData.day}
                         onChange={e => setFormData({...formData, day: e.target.value})}
                       >
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Unit Type</label>
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-[10px] font-black text-text-secondary uppercase text-center cursor-default">
                          Diesel (B7)
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Target Flow (L)</label>
                       <input 
                         type="number" 
                         step="0.1"
                         value={formData.expected_litres}
                         onChange={e => setFormData({...formData, expected_litres: e.target.value})}
                         placeholder="0.00" 
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Logged Actual (L)</label>
                       <input 
                         type="number" 
                         step="0.1"
                         value={formData.actual_litres}
                         onChange={e => setFormData({...formData, actual_litres: e.target.value})}
                         placeholder="0.00" 
                         required
                       />
                    </div>
                 </div>

                 <button 
                   disabled={submitting}
                   className="btn-primary w-full py-5 text-xs font-black tracking-[4px] uppercase flex items-center justify-center gap-2 mt-4"
                 >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Sync Telemetry Log'}
                 </button>

                 <div className="pt-8 border-t border-white/5 flex gap-3 text-text-secondary">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed font-medium italic">
                       Manual logs are cross-referenced with GPS mileage and tank sensor telemetry in real-time. Unaccounted variance triggers audit protocols.
                    </p>
                 </div>
              </form>
           </section>

           <div className="bg-gradient-to-br from-accent-orange/10 to-transparent p-8 rounded-2xl border border-accent-orange/20 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center gap-3 text-accent-orange">
                 <Activity size={20} />
                 <span className="text-xs font-black uppercase tracking-[3px]">Financial Leakage</span>
              </div>
              <h4 className="text-3xl font-black font-display text-white">
                 $ {Math.round(anomalies.reduce((s, a) => s + (a.actual_litres - a.expected_litres) * 1.20, 0))}
              </h4>
              <p className="text-[11px] font-medium text-text-secondary leading-relaxed">
                 Estimated operational capital lost to unaccounted fuel variance across all monitored global corridors this cycle.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
