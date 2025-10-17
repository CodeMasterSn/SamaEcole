'use client'

interface FactureTemplateProps {
  facture: any
  eleve: any
  ecole: any
  lignes: any[]
  mode?: 'preview' | 'print'
}

export function FactureTemplate({ facture, eleve, ecole, lignes, mode = 'preview' }: FactureTemplateProps) {
  const couleur = ecole.couleur_principale || '#7C3AED'
  
  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* EN-TÊTE */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex gap-4">
          {ecole.logo_url && (
            <img 
              src={ecole.logo_url} 
              alt="Logo" 
              className="w-20 h-20 object-contain" 
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: couleur }}>
              {ecole.nom}
            </h1>
            <p className="text-sm text-gray-600">{ecole.adresse}</p>
            <p className="text-sm text-gray-600">Tél: {ecole.telephone}</p>
            <p className="text-sm text-gray-600">Email: {ecole.email}</p>
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
        <p>Élève: {eleve.nom} {eleve.prenom}</p>
        <p>Matricule: {eleve.matricule}</p>
        {eleve.classe && <p>Classe: {eleve.classe.niveau} {eleve.classe.section}</p>}
        
        {eleve.parents && (
          <div className="mt-2 text-gray-600">
            <p className="text-sm">Parent/Tuteur:</p>
            <p>{eleve.parents.nom} {eleve.parents.prenom}</p>
            {eleve.parents.telephone && <p>Tél: {eleve.parents.telephone}</p>}
          </div>
        )}
      </div>

      {/* TABLEAU */}
      <div className="mb-8">
        <h3 className="font-bold mb-4" style={{ color: couleur }}>DÉTAIL DES FRAIS</h3>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: couleur, color: 'white' }}>
              <th className="text-left p-2">DÉSIGNATION</th>
              <th className="text-center p-2 w-20">QTÉ</th>
              <th className="text-right p-2 w-32">TARIF</th>
              <th className="text-right p-2 w-32">MONTANT</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="p-2">{ligne.designation}</td>
                <td className="text-center p-2">{ligne.quantite}</td>
                <td className="text-right p-2">{(ligne.tarif || ligne.prix_unitaire).toLocaleString('fr-FR').replace(/\s/g, ' ')} FCFA</td>
                <td className="text-right p-2 font-semibold">{ligne.montant.toLocaleString('fr-FR').replace(/\s/g, ' ')} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTAL */}
      <div className="flex justify-end mb-8">
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: couleur }}>
            TOTAL À PAYER: {facture.montant_total.toLocaleString('fr-FR').replace(/\s/g, ' ')} FCFA
          </p>
        </div>
      </div>

      {/* STATUT */}
      <div className="mb-4">
        <span className={`font-semibold ${facture.statut === 'payee' ? 'text-green-600' : 'text-red-600'}`}>
          État: {facture.statut === 'payee' ? 'PAYÉ' : 'IMPAYÉ'}
        </span>
        <p className="text-sm mt-2">
          Date limite: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* PAIEMENT */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2" style={{ color: couleur }}>MOYENS DE PAIEMENT</h4>
        <p className="text-sm text-gray-600">
          Wave, Orange Money, Free Money, virement bancaire, cash à la caisse
        </p>
        <p className="text-xs mt-2" style={{ color: couleur }}>
          Référence à mentionner: {facture.numero_facture}
        </p>
      </div>

      {/* FOOTER */}
      <div className="mt-8 text-xs text-gray-400 text-center">
        <p>Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
        <p>Sama École - Système de gestion scolaire</p>
      </div>
    </div>
  )
}
