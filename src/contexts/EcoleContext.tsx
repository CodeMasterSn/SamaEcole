'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase-client'

interface Ecole {
  id: number
  nom: string
  adresse: string
  telephone: string
  email: string
}

interface EcoleContextType {
  ecoleActive: Ecole | null
  setEcoleActive: (ecole: Ecole | null) => void
  isLoading: boolean
}

const EcoleContext = createContext<EcoleContextType | undefined>(undefined)

export const EcoleProvider = ({ children }: { children: ReactNode }) => {
  const [ecoleActive, setEcoleActive] = useState<Ecole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const chargerEcoleUtilisateur = async () => {
      try {
        const supabase = createClient()
        
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsLoading(false)
          return
        }

        // Récupérer l'école de l'utilisateur
        // Pour l'instant, on prend la première école (ID = 1)
        // Plus tard, on utilisera la table utilisateurs_ecoles
        const { data: ecole, error } = await supabase
          .from('ecoles')
          .select('*')
          .eq('id', 1)
          .single()

        if (error) {
          console.error('Erreur chargement école:', error)
        } else {
          setEcoleActive(ecole)
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    chargerEcoleUtilisateur()
  }, [])

  return (
    <EcoleContext.Provider value={{ ecoleActive, setEcoleActive, isLoading }}>
      {children}
    </EcoleContext.Provider>
  )
}

export const useEcole = () => {
  const context = useContext(EcoleContext)
  if (context === undefined) {
    throw new Error('useEcole doit être utilisé dans un EcoleProvider')
  }
  return context
}

