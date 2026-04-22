import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useApp } from '../context/AppContext'
import Logo from '../components/Logo'
import { LogIn, Loader2, Sparkles, Shield } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { loginWithGoogle, user } = useApp()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user])

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-bg-primary p-6">
      {/* Animated Orbs - Technical / Orbital feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vh] h-[60vh] rounded-full bg-accent-orange/10 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vh] h-[50vh] rounded-full bg-accent-blue/10 blur-[140px] animate-pulse delay-700"></div>
      
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/50 to-bg-primary pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-12 w-full max-w-[440px] relative z-10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] border-white/5 bg-gradient-to-br from-bg-card to-bg-secondary"
      >
        <div className="flex flex-col items-center mb-12 text-center">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <Logo />
          </motion.div>
          <div className="mt-8 space-y-2">
            <h2 className="text-3xl font-black font-display text-white italic tracking-tighter uppercase">Axora Fleet v4.0</h2>
            <div className="flex items-center justify-center gap-2 text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[3px]">Global Telemetry Nodes: Online</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="text-center space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed font-medium">
                Link your organizational identity to the Axora intelligence network to begin fleet optimization.
              </p>
           </div>

           <button 
             onClick={handleGoogleLogin}
             disabled={loading}
             className="btn-primary w-full py-5 text-xs font-black tracking-[4px] uppercase flex items-center justify-center gap-4 group/btn shadow-[0_12px_24px_rgba(244,123,32,0.15)] relative overflow-hidden"
           >
             <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity" />
             {loading ? <Loader2 className="animate-spin" size={18} /> : (
               <>
                 <LogIn size={18} className="group-hover/btn:-translate-x-1 transition-transform" />
                 Initialize via Google
               </>
             )}
           </button>

           <div className="grid grid-cols-2 gap-4 mt-12 pt-12 border-t border-white/5">
              <div className="flex flex-col items-center gap-2 opacity-50">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Shield size={18} className="text-accent-blue" />
                 </div>
                 <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Fortress Secure</span>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-50">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Sparkles size={18} className="text-accent-yellow" />
                 </div>
                 <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Gemini Optimized</span>
              </div>
           </div>
        </div>

        <div className="mt-10 text-center">
           <p className="text-[9px] font-medium text-text-secondary opacity-30 italic">
              Authorized Personnel Only. Telemetry encrypted via 4096-bit AES.
           </p>
        </div>
      </motion.div>
    </div>
  )
}
