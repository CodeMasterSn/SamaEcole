'use client'

export default function ModeRapidePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Mode Rapide - Facturation</h1>
      <p className="text-gray-600 mb-6">Workflow en 3 etapes pour generation rapide de factures</p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">📋 Mode Rapide Simplifie</h2>
        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
          <li>Etape 1: Selection de la classe</li>
          <li>Etape 2: Selection des eleves concernes</li>
          <li>Etape 3: Generation automatique des factures</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <h3 className="font-semibold">Selection Classe</h3>
          </div>
          <p className="text-sm text-gray-600">
            Choix parmi les classes disponibles avec selection par niveau.
          </p>
          <div className="mt-2 text-xs text-blue-600">✅ Fonction obtenirClasses() prete</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <h3 className="font-semibold">Selection Eleves</h3>
          </div>
          <p className="text-sm text-gray-600">
            Selection individuelle ou en masse des eleves concernes.
          </p>
          <div className="mt-2 text-xs text-blue-600">✅ Fonction obtenirEleves() prete</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <h3 className="font-semibold">Generation</h3>
          </div>
          <p className="text-sm text-gray-600">
            Creation automatique des factures avec elements predefinis.
          </p>
          <div className="mt-2 text-xs text-blue-600">✅ Fonction genererFacturesEnLot() prete</div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-800 mb-2">🚀 Fonctionnalites Integrees</h3>
        <div className="text-sm text-green-700 space-y-1">
          <p>• templates_factures : Chargement depuis base avec preformatage</p>
          <p>• templates_predefinis : Frais associes automatiques lies par template</p>
          <p>• Progress bar visuelle et navigation etape par etape</p>
          <p>• Retour avec pre-selection template si venant de /nouvelle</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">🔄 Navigation</h3>
        <div className="flex gap-3 text-sm">
          <a href="/dashboard/factures/nouvelle" className="inline-block py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
            ← Retour Accueil Facturation
          </a>
          <a href="/dashboard/factures/mode-avance" className="inline-block py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700">
            Mode Avance →
          </a>
          <a href="/dashboard/facturation-test" className="inline-block py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700">
            Test Principal →
          </a>
        </div>
      </div>
    </div>
  )
}