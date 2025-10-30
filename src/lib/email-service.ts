import { Resend } from 'resend'

// Initialisation de Resend avec gestion d'erreur et logs détaillés
const getResendClient = () => {
  console.log('🔑 === INITIALISATION RESEND ===')
  console.log('🔑 RESEND_API_KEY présente:', !!process.env.RESEND_API_KEY)
  console.log('🔑 Premiers caractères:', process.env.RESEND_API_KEY?.substring(0, 5))
  console.log('🔑 Longueur API key:', process.env.RESEND_API_KEY?.length)
  console.log('🔑 Environnement:', process.env.NODE_ENV)
  console.log('🔑 From Email configuré:', process.env.RESEND_FROM_EMAIL)
  console.log('🔑 From Name configuré:', process.env.RESEND_FROM_NAME)
  
  const apiKey = process.env.RESEND_API_KEY || 're_ZDeFxXv6_6dqPCwTDnqAkmF2BvvxS3f98'
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not defined')
  }
  
  console.log('🔑 Client Resend initialisé avec succès')
  return new Resend(apiKey)
}

interface EmailInvitationParams {
  email: string
  nomEcole: string
  lienInvitation: string
}

interface EmailRefusParams {
  email: string
  nomEcole: string
  motifRefus: string
}

export async function envoyerEmailInvitation(params: EmailInvitationParams) {
  const startTime = Date.now()
  
  try {
    console.log('📧 === DÉBUT ENVOI EMAIL INVITATION ===')
    console.log('📧 Timestamp début:', new Date().toISOString())
    console.log('📧 Destinataire:', params.email)
    console.log('📧 École:', params.nomEcole)
    console.log('📧 Lien:', params.lienInvitation)
    
    console.log('📧 Appel API route /api/send-email...')
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'invitation',
        email: params.email,
        nomEcole: params.nomEcole,
        lienInvitation: params.lienInvitation
      })
    })
    
    const result = await response.json()
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (!response.ok) {
      console.error('❌ === ERREUR API EMAIL ===')
      console.error('❌ Durée:', duration + 'ms')
      console.error('❌ Status:', response.status)
      console.error('❌ Erreur API:', result)
      return { success: false, error: result.error || 'Erreur API' }
    }

    console.log('✅ === EMAIL ENVOYÉ AVEC SUCCÈS ===')
    console.log('✅ Durée:', duration + 'ms')
    console.log('✅ Réponse API:', result)
    console.log('✅ ID email:', result.data?.id)
    console.log('✅ Timestamp fin:', new Date().toISOString())
    return { success: true, data: result.data }
    
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.error('💥 === ERREUR CATCH ENVOI EMAIL ===')
    console.error('💥 Durée:', duration + 'ms')
    console.error('💥 Type erreur:', typeof error)
    console.error('💥 Erreur brute:', error)
    console.error('💥 Message erreur:', error?.message)
    console.error('💥 Stack trace:', error?.stack)
    return { success: false, error }
  }
}

export async function envoyerEmailRefus(params: EmailRefusParams) {
  const startTime = Date.now()
  
  try {
    console.log('📧 === DÉBUT ENVOI EMAIL REFUS ===')
    console.log('📧 Timestamp début:', new Date().toISOString())
    console.log('📧 Destinataire:', params.email)
    console.log('📧 École:', params.nomEcole)
    console.log('📧 Motif:', params.motifRefus)
    
    console.log('📧 Appel API route /api/send-email...')
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'refus',
        email: params.email,
        nomEcole: params.nomEcole,
        motifRefus: params.motifRefus
      })
    })
    
    const result = await response.json()
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (!response.ok) {
      console.error('❌ === ERREUR API EMAIL REFUS ===')
      console.error('❌ Durée:', duration + 'ms')
      console.error('❌ Status:', response.status)
      console.error('❌ Erreur API:', result)
      return { success: false, error: result.error || 'Erreur API' }
    }

    console.log('✅ === EMAIL REFUS ENVOYÉ AVEC SUCCÈS ===')
    console.log('✅ Durée:', duration + 'ms')
    console.log('✅ Réponse API:', result)
    console.log('✅ ID email:', result.data?.id)
    console.log('✅ Timestamp fin:', new Date().toISOString())
    return { success: true, data: result.data }
    
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.error('💥 === ERREUR CATCH ENVOI EMAIL REFUS ===')
    console.error('💥 Durée:', duration + 'ms')
    console.error('💥 Type erreur:', typeof error)
    console.error('💥 Erreur brute:', error)
    console.error('💥 Message erreur:', error?.message)
    console.error('💥 Stack trace:', error?.stack)
    return { success: false, error }
  }
}
