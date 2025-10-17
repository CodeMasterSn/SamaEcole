'use client'

import { MessageCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { genererLienWhatsApp, validerNumeroSenegalais } from '@/lib/storage-functions'
import { uploadPDFVersStorage } from '@/lib/storage-functions'
import { genererPDFFactureBlob } from '@/lib/pdf-facture'
import { genererPDFRecuBlob } from '@/lib/pdf-recu'
import { obtenirInfosEcole } from '@/lib/supabase-functions'
import { supabase } from '@/lib/supabase'

interface BoutonWhatsAppProps {
  numeroDestinataire: string | null | undefined
  message: string
  typeDocument: 'facture' | 'recu'
  documentData: any // Facture ou reçu complet
  className?: string
  onMettreAJour?: () => void
}

export default function BoutonWhatsApp({ 
  numeroDestinataire, 
  message,
  typeDocument,
  documentData,
  className = '',
  onMettreAJour
}: BoutonWhatsAppProps) {
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const validation = validerNumeroSenegalais(numeroDestinataire)

  const handleClick = async () => {
    if (!validation.valide) {
      const confirmation = window.confirm(
        `❌ Numéro parent ${validation.erreur}\n\nVoulez-vous mettre à jour les informations ?`
      )
      if (confirmation && onMettreAJour) onMettreAJour()
      return
    }

    setEnvoiEnCours(true)

    try {
      console.log('🔍 Début génération WhatsApp pour:', typeDocument)
      
      // 1. Récupérer infos école
      console.log('📋 Récupération infos école...')
      const ecole = await obtenirInfosEcole(1)
      console.log('📍 École:', ecole)
      
      // 2. Générer le PDF selon le type
      let pdfBlob: Blob
      let nomFichier: string
      
      if (typeDocument === 'facture') {
        console.log('📋 Génération PDF facture...')
        
        // DEBUG: Vérifier toutes les données avant génération
        console.log('📍 Facture:', documentData.facture)
        console.log('📍 Élève:', documentData.eleve)
        console.log('📍 École:', ecole)
        
        // Vérifier si les données essentielles existent
        if (!documentData.facture) {
          throw new Error('documentData.facture est undefined')
        }
        if (!documentData.eleve) {
          throw new Error('documentData.eleve est undefined')
        }
        if (!ecole) {
          throw new Error('ecole est undefined')
        }
        
        // CHARGER LES LIGNES DE FACTURE DYNAMIQUEMENT
        console.log('📋 Chargement des lignes de facture...')
        const { data: lignes } = await supabase
          .from('facture_lignes')
          .select('*')
          .eq('facture_id', documentData.facture.id)
        
        console.log('📍 Lignes chargées:', lignes)
        console.log('✅ Nombre de lignes:', lignes?.length || 0)
        
        // Vérifier la structure des lignes
        if (lignes && lignes.length > 0) {
          console.log('📍 Première ligne:', lignes[0])
        }
        
        console.log('📋 Appel genererPDFFactureBlob avec:')
        console.log('  - facture:', documentData.facture)
        console.log('  - eleve:', documentData.eleve)
        console.log('  - ecole:', ecole)
        console.log('  - lignes:', lignes || [])
        
        // Debug spécifique des lignes
        if (lignes && lignes.length > 0) {
          console.log('🔍 Première ligne détaillée:', {
            designation: lignes[0].designation,
            description: lignes[0].description,
            nom: lignes[0].nom,
            prix_unitaire: lignes[0].prix_unitaire,
            tarif: lignes[0].tarif,
            montant: lignes[0].montant,
            total: lignes[0].total
          })
        }
        
        pdfBlob = await genererPDFFactureBlob(
          documentData.facture,
          documentData.eleve,
          ecole,
          lignes || [] // ← Utiliser les lignes chargées
        )
        nomFichier = `${documentData.facture.numero_facture}-${Date.now()}.pdf`
      } else {
        console.log('📋 Génération PDF reçu...')
        console.log('Données reçu:', documentData.recu)
        console.log('Données facture:', documentData.facture)
        console.log('Données élève:', documentData.eleve)
        
        pdfBlob = await genererPDFRecuBlob(
          documentData.recu,
          documentData.facture,
          documentData.eleve,
          ecole
        )
        nomFichier = `${documentData.recu.numero_recu}.pdf`
      }
      
      console.log('✅ PDF généré:', nomFichier, pdfBlob.size, 'bytes')
      
      // 3. Upload vers Supabase
      console.log('📋 Upload vers Supabase...')
      const urlPDF = await uploadPDFVersStorage(pdfBlob, nomFichier)
      
      if (!urlPDF) {
        console.error('❌ Échec upload PDF')
        alert('Erreur lors de la génération du document')
        return
      }
      
      console.log('✅ PDF uploadé:', urlPDF)
      
      // 4. Ajouter l'URL au message
      const messageFinal = `${message}\n\n📄 Télécharger le document :\n${urlPDF}`
      
      // 5. Ouvrir WhatsApp
      const lien = genererLienWhatsApp(validation.numeroFormate, messageFinal)
      window.open(lien, '_blank')
      
    } catch (error) {
      console.error('❌ Erreur complète envoi WhatsApp:', error)
      console.error('❌ Stack trace:', error.stack)
      alert(`Erreur lors de la préparation du message: ${error.message}`)
    } finally {
      setEnvoiEnCours(false)
    }
  }

  const estValide = validation.valide

  return (
    <button
      onClick={handleClick}
      disabled={envoiEnCours}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm
        transition-colors
        ${estValide 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-orange-500 hover:bg-orange-600 text-white'
        }
        ${envoiEnCours ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={estValide ? 'Envoyer par WhatsApp' : 'Numéro invalide'}
    >
      {!estValide && <AlertCircle className="w-4 h-4" />}
      <MessageCircle className="w-4 h-4" />
      {envoiEnCours ? 'Génération...' : 'WhatsApp'}
    </button>
  )
}
