'use client'

import { useEcole } from '@/hooks/useEcole'
import { createEcoleClient } from '@/lib/supabase-with-ecole'
import { useMemo } from 'react'

/**
 * Hook qui retourne un client Supabase avec l'école active du contexte
 */
export const useEcoleClient = () => {
  const { ecoleActive } = useEcole()
  
  const getClient = useMemo(() => {
    return async () => {
      if (!ecoleActive) {
        throw new Error('Aucune école active')
      }
      return await createEcoleClient(ecoleActive.id)
    }
  }, [ecoleActive])
  
  return getClient
}


