import { useState, useEffect } from 'react'
import { Bell, LogOut, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useApp()
  const [alertCount, setAlertCount] = useState(0)

  const getPageTitle = () => {
    const path = location.pathname.substring(1)
    if (!path) return 'Dashboard'
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ')
  }

  const fetchAlertCount = async () => {
    if (!user) return
    try {
      const res = await axios.get('/api/alerts')
      setAlertCount(res.data.length)
    } catch (err) {
      console.error('Failed to fetch alerts', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAlertCount()
      const interval = setInterval(fetchAlertCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  return (
    <header className="h-16 px-6 bg-bg-primary/95 backdrop-blur-md border-bottom border-border flex items-center justify-between sticky top-0 z-40">
      <h2 className="text-xl font-bold font-display text-text-primary tracking-tight">
        {getPageTitle()}
      </h2>

      <div className="flex items-center gap-6">
        <div className="relative group cursor-pointer" onClick={() => navigate('/dashboard')}>
          <Bell size={20} className="text-text-secondary group-hover:text-accent-orange transition-colors" />
          {alertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-red text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-bg-primary">
              {alertCount}
            </span>
          )}
        </div>

        <div className="h-8 w-px bg-border"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-text-primary leading-none">{user?.name}</p>
            <p className="text-[10px] font-semibold text-accent-orange uppercase tracking-wider mt-1">Fleet Manager</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 text-text-secondary hover:text-accent-red hover:bg-accent-red/5 rounded-xl transition-all"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
