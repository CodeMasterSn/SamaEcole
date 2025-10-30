import { supabase } from '@/lib/supabase'

export async function checkEcoleStatus(userId: string): Promise<{
  allowed: boolean
  message?: string
  ecole?: any
}> {
  const client = supabase
  
  // Récupérer l'école de l'utilisateur
  // Pour l'instant on suppose ecole_id = 1, 
  // Plus tard on utilisera la table utilisateurs_ecoles
  const { data: ecole, error } = await client
    .from('ecoles')
    .select('*')
    .eq('id', 1)
    .single()
  
  if (error || !ecole) {
    return {
      allowed: false,
      message: 'École introuvable. Contactez le support.'
    }
  }
  
  // Vérifier le statut
  if (ecole.statut === 'bloque') {
    return {
      allowed: false,
      message: '🚫 Votre accès à Sama École a été suspendu.\n\nVeuillez contacter notre service client :\n📧 contact@samaecole.online\n📞 +221 77 677 87 47',
      ecole
    }
  }
  
  if (ecole.statut === 'suspendu') {
    return {
      allowed: false,
      message: '⚠️ Votre compte est temporairement suspendu.\n\nRaison possible : Non-paiement\n\nContactez-nous :\n📧 contact@samaecole.online\n📞 +221 77 677 87 47',
      ecole
    }
  }
  
  // Vérifier si compte démo expiré
  if (ecole.type_compte === 'demo' && ecole.date_expiration) {
    const now = new Date()
    const expiration = new Date(ecole.date_expiration)
    
    if (now > expiration) {
      return {
        allowed: false,
        message: '⏰ Votre période d\'essai gratuite est terminée.\n\nPour continuer à utiliser Sama École, contactez-nous :\n📧 contact@samaecole.online\n📞 +221 77 677 87 47',
        ecole
      }
    }
  }
  
  // Tout est OK
  return {
    allowed: true,
    ecole
  }
}
