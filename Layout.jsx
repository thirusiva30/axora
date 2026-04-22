import { Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  const { sidebarOpen } = useApp()
  const ml = sidebarOpen ? '240px' : '72px'

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col transition-all duration-300 overflow-hidden"
        style={{ marginLeft: ml }}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-bg-primary relative custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
