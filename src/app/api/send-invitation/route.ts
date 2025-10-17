import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 === DÉBUT ENVOI EMAIL SAMA ÉCOLE ===');
  
  // VÉRIFICATION IMMÉDIATE des variables d'environnement
  console.log('🔑 Variables d\'environnement au runtime:');
  console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'PRÉSENTE' : 'MANQUANTE');
  console.log('- RESEND_API_KEY longueur:', process.env.RESEND_API_KEY?.length || 0);
  console.log('- RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'MANQUANT');
  console.log('- Toutes les variables env:', Object.keys(process.env).filter(key => key.startsWith('RESEND')));

  // Vérification critique AVANT d'initialiser Resend
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY complètement manquante');
    return NextResponse.json(
      { 
        error: 'Configuration email manquante', 
        details: 'RESEND_API_KEY non définie dans les variables d\'environnement',
        env_keys: Object.keys(process.env).filter(key => key.startsWith('RESEND'))
      },
      { status: 500 }
    );
  }

  if (!process.env.RESEND_API_KEY.startsWith('re_')) {
    console.error('❌ RESEND_API_KEY format invalide:', process.env.RESEND_API_KEY.substring(0, 5) + '...');
    return NextResponse.json(
      { error: 'Configuration email invalide', details: 'Format RESEND_API_KEY incorrect' },
      { status: 500 }
    );
  }

  console.log('✅ Configuration Resend validée, initialisation...');

  try {
    // INITIALISATION RESEND ICI (pas en haut du fichier)
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend initialisé avec succès');

    // Parse du JSON
    const body = await request.json();
    const { email, nom, ecole, invitePar, role, token, messagePersonnalise } = body;

    console.log('📧 Données reçues:', {
      email,
      nom,
      ecole: ecole || 'Non spécifié',
      role,
      hasToken: !!token,
      tokenPreview: token?.substring(0, 10) + '...'
    });

    // Validations essentielles
    if (!email || !nom || !token || !role) {
      const missing = [];
      if (!email) missing.push('email');
      if (!nom) missing.push('nom');
      if (!token) missing.push('token');
      if (!role) missing.push('role');
      
      console.error('❌ Données manquantes:', missing);
      return NextResponse.json(
        { error: `Données manquantes: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation email simple mais efficace
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Email invalide:', email);
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      );
    }

    // Préparation de l'envoi
    const fromAddress = `${process.env.RESEND_FROM_NAME || 'SAMA ECOLE'} <${process.env.RESEND_FROM_EMAIL || 'contact.samaecole@gmail.com'}>`;
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/rejoindre/${token}`;
    
    console.log('📤 Préparation envoi:');
    console.log('- Vers:', email);
    console.log('- From:', fromAddress);
    console.log('- URL:', activationUrl);

    // Template HTML simple et efficace
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation SAMA ÉCOLE</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); padding: 30px; border-radius: 10px; text-align: center; color: white; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px;">🏫 SAMA ÉCOLE</h1>
    <p style="margin: 10px 0 0 0;">Plateforme de gestion scolaire moderne</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 10px;">
    <h2 style="color: #1e293b; margin: 0 0 20px 0;">Vous êtes invité(e) !</h2>
    
    <p>Bonjour <strong>${nom}</strong>,</p>
    
    <p><strong>${invitePar || 'L\'administrateur'}</strong> vous invite à rejoindre <strong>${ecole || 'votre école'}</strong> sur SAMA ÉCOLE.</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>École :</strong> ${ecole || 'Non spécifiée'}</p>
      <p><strong>Rôle :</strong> ${role === 'secretaire' ? 'Secrétaire' : role === 'comptable' ? 'Comptable' : role}</p>
      <p><strong>Invité par :</strong> ${invitePar || 'Administrateur'}</p>
    </div>

    ${messagePersonnalise ? `
    <div style="background: #fef7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0;">Message personnel :</h4>
      <p style="margin: 0; font-style: italic;">"${messagePersonnalise}"</p>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${activationUrl}" 
         style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Créer mon compte
      </a>
    </div>

    <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #dc2626; font-size: 14px;">
        <strong>Important :</strong> Ce lien expire dans 7 jours
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
    <p>SAMA ÉCOLE - Dakar, Sénégal</p>
  </div>

</body>
</html>`;

    // Version texte
    const textContent = `
SAMA ÉCOLE - Invitation

Bonjour ${nom},

${invitePar || 'L\'administrateur'} vous invite à rejoindre ${ecole || 'votre école'} sur SAMA ÉCOLE.

Détails:
- École: ${ecole || 'Non spécifiée'}
- Rôle: ${role}
- Invité par: ${invitePar || 'Administrateur'}
${messagePersonnalise ? `\nMessage: "${messagePersonnalise}"` : ''}

Pour créer votre compte: ${activationUrl}

Important: Ce lien expire dans 7 jours.

SAMA ÉCOLE - Dakar, Sénégal
`;

    console.log('📨 Tentative d\'envoi via Resend...');

    // ENVOI EFFECTIF
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email.trim()],
      subject: `Rejoignez ${ecole || 'SAMA ÉCOLE'} - Invitation`,
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Entity-Ref-ID': token,
      }
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return NextResponse.json(
        { 
          error: 'Échec envoi email', 
          details: error.message || 'Erreur Resend inconnue',
          resendError: error
        }, 
        { status: 400 }
      );
    }

    console.log('🎉 EMAIL ENVOYÉ AVEC SUCCÈS !');
    console.log('📊 Détails:', {
      messageId: data?.id,
      recipient: email
    });
    
    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      message: 'Email envoyé avec succès',
      recipient: email
    });

  } catch (error) {
    console.error('💥 ERREUR CRITIQUE:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur', 
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

// Endpoint GET pour diagnostics
export async function GET() {
  console.log('🔍 Test de configuration...');
  
  const env = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'PRÉSENTE' : 'MANQUANTE',
    RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length || 0,
    RESEND_API_KEY_FORMAT: process.env.RESEND_API_KEY?.startsWith('re_') ? 'VALIDE' : 'INVALIDE',
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'MANQUANT',
    RESEND_FROM_NAME: process.env.RESEND_FROM_NAME || 'MANQUANT',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MANQUANT',
    ALL_RESEND_VARS: Object.keys(process.env).filter(key => key.startsWith('RESEND'))
  };
  
  console.log('📊 Variables d\'environnement:', env);
  
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      console.log('✅ Resend s\'initialise correctement');
    }
  } catch (initError) {
    console.error('❌ Erreur initialisation Resend:', initError);
    (env as any).INIT_ERROR = initError instanceof Error ? initError.message : 'Erreur inconnue';
  }
  
  return NextResponse.json({
    status: 'Test configuration SAMA ÉCOLE',
    environment: env,
    resendConfigured: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    timestamp: new Date().toISOString()
  });
}