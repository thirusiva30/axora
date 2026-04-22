import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FleetMap from './pages/FleetMap'
import Trucks from './pages/Trucks'
import Compliance from './pages/Compliance'
import Fuel from './pages/Fuel'
import Drivers from './pages/Drivers'
import Mechanics from './pages/Mechanics'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/" />
  return children
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="map" element={<FleetMap />} />
            <Route path="trucks" element={<Trucks />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="fuel" element={<Fuel />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="mechanics" element={<Mechanics />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0D1B2A',
          color: '#F0F4F8',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 'bold',
          letterSpacing: '0.5px'
        }
      }} />
    </AppProvider>
  )
}

export default App
