import jsPDF from 'jspdf'

export interface RapportData {
  ecole: {
    nom: string
    adresse?: string
    telephone?: string
    email?: string
  }
  periode: {
    debut: Date
    fin: Date
    libelle: string
  }
  stats: {
    chiffreAffaires: number
    totalPaiements: number
    totalFactures: number
    tauxRecouvrement: number
    impayesTotal: number
    elevesActifs: number
  }
  repartitionParMode: Array<{
    mode: string
    montant: number
    pourcentage: number
  }>
  repartitionParClasse: Array<{
    classe: string
    eleves: number
    revenus: number
  }>
  evolutionMensuelle: Array<{
    mois: string
    revenus: number
    paiements: number
  }>
}

export async function generateRapportPDF(data: RapportData): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF('p', 'mm', 'a4')
  
  // Configuration des couleurs
  const primaryColor = [79, 70, 229] // Indigo
  const textColor = [30, 41, 59] // Slate-800
  const grayColor = [100, 116, 139] // Slate-500
  
  // En-tête
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('RAPPORT FINANCIER', 105, 20, { align: 'center' })
  
  // Informations école
  doc.setTextColor(...textColor)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(data.ecole.nom, 20, 45)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  let yPos = 52
  if (data.ecole.adresse) {
    doc.text(`📍 ${data.ecole.adresse}`, 20, yPos)
    yPos += 5
  }
  if (data.ecole.telephone) {
    doc.text(`📞 ${data.ecole.telephone}`, 20, yPos)
    yPos += 5
  }
  if (data.ecole.email) {
    doc.text(`✉️ ${data.ecole.email}`, 20, yPos)
  }
  
  // Période du rapport
  doc.setFillColor(248, 250, 252)
  doc.rect(120, 40, 70, 25, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.rect(120, 40, 70, 25, 'S')
  
  doc.setTextColor(...primaryColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PÉRIODE', 155, 50, { align: 'center' })
  
  doc.setTextColor(...grayColor)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(data.periode.libelle, 155, 57, { align: 'center' })
  doc.text(`${data.periode.debut.toLocaleDateString('fr-FR')} - ${data.periode.fin.toLocaleDateString('fr-FR')}`, 155, 62, { align: 'center' })
  
  // KPIs principaux
  yPos = 80
  doc.setFillColor(...primaryColor)
  doc.rect(20, yPos, 170, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('📊 INDICATEURS CLÉS', 25, yPos + 8)
  
  yPos += 20
  const kpis = [
    { label: 'Chiffre d\'affaires', valeur: `${data.stats.chiffreAffaires.toLocaleString('fr-FR')} FCFA`, couleur: [34, 197, 94] },
    { label: 'Nombre de paiements', valeur: data.stats.totalPaiements.toString(), couleur: [59, 130, 246] },
    { label: 'Taux de recouvrement', valeur: `${data.stats.tauxRecouvrement.toFixed(1)}%`, couleur: [249, 115, 22] },
    { label: 'Élèves actifs', valeur: data.stats.elevesActifs.toString(), couleur: [168, 85, 247] }
  ]
  
  kpis.forEach((kpi, index) => {
    const x = 20 + (index % 2) * 85
    const y = yPos + Math.floor(index / 2) * 25
    
    doc.setFillColor(248, 250, 252)
    doc.rect(x, y, 80, 20, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(x, y, 80, 20, 'S')
    
    doc.setTextColor(...textColor)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label, x + 5, y + 8)
    
    doc.setTextColor(...kpi.couleur)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.valeur, x + 5, y + 16)
  })
  
  // Répartition par mode de paiement
  yPos += 60
  doc.setTextColor(...textColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('💳 RÉPARTITION PAR MODE DE PAIEMENT', 20, yPos)
  
  yPos += 10
  data.repartitionParMode.forEach((mode, index) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`• ${mode.mode}`, 25, yPos + (index * 6))
    doc.text(`${mode.montant.toLocaleString('fr-FR')} FCFA (${mode.pourcentage.toFixed(1)}%)`, 140, yPos + (index * 6))
  })
  
  // Performance par classe
  yPos += data.repartitionParMode.length * 6 + 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('🎓 PERFORMANCE PAR CLASSE', 20, yPos)
  
  yPos += 10
  data.repartitionParClasse.forEach((classe, index) => {
    if (yPos + (index * 6) > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`• ${classe.classe}`, 25, yPos + (index * 6))
    doc.text(`${classe.eleves} élèves`, 100, yPos + (index * 6))
    doc.text(`${classe.revenus.toLocaleString('fr-FR')} FCFA`, 140, yPos + (index * 6))
  })
  
  // Pied de page
  doc.setTextColor(...grayColor)
  doc.setFontSize(8)
  doc.text('Rapport généré automatiquement par SAMA ÉCOLE', 105, 280, { align: 'center' })
  doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 105, 285, { align: 'center' })
  
  return doc.output('blob')
}

export async function downloadRapportPDF(data: RapportData, filename?: string) {
  try {
    const pdfBlob = await generateRapportPDF(data)
    const url = URL.createObjectURL(pdfBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `rapport_${data.periode.libelle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    console.log('✅ Rapport PDF téléchargé:', link.download)
  } catch (error) {
    console.error('Erreur téléchargement rapport PDF:', error)
    throw error
  }
}

export function formatMontant(montant: number): string {
  return montant.toLocaleString('fr-FR') + ' FCFA'
}

export function formatPourcentage(pourcentage: number): string {
  return pourcentage.toFixed(1) + '%'
}

export function calculerTauxCroissance(actuel: number, precedent: number): number {
  if (precedent === 0) return actuel > 0 ? 100 : 0
  return ((actuel - precedent) / precedent) * 100
}





