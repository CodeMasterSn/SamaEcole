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
    
    const resend = getResendClient()
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'contact@samaecole.online'
    const fromName = process.env.RESEND_FROM_NAME || 'Sama École'
    
    console.log('📧 From Email:', fromEmail)
    console.log('📧 From Name:', fromName)
    
    const emailPayload = {
      from: `${fromName} <${fromEmail}>`,
      to: params.email,
      subject: '🎉 Votre accès à Sama École est approuvé !',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎓 Bienvenue sur Sama École !</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${params.nomEcole}</strong>,</p>
              
              <p>Excellente nouvelle ! Votre demande d'accès à la plateforme Sama École a été <strong>approuvée</strong> ! 🎉</p>
              
              <p>Vous pouvez maintenant créer votre compte administrateur et commencer à gérer votre école sur notre plateforme.</p>
              
              <div style="text-align: center;">
                <a href="${params.lienInvitation}" class="button">
                  🚀 Créer mon compte
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                <strong>Note :</strong> Ce lien est personnel et sécurisé. Ne le partagez avec personne.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <h3>🎯 Prochaines étapes :</h3>
              <ol>
                <li>Cliquez sur le bouton ci-dessus</li>
                <li>Choisissez votre mot de passe</li>
                <li>Commencez à utiliser Sama École !</li>
              </ol>
              
              <p>Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@samaecole.online">contact@samaecole.online</a></p>
              
              <p>À très bientôt sur Sama École ! 🌟</p>
            </div>
            <div class="footer">
              <p>Sama École - Plateforme de gestion scolaire</p>
              <p>Cet email a été envoyé à ${params.email}</p>
            </div>
          </body>
        </html>
      `
    }
    
    console.log('📧 Payload email:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      hasHtml: true,
      htmlLength: emailPayload.html.length
    })
    
    console.log('📧 Tentative d\'envoi via Resend...')
    const { data, error } = await resend.emails.send(emailPayload)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (error) {
      console.error('❌ === ERREUR ENVOI EMAIL ===')
      console.error('❌ Durée:', duration + 'ms')
      console.error('❌ Type erreur:', typeof error)
      console.error('❌ Erreur brute:', error)
      console.error('❌ Message erreur:', error?.message)
      console.error('❌ Code erreur:', error?.code)
      console.error('❌ Détails erreur JSON:', JSON.stringify(error, null, 2))
      console.error('❌ Stack trace:', error?.stack)
      return { success: false, error }
    }

    console.log('✅ === EMAIL ENVOYÉ AVEC SUCCÈS ===')
    console.log('✅ Durée:', duration + 'ms')
    console.log('✅ Réponse Resend:', data)
    console.log('✅ ID email:', data?.id)
    console.log('✅ Timestamp fin:', new Date().toISOString())
    return { success: true, data }
    
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
    
    const resend = getResendClient()
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'contact@samaecole.online'
    const fromName = process.env.RESEND_FROM_NAME || 'Sama École'
    
    console.log('📧 From Email:', fromEmail)
    console.log('📧 From Name:', fromName)
    
    const emailPayload = {
      from: `${fromName} <${fromEmail}>`,
      to: params.email,
      subject: 'Votre demande d\'accès à Sama École',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: #ef4444;
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Sama École</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${params.nomEcole}</strong>,</p>
              
              <p>Nous avons bien reçu votre demande d'accès à la plateforme Sama École.</p>
              
              <p>Après examen, nous ne pouvons malheureusement pas donner suite à votre demande pour la raison suivante :</p>
              
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Motif :</strong> ${params.motifRefus}</p>
              </div>
              
              <p>Si vous pensez qu'il s'agit d'une erreur ou souhaitez plus d'informations, n'hésitez pas à nous contacter à <a href="mailto:contact@samaecole.online">contact@samaecole.online</a></p>
              
              <p>Cordialement,<br>L'équipe Sama École</p>
            </div>
            <div class="footer">
              <p>Sama École - Plateforme de gestion scolaire</p>
            </div>
          </body>
        </html>
      `
    }
    
    console.log('📧 Payload email refus:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      hasHtml: true,
      htmlLength: emailPayload.html.length
    })
    
    console.log('📧 Tentative d\'envoi email refus via Resend...')
    const { data, error } = await resend.emails.send(emailPayload)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (error) {
      console.error('❌ === ERREUR ENVOI EMAIL REFUS ===')
      console.error('❌ Durée:', duration + 'ms')
      console.error('❌ Type erreur:', typeof error)
      console.error('❌ Erreur brute:', error)
      console.error('❌ Message erreur:', error?.message)
      console.error('❌ Code erreur:', error?.code)
      console.error('❌ Détails erreur JSON:', JSON.stringify(error, null, 2))
      console.error('❌ Stack trace:', error?.stack)
      return { success: false, error }
    }

    console.log('✅ === EMAIL REFUS ENVOYÉ AVEC SUCCÈS ===')
    console.log('✅ Durée:', duration + 'ms')
    console.log('✅ Réponse Resend:', data)
    console.log('✅ ID email:', data?.id)
    console.log('✅ Timestamp fin:', new Date().toISOString())
    return { success: true, data }
    
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
