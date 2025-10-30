'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { envoyerEmailInvitation, envoyerEmailRefus } from '@/lib/email-service'

interface Demande {
  id: number
  nom_ecole: string
  nom_contact: string
  email: string
  telephone: string
  adresse: string
  ville: string
  message: string
  statut: string
  created_at: string
  traite_par: string | null
  date_traitement: string | null
  notes_admin: string | null
  raison_refus: string | null
}

export default function DemandesPage() {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('en_attente')
  
  // Modal états
  const [showModal, setShowModal] = useState(false)
  const [demandeSelectionnee, setDemandeSelectionnee] = useState<Demande | null>(null)
  const [actionEnCours, setActionEnCours] = useState<'approuver' | 'refuser' | null>(null)
  const [motifRefus, setMotifRefus] = useState('')
  const [notesAdmin, setNotesAdmin] = useState('')
  const [processing, setProcessing] = useState(false)
  
  // États pour les notifications
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    chargerDemandes()
  }, [filtreStatut])

  const chargerDemandes = async () => {
    setLoading(true)
    const client = supabase
    
    let query = client
      .from('demandes_inscription')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filtreStatut !== 'tous') {
      query = query.eq('statut', filtreStatut)
    }
    
    const { data } = await query
    setDemandes(data || [])
    setLoading(false)
  }

  const ouvrirModal = (demande: Demande, action: 'approuver' | 'refuser') => {
    setDemandeSelectionnee(demande)
    setActionEnCours(action)
    setMotifRefus('')
    setNotesAdmin('')
    setShowModal(true)
  }

  const approuverDemande = async () => {
    if (!demandeSelectionnee) return
    
    setProcessing(true)
    const client = supabase
    
    try {
      // 1. CRÉER L'ÉCOLE D'ABORD
      console.log('🏫 Création de l\'école:', demandeSelectionnee.nom_ecole)
      
      const { data: ecole, error: ecoleError } = await client
        .from('ecoles')
        .insert({
          nom: demandeSelectionnee.nom_ecole,
          email: demandeSelectionnee.email,
          telephone: demandeSelectionnee.telephone,
          adresse: demandeSelectionnee.adresse,
          statut: 'actif',
          type_compte: 'standard'
        })
        .select()
        .single()
      
      if (ecoleError) {
        console.error('❌ Erreur création école:', ecoleError)
        setNotificationMessage(`❌ Erreur lors de la création de l'école.\n\nErreur : ${ecoleError.message}`)
        setNotificationType('error')
        setShowErrorModal(true)
        setProcessing(false)
        return
      }
      
      console.log('✅ École créée avec succès:', ecole.id)
      
      // 2. ENVOYER L'EMAIL D'INVITATION AVEC LE BON LIEN
      console.log('📧 Envoi email d\'invitation à:', demandeSelectionnee.email)
      
      const invitationLink = `${window.location.origin}/creer-compte?email=${encodeURIComponent(demandeSelectionnee.email)}&ecole_id=${ecole.id}`
      
      const emailResult = await envoyerEmailInvitation({
        email: demandeSelectionnee.email,
        nomEcole: demandeSelectionnee.nom_ecole,
        lienInvitation: invitationLink
      })
      
      // 3. Si l'email échoue, TOUT ARRÊTER
      if (!emailResult.success) {
        console.error('❌ Erreur envoi email:', emailResult.error)
        setNotificationMessage(`❌ École créée mais impossible d'envoyer l'email d'invitation.\n\nErreur : ${emailResult.error?.message || 'Erreur inconnue'}\n\nLien manuel : ${invitationLink}`)
        setNotificationType('error')
        setShowErrorModal(true)
        setProcessing(false)
        return
      }
      
      console.log('✅ Email envoyé avec succès')
      
      // 4. METTRE À JOUR LA DEMANDE
      const { data: { user } } = await client.auth.getUser()
      
      const { error: updateError } = await client
        .from('demandes_inscription')
        .update({
          statut: 'approuvee',
          traite_par: user?.id,
          date_traitement: new Date().toISOString(),
          notes_admin: notesAdmin || null
        })
        .eq('id', demandeSelectionnee.id)
      
      if (updateError) {
        console.error('❌ Erreur mise à jour demande:', updateError)
        setNotificationMessage(`❌ École créée et email envoyé mais erreur lors de la mise à jour de la demande.\n\nErreur : ${updateError.message}`)
        setNotificationType('error')
        setShowErrorModal(true)
        setProcessing(false)
        return
      }
      
      // 5. SUCCÈS COMPLET
      setNotificationMessage(`✅ Demande approuvée avec succès!\n\nÉcole créée : ${ecole.nom}\nID: ${ecole.id}\n\n📧 Email d'invitation envoyé à : ${demandeSelectionnee.email}\n\nL'école peut maintenant créer son compte administrateur via le lien reçu.`)
      setNotificationType('success')
      setShowSuccessModal(true)
      
      setShowModal(false)
      chargerDemandes()
      
    } catch (error) {
      console.error('💥 Erreur critique approbation:', error)
      setNotificationMessage('❌ Une erreur critique est survenue lors de l\'approbation.\n\nVeuillez réessayer ou contacter le support technique.')
      setNotificationType('error')
      setShowErrorModal(true)
    } finally {
      setProcessing(false)
    }
  }

  const refuserDemande = async () => {
    if (!demandeSelectionnee || !motifRefus.trim()) {
      setNotificationMessage('Veuillez indiquer un motif de refus')
      setNotificationType('error')
      setShowErrorModal(true)
      return
    }
    
    setProcessing(true)
    const client = supabase
    
    try {
      // 1. D'ABORD : Envoyer l'email de refus
      console.log('📧 Envoi email refus à:', demandeSelectionnee.email)
      const emailResult = await envoyerEmailRefus({
        email: demandeSelectionnee.email,
        nomEcole: demandeSelectionnee.nom_ecole,
        motifRefus: motifRefus
      })
      
      // 2. Si l'email échoue, TOUT ARRÊTER
      if (!emailResult.success) {
        console.error('❌ Erreur envoi email refus:', emailResult.error)
        setNotificationMessage(`❌ Impossible d'envoyer l'email de refus.\n\nErreur : ${emailResult.error?.message || 'Erreur inconnue'}\n\nLe refus a été annulé.`)
        setNotificationType('error')
        setShowErrorModal(true)
        setProcessing(false)
        return
      }
      
      console.log('✅ Email de refus envoyé avec succès, mise à jour de la demande...')
      
      // 3. MAINTENANT : Mettre à jour la demande (email réussi)
      const { data: { user } } = await client.auth.getUser()
      
      const { error } = await client
        .from('demandes_inscription')
        .update({
          statut: 'refusee',
          traite_par: user?.id,
          date_traitement: new Date().toISOString(),
          raison_refus: motifRefus,
          notes_admin: notesAdmin || null
        })
        .eq('id', demandeSelectionnee.id)
      
      if (error) {
        console.error('❌ Erreur mise à jour demande après email refus réussi:', error)
        setNotificationMessage(`❌ Email de refus envoyé mais erreur lors de la mise à jour de la demande.\n\nErreur : ${error.message}\n\nVeuillez contacter le support technique.`)
        setNotificationType('error')
        setShowErrorModal(true)
        setProcessing(false)
        return
      }
      
      // 4. SUCCÈS COMPLET
      setNotificationMessage(`✅ Demande refusée avec succès!\n\n📧 Email de notification envoyé à : ${demandeSelectionnee.email}\n\nMotif : ${motifRefus}`)
      setNotificationType('success')
      setShowSuccessModal(true)
      
      setShowModal(false)
      chargerDemandes()
      
    } catch (error) {
      console.error('💥 Erreur critique refus:', error)
      setNotificationMessage('❌ Une erreur critique est survenue lors du refus.\n\nVeuillez réessayer ou contacter le support technique.')
      setNotificationType('error')
      setShowErrorModal(true)
    } finally {
      setProcessing(false)
    }
  }

  const getStatutBadge = (statut: string) => {
    const config = {
      en_attente: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '⏳' },
      approuvee: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      refusee: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' }
    }
    const c = config[statut as keyof typeof config] || config.en_attente
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${c.bg} ${c.text}`}>
        <span>{c.icon}</span>
        {statut.replace('_', ' ')}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demandes d'Inscription</h1>
          <p className="text-gray-600 mt-2">
            {demandes.length} demande(s) {filtreStatut !== 'tous' ? `(${filtreStatut})` : 'au total'}
          </p>
        </div>
        
        {/* Filtres */}
        <div className="flex gap-2">
          {['tous', 'en_attente', 'approuvee', 'refusee'].map((statut) => (
            <button
              key={statut}
              onClick={() => setFiltreStatut(statut)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtreStatut === statut
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              {statut === 'tous' ? 'Tous' : statut.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600">En attente</p>
          <p className="text-2xl font-bold text-orange-700">
            {demandes.filter(d => d.statut === 'en_attente').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Approuvées</p>
          <p className="text-2xl font-bold text-green-700">
            {demandes.filter(d => d.statut === 'approuvee').length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">Refusées</p>
          <p className="text-2xl font-bold text-red-700">
            {demandes.filter(d => d.statut === 'refusee').length}
          </p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {demandes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune demande pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">École</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Contact</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell w-32">Ville</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Statut</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell w-48">Message</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y">
              {demandes.map((demande) => (
                <tr key={demande.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 w-20">
                    {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-3 sm:px-6 py-4 w-40">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{demande.nom_ecole}</div>
                    <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">{demande.adresse}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 w-48">
                    <div className="text-sm text-gray-900">{demande.nom_contact}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{demande.email}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{demande.telephone}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell w-32">
                    {demande.ville}
                  </td>
                  <td className="px-3 sm:px-6 py-4 w-24">
                    {getStatutBadge(demande.statut)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 hidden md:table-cell w-48">
                    {demande.message ? (
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-700 line-clamp-2" title={demande.message}>
                          {demande.message}
                        </p>
                        {demande.message.length > 80 && (
                          <button
                            onClick={() => {
                              setDemandeSelectionnee(demande)
                              setShowModal(true)
                              setActionEnCours(null)
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
                          >
                            Lire plus →
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Aucun message</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 w-32">
                    {demande.statut === 'en_attente' ? (
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <button
                          onClick={() => ouvrirModal(demande, 'approuver')}
                          className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded text-xs font-medium hover:bg-green-700 whitespace-nowrap"
                        >
                          ✅ Approuver
                        </button>
                        <button
                          onClick={() => ouvrirModal(demande, 'refuser')}
                          className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded text-xs font-medium hover:bg-red-700 whitespace-nowrap"
                        >
                          ❌ Refuser
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setDemandeSelectionnee(demande)
                          setShowModal(true)
                          setActionEnCours(null)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        👁️ Voir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && demandeSelectionnee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`p-4 sm:p-6 rounded-t-xl ${
              actionEnCours === 'approuver' ? 'bg-green-600' :
              actionEnCours === 'refuser' ? 'bg-red-600' :
              'bg-blue-600'
            } text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold truncate">
                    {actionEnCours === 'approuver' && '✅ Approuver la demande'}
                    {actionEnCours === 'refuser' && '❌ Refuser la demande'}
                    {!actionEnCours && '👁️ Détails de la demande'}
                  </h2>
                  <p className="text-xs sm:text-sm opacity-90 mt-1 truncate">{demandeSelectionnee.nom_ecole}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition flex-shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Informations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">École</p>
                  <p className="font-medium">{demandeSelectionnee.nom_ecole}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-medium">{demandeSelectionnee.nom_contact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{demandeSelectionnee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{demandeSelectionnee.telephone}</p>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-sm text-gray-600">Adresse</p>
                  <p className="font-medium text-sm sm:text-base">{demandeSelectionnee.adresse}, {demandeSelectionnee.ville}</p>
                </div>
                {demandeSelectionnee.message && (
                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-sm text-gray-600">Message</p>
                    <p className="font-medium text-sm sm:text-base break-words">{demandeSelectionnee.message}</p>
                  </div>
                )}
              </div>

              {/* Formulaire pour Refuser */}
              {actionEnCours === 'refuser' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motif du refus *
                    </label>
                    <textarea
                      value={motifRefus}
                      onChange={(e) => setMotifRefus(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                      placeholder="Expliquez pourquoi la demande est refusée..."
                      required
                    />
                  </div>
                </div>
              )}

              {/* Notes admin (pour les deux actions) */}
              {actionEnCours && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes internes (optionnel)
                  </label>
                  <textarea
                    value={notesAdmin}
                    onChange={(e) => setNotesAdmin(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Notes pour vous ou d'autres admins..."
                  />
                </div>
              )}

              {/* Affichage notes/raisons si demande traitée */}
              {!actionEnCours && demandeSelectionnee.statut !== 'en_attente' && (
                <div className="space-y-3">
                  {demandeSelectionnee.raison_refus && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-1">Motif du refus :</p>
                      <p className="text-sm text-red-700">{demandeSelectionnee.raison_refus}</p>
                    </div>
                  )}
                  {demandeSelectionnee.notes_admin && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Notes admin :</p>
                      <p className="text-sm text-yellow-700">{demandeSelectionnee.notes_admin}</p>
                    </div>
                  )}
                  {demandeSelectionnee.date_traitement && (
                    <p className="text-sm text-gray-500">
                      Traitée le {new Date(demandeSelectionnee.date_traitement).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer avec actions */}
            <div className="border-t p-4 sm:p-6 bg-gray-50 rounded-b-xl">
              <div className="flex flex-col sm:flex-row gap-3">
                {actionEnCours === 'approuver' && (
                  <>
                    <button
                      onClick={approuverDemande}
                      disabled={processing}
                      className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 text-sm sm:text-base"
                    >
                      {processing ? '⏳ Création...' : '✅ Confirmer l\'approbation'}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={processing}
                      className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
                    >
                      Annuler
                    </button>
                  </>
                )}
                
                {actionEnCours === 'refuser' && (
                  <>
                    <button
                      onClick={refuserDemande}
                      disabled={processing || !motifRefus.trim()}
                      className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 text-sm sm:text-base"
                    >
                      {processing ? '⏳ Traitement...' : '❌ Confirmer le refus'}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={processing}
                      className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
                    >
                      Annuler
                    </button>
                  </>
                )}

                {!actionEnCours && (
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 font-medium text-sm sm:text-base"
                  >
                    Fermer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 rounded-t-xl bg-green-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">✅</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold">Succès</h2>
                    <p className="text-green-100 text-xs sm:text-sm">Action réalisée avec succès</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition flex-shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base break-words">{notificationMessage}</p>
            </div>
            
            <div className="border-t p-4 sm:p-6 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base"
              >
                Parfait !
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'erreur */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 rounded-t-xl bg-red-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">❌</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold">Erreur</h2>
                    <p className="text-red-100 text-xs sm:text-sm">Une erreur s'est produite</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition flex-shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base break-words">{notificationMessage}</p>
            </div>
            
            <div className="border-t p-4 sm:p-6 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium text-sm sm:text-base"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
