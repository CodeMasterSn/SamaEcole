// Interface pour les données d'invitation email
interface InvitationEmailData {
  email: string;
  nom: string;
  token: string;
  ecole: string;
  invitePar: string;
  role: string;
  messagePersonnalise?: string;
}

// Interface pour le résultat de l'envoi
interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
  recipient?: string;
}

/**
 * Envoie un email d'invitation via l'API Resend
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<EmailResult> {
  try {
    console.log('📧 Préparation envoi email à:', data.email);

    // Validation côté client avant envoi
    const validation = validateInvitationData(data);
    if (!validation.isValid) {
      console.log('❌ Validation échouée:', validation.error);
      return { success: false, error: validation.error };
    }

    console.log('✅ Données validées, envoi à l\'API...');

    // Appel à l'API route
    const response = await fetch('/api/send-invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      console.log('❌ Erreur API:', result);
      throw new Error(result.error || `Erreur HTTP ${response.status}`);
    }

    console.log('✅ Email envoyé avec succès:', result);
    return { 
      success: true, 
      messageId: result.messageId,
      recipient: result.recipient
    };

  } catch (error) {
    console.error('❌ Erreur dans sendInvitationEmail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'envoi'
    };
  }
}

/**
 * Valide les données d'invitation avant envoi
 */
function validateInvitationData(data: InvitationEmailData): { isValid: boolean; error?: string } {
  // Validation email
  if (!data.email || !isValidEmail(data.email)) {
    return { isValid: false, error: 'Adresse email invalide' };
  }
  
  // Validation nom
  if (!data.nom || data.nom.trim().length < 2) {
    return { isValid: false, error: 'Nom trop court (minimum 2 caractères)' };
  }
  
  // Validation token
  if (!data.token || data.token.length < 10) {
    return { isValid: false, error: 'Token d\'invitation invalide' };
  }
  
  // Validation rôle
  if (!data.role || !['secretaire', 'comptable'].includes(data.role.toLowerCase())) {
    return { isValid: false, error: 'Rôle invalide (doit être secrétaire ou comptable)' };
  }
  
  // Validation message personnalisé (optionnel mais si présent, limité)
  if (data.messagePersonnalise && data.messagePersonnalise.length > 500) {
    return { isValid: false, error: 'Message personnalisé trop long (maximum 500 caractères)' };
  }
  
  return { isValid: true };
}

/**
 * Validation robuste d'email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim());
}

/**
 * Nettoie et formate les données d'invitation
 */
export function sanitizeEmailData(data: Partial<InvitationEmailData>): InvitationEmailData | null {
  if (!data.email || !data.nom || !data.token || !data.role) {
    console.log('❌ Données obligatoires manquantes pour email');
    return null;
  }

  return {
    email: data.email.trim().toLowerCase(),
    nom: data.nom.trim(),
    token: data.token.trim(),
    ecole: data.ecole?.trim() || 'Votre École',
    invitePar: data.invitePar?.trim() || 'L\'Administrateur',
    role: data.role.trim().toLowerCase(),
    messagePersonnalise: data.messagePersonnalise?.trim() || undefined
  };
}

/**
 * Teste la configuration Resend (développement uniquement)
 */
export async function testResendConfiguration(): Promise<{ configured: boolean; error?: string }> {
  try {
    console.log('🧪 Test de la configuration Resend...');
    
    const response = await fetch('/api/send-invitation', {
      method: 'GET'
    });
    
    if (!response.ok) {
      return { configured: false, error: 'API route non accessible' };
    }
    
    const result = await response.json();
    console.log('📊 Configuration Resend:', result);
    
    return { 
      configured: result.resendConfigured || false,
      error: result.resendConfigured ? undefined : 'Variables d\'environnement manquantes'
    };
    
  } catch (error) {
    console.error('❌ Erreur test configuration:', error);
    return { 
      configured: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Utilitaire pour formater le nom du rôle
 */
export function formatRoleName(role: string): string {
  switch (role.toLowerCase()) {
    case 'secretaire':
      return 'Secrétaire';
    case 'comptable':
      return 'Comptable';
    default:
      return 'Utilisateur';
  }
}

/**
 * Génère un aperçu de l'email (pour debug)
 */
export function generateEmailPreview(data: InvitationEmailData): string {
  return `
📧 APERÇU EMAIL INVITATION
━━━━━━━━━━━━━━━━━━━━━━━━━━
À: ${data.email}
De: SAMA ÉCOLE <contact.samaecole@gmail.com>
Sujet: ✉️ Rejoignez ${data.ecole} sur SAMA ÉCOLE

Contenu:
- Nom invité: ${data.nom}
- École: ${data.ecole}
- Rôle: ${formatRoleName(data.role)}
- Invité par: ${data.invitePar}
${data.messagePersonnalise ? `- Message: ${data.messagePersonnalise}` : ''}
- Token: ${data.token.substring(0, 10)}...

Lien d'activation: /rejoindre/${data.token}
━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
}
