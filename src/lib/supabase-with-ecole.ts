import { createClient } from '@/lib/supabase-client'

/**
 * Crée un client Supabase avec le contexte école défini
 * Toutes les requêtes filtreront automatiquement par ecole_id
 */
export const createEcoleClient = async (ecoleId: number) => {
  const supabase = createClient()
  
  // Définir le contexte école pour cette session
  const { error } = await supabase.rpc('set_ecole_context', {
    ecole_id_param: ecoleId
  })
  
  if (error) {
    console.error('Erreur définition contexte école:', error)
  }
  
  return supabase
}

/**
 * Hook pour obtenir un client Supabase avec école active
 * Utilise automatiquement l'école du contexte React
 */
export const useEcoleClient = () => {
  // Cette fonction sera utilisée dans les composants
  // Elle récupérera l'ecoleId du contexte React
  return async (ecoleId: number) => {
    return await createEcoleClient(ecoleId)
  }
}

