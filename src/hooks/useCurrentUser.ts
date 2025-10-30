'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserData {
  ecoleId: number | null
  ecoleNom: string | null
  role: string | null
  loading: boolean
}

export function useCurrentUser() {
  const [userData, setUserData] = useState<UserData>({
    ecoleId: null,
    ecoleNom: null,
    role: null,
    loading: true
  })

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    try {
      const client = supabase

      // 1. Auth user
      const { data: { user } } = await client.auth.getUser()
      
      if (!user) {
        setUserData({ ecoleId: null, ecoleNom: null, role: null, loading: false })
        return
      }

      console.log('👤 User ID:', user.id)

      // 2. Get user data
      const { data: utilisateur } = await client
        .from('utilisateurs')
        .select('ecole_id, role')
        .eq('id', user.id)
        .single()

      console.log('📊 Utilisateur:', utilisateur)

      if (!utilisateur) {
        setUserData({ ecoleId: null, ecoleNom: null, role: null, loading: false })
        return
      }

      // 3. Get ecole
      const { data: ecole } = await client
        .from('ecoles')
        .select('id, nom')
        .eq('id', utilisateur.ecole_id)
        .single()

      console.log('🏫 École:', ecole)

      setUserData({
        ecoleId: ecole?.id || null,
        ecoleNom: ecole?.nom || null,
        role: utilisateur.role || null,
        loading: false
      })

    } catch (error) {
      console.error('❌ Erreur:', error)
      setUserData({ ecoleId: null, ecoleNom: null, role: null, loading: false })
    }
  }

  return userData
}
