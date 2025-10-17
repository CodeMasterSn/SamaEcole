'use client'

interface FacturePreviewProps {
  facture: any
  eleve: any
  ecole: any
  lignes: any[]
}

export function FacturePreview({ facture, eleve, ecole, lignes }: FacturePreviewProps) {
  const couleur = ecole?.couleur_principale || '#7C3AED'
  
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* EN-TÊTE */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col items-start">
          {ecole?.logo_url && (
            <img 
              src={ecole.logo_url} 
              alt="Logo" 
              className="w-20 h-20 object-contain mb-3" 
            />
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: couleur }}>
              {ecole?.nom || 'École'}
            </h1>
            <p className="text-xs text-gray-600">{ecole?.adresse}</p>
            <p className="text-xs text-gray-600">Tél: {ecole?.telephone}</p>
            <p className="text-xs text-gray-600">Email: {ecole?.email}</p>
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-3xl font-bold" style={{ color: couleur }}>FACTURE</h2>
          <p className="text-sm mt-2">N° {facture.numero_facture}</p>
          <p className="text-sm">Date: {new Date(facture.date_emission).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* CLIENT */}
      <div className="mb-8">
        <h3 className="font-bold mb-2" style={{ color: couleur }}>FACTURÉ À</h3>
        
        {/* Bloc aligné avec padding-left */}
        <div className="pl-4">
          <p>Élève: {eleve?.nom} {eleve?.prenom}</p>
          <p>Matricule: {eleve?.matricule}</p>
          {eleve?.classe && <p>Classe: {eleve.classe.niveau} {eleve.classe.section}</p>}
          
          {eleve?.parents && (
            <div className="mt-2 text-gray-600">
              <p className="text-sm">Parent/Tuteur:</p>
              <p>{eleve.parents.nom} {eleve.parents.prenom}</p>
              {eleve.parents.telephone && <p>Tél: {eleve.parents.telephone}</p>}
            </div>
          )}
        </div>
      </div>

      {/* TABLEAU */}
      <div className="mb-8">
        <h3 className="font-bold mb-4" style={{ color: couleur }}>DÉTAIL DES FRAIS</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: couleur, color: 'white' }}>
              <th className="text-left p-3 border">DÉSIGNATION</th>
              <th className="text-center p-3 border w-20">QTÉ</th>
              <th className="text-right p-3 border w-32">TARIF</th>
              <th className="text-right p-3 border w-32">MONTANT</th>
            </tr>
          </thead>
          <tbody>
            {lignes?.map((ligne, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="p-3 border">{ligne.designation}</td>
                <td className="text-center p-3 border">{ligne.quantite}</td>
                <td className="text-right p-3 border">{(ligne.tarif || ligne.prix_unitaire).toLocaleString('fr-FR')} FCFA</td>
                <td className="text-right p-3 border font-semibold">{ligne.montant.toLocaleString('fr-FR')} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTAL */}
      <div className="flex justify-between items-center border-t-2 pt-4 mb-8" style={{ borderColor: couleur }}>
        <span className="text-lg font-semibold" style={{ color: couleur }}>
          TOTAL À PAYER
        </span>
        <span className="text-2xl font-bold" style={{ color: couleur }}>
          {facture.montant_total.toLocaleString('fr-FR')} FCFA
        </span>
      </div>

      {/* STATUT */}
      <div className="mb-6">
        <span className={`font-semibold text-lg ${facture.statut === 'payee' ? 'text-green-600' : 'text-red-600'}`}>
          État: {facture.statut === 'payee' ? 'PAYÉ' : 'IMPAYÉ'}
        </span>
        <p className="text-sm mt-2">
          Date limite: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* PAIEMENT */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2" style={{ color: couleur }}>MOYENS DE PAIEMENT</h4>
        <p className="text-sm text-gray-600 mb-2">
          Wave, Orange Money, Free Money, virement bancaire, cash à la caisse
        </p>
        <p className="text-xs font-mono" style={{ color: couleur }}>
          Référence: {facture.numero_facture}
        </p>
      </div>

      {/* FOOTER */}
      <div className="mt-8 text-xs text-gray-400 text-center border-t pt-4">
        <p>Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
        <p>Sama École - Système de gestion scolaire</p>
      </div>
    </div>
  )
}
