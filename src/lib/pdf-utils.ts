import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { FactureComplet } from './supabase-functions'

export interface PDFOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  quality?: number
}

/**
 * Génère un PDF à partir d'un élément HTML
 */
export async function generatePDFFromElement(
  elementId: string, 
  options: PDFOptions = {}
): Promise<{ success: boolean; blob?: Blob; error?: string }> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Élément avec l'ID "${elementId}" non trouvé`)
    }

    // Configuration par défaut
    const config = {
      filename: options.filename || 'document.pdf',
      format: options.format || 'a4',
      orientation: options.orientation || 'portrait',
      quality: options.quality || 1
    }

    // Générer le canvas à partir de l'élément HTML
    console.log('🔍 Génération canvas...')
    const canvas = await html2canvas(element, {
      scale: config.quality,
      useCORS: true,
      allowTaint: true, // Permettre les images externes
      backgroundColor: '#ffffff',
      removeContainer: true,
      imageTimeout: 15000, // Timeout plus long
      logging: false,
      ignoreElements: (element) => {
        // Ignorer les éléments qui peuvent causer des problèmes
        return element.classList?.contains('no-pdf') || false
      },
      onclone: (clonedDoc) => {
        // Nettoyer les styles problématiques dans le clone
        const clonedElement = clonedDoc.getElementById(elementId)
        if (clonedElement) {
          // Supprimer les classes Tailwind problématiques
          clonedElement.querySelectorAll('*').forEach(el => {
            if (el instanceof HTMLElement) {
              // Supprimer les classes qui peuvent causer des problèmes
              el.classList.remove('transition-all', 'duration-300', 'hover:shadow-lg')
            }
          })
        }
      }
    })
    
    console.log('✅ Canvas généré:', canvas.width, 'x', canvas.height)

    // Créer le PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.format
    })

    // Calculer les dimensions
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 20 // Marges de 10mm de chaque côté
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Ajouter l'image au PDF
    let position = 10 // Marge du haut
    
    if (imgHeight <= pageHeight - 20) {
      // L'image tient sur une page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    } else {
      // L'image nécessite plusieurs pages
      let remainingHeight = imgHeight
      let sourceY = 0
      
      while (remainingHeight > 0) {
        const pageImgHeight = Math.min(remainingHeight, pageHeight - 20)
        const sourceHeight = (pageImgHeight * canvas.height) / imgHeight
        
        // Créer un canvas temporaire pour cette partie de l'image
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        
        tempCanvas.width = canvas.width
        tempCanvas.height = sourceHeight
        
        tempCtx?.drawImage(
          canvas,
          0, sourceY,
          canvas.width, sourceHeight,
          0, 0,
          canvas.width, sourceHeight
        )
        
        const tempImgData = tempCanvas.toDataURL('image/png')
        
        if (sourceY > 0) {
          pdf.addPage()
        }
        
        pdf.addImage(tempImgData, 'PNG', 10, 10, imgWidth, pageImgHeight)
        
        sourceY += sourceHeight
        remainingHeight -= pageImgHeight
      }
    }

    // Retourner le blob du PDF
    const pdfBlob = pdf.output('blob')
    
    return { success: true, blob: pdfBlob }
  } catch (error: any) {
    console.error('Erreur génération PDF:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Télécharge un PDF généré
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Ouvre un PDF dans un nouvel onglet
 */
export function previewPDF(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Ne pas révoquer l'URL immédiatement pour permettre l'affichage
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Génère une facture PDF directement avec jsPDF (sans html2canvas)
 */
export async function generateFacturePDFDirect(
  facture: FactureComplet,
  ecole: any,
  options: { download?: boolean; preview?: boolean } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 Génération PDF directe...')
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // En-tête
    pdf.setFontSize(20)
    pdf.setTextColor(37, 99, 235) // Bleu
    pdf.text(ecole.nom, 20, 30)
    
    pdf.setFontSize(10)
    pdf.setTextColor(107, 114, 128) // Gris
    if (ecole.adresse) pdf.text(ecole.adresse, 20, 40)
    if (ecole.telephone) pdf.text(`Tél: ${ecole.telephone}`, 20, 47)
    if (ecole.email) pdf.text(`Email: ${ecole.email}`, 20, 54)

    // Numéro de facture
    pdf.setFontSize(16)
    pdf.setTextColor(37, 99, 235)
    pdf.text('FACTURE', 150, 30)
    
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    pdf.text(`N° ${facture.numero_facture}`, 150, 40)
    pdf.text(`Date: ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}`, 150, 47)

    // Informations élève
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('FACTURÉ À', 20, 80)
    
    pdf.setFontSize(14)
    pdf.text(`${facture.eleve?.prenom} ${facture.eleve?.nom}`, 20, 95)
    
    pdf.setFontSize(10)
    pdf.text(`Matricule: ${facture.eleve?.matricule}`, 20, 105)
    pdf.text(`Classe: ${facture.eleve?.classes?.nom_complet}`, 20, 112)
    
    // Ajouter les informations parent si disponibles
    if (facture.eleve?.parents) {
      pdf.text(`Parent/Tuteur: ${facture.eleve.parents.nom} ${facture.eleve.parents.prenom}`, 20, 119)
      if (facture.eleve.parents.telephone) {
        pdf.text(`Tél: ${facture.eleve.parents.telephone}`, 20, 126)
      }
    }

    // Tableau des frais
    let yPosition = 140
    
    pdf.setFontSize(12)
    pdf.text('DÉTAIL DES FRAIS', 20, yPosition)
    yPosition += 15

    // En-tête du tableau
    pdf.setFillColor(239, 246, 255) // Bleu clair
    pdf.rect(20, yPosition, 170, 10, 'F')
    
    pdf.setFontSize(9)
    pdf.setTextColor(0, 0, 0)
    pdf.text('DÉSIGNATION', 25, yPosition + 7)
    pdf.text('QTÉ', 120, yPosition + 7)
    pdf.text('TARIF', 140, yPosition + 7)
    pdf.text('MONTANT', 170, yPosition + 7)
    
    yPosition += 15

    // Lignes du tableau
    if (facture.details && facture.details.length > 0) {
      facture.details.forEach((detail, index) => {
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251) // Gris très clair
          pdf.rect(20, yPosition - 2, 170, 10, 'F')
        }
        
        pdf.setTextColor(0, 0, 0)
        pdf.text(detail.designation || detail.description || detail.nom || 'Frais scolaire', 25, yPosition + 5)
        pdf.text((detail.quantite || 1).toString(), 125, yPosition + 5)
        pdf.text(`${(detail.tarif || detail.prix_unitaire || detail.montant).toLocaleString('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).replace(/\s/g, '.')} FCFA`, 145, yPosition + 5)
        pdf.text(`${(detail.montant || ((detail.tarif || detail.prix_unitaire) * (detail.quantite || 1))).toLocaleString('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).replace(/\s/g, '.')} FCFA`, 175, yPosition + 5)
        
        yPosition += 12
      })
    } else {
      pdf.text('Frais scolaires', 25, yPosition + 5)
      pdf.text('1', 125, yPosition + 5)
      pdf.text(`${facture.montant_total.toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).replace(/\s/g, '.')} FCFA`, 145, yPosition + 5)
      pdf.text(`${facture.montant_total.toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).replace(/\s/g, '.')} FCFA`, 175, yPosition + 5)
      yPosition += 12
    }

    // Total - TOTAL À PAYER complètement à gauche, montant à droite
    console.log('🔧 Positionnement TOTAL À PAYER - Position Y:', yPosition)
    pdf.setFillColor(37, 99, 235) // Bleu
    pdf.rect(20, yPosition, 170, 12, 'F')
    
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    // TOTAL À PAYER complètement à gauche
    console.log('🔧 Placement TOTAL À PAYER à gauche (x=25)')
    pdf.text('TOTAL À PAYER', 25, yPosition + 8)
    
    pdf.setFontSize(12)
    pdf.text(`${facture.montant_total.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).replace(/\s/g, '.')} FCFA`, 175, yPosition + 8, { align: 'right' })

    // Informations de paiement
    yPosition += 30
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('INFORMATIONS DE PAIEMENT', 20, yPosition)
    
    yPosition += 15
    pdf.setFontSize(9)
    pdf.text('Modes de paiement acceptés:', 20, yPosition)
    yPosition += 8
    pdf.text('• Espèces au secrétariat', 25, yPosition)
    yPosition += 6
    pdf.text(`• Chèque à l'ordre de "${ecole.nom}"`, 25, yPosition)
    yPosition += 6
    pdf.text('• Virement bancaire', 25, yPosition)
    yPosition += 6
    pdf.text('• Mobile Money (Orange Money, Wave)', 25, yPosition)

    // Notes
    if (facture.notes) {
      yPosition += 20
      pdf.setFontSize(12)
      pdf.text('NOTES', 20, yPosition)
      yPosition += 10
      pdf.setFontSize(9)
      const splitNotes = pdf.splitTextToSize(facture.notes, 170)
      pdf.text(splitNotes, 20, yPosition)
    }

    // Pied de page
    yPosition = 270
    pdf.setFontSize(8)
    pdf.setTextColor(107, 114, 128)
    pdf.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition)
    pdf.text('Sama École - Système de gestion scolaire', 20, yPosition + 5)
    
    pdf.text('Signature et cachet de l\'école', 130, yPosition)
    pdf.rect(130, yPosition + 5, 50, 20) // Cadre signature

    const filename = `Facture_${facture.numero_facture}_${facture.eleve?.nom}_${facture.eleve?.prenom}.pdf`

    // Actions selon les options
    if (options.download) {
      pdf.save(filename)
    }
    
    if (options.preview) {
      const pdfBlob = pdf.output('blob')
      previewPDF(pdfBlob)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erreur génération PDF directe:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Génère et télécharge une facture PDF (version html2canvas)
 */
export async function generateFacturePDF(
  facture: FactureComplet,
  ecole: any,
  options: { download?: boolean; preview?: boolean } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Utiliser TOUJOURS la génération directe pour éviter les problèmes de positionnement
    console.log('🔍 Génération PDF directe (forcée)...')
    const directResult = await generateFacturePDFDirect(facture, ecole, options)
    
    if (directResult.success) {
      console.log('✅ Génération directe réussie')
      return directResult
    }
    
    console.log('❌ Génération directe échouée:', directResult.error)
    throw new Error(directResult.error || 'Erreur de génération PDF directe')
    
    /* COMMENTÉ: Conversion HTML → PDF qui cause les problèmes de positionnement
    console.log('⚠️ Tentative html2canvas...')
    
    const filename = `Facture_${facture.numero_facture}_${facture.eleve?.nom}_${facture.eleve?.prenom}.pdf`
    
    const result = await generatePDFFromElement('facture-pdf-content', {
      filename,
      format: 'a4',
      orientation: 'portrait',
      quality: 1
    })

    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Erreur de génération PDF')
    }

    if (options.download) {
      downloadPDF(result.blob, filename)
    }
    
    if (options.preview) {
      previewPDF(result.blob)
    }

    return { success: true }
    */
  } catch (error: any) {
    console.error('Erreur génération facture PDF:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Génère plusieurs factures en PDF (dans un seul fichier ou séparément)
 */
export async function generateMultipleFacturesPDF(
  factures: FactureComplet[],
  ecole: any,
  options: { 
    separate?: boolean
    download?: boolean
    preview?: boolean
  } = {}
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    if (options.separate) {
      // Générer des PDFs séparés
      let successCount = 0
      
      for (const facture of factures) {
        const result = await generateFacturePDF(facture, ecole, { download: options.download })
        if (result.success) {
          successCount++
        }
        
        // Petite pause entre les générations pour éviter les problèmes de performance
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      return { success: true, count: successCount }
    } else {
      // Générer un PDF combiné (pour plus tard)
      return { success: false, error: 'Génération combinée pas encore implémentée' }
    }
  } catch (error: any) {
    console.error('Erreur génération multiple PDF:', error)
    return { success: false, error: error.message }
  }
}

// ===== FONCTIONS PDF POUR LES REÇUS =====

// Fonction pour générer un PDF de reçu directement
export async function generateRecuPDFDirect(recu: any, ecole: any): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF('p', 'mm', 'a4')
  
  // Configuration des couleurs
  const primaryColor = [124, 58, 237] // Purple
  const textColor = [30, 41, 59] // Slate-800
  const grayColor = [100, 116, 139] // Slate-500
  
  // En-tête avec logo et titre
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 25, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('REÇU OFFICIEL', 105, 16, { align: 'center' })
  
  // Informations école (gauche)
  doc.setTextColor(...textColor)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(ecole?.nom || 'SAMA ÉCOLE', 20, 40)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  let yPos = 48
  if (ecole?.adresse) {
    doc.text(`📍 ${ecole.adresse}`, 20, yPos)
    yPos += 5
  }
  if (ecole?.telephone) {
    doc.text(`📞 ${ecole.telephone}`, 20, yPos)
    yPos += 5
  }
  if (ecole?.email) {
    doc.text(`✉️ ${ecole.email}`, 20, yPos)
  }
  
  // Numéro de reçu et date (droite)
  doc.setFillColor(248, 250, 252)
  doc.rect(130, 35, 70, 25, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.rect(130, 35, 70, 25, 'S')
  
  doc.setTextColor(...primaryColor)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(recu.numero_recu, 165, 45, { align: 'center' })
  
  doc.setTextColor(...grayColor)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const dateStr = new Date(recu.date_emission).toLocaleDateString('fr-FR')
  doc.text(`Date: ${dateStr}`, 165, 52, { align: 'center' })
  
  // Informations élève
  doc.setFillColor(241, 245, 249)
  doc.rect(20, 75, 170, 35, 'F')
  doc.setDrawColor(203, 213, 225)
  doc.rect(20, 75, 170, 35, 'S')
  
  doc.setTextColor(...textColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('👨‍🎓 INFORMATIONS ÉLÈVE', 25, 85)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const eleve = recu.paiements?.factures?.eleves
  if (eleve) {
    doc.text(`Nom: ${eleve.prenom} ${eleve.nom}`, 25, 95)
    doc.text(`Matricule: ${eleve.matricule || 'Non spécifié'}`, 25, 102)
    doc.text(`Classe: ${eleve.classes?.nom_complet || 'Non spécifiée'}`, 110, 95)
    doc.text(`Facture: ${recu.paiements.factures.numero_facture || '#' + recu.paiements.facture_id}`, 110, 102)
  }
  
  // Détails du paiement
  doc.setFillColor(...primaryColor)
  doc.rect(20, 125, 170, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('💰 DÉTAILS DU PAIEMENT REÇU', 25, 133)
  
  // Mode de paiement
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const modes: Record<string, string> = {
    'especes': 'Espèces',
    'cheque': 'Chèque', 
    'virement': 'Virement bancaire',
    'mobile_money': 'Mobile Money'
  }
  doc.text(`Mode: ${modes[recu.mode_paiement] || recu.mode_paiement}`, 25, 150)
  
  if (recu.paiements?.reference_paiement) {
    doc.text(`Référence: ${recu.paiements.reference_paiement}`, 25, 157)
  }
  
  // Montant - Encadré jaune
  doc.setFillColor(254, 243, 199)
  doc.rect(20, 170, 170, 25, 'F')
  doc.setDrawColor(245, 158, 11)
  doc.setLineWidth(2)
  doc.rect(20, 170, 170, 25, 'S')
  
  doc.setTextColor(146, 64, 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('MONTANT REÇU', 105, 180, { align: 'center' })
  
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  const montantStr = `${recu.montant_recu.toLocaleString('fr-FR')} FCFA`
  doc.text(montantStr, 105, 190, { align: 'center' })
  
  // Notes si présentes
  if (recu.notes) {
    doc.setFillColor(248, 250, 252)
    doc.rect(20, 210, 170, 20, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(20, 210, 170, 20, 'S')
    
    doc.setTextColor(...textColor)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('📝 Notes:', 25, 220)
    
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.text(`"${recu.notes}"`, 25, 227)
  }
  
  // Signatures
  const sigY = recu.notes ? 250 : 230
  doc.setTextColor(...textColor)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Signature élève/Parent', 50, sigY, { align: 'center' })
  doc.text('Cachet et signature école', 160, sigY, { align: 'center' })
  
  // Lignes de signature
  doc.setDrawColor(...grayColor)
  doc.setLineWidth(0.5)
  doc.line(25, sigY - 15, 75, sigY - 15) // Ligne signature élève
  doc.line(135, sigY - 15, 185, sigY - 15) // Ligne signature école
  
  // Pied de page
  doc.setTextColor(...grayColor)
  doc.setFontSize(8)
  doc.text('Ce reçu certifie le paiement des frais scolaires mentionnés ci-dessus.', 105, 280, { align: 'center' })
  doc.text(`Généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} par SAMA ÉCOLE`, 105, 285, { align: 'center' })
  
  return doc.output('blob')
}

// Fonction principale pour générer un PDF de reçu
export async function generateRecuPDF(recu: any, ecole: any): Promise<Blob> {
  try {
    console.log('🧾 Génération PDF reçu:', recu.numero_recu)
    return await generateRecuPDFDirect(recu, ecole)
  } catch (error) {
    console.error('Erreur génération PDF reçu:', error)
    throw new Error('Impossible de générer le PDF du reçu')
  }
}

// Fonction pour générer plusieurs PDFs de reçus
export async function generateMultipleRecusPDF(recus: any[], ecole: any, merged: boolean = false): Promise<Blob | Blob[]> {
  if (merged) {
    // PDF fusionné - Générer un PDF avec tous les reçus
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF('p', 'mm', 'a4')
    
    for (let i = 0; i < recus.length; i++) {
      if (i > 0) doc.addPage()
      
      // Ici on devrait intégrer le contenu de chaque reçu
      // Pour simplifier, on génère une page de couverture
      doc.setFontSize(16)
      doc.text(`Reçu ${i + 1}/${recus.length}: ${recus[i].numero_recu}`, 20, 20)
      doc.setFontSize(12)
      doc.text(`Montant: ${recus[i].montant_recu.toLocaleString()} FCFA`, 20, 35)
    }
    
    return doc.output('blob')
  } else {
    // PDFs séparés
    const pdfPromises = recus.map(recu => generateRecuPDF(recu, ecole))
    return await Promise.all(pdfPromises)
  }
}

/**
 * Utilitaires pour la gestion des PDFs
 */
export const PDFUtils = {
  generateFacturePDF,
  generateMultipleFacturesPDF,
  generateRecuPDF,
  generateMultipleRecusPDF,
  downloadPDF,
  previewPDF,
  generatePDFFromElement
}
