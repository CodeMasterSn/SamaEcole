'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { checkEcoleStatus } from '@/lib/check-ecole-status'

interface AuthContextType {
  user: User | null
  userRole: string | null
  userProfile: any | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    let authListener: any = null

    const initAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Erreur session:', error)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          
          const { data: profile } = await supabase
            .from('utilisateurs')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profile && mounted) {
            setUserRole(profile.role)
            setUserProfile(profile)
            console.log('✅ Profil chargé:', profile.role) // Log unique
          }
        }
      } catch (error) {
        console.error('Erreur init auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Écouter SEULEMENT les événements importants
    authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      
      // Ignorer les événements redondants
      if (event === 'TOKEN_REFRESHED') return
      
      console.log('🔑 Auth event:', event) // Log réduit
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole(null)
        setUserProfile(null)
        router.push('/auth/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        // Ne pas recharger le profil ici si déjà fait dans initAuth
      }
    })

    return () => {
      mounted = false
      authListener?.data?.subscription?.unsubscribe()
    }
  }, []) // Dépendances vides - s'exécute UNE SEULE FOIS

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return { error }
      }
      
      if (data?.user) {
        // Vérifier le statut de l'école AVANT de permettre la connexion
        const statusCheck = await checkEcoleStatus(data.user.id)
        
        if (!statusCheck.allowed) {
          // Déconnecter immédiatement l'utilisateur
          await supabase.auth.signOut()
          
          // Retourner l'erreur avec le message de blocage
          return { 
            error: new Error(statusCheck.message || 'Accès refusé') 
          }
        }
        
        // Si l'école est autorisée, continuer normalement
        setUser(data.user)
        
        const { data: profile } = await supabase
          .from('utilisateurs')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        if (profile) {
          setUserRole(profile.role)
        }
        
        return { success: true }
      }
      
      return { error: new Error('Aucun utilisateur retourné') }
    } catch (error) {
      return { error }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    router.push('/auth/login')
  }

  const hasPermission = (permission: string) => {
    if (!userRole) return false
    
    const rolePermissions: { [key: string]: string[] } = {
      'admin': ['all'],
      'comptable': ['factures.view', 'factures.create', 'paiements', 'frais.view', 'frais.create', 'frais.edit', 'frais.delete'],
      'secretaire': ['eleves.view', 'classes.view', 'frais.view'],
      'professeur': ['notes', 'absences']
    }
    
    const permissions = rolePermissions[userRole] || []
    return permissions.includes('all') || permissions.includes(permission)
  }

  const hasRole = (role: string) => {
    return userRole === role
  }

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      userProfile,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      hasPermission,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}