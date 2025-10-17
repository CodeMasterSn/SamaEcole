import jsPDF from 'jspdf'

/**
 * Génère un PDF de facture et retourne le Blob (pour upload)
 */
export async function genererPDFFactureBlob(
  facture: any, 
  eleve: any, 
  ecole: any, 
  lignes: any[]
): Promise<Blob> {
  const doc = new jsPDF()
  const couleurPrincipale = ecole.couleur_principale || '#7C3AED'
  const [r, g, b] = couleurPrincipale.match(/\w\w/g)!.map(x => parseInt(x, 16))

  // ============ LOGO EN HAUT ============
  let y = 15
  
  if (ecole.logo_url) {
    try {
      const logoData = await chargerImage(ecole.logo_url)
      if (logoData) {
        doc.addImage(logoData, 'PNG', 15, y, 25, 25)
      }
    } catch (e) {
      console.error('Logo non chargé')
    }
  }

  // ============ INFOS ÉCOLE EN DESSOUS DU LOGO ============
  y = ecole.logo_url ? 45 : 20
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(r, g, b)
  doc.text(ecole.nom || 'École', 15, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(ecole.adresse || '', 15, y + 6)
  doc.text(`Tél: ${ecole.telephone || ''}`, 15, y + 11)
  doc.text(`Email: ${ecole.email || 'contact@ecolesenegalaise.sn'}`, 15, y + 16)

  // ============ TITRE FACTURE À DROITE ============
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(r, g, b) // Même couleur que les autres éléments
  doc.text('FACTURE', 195, 25, { align: 'right' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`N° ${facture.numero_facture}`, 195, 35, { align: 'right' })
  
  const dateEmission = new Date(facture.date_emission)
  doc.text(`Date: ${dateEmission.toLocaleDateString('fr-FR')}`, 195, 41, { align: 'right' })
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Heure: ${dateEmission.toLocaleTimeString('fr-FR')}`, 195, 46, { align: 'right' })

  // ============ LIGNE DE SÉPARATION ============
  y = ecole.logo_url ? 70 : 55
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)

  // ============ ENCADRÉ FACTURÉ À ============
  y += 10
  doc.setFillColor(248, 250, 252) // Gris très clair
  doc.rect(15, y, 180, 35, 'F')
  
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text('FACTURÉ À', 20, y)
  
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`${eleve.nom} ${eleve.prenom}`, 20, y)
  
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Matricule: ${eleve.matricule}`, 20, y)
  
  y += 5
  if (eleve.classe) {
    doc.text(`Classe: ${eleve.classe.niveau} ${eleve.classe.section}`, 20, y)
    y += 5
  }
  
  // Ajouter les informations parent/tuteur si disponibles
  if (eleve.parents) {
    doc.text(`Parent/Tuteur: ${eleve.parents.nom} ${eleve.parents.prenom}`, 20, y)
    y += 5
    if (eleve.parents.telephone) {
      doc.text(`Tél: ${eleve.parents.telephone}`, 20, y)
    }
  }

  // ============ TABLEAU DES LIGNES ============
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(r, g, b)
  doc.text('DÉTAIL DE LA FACTURE', 15, y)

  y += 10
  // En-têtes du tableau
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Désignation', 15, y)
  doc.text('Qté', 100, y)
  doc.text('Tarif', 130, y)
  doc.text('Montant', 190, y, { align: 'right' })

  // Ligne de séparation
  y += 3
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(15, y, 195, y)

  // Lignes de la facture
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)

  lignes.forEach((ligne, index) => {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    const designation = ligne.designation || ligne.description || ligne.nom || 'Frais scolaire'
    const quantite = ligne.quantite || 1
    const tarif = ligne.tarif || ligne.prix_unitaire || 0
    const montant = ligne.montant || ligne.total || 0
    
    doc.text(designation, 15, y)
    doc.text(`${quantite}`, 100, y)
    doc.text(`${tarif.toLocaleString('fr-FR').replace(/\s/g, '.')} FCFA`, 130, y)
    doc.text(`${montant.toLocaleString('fr-FR').replace(/\s/g, '.')} FCFA`, 190, y, { align: 'right' })
    y += 8
  })

  // ============ TOTAL À PAYER ============
  y += 10
  
  // Ligne de séparation avant total
  doc.setDrawColor(139, 92, 246) // Violet
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)
  y += 10

  // Total avec fond violet clair
  doc.setFillColor(245, 243, 255) // Violet très clair
  doc.rect(15, y - 5, 180, 15, 'F')

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(139, 92, 246) // Violet
  doc.text('TOTAL À PAYER', 20, y)

  doc.setTextColor(139, 92, 246)
  doc.text(`${formaterMontant(facture.montant_total)} FCFA`, 195, y, { align: 'right' })
  y += 15

  // ============ ÉTAT DE PAIEMENT ============
  y += 5
  
  // État avec couleur conditionnelle
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')

  const statut = facture.statut || 'EN_ATTENTE'
  if (statut === 'PAYE' || statut === 'payee') {
    doc.setTextColor(34, 197, 94) // Vert
    doc.text('État: PAYÉ', 20, y)
  } else {
    doc.setTextColor(239, 68, 68) // Rouge
    doc.text('État: IMPAYÉ', 20, y)
  }

  // Date limite en noir
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  y += 7
  if (facture.date_echeance) {
    const dateEcheance = new Date(facture.date_echeance).toLocaleDateString('fr-FR')
    doc.text(`Date limite: ${dateEcheance}`, 20, y)
  }
  y += 15

  // ============ MOYENS DE PAIEMENT ============
  // Ligne de séparation
  doc.setDrawColor(200, 200, 200)
  doc.line(15, y, 195, y)
  y += 10

  // Titre section moyens de paiement
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(139, 92, 246) // Violet
  doc.text('MOYENS DE PAIEMENT', 20, y)
  y += 7

  // Liste des moyens
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100) // Gris
  const moyensPaiement = 'Wave, Orange Money, Free Money, virement bancaire, espèces'
  doc.text(moyensPaiement, 20, y)
  y += 10

  // Référence en violet
  doc.setFontSize(9)
  doc.setTextColor(139, 92, 246)
  doc.text(`Référence: ${facture.numero_facture}`, 20, y)

  // ============ FOOTER ============
  y += 5
  
  // Footer centré comme dans l'aperçu
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128) // #6b7280 - gris clair
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, y, { align: 'center' })
  
  y += 5
  doc.setFontSize(7)
  doc.text('Sama École - Système de gestion scolaire', 105, y, { align: 'center' })

  // Retourner le blob au lieu de sauvegarder
  return doc.output('blob')
}

