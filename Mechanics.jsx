import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Wrench, 
  Star, 
  MapPin, 
  History, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  X,
  Plus,
  ArrowRight,
  Phone,
  Settings,
  Activity,
  Zap,
  Maximize2
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useApp } from '../context/AppContext'

export default function Mechanics() {
  const { user } = useApp()
  const [mechanics, setMechanics] = useState([])
  const [bookings, setBookings] = useState([])
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [bookingModal, setBookingModal] = useState(null)
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    truck_id: '',
    service_type: 'Full Service',
    booking_date: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    if (!user) return
    try {
      const [mechRes, bookRes, truckRes] = await Promise.all([
        axios.get('/api/mechanics'),
        axios.get('/api/mechanics/bookings'),
        axios.get('/api/trucks')
      ])
      setMechanics(mechRes.data)
      setBookings(bookRes.data)
      setTrucks(truckRes.data)
      if (truckRes.data.length > 0) setBookingForm(prev => ({ ...prev, truck_id: truckRes.data[0].id }))
    } catch (err) {
      toast.error('Failed to sync maintenance network')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const handleSearch = async (e) => {
    e?.preventDefault()
    setSearching(true)
    try {
      const res = await axios.get(`/api/mechanics/search?query=${searchQuery}&location=${searchLocation}`)
      setMechanics(res.data)
    } catch (err) {
      toast.error('Search failure. Google Places link unstable.')
    } finally {
      setSearching(false)
    }
  }

  const handleBook = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await axios.post('/api/mechanics/book', {
        ...bookingForm,
        mechanic_name: bookingModal.name,
        mechanic_shop: bookingModal.shop,
        mechanic_phone: bookingModal.phone
      })
      toast.success(`Booking confirmed at ${bookingModal.shop}! Est. Cost: $${res.data.estimatedCost}`)
      fetchData()
      setBookingModal(null)
    } catch (err) {
      toast.error('Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const getEstimatedCost = (type) => {
    const costs = {
      'Full Service': 3500,
      'Engine Check': 2200,
      'Tyre & Brakes': 1800,
      'Electrical': 1500,
      'General Repair': 2000
    }
    return costs[type] || 2000
  }

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent-orange" size={40} />
    </div>
  )

  return (
    <div className="space-y-12 pb-20 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-8">
        <div>
           <h2 className="text-4xl font-black font-display tracking-tighter text-white uppercase italic">Maintenance Network</h2>
           <p className="text-text-secondary mt-1 font-medium tracking-tight">Verified Tier-1 facilities across your fleet's operational corridor.</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
           <div className="space-y-1">
              <label className="text-[9px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Expertise Needed</label>
              <input 
                type="text" 
                placeholder="e.g. Engine, Tyres..."
                className="bg-bg-primary/50 text-xs py-3 w-40"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Geographic Filter</label>
              <input 
                type="text" 
                placeholder="City or Area"
                className="bg-bg-primary/50 text-xs py-3 w-40"
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
              />
           </div>
           <button type="submit" className="btn-primary py-3 px-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              {searching ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} className="fill-current" />}
              Search Google
           </button>
        </form>
      </div>

      {/* Mechanics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mechanics.map((mech) => (
          <motion.div 
            key={mech.id}
            whileHover={{ y: -8 }}
            className="card group relative flex flex-col justify-between overflow-hidden border-white/10 shadow-2xl bg-gradient-to-br from-bg-card to-bg-primary"
          >
             {/* Gradient Accent */}
             <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-orange to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
             
             <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <h3 className="text-xl font-bold font-display text-white tracking-tight leading-tight">{mech.shop}</h3>
                      <p className="text-[10px] font-black text-accent-orange uppercase tracking-[3px]">{mech.name}</p>
                   </div>
                   <div className="flex items-center gap-1.5 bg-bg-primary/50 text-accent-yellow px-2.5 py-1 rounded-full border border-white/5 shadow-inner">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-black">{mech.rating}</span>
                   </div>
                </div>

                <div className="flex flex-wrap gap-2">
                   <span className="px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 rounded-lg text-[9px] font-black text-accent-blue uppercase tracking-widest">{mech.speciality}</span>
                   <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin size={10} /> {mech.distance_km} KM AWAY
                   </span>
                </div>

                <div className="p-4 bg-bg-secondary/40 rounded-xl border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Phone size={14} className="text-text-secondary" />
                      <span className="text-xs font-mono font-bold text-text-secondary">{mech.phone}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${mech.available ? 'bg-accent-green shadow-[0_0_8px_var(--color-accent-green)]' : 'bg-accent-red'}`} />
                      <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">{mech.available ? 'AVAILABLE' : 'BUSY'}</span>
                   </div>
                </div>
             </div>

             <button 
               onClick={() => setBookingModal(mech)}
               className="mt-8 w-full btn-primary py-4 text-xs font-black tracking-[4px] uppercase flex items-center justify-center gap-3 group/btn"
             >
                SECURE SLOT <ArrowRight size={14} className="group-hover/btn:translate-x-1.5 transition-all" />
             </button>
          </motion.div>
        ))}
      </div>

      {/* Booking History */}
      <section className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-display tracking-tight text-white uppercase tracking-widest">Maintenance History</h3>
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[2px]">{bookings.length} Verified Records</span>
         </div>

         <div className="card p-0 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-bg-secondary/50 text-[10px] font-black uppercase tracking-[2px] text-text-secondary">
                        <th className="px-8 py-5">Unit ID</th>
                        <th className="px-8 py-5">Verified Partner</th>
                        <th className="px-8 py-5">Operation Type</th>
                        <th className="px-8 py-5">Execution Date</th>
                        <th className="px-8 py-5">Audit Status</th>
                        <th className="px-8 py-5 text-right">Capital Outflow</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                     {bookings.map((book) => (
                       <tr key={book.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <Maximize2 size={14} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="font-black text-sm text-white tracking-widest">{book.truck_id}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex flex-col">
                                <span className="font-bold text-text-primary text-sm tracking-tight">{book.mechanic_shop}</span>
                                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-tight">{book.mechanic_name}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[10px] font-black text-text-secondary uppercase tracking-widest">{book.service_type}</span>
                          </td>
                          <td className="px-8 py-6 text-sm font-mono text-text-secondary">{book.booking_date}</td>
                          <td className="px-8 py-6">
                             <span className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                                <span className="text-[9px] font-black text-text-primary uppercase tracking-widest">{book.status}</span>
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-accent-orange text-sm font-sans">
                             $ {book.estimated_cost}
                          </td>
                       </tr>
                     ))}
                     {bookings.length === 0 && (
                       <tr>
                          <td colSpan="6" className="px-8 py-12 text-center text-text-secondary italic text-sm">No maintenance history recorded in common database.</td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </section>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setBookingModal(null)}
               className="absolute inset-0 bg-bg-primary/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="glass w-full max-w-lg overflow-hidden relative z-10 shadow-[0_32px_128px_rgba(0,0,0,0.8)] border-white/10"
             >
                <div className="p-8 border-b border-white/5 bg-gradient-to-br from-bg-card to-bg-secondary flex justify-between items-start">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-3xl bg-accent-orange text-white flex items-center justify-center shadow-[0_0_30px_rgba(244,123,32,0.3)]">
                         <Zap size={32} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black font-display text-white tracking-tighter italic">Secure Facility Slot</h3>
                         <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">AXORA AUDIT PARTNER: {bookingModal.shop}</p>
                      </div>
                   </div>
                   <button onClick={() => setBookingModal(null)} className="p-2 hover:bg-white/5 rounded-full text-text-secondary hover:text-accent-red transition-all">
                      <X size={20} />
                   </button>
                </div>

                <div className="p-10 space-y-8">
                   <form onSubmit={handleBook} className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Asset Allocation</label>
                            <select 
                               value={bookingForm.truck_id}
                               onChange={e => setBookingForm({...bookingForm, truck_id: e.target.value})}
                               className="py-4"
                               required
                            >
                               {trucks.map(t => <option key={t.id} value={t.id}>{t.nickname} ({t.id})</option>)}
                            </select>
                         </div>
                         <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Manifest Date</label>
                            <input 
                               type="date" 
                               className="py-4"
                               value={bookingForm.booking_date}
                               onChange={e => setBookingForm({...bookingForm, booking_date: e.target.value})}
                               required
                            />
                         </div>
                      </div>

                      <div className="space-y-2.5">
                         <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Specialization Type</label>
                         <select 
                            value={bookingForm.service_type}
                            onChange={e => setBookingForm({...bookingForm, service_type: e.target.value})}
                            className="py-4"
                         >
                            <option>Full Service</option>
                            <option>Engine Check</option>
                            <option>Tyre & Brakes</option>
                            <option>Electrical</option>
                            <option>General Repair</option>
                         </select>
                      </div>

                      <div className="p-8 bg-bg-secondary/60 rounded-3xl border border-accent-orange/10 flex flex-col items-center gap-2 relative overflow-hidden group">
                         <div className="absolute inset-0 bg-accent-orange/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <span className="text-[10px] font-black text-text-secondary uppercase tracking-[4px] relative z-10">Estimated Capital Required</span>
                         <h4 className="text-5xl font-black font-display text-white relative z-10">$ <span className="text-accent-orange italic">{getEstimatedCost(bookingForm.service_type)}</span></h4>
                         <p className="text-[9px] text-text-secondary font-medium tracking-tight mt-1 relative z-10 italic">* Final audit subject to component variance and labor overhead.</p>
                      </div>

                      <button 
                         disabled={submitting}
                         className="btn-primary w-full py-6 text-sm font-black tracking-[8px] uppercase flex items-center justify-center gap-3 mt-4 group shadow-[0_12px_48px_rgba(244,123,32,0.2)]"
                      >
                         {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                           <>
                             EXECUTE BOOKING <Zap size={18} className="fill-current" />
                           </>
                         )}
                      </button>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
