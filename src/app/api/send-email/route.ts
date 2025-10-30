import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, email, nomEcole, lienInvitation, motifRefus } = body

    console.log('🔑 === API ROUTE EMAIL ===')
    console.log('🔑 RESEND_API_KEY présente:', !!process.env.RESEND_API_KEY)
    console.log('🔑 Premiers caractères:', process.env.RESEND_API_KEY?.substring(0, 5))
    console.log('🔑 From Email:', process.env.RESEND_FROM_EMAIL)
    console.log('🔑 From Name:', process.env.RESEND_FROM_NAME)
    console.log('📧 Type:', type)
    console.log('📧 Destinataire:', email)

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'contact@samaecole.online'
    const fromName = process.env.RESEND_FROM_NAME || 'Sama École'

    if (type === 'invitation') {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: email,
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
                <p>Bonjour <strong>${nomEcole}</strong>,</p>
                
                <p>Excellente nouvelle ! Votre demande d'accès à la plateforme Sama École a été <strong>approuvée</strong> ! 🎉</p>
                
                <p>Vous pouvez maintenant créer votre compte administrateur et commencer à gérer votre école sur notre plateforme.</p>
                
                <div style="text-align: center;">
                  <a href="${lienInvitation}" class="button">
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
                <p>Cet email a été envoyé à ${email}</p>
              </div>
            </body>
          </html>
        `
      })

      if (error) {
        console.error('❌ Erreur envoi email invitation:', error)
        return NextResponse.json({ success: false, error }, { status: 500 })
      }

      console.log('✅ Email invitation envoyé:', data)
      return NextResponse.json({ success: true, data })

    } else if (type === 'refus') {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: email,
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
                <p>Bonjour <strong>${nomEcole}</strong>,</p>
                
                <p>Nous avons bien reçu votre demande d'accès à la plateforme Sama École.</p>
                
                <p>Après examen, nous ne pouvons malheureusement pas donner suite à votre demande pour la raison suivante :</p>
                
                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Motif :</strong> ${motifRefus}</p>
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
      })

      if (error) {
        console.error('❌ Erreur envoi email refus:', error)
        return NextResponse.json({ success: false, error }, { status: 500 })
      }

      console.log('✅ Email refus envoyé:', data)
      return NextResponse.json({ success: true, data })

    } else {
      return NextResponse.json({ success: false, error: 'Type d\'email invalide' }, { status: 400 })
    }

  } catch (error) {
    console.error('💥 Erreur API email:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
