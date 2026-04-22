import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'motion/react'
import { 
  Trophy, 
  MapPin, 
  TrendingUp, 
  Loader2, 
  User,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Flame,
  ChevronRight,
  TrendingDown,
  Users
} from 'lucide-react'
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'
import { useApp } from '../context/AppContext'

export default function Drivers() {
  const { user } = useApp()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDrivers = async () => {
    if (!user) return
    try {
      const res = await axios.get('/api/drivers')
      setDrivers(res.data)
    } catch (err) {
      toast.error('Failed to sync driver profiles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchDrivers()
  }, [user])

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent-orange" size={40} />
    </div>
  )

  const getTier = (score) => {
    if (score >= 90) return { label: 'ELITE', color: 'text-accent-green', bg: 'bg-accent-green/10' }
    if (score >= 75) return { label: 'NOMINAL', color: 'text-accent-blue', bg: 'bg-accent-blue/10' }
    if (score >= 50) return { label: 'CAUTION', color: 'text-accent-yellow', bg: 'bg-accent-yellow/10' }
    return { label: 'CRITICAL', color: 'text-accent-red', bg: 'bg-accent-red/10' }
  }

  const top3 = drivers.slice(0, 3)
  const remainder = drivers.slice(3)

  // Radar data for #1 driver
  const radarData = top3[0] ? [
    { subject: 'Safety', A: top3[0].score, fullMark: 100 },
    { subject: 'Hydraulics', A: 100 - (top3[0].hard_brakes * 5), fullMark: 100 },
    { subject: 'Speed', A: 100 - (top3[0].overspeeding * 10), fullMark: 100 },
    { subject: 'Fuel', A: 85, fullMark: 100 },
    { subject: 'Consistency', A: 92, fullMark: 100 },
  ] : []

  return (
    <div className="space-y-12 pb-20 scroll-smooth">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-bold font-display tracking-tight text-white">Elite Human Intelligence</h2>
           <p className="text-text-secondary mt-1 font-medium italic">Benchmarking operator behavior against global safety protocols.</p>
        </div>
      </div>

      {/* Podium Section */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {top3.map((driver, i) => (
              <motion.div 
                key={driver.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`card relative overflow-hidden flex flex-col items-center text-center p-8 ${i === 0 ? 'border-accent-orange/50 ring-1 ring-accent-orange/20 shadow-orange-900/20 shadow-2xl scale-105' : 'bg-white/[0.02]'}`}
              >
                {i === 0 && (
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Trophy size={100} className="text-accent-orange" />
                  </div>
                )}
                
                <div className="relative mb-6">
                   <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black font-display border-4 ${i === 0 ? 'border-accent-orange bg-accent-orange/10 text-accent-orange' : 'border-border bg-bg-secondary text-text-secondary'}`}>
                      {driver.name.split(' ').map(n => n[0]).join('')}
                   </div>
                   <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-bg-card flex items-center justify-center font-black ${i === 0 ? 'bg-accent-yellow text-bg-primary' : i === 1 ? 'bg-slate-300 text-bg-primary' : 'bg-orange-700 text-white'}`}>
                      {i + 1}
                   </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{driver.name}</h3>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-[2px]">{driver.truck_id}</p>

                <div className="mt-8 space-y-4 w-full">
                   <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${driver.score}%` }} 
                        transition={{ duration: 1, delay: i * 0.2 }}
                        className={`absolute h-full rounded-full ${getTier(driver.score).color.replace('text-', 'bg-')}`} 
                      />
                   </div>
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">HABIT INDEX</span>
                      <span className={`text-sm font-black font-display ${getTier(driver.score).color}`}>{driver.score}/100</span>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 w-full grid grid-cols-2 gap-4">
                   <div className="text-left">
                      <p className="text-[9px] font-bold text-text-secondary uppercase">WASTE</p>
                      <p className="text-xs font-bold text-text-primary">$ {driver.fuel_waste}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-bold text-text-secondary uppercase">GRADE</p>
                      <p className={`text-xs font-black ${getTier(driver.score).color}`}>{getTier(driver.score).label}</p>
                   </div>
                </div>
              </motion.div>
            ))}
         </div>

         {/* Radar Analytics for Top Driver */}
         <div className="xl:col-span-4 h-full">
            <div className="card h-full flex flex-col p-8 border-accent-orange/10 bg-accent-orange/[0.02]">
               <div className="flex items-center justify-between mb-10">
                  <h4 className="text-sm font-black font-display uppercase tracking-[3px] text-text-secondary">#1 UNIT TELEMETRY</h4>
                  <Activity className="text-accent-orange" size={20} />
               </div>
               
               <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  <ResponsiveContainer width="100%" height={300}>
                     <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#8899AA', fontSize: 10, fontWeight: 'bold' }} />
                        <Radar
                           name="Driver Performance"
                           dataKey="A"
                           stroke="var(--color-accent-orange)"
                           fill="var(--color-accent-orange)"
                           fillOpacity={0.15}
                        />
                     </RadarChart>
                  </ResponsiveContainer>
               </div>

               <div className="mt-8 space-y-4">
                  <p className="text-[10px] font-medium text-text-secondary text-center italic tracking-tight leading-relaxed">
                     "Alex, James Whitfield continues to set the benchmark for low-carbon heavy logistics. Zero overspeeding events logged in the last 1200km."
                  </p>
                  <div className="flex justify-center gap-3">
                     <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                     <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                     <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Leaderboard Table */}
      <section className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-display tracking-tight text-white uppercase tracking-widest">Global Ranking Ledger</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border-white/5 opacity-50">
                  <ShieldCheck size={14} className="text-accent-green" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Verified Audit</span>
               </div>
            </div>
         </div>

         <div className="card p-0 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-bg-secondary/50 text-[10px] font-black uppercase tracking-[2px] text-text-secondary">
                        <th className="px-8 py-5">Rank</th>
                        <th className="px-8 py-5">Operator Hub Name</th>
                        <th className="px-8 py-5">Unit ID</th>
                        <th className="px-8 py-5">System Score</th>
                        <th className="px-8 py-5">Safety Invariants</th>
                        <th className="px-8 py-5 text-right">Incentive Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                     {drivers.map((driver, i) => (
                       <tr key={driver.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                             <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${i < 3 ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20' : 'bg-white/5 text-text-secondary'}`}>
                                {i + 1}
                             </span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-text-secondary group-hover:text-accent-orange transition-colors">
                                   {driver.name[0]}
                                </div>
                                <span className="font-bold text-text-primary text-sm tracking-tight">{driver.name}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-[11px] font-black font-mono text-text-secondary tracking-widest uppercase">{driver.truck_id}</span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <span className={`text-sm font-black font-display w-8 ${getTier(driver.score).color}`}>{driver.score}</span>
                                <div className="flex-1 w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                   <div 
                                     className={`h-full rounded-full ${getTier(driver.score).color.replace('text-', 'bg-')}`} 
                                     style={{ width: `${driver.score}%` }}
                                   />
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex gap-4">
                                <div className="flex items-center gap-1.5 text-text-secondary" title="Hard Brakes">
                                   <Activity size={14} className={driver.hard_brakes > 5 ? 'text-accent-red' : 'text-accent-green'} />
                                   <span className="text-[11px] font-bold">{driver.hard_brakes}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-text-secondary" title="Overspeeding">
                                   <Flame size={14} className={driver.overspeeding > 2 ? 'text-accent-red' : 'text-accent-green'} />
                                   <span className="text-[11px] font-bold">{driver.overspeeding}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${driver.score >= 80 ? 'text-accent-green bg-accent-green/10 border border-accent-green/20' : 'text-text-secondary bg-white/5 border border-white/5'}`}>
                                {driver.score >= 80 ? 'QUALIFIED' : 'PENDING'}
                             </span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </section>

      {/* Stats Bottom Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <StatsInsight icon={Users} label="Total Managed Ops" value={drivers.length} trend="+2 this month" />
         <StatsInsight icon={ShieldCheck} label="Compliance Surcharge" value="0.0%" trend="Optimal Level" />
         <StatsInsight icon={TrendingDown} label="Fuel Leakage Mitigation" value={`$ ${drivers.reduce((s,d) => s + d.fuel_waste, 0)}`} trend="Cycle-to-Date" />
      </div>
    </div>
  )
}

function StatsInsight({ icon: Icon, label, value, trend }) {
  return (
    <div className="card bg-bg-secondary/40 border-white/5 p-6 flex items-center gap-6 group hover:border-white/10 transition-all">
       <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-text-secondary group-hover:text-accent-orange transition-all">
          <Icon size={28} />
       </div>
       <div>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[2px]">{label}</p>
          <div className="flex items-baseline gap-3">
             <h4 className="text-2xl font-black text-white font-display mt-0.5">{value}</h4>
             <span className="text-[9px] font-bold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">{trend}</span>
          </div>
       </div>
    </div>
  )
}
