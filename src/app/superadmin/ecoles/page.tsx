'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Ecole {
  id: number
  nom: string
  email: string
  telephone: string
  adresse: string
  statut: string
  type_compte: string
  created_at: string
  nb_eleves: number
  nb_utilisateurs: number
  notes_admin?: string
}

export default function EcolesPage() {
  const [ecoles, setEcoles] = useState<Ecole[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [ecoleSelectionnee, setEcoleSelectionnee] = useState<Ecole | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [actionEnCours, setActionEnCours] = useState<{ecoleId: number, action: string, ecoleNom: string} | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    chargerEcoles()
  }, [])

  const chargerEcoles = async () => {
    const client = supabase
    
    let query = client
      .from('ecoles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filtreStatut !== 'tous') {
      query = query.eq('statut', filtreStatut)
    }
    
    const { data } = await query
    
    // Enrichir avec nb élèves et utilisateurs
    const ecolesEnrichies = await Promise.all(
      (data || []).map(async (ecole) => {
        const { count: nbEleves } = await client
          .from('eleves')
          .select('*', { count: 'exact', head: true })
          .eq('ecole_id', ecole.id)
        
        return {
          ...ecole,
          nb_eleves: nbEleves || 0,
          nb_utilisateurs: 0 // TODO: compter utilisateurs quand table créée
        }
      })
    )
    
    setEcoles(ecolesEnrichies)
    setLoading(false)
  }

  const demanderConfirmation = (ecoleId: number, nouveauStatut: string, ecoleNom: string) => {
    setActionEnCours({ ecoleId, action: nouveauStatut, ecoleNom })
    setShowConfirmModal(true)
  }

  const afficherNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 8000)
  }

  const confirmerAction = async () => {
    if (!actionEnCours) return
    
    const { ecoleId, action: nouveauStatut } = actionEnCours
    setShowConfirmModal(false)
    
    const client = supabase
    
    const { error } = await client
      .from('ecoles')
      .update({ 
        statut: nouveauStatut,
        updated_at: new Date().toISOString()
      })
      .eq('id', ecoleId)
    
    if (error) {
      afficherNotification('error', 'Erreur: ' + error.message)
      console.error('Erreur changement statut:', error)
    } else {
      afficherNotification('success', `École ${nouveauStatut === 'bloque' ? 'bloquée' : 'activée'} avec succès`)
      await chargerEcoles() // Recharger la liste
    }
    
    setActionEnCours(null)
  }

  const annulerAction = () => {
    setShowConfirmModal(false)
    setActionEnCours(null)
  }

  const voirDetails = (ecole: Ecole) => {
    setEcoleSelectionnee(ecole)
    setShowModal(true)
  }

  const getStatutBadge = (statut: string) => {
    const config = {
      actif: { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢' },
      demo: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🟠' },
      suspendu: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡' },
      bloque: { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴' }
    }
    const c = config[statut as keyof typeof config] || config.actif
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${c.bg} ${c.text}`}>
        <span>{c.icon}</span>
        {statut}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Écoles</h1>
          <p className="text-gray-600 mt-2">
            {ecoles.length} école(s) sur la plateforme
          </p>
        </div>
        
        {/* Filtres */}
        <div className="flex gap-2">
          {['tous', 'actif', 'demo', 'suspendu', 'bloque'].map((statut) => (
            <button
              key={statut}
              onClick={() => {
                setFiltreStatut(statut)
                setLoading(true)
                chargerEcoles()
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtreStatut === statut
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              {statut === 'tous' ? 'Tous' : statut}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                École
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Élèves
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date création
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ecoles.map((ecole) => (
              <tr key={ecole.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{ecole.nom}</div>
                  <div className="text-sm text-gray-500">{ecole.adresse}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{ecole.email}</div>
                  <div className="text-sm text-gray-500">{ecole.telephone}</div>
                </td>
                <td className="px-6 py-4">
                  {getStatutBadge(ecole.statut)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{ecole.type_compte}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{ecole.nb_eleves}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(ecole.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {ecole.statut === 'actif' ? (
                      <button
                        onClick={() => demanderConfirmation(ecole.id, 'bloque', ecole.nom)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        🔒 Bloquer
                      </button>
                    ) : (
                      <button
                        onClick={() => demanderConfirmation(ecole.id, 'actif', ecole.nom)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        🔓 Activer
                      </button>
                    )}
                    <button
                      onClick={() => voirDetails(ecole)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      👁️ Voir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal détails école */}
      {showModal && ecoleSelectionnee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{ecoleSelectionnee.nom}</h2>
                  <p className="text-red-100 text-sm mt-1">ID: {ecoleSelectionnee.id}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  📍 Informations générales
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{ecoleSelectionnee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-medium">{ecoleSelectionnee.telephone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="font-medium">{ecoleSelectionnee.adresse}</p>
                  </div>
                </div>
              </div>

              {/* Statut & Type */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  ⚙️ Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <div className="mt-1">{getStatutBadge(ecoleSelectionnee.statut)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type de compte</p>
                    <p className="font-medium capitalize">{ecoleSelectionnee.type_compte}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Date de création</p>
                    <p className="font-medium">
                      {new Date(ecoleSelectionnee.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  📊 Statistiques
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Élèves</p>
                    <p className="text-2xl font-bold text-blue-700">{ecoleSelectionnee.nb_eleves}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Utilisateurs</p>
                    <p className="text-2xl font-bold text-purple-700">{ecoleSelectionnee.nb_utilisateurs}</p>
                  </div>
                </div>
              </div>

              {/* Notes admin si existantes */}
              {ecoleSelectionnee.notes_admin && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    📝 Notes administrateur
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{ecoleSelectionnee.notes_admin}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer avec actions */}
            <div className="border-t p-6 bg-gray-50 rounded-b-xl flex gap-3">
              {ecoleSelectionnee.statut === 'actif' ? (
                <button
                  onClick={() => {
                    setShowModal(false)
                    demanderConfirmation(ecoleSelectionnee.id, 'bloque', ecoleSelectionnee.nom)
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium"
                >
                  🔒 Bloquer cette école
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowModal(false)
                    demanderConfirmation(ecoleSelectionnee.id, 'actif', ecoleSelectionnee.nom)
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                >
                  🔓 Activer cette école
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirmModal && actionEnCours && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className={`p-6 rounded-t-xl ${actionEnCours.action === 'bloque' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {actionEnCours.action === 'bloque' ? '🔒' : '🔓'}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {actionEnCours.action === 'bloque' ? 'Bloquer l\'école' : 'Activer l\'école'}
                  </h2>
                  <p className="text-sm opacity-90 mt-1">
                    {actionEnCours.action === 'bloque' ? 'Cette action empêchera l\'accès à la plateforme' : 'Cette action rétablira l\'accès à la plateforme'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Êtes-vous sûr de vouloir <strong>{actionEnCours.action === 'bloque' ? 'bloquer' : 'activer'}</strong> l\'école :
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-semibold text-gray-900">{actionEnCours.ecoleNom}</p>
                </div>
              </div>
              
              {actionEnCours.action === 'bloque' ? (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ Attention :</strong> Cette action empêchera tous les utilisateurs de cette école d\'accéder à la plateforme.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
                  <p className="text-sm text-green-800">
                    <strong>✅ Information :</strong> Cette action rétablira l\'accès à la plateforme pour tous les utilisateurs de cette école.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t p-6 bg-gray-50 rounded-b-xl flex gap-3">
              <button
                onClick={annulerAction}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmerAction}
                className={`flex-1 text-white px-4 py-2 rounded-lg font-medium transition ${
                  actionEnCours.action === 'bloque' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionEnCours.action === 'bloque' ? '🔒 Bloquer' : '🔓 Activer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className={`w-96 max-w-lg shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === 'success' ? (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">✅</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm">❌</span>
                    </div>
                  )}
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className={`text-sm font-medium ${
                    notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {notification.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => setNotification(null)}
                    className={`inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      notification.type === 'success' 
                        ? 'text-green-500 hover:text-green-600 focus:ring-green-500' 
                        : 'text-red-500 hover:text-red-600 focus:ring-red-500'
                    }`}
                  >
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
