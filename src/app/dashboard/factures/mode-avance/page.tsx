'use client'

export default function ModeAvancePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Mode Avance - Facturation Personnalisee</h1>
      <p className="text-gray-600 mb-6">Interface split-screen avec previsualisation temps reel</p>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-purple-800 mb-2">🎨 Mode Avance Simplifie</h2>
        <div className="text-purple-700 text-sm space-y-1">
          <p>• Interface gauche: Formulaire de saisie des factures</p>
          <p>• Interface droite: Apercu en temps reel</p>
          <p>• Sauvegarde automatique en brouillon</p>
          <p>• Generation de factures avec elements personnalises</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">📝 Formulaire de Saisie</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-sm font-medium mb-2">Selection Eleves</h4>
              <p className="text-xs text-gray-600">Choix individuel ou multiselection</p>
              <div className="text-xs text-blue-600 mt-1">✅ Recherche et filtrage implantes</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-sm font-medium mb-2">Elements de Facture</h4>
              <p className="text-xs text-gray-600">Ajout/suppression/modification elements</p>
              <div className="text-xs text-blue-600 mt-1">✅ Calculs automatiques totaux</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-sm font-medium mb-2">Informations Supplementaires</h4>
              <p className="text-xs text-gray-600">Notes, conditions particuliere</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">👀 Previsualisation Temps Reel</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="text-sm font-medium mb-2">Format Facture</h4>
              <p className="text-xs text-gray-600">Apercu conforme a la structure factures</p>
            </div>
            
            <div className="bg-green-50 p-3 rounded">
              <h4 className="text-sm font-medium mb-2">Calculs Automatiques</h4>
              <p className="text-xs text-gray-600">Totaux, sous-totaux, montants</p>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded">
              <h4 className="text-sm font-medium mb-2">Informations Completes</h4>
              <p className="text-xs text-gray-600">Donnees eleve, elements, date</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-800 mb-2">🚀 Fonctions Integrees</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <strong>creerFactureAvecElements()</strong><br/>
            <span className="text-gray-600">Cree facture avec elements</span>
          </div>
          <div>
            <strong>sauvegarderBrouillonTemplate()</strong><br/>
            <span className="text-gray-600">Sauvegarde brouillons</span>
          </div>
          <div>
            <strong>obtenirEleves(classeId)</strong><br/>
            <span className="text-gray-600">Liste eleves filtres</span>
          </div>
          <div>
            <strong>obtenirClasses(ecoleId)</strong><br/>
            <span className="text-gray-600">Liste classes disponibles</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">🔄 Navigation et Actions</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="/dashboard/factures/nouvelle" className="inline-block py-2 px-3 bg-blue-600 text-white rounded hover:bg-blue-700">
            ← Accueil Facturation
          </a>
          <a href="/dashboard/factures/mode-rapide" className="inline-block py-2 px-3 bg-green-600 text-white rounded hover:bg-green-700">
            Mode Rapide →
          </a>
          <button className="inline-block py-2 px-3 bg-purple-600 text-white rounded hover:bg-purple-700">
            💾 Sauvegarder Brouillon
          </button>
          <button className="inline-block py-2 px-3 bg-orange-600 text-white rounded hover:bg-orange-700">
            📄 Generer Facture
          </button>
        </div>
      </div>
    </div>
  )
}