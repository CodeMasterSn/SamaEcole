import jsPDF from 'jspdf'

function formaterMontant(montant: number): string {
  return montant.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

async function chargerImage(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

export async function genererPDFRecuObjet(recu: any, facture: any, eleve: any, ecole: any) {
  const doc = new jsPDF()
  const couleurPrincipale = ecole.couleur_principale || '#7C3AED'
  const [r, g, b] = couleurPrincipale.match(/\w\w/g)!.map(x => parseInt(x, 16))

  let y = 15

  // Logo
  if (ecole.logo_url) {
    try {
      const logoData = await chargerImage(ecole.logo_url)
      doc.addImage(logoData, 'PNG', 15, y, 25, 25)
    } catch (e) {
      console.error('Logo non chargé')
    }
  }

  // Infos école
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

  // Titre REÇU
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(22, 163, 74) // Vert pour différencier du rouge "facture"
  doc.text('REÇU', 195, 25, { align: 'right' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`N° ${recu.numero_recu}`, 195, 35, { align: 'right' })
  
  const dateGeneration = new Date(recu.date_generation)
  doc.text(`Date: ${dateGeneration.toLocaleDateString('fr-FR')}`, 195, 41, { align: 'right' })
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Heure: ${dateGeneration.toLocaleTimeString('fr-FR')}`, 195, 46, { align: 'right' })

  // Ligne de séparation
  y = ecole.logo_url ? 70 : 55
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)

  // Encadré reçu de
  y += 10
  doc.setFillColor(240, 253, 244) // Vert clair
  doc.rect(15, y, 180, 35, 'F')
  
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(22, 163, 74)
  doc.text('REÇU DE', 20, y)
  
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
  }

  // Détails du paiement
  y += 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(r, g, b)
  doc.text('DÉTAILS DU PAIEMENT', 15, y)

  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  // Tableau
  const lignes = [
    ['Référence facture', facture.numero_facture],
    ['Mode de paiement', recu.mode_paiement || 'Espèces'],
    ['Reçu par', recu.recu_par || 'Caisse'],
  ]

  lignes.forEach(([label, valeur]) => {
    doc.setTextColor(100, 100, 100)
    doc.text(label, 20, y)
    doc.setTextColor(0, 0, 0)
    doc.text(valeur, 100, y)
    y += 7
  })

  // Montant reçu (mis en évidence)
  y += 8
  doc.setDrawColor(22, 163, 74)
  doc.setLineWidth(1)
  doc.line(15, y, 195, y)
  
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(22, 163, 74)
  doc.text('MONTANT REÇU', 100, y)
  doc.text(`${formaterMontant(recu.montant_recu)} FCFA`, 190, y, { align: 'right' })

  // Notes
  if (recu.notes) {
    y += 15
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Notes:', 15, y)
    y += 5
    doc.setTextColor(0, 0, 0)
    doc.text(recu.notes, 15, y, { maxWidth: 175 })
  }

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 15, 280)
  doc.text('Sama École - Système de gestion scolaire', 195, 280, { align: 'right' })

  return doc
}

export async function genererPDFRecu(recu: any, facture: any, eleve: any, ecole: any) {
  const doc = await genererPDFRecuObjet(recu, facture, eleve, ecole)
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'')
  doc.save(`Recu_${eleve.nom}_${dateStr}.pdf`)
}

export async function genererPDFRecuBlob(
  recu: any,
  facture: any,
  eleve: any,
  ecole: any
): Promise<Blob> {
  const doc = await genererPDFRecuObjet(recu, facture, eleve, ecole)
  return doc.output('blob')
}
