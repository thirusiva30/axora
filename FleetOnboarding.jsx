import { useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Truck, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  ChevronLeft,
  Zap,
  Globe,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function FleetOnboarding({ onComplete, user }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    truckId: '',
    truckNickname: '',
    driverName: '',
    insuranceExpiry: '',
    licenseExpiry: ''
  })

  const totalSteps = 4

  const nextStep = () => {
    if (step === 1 && (!formData.truckId || !formData.truckNickname)) {
       return toast.error('Please specify asset identifiers')
    }
    if (step === 2 && !formData.driverName) {
       return toast.error('Driver name is required for personnel logging')
    }
    if (step === 3 && (!formData.insuranceExpiry || !formData.licenseExpiry)) {
       return toast.error('Compliance dates must be set for risk mitigation')
    }
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  const handleFinish = async () => {
    setLoading(true)
    try {
      // 1. Create Truck
      await axios.post('/api/trucks', {
        id: formData.truckId,
        nickname: formData.truckNickname,
        driver: formData.driverName,
        status: 'active'
      })

      // 2. Create Driver
      await axios.post('/api/drivers', {
        name: formData.driverName,
        truck_id: formData.truckId
      })

      // 3. Create Compliance Records
      await axios.post('/api/compliance', {
        truck_id: formData.truckId,
        type: 'Insurance',
        expiry: formData.insuranceExpiry
      })
      await axios.post('/api/compliance', {
        truck_id: formData.truckId,
        type: 'Operating License',
        expiry: formData.licenseExpiry
      })

      toast.success('Fleet Initialized Successfully')
      onComplete()
    } catch (err) {
      toast.error('Initialization failed. Neural link timeout.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="flex justify-between mb-12 relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10" />
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500 border-2 ${
                step >= s ? 'bg-accent-orange border-accent-orange text-white shadow-[0_0_20px_rgba(244,123,32,0.4)]' : 'bg-bg-primary border-white/5 text-text-secondary'
              }`}
            >
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
          ))}
        </div>

        <motion.div 
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass p-12 relative overflow-hidden"
        >
          {/* Decorative Backdrops */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-orange/5 blur-3xl rounded-full -mr-32 -mt-32" />
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                   <div className="w-12 h-12 bg-accent-orange/10 text-accent-orange rounded-xl flex items-center justify-center mb-4">
                      <Truck size={24} />
                   </div>
                   <h2 className="text-3xl font-black font-display text-white tracking-tighter uppercase italic">Register Primary Asset</h2>
                   <p className="text-text-secondary text-sm font-medium">Every great fleet starts with a single unit. Define your heavy-duty backbone.</p>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Asset Serial Number (ID)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., AX-TRK-77"
                        className="py-4"
                        value={formData.truckId}
                        onChange={e => setFormData({ ...formData, truckId: e.target.value })}
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Fleet Nickname</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Highway Ghost"
                        className="py-4"
                        value={formData.truckNickname}
                        onChange={e => setFormData({ ...formData, truckNickname: e.target.value })}
                        required
                      />
                   </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                   <div className="w-12 h-12 bg-accent-blue/10 text-accent-blue rounded-xl flex items-center justify-center mb-4">
                      <User size={24} />
                   </div>
                   <h2 className="text-3xl font-black font-display text-white tracking-tighter uppercase italic">Personnel Allocation</h2>
                   <p className="text-text-secondary text-sm font-medium">Link a verified operator to your new asset. Personnel safety is paramount.</p>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Lead Operator Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter full legal name"
                        className="py-4"
                        value={formData.driverName}
                        onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                        required
                      />
                   </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                   <div className="w-12 h-12 bg-accent-green/10 text-accent-green rounded-xl flex items-center justify-center mb-4">
                      <ShieldCheck size={24} />
                   </div>
                   <h2 className="text-3xl font-black font-display text-white tracking-tighter uppercase italic">Compliance Protocol</h2>
                   <p className="text-text-secondary text-sm font-medium">Set key expiration dates for neural alerts. Avoid regulatory friction.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Insurance Expiry</label>
                      <input 
                        type="date" 
                        className="py-4"
                        value={formData.insuranceExpiry}
                        onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-[2px] ml-1">Permit Expiry</label>
                      <input 
                        type="date" 
                        className="py-4"
                        value={formData.licenseExpiry}
                        onChange={e => setFormData({ ...formData, licenseExpiry: e.target.value })}
                        required
                      />
                   </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 text-center py-8"
              >
                <div className="relative mx-auto w-24 h-24">
                   <div className="absolute inset-0 bg-accent-green rounded-full blur-xl opacity-20 animate-pulse" />
                   <div className="w-24 h-24 bg-accent-green/10 border-2 border-accent-green text-accent-green rounded-full flex items-center justify-center relative z-10">
                      <Zap size={48} className="fill-current" />
                   </div>
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-black font-display text-white tracking-tighter uppercase italic">Initialization Complete</h2>
                   <p className="text-text-secondary text-sm font-medium">Your account hash has been successfully linked to your first asset group. You are now operational.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                   <div className="p-4 bg-bg-secondary rounded-2xl border border-white/5">
                      <span className="text-[9px] font-black text-accent-blue uppercase tracking-widest block mb-1">Asset Locked</span>
                      <span className="text-xs font-bold text-white">{formData.truckNickname} ({formData.truckId})</span>
                   </div>
                   <div className="p-4 bg-bg-secondary rounded-2xl border border-white/5">
                      <span className="text-[9px] font-black text-accent-orange uppercase tracking-widest block mb-1">Assigned Personnel</span>
                      <span className="text-xs font-bold text-white">{formData.driverName}</span>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
             {step > 1 && step < 4 ? (
               <button 
                 onClick={prevStep}
                 className="flex items-center gap-2 text-[10px] font-black text-text-secondary uppercase tracking-[2px] transition-colors"
               >
                 <ChevronLeft size={14} /> Back-Step
               </button>
             ) : <div />}

             {step < 4 ? (
               <button 
                 onClick={nextStep}
                 className="btn-primary px-8 py-4 text-xs font-black tracking-[4px] uppercase flex items-center gap-3 group"
               >
                 Advance Core <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
               </button>
             ) : (
               <button 
                 onClick={handleFinish}
                 disabled={loading}
                 className="btn-primary w-full py-6 text-sm font-black tracking-[12px] uppercase flex justify-center items-center gap-4 animate-in slide-in-from-bottom duration-700"
               >
                 {loading ? <Loader2 size={24} className="animate-spin text-white" /> : (
                   <>
                     Ignite Fleet <Globe size={20} />
                   </>
                 )}
               </button>
             )}
          </div>
        </motion.div>

        {/* Support Link */}
        <p className="text-center mt-12 text-[10px] text-text-secondary font-medium uppercase tracking-[2px]">
          Need technical oversight? <span className="text-accent-orange cursor-pointer hover:underline">Consult Neural Manual</span>
        </p>
      </div>
    </div>
  )
}
