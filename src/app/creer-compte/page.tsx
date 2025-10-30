'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CreerComptePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Récupérer les paramètres de l'URL
  const email = searchParams.get('email')
  const ecoleId = searchParams.get('ecole_id')
  
  // État du formulaire
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: ''
  })
  
  // Informations de l'école (si ecole_id fourni)
  const [ecoleInfo, setEcoleInfo] = useState<any>(null)

  useEffect(() => {
    // Si pas d'email, erreur
    if (!email) {
      setError('Email manquant dans le lien d\'invitation.')
      return
    }
    
    // Si pas d'ecole_id, erreur
    if (!ecoleId) {
      setError('Lien d\'invitation invalide. Veuillez contacter le support.')
      return
    }
    
    // Charger les infos de l'école
    chargerInfosEcole()
  }, [email, ecoleId])

  const chargerInfosEcole = async () => {
    try {
      const { data, error } = await supabase
        .from('ecoles')
        .select('*')
        .eq('id', ecoleId)
        .single()
      
      if (error) {
        setError('École non trouvée.')
        return
      }
      
      setEcoleInfo(data)
    } catch (error) {
      setError('Erreur lors du chargement des informations de l\'école.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas.')
        setLoading(false)
        return
      }

      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.')
        setLoading(false)
        return
      }

      if (!formData.nom.trim() || !formData.prenom.trim()) {
        setError('Veuillez remplir tous les champs.')
        setLoading(false)
        return
      }

      // 1. Créer le compte utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email!,
        password: formData.password,
        options: {
          data: {
            nom: formData.nom,
            prenom: formData.prenom,
            ecole_id: ecoleId
          }
        }
      })

      if (authError) {
        setError('Erreur lors de la création du compte: ' + authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Erreur lors de la création du compte.')
        setLoading(false)
        return
      }

      // 2. Créer le profil utilisateur avec une fonction SQL pour contourner RLS
      const { error: profileError } = await supabase.rpc('creer_utilisateur_admin', {
        user_id: authData.user.id,
        nom_utilisateur: formData.nom,
        prenom_utilisateur: formData.prenom,
        email_utilisateur: email,
        ecole_id_param: parseInt(ecoleId!)
      })

      if (profileError) {
        setError('Erreur lors de la création du profil: ' + profileError.message)
        setLoading(false)
        return
      }

      // 3. Note: L'utilisateur admin est identifié par son rôle dans la table utilisateurs
      // Pas besoin de mettre à jour la table ecoles (pas de colonne admin_id)

      setSuccess(true)
      
      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (error) {
      console.error('Erreur création compte:', error)
      setError('Une erreur inattendue s\'est produite.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Compte créé avec succès !</h1>
          <p className="text-gray-600 mb-6">
            Votre compte administrateur a été créé pour <strong>{ecoleInfo?.nom || 'votre école'}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            Vous allez être redirigé vers votre dashboard dans quelques secondes...
          </p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <h1 className="text-2xl font-bold">Créer votre compte</h1>
            <p className="text-blue-100 text-sm mt-2">
              {ecoleInfo ? `Administrateur de ${ecoleInfo.nom}` : 'Compte administrateur'}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">❌</span>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {!email || !ecoleId ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Lien invalide</h2>
              <p className="text-gray-600 text-sm">
                Ce lien d'invitation n'est pas valide. Veuillez contacter le support.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre prénom"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              {/* Email (lecture seule) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email || ''}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  disabled
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 6 caractères"
                  required
                />
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Répétez votre mot de passe"
                  required
                />
              </div>

              {/* Informations école */}
              {ecoleInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Informations de votre école</h3>
                  <p className="text-sm text-blue-800">
                    <strong>Nom :</strong> {ecoleInfo.nom}<br />
                    <strong>Email :</strong> {ecoleInfo.email}<br />
                    <strong>Adresse :</strong> {ecoleInfo.adresse}
                  </p>
                </div>
              )}

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Création en cours...
                  </div>
                ) : (
                  '🚀 Créer mon compte'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <p className="text-center text-xs text-gray-500">
            En créant ce compte, vous acceptez les conditions d'utilisation de Sama École.
          </p>
        </div>
      </div>
    </div>
  )
}
