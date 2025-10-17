// Utilitaires pour l'export Excel
// Note: Pour une vraie implémentation, il faudrait installer xlsx ou exceljs
// Ici nous simulons avec des CSVs qui s'ouvrent dans Excel

export interface ExcelData {
  headers: string[]
  rows: (string | number)[][]
  filename: string
}

export function exportToCSV(data: ExcelData) {
  try {
    // Créer le contenu CSV
    const csvContent = [
      // Headers
      data.headers.join(','),
      // Rows
      ...data.rows.map(row => 
        row.map(cell => {
          // Échapper les virgules et guillemets
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        }).join(',')
      )
    ].join('\n')

    // Créer le blob avec BOM pour UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // Télécharger
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', data.filename.endsWith('.csv') ? data.filename : `${data.filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('✅ Export CSV réussi:', data.filename)
  } catch (error) {
    console.error('Erreur export CSV:', error)
    throw new Error('Erreur lors de l\'export CSV')
  }
}

export function exportRapportFinancier(stats: any, periode: string) {
  const data: ExcelData = {
    headers: [
      'Indicateur',
      'Valeur',
      'Unité',
      'Période'
    ],
    rows: [
      ['Chiffre d\'affaires', stats.chiffreAffaires, 'FCFA', periode],
      ['Total paiements', stats.totalPaiements, 'Nombre', periode],
      ['Total factures', stats.totalFactures, 'Nombre', periode],
      ['Total reçus', stats.totalRecus, 'Nombre', periode],
      ['Impayés', stats.impayesTotal, 'FCFA', periode],
      ['Taux de recouvrement', stats.tauxRecouvrement.toFixed(2), '%', periode],
      ['Élèves actifs', stats.elevesActifs, 'Nombre', periode],
      ['Élèves suspendus', stats.elevesSuspendus, 'Nombre', periode],
      ['Nouvelles inscriptions', stats.nouvellesInscriptions, 'Nombre', periode]
    ],
    filename: `rapport_financier_${periode.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
  }
  
  exportToCSV(data)
}

export function exportRepartitionParMode(repartitionParMode: any[], periode: string) {
  const data: ExcelData = {
    headers: [
      'Mode de paiement',
      'Montant (FCFA)',
      'Pourcentage (%)',
      'Période'
    ],
    rows: repartitionParMode.map(mode => [
      mode.mode,
      mode.montant,
      mode.pourcentage.toFixed(2),
      periode
    ]),
    filename: `repartition_modes_paiement_${periode.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
  }
  
  exportToCSV(data)
}

export function exportRepartitionParClasse(repartitionParClasse: any[], periode: string) {
  const data: ExcelData = {
    headers: [
      'Classe',
      'Nombre d\'élèves',
      'Revenus (FCFA)',
      'Moyenne par élève (FCFA)',
      'Période'
    ],
    rows: repartitionParClasse.map(classe => [
      classe.classe,
      classe.eleves,
      classe.revenus,
      classe.eleves > 0 ? Math.round(classe.revenus / classe.eleves) : 0,
      periode
    ]),
    filename: `performance_par_classe_${periode.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
  }
  
  exportToCSV(data)
}

export function exportEvolutionMensuelle(evolutionMensuelle: any[]) {
  const data: ExcelData = {
    headers: [
      'Mois',
      'Revenus (FCFA)',
      'Nombre de paiements'
    ],
    rows: evolutionMensuelle.map(mois => [
      mois.mois,
      mois.revenus,
      mois.paiements
    ]),
    filename: `evolution_mensuelle_${new Date().toISOString().split('T')[0]}`
  }
  
  exportToCSV(data)
}





