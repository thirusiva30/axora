import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  User, 
  Smartphone, 
  Building, 
  CreditCard, 
  ShieldCheck, 
  TrendingUp, 
  Cpu, 
  Database, 
  Cloud,
  Loader2,
  Settings as SettingsIcon,
  ChevronRight,
  Zap,
  Star,
  Info
} from 'lucide-react'
import { motion } from 'motion/react'
import toast from 'react-hot-toast'

import { useApp } from '../context/AppContext'

export default function Settings() {
  const { user: authUser } = useApp()
  const [user, setUser] = useState(null)
  const [scoreData, setScoreData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    if (!authUser) return
    try {
      const [userRes, scoreRes] = await Promise.all([
        axios.get('/api/user'),
        axios.get('/api/axora-score')
      ])
      setUser(userRes.data)
      setScoreData(scoreRes.data)
    } catch (err) {
      toast.error('Failed to sync system configuration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authUser) fetchData()
  }, [authUser])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.put('/api/user', user)
      toast.success('System identity parameters updated')
      fetchData()
    } catch (err) {
      toast.error('Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent-orange" size={40} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Identity & Sub */}
        <div className="lg:col-span-5 space-y-8">
           <section className="glass p-8 rounded-3xl border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                 <User size={160} />
              </div>
              <h3 className="text-xl font-bold font-display text-white italic mb-10 relative z-10 flex items-center gap-3">
                 <SettingsIcon size={20} className="text-accent-orange" />
                 Profile Manifest
              </h3>
              
              <form onSubmit={handleUpdate} className="space-y-6 relative z-10">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Identity Head</label>
                    <div className="relative">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                       <input 
                         className="pl-12 h-14"
                         value={user?.name}
                         onChange={e => setUser({...user, name: e.target.value})}
                         required
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Fleet Namespace</label>
                    <div className="relative">
                       <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                       <input 
                         className="pl-12 h-14"
                         value={user?.fleet_name}
                         onChange={e => setUser({...user, fleet_name: e.target.value})}
                         required
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Secure Contact</label>
                    <div className="relative">
                       <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                       <input 
                         className="pl-12 h-14"
                         value={user?.phone}
                         onChange={e => setUser({...user, phone: e.target.value})}
                         required
                       />
                    </div>
                 </div>

                 <button 
                   disabled={submitting}
                   className="btn-primary w-full py-5 text-xs font-black tracking-[4px] uppercase flex items-center justify-center gap-3 mt-4 active:scale-95"
                 >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Sync Manifest Overrides'}
                 </button>
              </form>
           </section>

           <section className="bg-gradient-to-br from-bg-card to-bg-secondary p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Zap size={100} className="text-accent-orange" />
              </div>
              <h3 className="text-[10px] font-black text-accent-orange uppercase tracking-[4px] mb-8">Service Tier</h3>
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-accent-orange/10 flex items-center justify-center text-accent-orange shadow-inner">
                    <TrendingUp size={32} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black font-display text-white tracking-widest uppercase italic">Elite Founders</h4>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Unlimited Global Access • 10 Units Linked</p>
                 </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                 <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest block mb-1">Status</span>
                    <span className="text-xs font-black text-accent-green uppercase">Authorized</span>
                 </div>
                 <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest block mb-1">Next Bill</span>
                    <span className="text-xs font-black text-white uppercase">Trial Entitlement</span>
                 </div>
              </div>
           </section>
        </div>

        {/* Global Score & System Info */}
        <div className="lg:col-span-7 space-y-12">
           <section className="glass p-10 rounded-3xl relative overflow-hidden shadow-2xl border-white/10 group">
              <div className="flex flex-col md:flex-row items-center gap-10">
                 <div className="w-48 h-48 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="96" cy="96" r="80" className="text-white/5" stroke="currentColor" strokeWidth="12" fill="none" />
                       <motion.circle 
                         initial={{ strokeDashoffset: 502 }}
                         animate={{ strokeDashoffset: 502 - (502 * (scoreData?.axoraScore / 100)) }}
                         transition={{ duration: 1.5, ease: "easeOut" }}
                         cx="96" cy="96" r="80" 
                         className="text-accent-orange" 
                         stroke="currentColor" 
                         strokeWidth="16" 
                         fill="none" 
                         strokeDasharray="502" 
                         strokeLinecap="round" 
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <h2 className="text-5xl font-black font-display text-white">{scoreData?.axoraScore}</h2>
                       <span className="text-[9px] font-black text-text-secondary uppercase tracking-[3px] mt-1 italic">World Index</span>
                    </div>
                 </div>

                 <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                       <Star className="text-accent-yellow fill-current" size={16} />
                       <h3 className="text-2xl font-black font-display text-white italic tracking-tighter uppercase">Axora Financial Score</h3>
                    </div>
                    <p className="text-sm font-medium text-text-secondary leading-relaxed italic">
                       "Your operational hygiene benchmarks in the top 15% of global carriers. This index reflects your risk-adjusted capital worth."
                    </p>
                    <div className="pt-4 flex items-center gap-4 group/loan">
                       <div className="bg-accent-green/10 px-4 py-2 rounded-xl border border-accent-green/20">
                          <span className="text-[10px] font-black text-accent-green uppercase tracking-[3px]">Qualified Loan Rate: {scoreData?.loanRate}</span>
                       </div>
                       <ChevronRight className="text-accent-orange opacity-0 group-hover/loan:opacity-100 group-hover/loan:translate-x-2 transition-all" size={20} />
                    </div>
                 </div>
              </div>

              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                 <ScoreMetric label="Compliance" score={scoreData?.breakdown.complianceScore} />
                 <ScoreMetric label="Driver Behavior" score={scoreData?.breakdown.avgDriverScore} />
                 <ScoreMetric label="Fuel Integrity" score={scoreData?.breakdown.fuelScore} />
                 <ScoreMetric label="Maintenance" score={scoreData?.breakdown.maintenanceScore} />
              </div>
           </section>

           <section className="space-y-6">
              <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[4px] ml-1">Neural Core Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <SystemBlock icon={Cpu} title="Intelligence" value="Gemini 3 Flash" />
                 <SystemBlock icon={Database} title="Ledger Engine" value="Firestore / Asia-SE1" />
                 <SystemBlock icon={Cloud} title="Operations" value="Google Cloud Compute" />
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4">
                 <Info className="text-text-secondary mt-1 shrink-0" size={18} />
                 <p className="text-[11px] font-medium text-text-secondary leading-relaxed italic">
                    Axora Global uses AES-256 end-to-end encryption for all unit telemetry and financial identity metrics. Your intelligence data is never shared with third-party insurance providers without explicit cryptographic authorization.
                 </p>
              </div>
           </section>
        </div>
      </div>
    </div>
  )
}

function ScoreMetric({ label, score }) {
  return (
    <div className="space-y-2.5">
       <div className="flex justify-between items-baseline">
          <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">{label}</span>
          <span className="text-sm font-black font-display text-text-primary italic">{score}%</span>
       </div>
       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-accent-orange" 
          />
       </div>
    </div>
  )
}

function SystemBlock({ icon: Icon, title, value }) {
  return (
    <div className="card bg-bg-secondary/40 border-white/5 group hover:border-white/10 transition-all flex flex-col gap-4">
       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-secondary group-hover:text-accent-orange transition-all">
          <Icon size={20} />
       </div>
       <div>
          <p className="text-[9px] font-black text-text-secondary uppercase tracking-[3px] mb-1">{title}</p>
          <p className="text-xs font-bold text-text-primary tracking-tight">{value}</p>
       </div>
    </div>
  )
}
