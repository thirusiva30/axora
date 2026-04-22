import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore'
import toast from 'react-hot-toast'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Validate Connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'))
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.")
        }
      }
    }
    testConnection()
  }, [])

  useEffect(() => {
    let interceptorId = null

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cleanup previous state
      if (interceptorId !== null) {
        axios.interceptors.request.eject(interceptorId)
        interceptorId = null
      }
      
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          console.log('[AUTH] Token acquired, setting headers')
          
          // Use defaults as fallback
          axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`

          // Robust interceptor for all future requests
          interceptorId = axios.interceptors.request.use(async (config) => {
            try {
              // Ensure we always have the freshest token
              const currentToken = await firebaseUser.getIdToken()
              config.headers.Authorization = `Bearer ${currentToken}`
            } catch (e) {
              console.error('[AUTH] Interceptor token failure', e)
            }
            return config
          })

          // Sync user profile
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userSnap = await getDoc(userRef)
          
          let profileData
          if (!userSnap.exists()) {
            profileData = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Alex Morrison',
              email: firebaseUser.email,
              fleet_name: 'Global Logistics Corp',
              phone: firebaseUser.phoneNumber || ''
            }
            await setDoc(userRef, profileData)
          } else {
            profileData = userSnap.data()
          }
          
          // FINALLY set the user to trigger UI fetches
          setUser(profileData)
        } catch (err) {
          console.error('[AUTH] Critical auth sync failure', err)
          toast.error('Identity sync blocked')
        }
      } else {
        setUser(null)
        delete axios.defaults.headers.common['Authorization']
      }
      setLoading(false)
    })

    return () => {
      unsubscribe()
      if (interceptorId !== null) {
        axios.interceptors.request.eject(interceptorId)
      }
    }
  }, [])

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      toast.success('System Overdrive Initialized')
    } catch (error) {
      toast.error('Authentication linkage failed')
      console.error(error)
    }
  }

  const logout = async () => {
    await signOut(auth)
    delete axios.defaults.headers.common['Authorization']
    toast.success('Core Systems Safely Powered Down')
  }

  return (
    <AppContext.Provider value={{ 
      user, 
      setUser, 
      loginWithGoogle, 
      logout, 
      sidebarOpen, 
      setSidebarOpen,
      loading 
    }}>
      {!loading && children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
