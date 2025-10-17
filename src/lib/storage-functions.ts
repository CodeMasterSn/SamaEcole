import { supabase } from './supabase'

/**
 * Upload un fichier PDF vers Supabase Storage
 */
export async function uploadPDFVersStorage(
  pdfBlob: Blob, 
  nomFichier: string
): Promise<string | null> {
  try {
    // Utiliser le client supabase directement (avec session authentifiée)
    
    // Vérifier la session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('🔑 Session active:', session ? 'OUI' : 'NON')
    console.log('🔑 User ID:', session?.user?.id)
    
    // Déterminer le dossier selon le type de document
    let dossier = 'factures'
    if (nomFichier.startsWith('REC-')) {
      dossier = 'recus'
    } else if (nomFichier.startsWith('FAC-')) {
      dossier = 'factures'
    }
    
    const chemin = `${dossier}/${nomFichier}`
    
    console.log('📁 Upload vers:', chemin)
    
    const { data, error } = await supabase.storage
      .from('sama-ecole-public') // Bucket public sans RLS
      .upload(chemin, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true // Remplace si existe déjà
      })
    
    if (error) {
      console.error('Erreur upload:', error)
      return null
    }
    
    // Récupérer URL publique
    const { data: urlData } = supabase.storage
      .from('sama-ecole-public') // Bucket public sans RLS
      .getPublicUrl(chemin)
    
    console.log('✅ PDF uploadé:', urlData.publicUrl)
    return urlData.publicUrl
  } catch (error) {
    console.error('Erreur:', error)
    return null
  }
}

/**
 * Génère un lien WhatsApp avec message pré-rempli
 */
export function genererLienWhatsApp(
  numeroDestinataire: string,
  message: string
): string {
  const numeroClean = numeroDestinataire.replace(/[\s\-\(\)]/g, '')
  const messageEncode = encodeURIComponent(message)
  return `https://wa.me/${numeroClean}?text=${messageEncode}`
}

/**
 * Valide un numéro de téléphone sénégalais
 */
export function validerNumeroSenegalais(numero: string | null | undefined): {
  valide: boolean
  numeroFormate: string
  erreur: string
} {
  if (!numero) {
    return {
      valide: false,
      numeroFormate: '',
      erreur: 'Numéro manquant'
    }
  }

  // Nettoyer le numéro
  const numeroNettoye = numero.replace(/\D/g, '')
  
  // Formats sénégalais acceptés
  const formatsValides = [
    /^221[0-9]{9}$/, // +221 77 123 45 67
    /^221[0-9]{8}$/, // +221 77 123 45 6
    /^[0-9]{9}$/,    // 77 123 45 67
    /^[0-9]{8}$/     // 77 123 45 6
  ]

  const estValide = formatsValides.some(format => format.test(numeroNettoye))
  
  if (!estValide) {
    return {
      valide: false,
      numeroFormate: '',
      erreur: 'Format invalide (ex: +221 77 123 45 67)'
    }
  }

  // Formater le numéro pour WhatsApp
  let numeroFormate = numeroNettoye
  if (numeroFormate.startsWith('221')) {
    numeroFormate = numeroFormate
  } else if (numeroFormate.length === 9) {
    numeroFormate = '221' + numeroFormate
  } else if (numeroFormate.length === 8) {
    numeroFormate = '221' + numeroFormate
  }

  return {
    valide: true,
    numeroFormate,
    erreur: ''
  }
}

/**
 * Test d'upload d'un PDF simple
 */
export async function testerUploadPDF(): Promise<boolean> {
  try {
    console.log('🧪 Test d\'upload PDF...')
    
    // Créer un PDF de test simple
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.text('Test d\'upload PDF', 20, 20)
    doc.text('Date: ' + new Date().toLocaleString('fr-FR'), 20, 40)
    doc.text('Ce fichier teste l\'upload vers Supabase Storage', 20, 60)
    
    const pdfBlob = doc.output('blob')
    const nomFichier = `test-${Date.now()}.pdf`
    
    const url = await uploadPDFVersStorage(pdfBlob, nomFichier)
    
    if (url) {
      console.log('✅ Test réussi! URL:', url)
      return true
    } else {
      console.error('❌ Test échoué')
      return false
    }
  } catch (error) {
    console.error('❌ Erreur test:', error)
    return false
  }
}
