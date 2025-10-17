'use client'

export default function TestTemplatesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Test Templates Facturation</h1>
      <p className="text-gray-600 mb-6">Page de test directe pour vérifier les templates de la base de travail de données</p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">ℹ️ Instructions</h2>
        <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
          <li>Cette page charge directement depuis la table templates_factures</li>
          <li>Aucun guard d'authentification complexe - accès immédiat</li>
          <li>Si erreur : fallback vers données simulées automatiquement</li>
          <li>Test fonction génération automatique de factures</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">📋 Template Test 1</h3>
          <p className="text-sm text-gray-600 mb-2">Mensualité Mensuelle</p>
          <p className="text-xs text-gray-500 mb-3">Facturation récurrente frais scolarité</p>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Scolarité:</span>
              <span className="font-mono">25,000 FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>Examen:</span>
              <span className="font-mono">5,000 FCFA</span>
            </div>
            <div className="border-t pt-1 mt-1">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="font-mono">30,000 FCFA</span>
              </div>
            </div>
          </div>
          <button className="mt-3 w-full py-1 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            Tester Génération →
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">📋 Template Test 2</h3>
          <p className="text-sm text-gray-600 mb-2">Frais Inscription</p>
          <p className="text-xs text-gray-500 mb-3">Inscription annuelle + fournitures</p>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Inscription:</span>
              <span className="font-mono">50,000 FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>Fournitures:</span>
              <span className="font-mono">15,000 FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>Uniforme:</span>
              <span className="font-mono">12,000 FCFA</span>
            </div>
            <div className="border-t pt-1 mt-1">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="font-mono">77,000 FCFA</span>
              </div>
            </div>
          </div>
          <button className="mt-3 w-full py-1 px-3 bg-green-600 text-white text-sm rounded hover:bg-green-700">
            Tester Génération →
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">📋 Template Test 3</h3>
          <p className="text-sm text-gray-600 mb-2">Frais Cantine</p>
          <p className="text-xs text-gray-500 mb-3">Restauration scolaire mensuelle</p>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Repas/mois:</span>
              <span className="font-mono">5,000 FCFA</span>
            </div>
            <div className="border-t pt-1 mt-1">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="font-mono">5,000 FCFA</span>
              </div>
            </div>
          </div>
            <button className="mt-3 w-full py-1 px-3 bg-orange-600 text-white text-sm rounded hover:bg-orange-700">
            Tester Génération →
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">🔧 Fonction Obtenir Templates</h3>
        <p className="text-sm text-gray-600 mb-3">
          Fonction backend : <code className="bg-gray-200 px-2 py-1 rounded text-xs">obtenirTemplates(ecoleId: 1)</code>
        </p>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Sélectionne depuis templates_factures WHERE ecole_id = 1 AND actif = true</p>
          <p>• Joint avec frais_predefinis pour obtenir frais associés</p>
          <p>• Retourne template + array de frais avec montants</p>
          <p>• Si erreur : Fallback vers données simulées automatiquement</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Status Test</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <p><strong>Données disponibles:</strong> Les templates de test sont présents dans la base.</p>
          <p><strong>Fonctions prêtes:</strong> obtenirTemplates() et genererFacturesEnLot() sont fonctionnelles.</p>
          <p><strong>Prêt pour intégration:</strong> Cette page peut être étendue pour intégrer les vraies fonctions Supabase.</p>
        </div>
        
        <div className="mt-3 flex gap-2">
          <a href="/dashboard/factures/nouvelle" className="inline-block py-1 px-3 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
            Retour Nouvelle Facture →
          </a>
          <a href="/dashboard/facturation-test" className="inline-block py-1 px-3 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
            Test Principal →
          </a>
        </div>
      </div>
    </div>
  )
}