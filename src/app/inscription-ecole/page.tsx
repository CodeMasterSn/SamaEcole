'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function InscriptionEcolePage() {
  const [formData, setFormData] = useState({
    nom_ecole: '',
    nom_contact: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const client = supabase

      // Vérifier si email existe déjà
      const { data: existing } = await client
        .from('demandes_inscription')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (existing) {
        setError('Une demande existe déjà pour cet email.')
        setLoading(false)
        return
      }

      // Insérer la demande
      const { error: insertError } = await client
        .from('demandes_inscription')
        .insert({
          ...formData,
          statut: 'en_attente'
        })

      if (insertError) {
        console.error('Erreur insertion:', insertError)
        setError('Erreur lors de l\'envoi de la demande.')
        setLoading(false)
        return
      }

      // TODO: Envoyer email notification au super admin
      // Pour l'instant, juste confirmer

      setSuccess(true)
      setFormData({
        nom_ecole: '',
        nom_contact: '',
        email: '',
        telephone: '',
        adresse: '',
        ville: '',
        message: ''
      })
      
    } catch (err) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Demande envoyée avec succès !
          </h1>
          <p className="text-gray-600 mb-6">
            Nous avons bien reçu votre demande d'accès à Sama École. 
            Notre équipe l'examinera dans les plus brefs délais.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Vous recevrez un email de confirmation une fois votre compte approuvé.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Faire une autre demande
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎓 Rejoignez Sama École
          </h1>
          <p className="text-lg text-gray-600">
            Demandez l'accès à notre plateforme de gestion scolaire
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations École */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🏫 Informations de l'école
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'école *
                  </label>
                  <input
                    type="text"
                    name="nom_ecole"
                    value={formData.nom_ecole}
                    onChange={handleChange}
                    placeholder="École Primaire Liberté"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville *
                    </label>
                    <input
                      type="text"
                      name="ville"
                      value={formData.ville}
                      onChange={handleChange}
                      placeholder="Dakar"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="+221 77 123 45 67"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse complète *
                  </label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Rue 10, Villa 123, Liberté 6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Personne de contact */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                👤 Personne de contact
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="nom_contact"
                    value={formData.nom_contact}
                    onChange={handleChange}
                    placeholder="Fatou Diop"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@ecole.sn"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cet email sera utilisé pour votre compte administrateur
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optionnel)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Dites-nous en plus sur votre école..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
            >
              {loading ? '⏳ Envoi en cours...' : '🚀 Envoyer ma demande'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Déjà un compte ? <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Se connecter</a>
            </p>
          </form>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">💼</div>
            <h3 className="font-semibold text-gray-900 mb-2">Gestion complète</h3>
            <p className="text-sm text-gray-600">Élèves, classes, notes et présences</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-900 mb-2">Facturation</h3>
            <p className="text-sm text-gray-600">Générez et suivez vos paiements</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Statistiques</h3>
            <p className="text-sm text-gray-600">Tableaux de bord et rapports</p>
          </div>
        </div>
      </div>
    </div>
  )
}