// Fonction pour formater les nombres correctement
function formaterMontant(montant: number | null | undefined): string {
  const valeur = montant ?? 0 // Utilise 0 si null ou undefined
  return valeur.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).replace(/\s/g, '.') // Remplace les espaces par des points
}

// Fonction pour charger une image depuis URL
async function chargerImage(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Erreur chargement logo:', error)
    return ''
  }
}

export async function genererPDFFacture(facture: any, eleve: any, ecole: any, lignes: any[]) {
  const doc = new jsPDF()
  const couleurPrincipale = ecole.couleur_principale || '#7C3AED'
  const [r, g, b] = couleurPrincipale.match(/\w\w/g)!.map(x => parseInt(x, 16))

  // ============ LOGO EN HAUT ============
  let y = 15
  
  if (ecole.logo_url) {
    try {
      const logoData = await chargerImage(ecole.logo_url)
      if (logoData) {
        doc.addImage(logoData, 'PNG', 15, y, 25, 25)
      }
    } catch (e) {
      console.error('Logo non chargé')
    }
  }

  // ============ INFOS ÉCOLE EN DESSOUS DU LOGO ============
  y = ecole.logo_url ? 45 : 20
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(r, g, b)
  doc.text(ecole.nom || 'École', 15, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(ecole.adresse || '', 15, y + 6)
  doc.text(`Tél: ${ecole.telephone || ''}`, 15, y + 11)
  doc.text(`Email: ${ecole.email || ''}`, 15, y + 16)

  // ============ TITRE FACTURE À DROITE ============
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(r, g, b)
  doc.text('FACTURE', 195, 25, { align: 'right' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`N° ${facture.numero_facture}`, 195, 35, { align: 'right' })
  doc.text(`Date: ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}`, 195, 41, { align: 'right' })

  // ============ LIGNE DE SÉPARATION ============
  y = ecole.logo_url ? 70 : 55
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)

  // ============ SECTION FACTURÉ À (ENCADRÉ) ============
  y += 10
  
  doc.setFillColor(245, 247, 250)
  doc.rect(15, y, 90, 45, 'F')
  
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(r, g, b)
  doc.text('FACTURÉ À', 20, y)
  
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`${eleve.nom} ${eleve.prenom}`, 20, y)
  
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Matricule: ${eleve.matricule}`, 20, y)
  
  y += 5
  if (eleve.classe) {
    doc.text(`Classe: ${eleve.classe.niveau} ${eleve.classe.section}`, 20, y)
    y += 5
  }
  
  if (eleve.parents) {
    y += 3
    doc.setFontSize(8)
    doc.text('Parent/Tuteur:', 20, y)
    y += 4
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text(`${eleve.parents.nom} ${eleve.parents.prenom}`, 20, y)
    y += 4
    if (eleve.parents.telephone) {
      doc.setTextColor(100, 100, 100)
      doc.text(`Tél: ${eleve.parents.telephone}`, 20, y)
    }
  }

  // ============ TABLEAU DES FRAIS ============
  y = ecole.logo_url ? 130 : 115
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(r, g, b)
  doc.text('DÉTAIL DES FRAIS', 15, y)
  
  y += 8

  doc.setFillColor(r, g, b)
  doc.rect(15, y, 180, 10, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('DÉSIGNATION', 20, y + 6)
  doc.text('QTÉ', 130, y + 6, { align: 'center' })
  doc.text('TARIF', 155, y + 6, { align: 'center' })
  doc.text('MONTANT', 190, y + 6, { align: 'right' })

  y += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  lignes.forEach((ligne, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(15, y - 3, 180, 9, 'F')
    }
    
    doc.text(ligne.designation, 20, y + 3)
    doc.text(ligne.quantite.toString(), 130, y + 3, { align: 'center' })
    doc.text(`${formaterMontant(ligne.tarif || ligne.prix_unitaire)} FCFA`, 155, y + 3, { align: 'center' })
    doc.text(`${formaterMontant(ligne.montant)} FCFA`, 190, y + 3, { align: 'right' })
    
    y += 9
  })

  y += 5
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(1)
  doc.line(15, y, 195, y)
  
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(r, g, b)
  doc.text('TOTAL À PAYER', 20, y) // Complètement à gauche
  doc.text(`${formaterMontant(facture.montant_total)} FCFA`, 190, y, { align: 'right' })

  y += 12
  
  const statutColor = facture.statut === 'payee' ? [22, 163, 74] : [239, 68, 68]
  doc.setFontSize(11)
  doc.setTextColor(...statutColor)
  doc.setFont('helvetica', 'bold')
  doc.text(`État: ${facture.statut === 'payee' ? 'PAYÉ' : 'IMPAYÉ'}`, 15, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Date limite: ${new Date(facture.date_echeance).toLocaleDateString('fr-FR')}`, 15, y + 6)

  y += 15
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(r, g, b)
  doc.text('MOYENS DE PAIEMENT', 15, y)
  
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text('Wave, Orange Money, Free Money, virement bancaire, espèces', 15, y)
  
  y += 6
  doc.setFontSize(8)
  doc.setTextColor(r, g, b)
  doc.text(`Référence: ${facture.numero_facture}`, 15, y)

  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, 280)
  doc.text('Sama École - Système de gestion scolaire', 195, 280, { align: 'right' })

  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'')
  doc.save(`Facture_${eleve.nom}_${dateStr}.pdf`)
}



