'use client'

import { useEcoleClient } from '@/hooks/useEcoleClient'
import { useEcole } from '@/hooks/useEcole'
import { useState } from 'react'

export default function TestRLSPage() {
  const { ecoleActive, isLoading } = useEcole()
  const getClient = useEcoleClient()
  const [resultats, setResultats] = useState<any>(null)
  const [chargement, setChargement] = useState(false)

  const testerIsolation = async () => {
    setChargement(true)
    try {
      const client = await getClient()
      
      console.log('====================================')
      console.log('🔍 École active:', ecoleActive?.id, ecoleActive?.nom)
      console.log('====================================')
      
      // Test 1 : Charger les élèves
      const { data: eleves, error: errEleves } = await client
        .from('eleves')
        .select('id, nom, prenom, ecole_id')
        .limit(10)
      
      console.log('📊 Élèves chargés:', eleves?.length || 0)
      console.log('📋 Données élèves:', eleves)
      console.log('❌ Erreur élèves:', errEleves)
      
      // Test 2 : Charger les classes
      const { data: classes, error: errClasses } = await client
        .from('classes')
        .select('id, niveau, section, ecole_id')
      
      console.log('📊 Classes chargées:', classes?.length || 0)
      console.log('📋 Données classes:', classes)
      console.log('❌ Erreur classes:', errClasses)
      
      // Test 3 : Charger les factures
      const { data: factures, error: errFactures } = await client
        .from('factures')
        .select('id, numero, montant_total, eleve_id')
        .limit(5)
      
      console.log('📊 Factures chargées:', factures?.length || 0)
      console.log('❌ Erreur factures:', errFactures)
      
      console.log('====================================')
      
      setResultats({
        ecoleId: ecoleActive?.id,
        ecoleNom: ecoleActive?.nom,
        nbEleves: eleves?.length || 0,
        nbClasses: classes?.length || 0,
        nbFactures: factures?.length || 0,
        eleves: eleves,
        classes: classes,
        factures: factures,
        erreurs: {
          eleves: errEleves,
          classes: errClasses,
          factures: errFactures
        }
      })
      
    } catch (error) {
      console.error('💥 ERREUR CRITIQUE:', error)
      alert('Erreur : ' + (error as Error).message)
    } finally {
      setChargement(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Chargement du contexte école...</div>
      </div>
    )
  }

  if (!ecoleActive) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">❌ Aucune école active trouvée</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🧪 Test RLS - Isolation École</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">École active :</h2>
        <p className="text-lg">{ecoleActive.nom}</p>
        <p className="text-sm text-gray-600">ID : {ecoleActive.id}</p>
      </div>
      
      <button
        onClick={testerIsolation}
        disabled={chargement}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {chargement ? '⏳ Test en cours...' : '🚀 Lancer le test'}
      </button>
      
      {resultats && (
        <div className="mt-6 space-y-4">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-xl mb-4">📊 Résultats</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">Élèves</p>
                <p className="text-2xl font-bold text-green-700">{resultats.nbEleves}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Classes</p>
                <p className="text-2xl font-bold text-blue-700">{resultats.nbClasses}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">Factures</p>
                <p className="text-2xl font-bold text-purple-700">{resultats.nbFactures}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              École testée : <strong>{resultats.ecoleNom}</strong> (ID: {resultats.ecoleId})
            </p>
          </div>
          
          {/* Affichage des erreurs */}
          {(resultats.erreurs.eleves || resultats.erreurs.classes || resultats.erreurs.factures) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">❌ Erreurs détectées :</h4>
              {resultats.erreurs.eleves && (
                <p className="text-sm text-red-700 mb-1">
                  Élèves : {resultats.erreurs.eleves.message}
                </p>
              )}
              {resultats.erreurs.classes && (
                <p className="text-sm text-red-700 mb-1">
                  Classes : {resultats.erreurs.classes.message}
                </p>
              )}
              {resultats.erreurs.factures && (
                <p className="text-sm text-red-700">
                  Factures : {resultats.erreurs.factures.message}
                </p>
              )}
            </div>
          )}
          
          {/* Données détaillées */}
          <details className="bg-gray-50 border rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              🔍 Voir les données brutes (JSON)
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Élèves :</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-60">
                  {JSON.stringify(resultats.eleves, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Classes :</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-60">
                  {JSON.stringify(resultats.classes, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Factures :</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-60">
                  {JSON.stringify(resultats.factures, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}
      
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">ℹ️ Instructions :</h4>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Cliquez sur "Lancer le test"</li>
          <li>Ouvrez la console du navigateur (F12)</li>
          <li>Vérifiez que les données affichées correspondent à l'école active</li>
          <li>Assurez-vous qu'il n'y a pas d'erreurs</li>
        </ol>
      </div>
    </div>
  )
}
