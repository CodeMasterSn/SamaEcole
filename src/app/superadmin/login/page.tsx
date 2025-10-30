'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const client = supabase
      
      // 1. Connexion Supabase
      const { data, error: authError } = await client.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError('Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      // 2. Vérifier rôle super_admin
      const { data: role, error: roleError } = await client
        .from('roles_globaux')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      if (roleError || !role || role.role !== 'super_admin') {
        // Déconnecter immédiatement
        await client.auth.signOut()
        
        setError('❌ Accès refusé. Cette interface est réservée aux super administrateurs.')
        setLoading(false)
        return
      }

      // 3. Connexion réussie
      console.log('✅ Super admin connecté:', data.user.email)
      router.push('/superadmin')
      
    } catch (err) {
      console.error('Erreur connexion:', err)
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-4 border-red-600">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full mb-4">
            <span className="text-3xl">👑</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-gray-600 mt-2">Sama École - Accès Administrateur</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Administrateur
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@samaecole.online"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Accès sécurisé réservé aux administrateurs de la plateforme
          </p>
        </div>

        {/* Lien retour */}
        <div className="mt-6 text-center">
          <a 
            href="/login" 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Connexion école
          </a>
        </div>
      </div>
    </div>
  )
}
