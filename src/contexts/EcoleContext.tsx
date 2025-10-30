'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

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
        const client = supabase
        
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await client.auth.getUser()
        
        if (!user) {
          setIsLoading(false)
          return
        }

        // Vérifier si c'est un Super Admin
        const { data: roleData } = await client
          .from('roles_globaux')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (roleData?.role === 'super_admin') {
          console.log('✅ Super Admin détecté - pas d\'école à charger')
          setIsLoading(false)
          return
        }

        // Récupérer l'école de l'utilisateur depuis la table utilisateurs
        console.log('🔍 Tentative de récupération utilisateur ID:', user.id)
        let utilisateur = null
        const { data: userData, error: userError } = await client
          .from('utilisateurs')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        console.log('📊 Résultat requête utilisateur:', { userData, userError })

        if (userError) {
          console.error('Erreur récupération utilisateur:', userError)
          console.error('User ID:', user.id)
          console.error('User email:', user.email)
          
          // Si l'utilisateur n'existe pas dans utilisateurs, essayer de le créer
          if (userError.code === 'PGRST116') {
            console.log('Utilisateur non trouvé dans la table utilisateurs, tentative de création...')
            
            // Ne pas créer automatiquement d'utilisateur
            // L'utilisateur doit être créé via le processus d'approbation
            console.error('❌ Utilisateur non trouvé dans la table utilisateurs. L\'utilisateur doit être créé via le processus d\'approbation.')
            setIsLoading(false)
            return
          } else {
            setIsLoading(false)
            return
          }
        } else {
          utilisateur = userData
        }

        if (!utilisateur) {
          console.error('Utilisateur non trouvé après toutes les tentatives')
          setIsLoading(false)
          return
        }

        // Récupérer l'école correspondante
        console.log('🔍 EcoleContext: Récupération école pour ecole_id:', utilisateur.ecole_id)
        const { data: ecole, error } = await client
          .from('ecoles')
          .select('*')
          .eq('id', utilisateur.ecole_id)
          .single()

        console.log('🔍 EcoleContext: Données école récupérées:', ecole)
        console.log('🔍 EcoleContext: Erreur école:', error)

        if (error) {
          console.error('Erreur chargement école:', error)
        } else {
          console.log('✅ EcoleContext: École active définie:', ecole.nom, '(ID:', ecole.id, ')')
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

