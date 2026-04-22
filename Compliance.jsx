import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Calendar,
  X,
  FileText,
  TrendingUp,
  Download,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useApp } from '../context/AppContext'

export default function Compliance() {
  const { user } = useApp()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [newExpiry, setNewExpiry] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchDocs = async () => {
    if (!user) return
    try {
      const res = await axios.get('/api/compliance')
      setDocs(res.data.sort((a, b) => {
        const order = { expired: 0, critical: 1, warning: 2, ok: 3 }
        return order[a.status] - order[b.status]
      }))
    } catch (err) {
      toast.error('Failed to sync compliance log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchDocs()
  }, [user])

  const handleRenew = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.put(`/api/compliance/${selectedDoc.id}`, { expiry: newExpiry })
      toast.success('Document renewal recorded')
      fetchDocs()
      setSelectedDoc(null)
    } catch (err) {
      toast.error('Renewal failed')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredDocs = docs.filter(d => 
    d.truck_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: docs.length,
    compliant: docs.filter(d => d.status === 'ok').length,
    expiring: docs.filter(d => d.status === 'warning' || d.status === 'critical').length,
    expired: docs.filter(d => d.status === 'expired').length
  }

  const complianceScore = docs.length > 0 ? Math.round((stats.compliant / stats.total) * 100) : 100

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent-orange" size={40} />
    </div>
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Gauge Card */}
        <div className="glass p-8 rounded-2xl md:w-full xl:w-[420px] flex flex-col items-center border-white/5 relative overflow-hidden group shadow-2xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-accent-orange/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-accent-orange/10 transition-all duration-700" />
           <h3 className="text-sm font-black font-display text-text-secondary uppercase tracking-[3px] mb-8">System Compliance Index</h3>
           
           <div className="relative w-64 h-32 mb-4 overflow-hidden">
             <div className="w-64 h-64 border-[16px] border-bg-primary rounded-full relative">
               <motion.div 
                 initial={{ rotate: -90 }}
                 animate={{ rotate: -90 + (complianceScore / 100 * 180) }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 className="absolute inset-[-16px] border-[16px] border-t-accent-orange border-r-accent-orange border-b-transparent border-l-transparent rounded-full origin-center"
                 style={{ transform: `rotate(${-90 + (complianceScore / 100 * 180)}deg)` }}
               />
             </div>
             <div className="absolute bottom-0 left-0 w-full flex flex-col items-center">
                <span className="text-5xl font-black text-text-primary tracking-tighter">{complianceScore}%</span>
             </div>
           </div>
           
           <div className="flex gap-2 items-center text-text-secondary mt-2">
              <TrendingUp size={16} className="text-accent-green" />
              <span className="text-xs font-bold uppercase tracking-wider">Top 5% of Global Fleets</span>
           </div>
        </div>

        {/* Stats Row */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard label="Audit Log Size" value={stats.total} icon={FileText} color="blue" />
          <StatCard label="Fully Verified" value={stats.compliant} icon={ShieldCheck} color="green" />
          <StatCard label="Critical Alerts" value={stats.expiring} icon={Clock} color="yellow" />
          <StatCard label="Legal Breaches" value={stats.expired} icon={AlertTriangle} color="red" />
        </div>
      </div>

      {/* Main Ledger */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h3 className="text-xl font-bold font-display tracking-tight text-white uppercase tracking-widest">Compliance Ledger</h3>
              <p className="text-text-secondary text-xs font-medium uppercase mt-1 tracking-widest">Global Regulatory Audit Trail</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
                 <input 
                   placeholder="Filter by ID or Doc..." 
                   className="pl-10 h-10 text-xs"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <button className="h-10 px-4 glass border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group">
                 <Download size={14} className="group-hover:translate-y-0.5 transition-all" />
                 Audit Log
              </button>
           </div>
        </div>

        <div className="card p-0 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-bg-secondary/50 text-[10px] font-black uppercase tracking-[2px] text-text-secondary">
                      <th className="px-6 py-4">Unit Identity</th>
                      <th className="px-6 py-4">Verification Type</th>
                      <th className="px-6 py-4">Maturity Date</th>
                      <th className="px-6 py-4">Days Remaining</th>
                      <th className="px-6 py-4">State</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {filteredDocs.map((doc) => {
                     const days = Math.floor((new Date(doc.expiry) - new Date()) / (1000 * 60 * 60 * 24))
                     return (
                       <tr key={doc.id} className={`hover:bg-white/[0.02] transition-colors ${doc.status === 'expired' || doc.status === 'critical' ? 'bg-accent-red/[0.03]' : ''}`}>
                          <td className="px-6 py-5 font-bold text-sm text-text-primary uppercase tracking-tight">{doc.truck_id}</td>
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${doc.status === 'ok' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-orange/10 text-accent-orange'}`}>
                                   <FileText size={16} />
                                </div>
                                <span className="text-sm font-medium text-text-primary leading-none">{doc.type}</span>
                             </div>
                          </td>
                          <td className="px-6 py-5 font-mono text-xs text-text-secondary">{doc.expiry}</td>
                          <td className="px-6 py-5">
                             <span className={`text-xs font-bold ${days < 0 ? 'text-accent-red' : days < 7 ? 'text-accent-yellow' : 'text-text-primary'}`}>
                                {days < 0 ? 'EXPIRED' : `${days} Days`}
                             </span>
                          </td>
                          <td className="px-6 py-5">
                             <span className={`badge-${doc.status} px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest`}>
                                {doc.status}
                             </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <button 
                               onClick={() => setSelectedDoc(doc)}
                               className="text-[10px] font-black text-accent-orange hover:brightness-110 tracking-widest uppercase border-b border-accent-orange/30 hover:border-accent-orange transition-all"
                             >
                               RENEW FILING
                             </button>
                          </td>
                       </tr>
                     )
                   })}
                   {filteredDocs.length === 0 && (
                     <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-text-secondary italic text-sm">No compliance records matching your criteria found.</td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>
      </div>

      {/* Renewal Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedDoc(null)}
               className="absolute inset-0 bg-bg-primary/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="glass w-full max-w-md p-8 relative z-10 shadow-3xl"
             >
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xl font-bold font-display text-white italic">Renew Filing</h3>
                   <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-white/5 rounded-full text-text-secondary">
                      <X size={20} />
                   </button>
                </div>

                <div className="bg-bg-secondary p-5 rounded-xl border border-border mb-8">
                   <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">UNIT IDENTIFICATION</p>
                   <p className="text-lg font-bold text-white tracking-widest mb-4 uppercase">{selectedDoc.truck_id}</p>
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                      <span className="text-xs font-bold text-text-secondary uppercase">{selectedDoc.type}</span>
                      <span className="text-xs font-black text-accent-orange font-mono uppercase">{selectedDoc.expiry}</span>
                   </div>
                </div>

                <form onSubmit={handleRenew} className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">New Expiration Schedule</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input 
                           type="date" 
                           value={newExpiry}
                           onChange={e => setNewExpiry(e.target.value)}
                           className="pl-12 py-4"
                           required
                        />
                      </div>
                   </div>

                   <button 
                      disabled={submitting}
                      className="btn-primary w-full py-5 text-xs font-black tracking-[4px] uppercase flex items-center justify-center gap-2 mt-4"
                   >
                      {submitting ? <Loader2 className="animate-spin" size={18} /> : 'OFFICIAL FILING SYNC'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20 shadow-blue-900/10',
    green: 'text-accent-green bg-accent-green/10 border-accent-green/20 shadow-green-900/10',
    yellow: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20 shadow-yellow-900/10',
    red: 'text-accent-red bg-accent-red/10 border-accent-red/20 shadow-red-900/10'
  }
  return (
    <div className={`card flex flex-col gap-5 border shadow-xl ${colors[color]}`}>
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5`}>
          <Icon size={20} />
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-[2px] opacity-70">{label}</p>
          <h3 className="text-3xl font-black text-text-primary mt-1">{value}</h3>
       </div>
    </div>
  )
}
