'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Comptes de démonstration
  const demoAccounts = [
    { role: 'Directeur', email: 'directeur@samaecole.sn', password: 'demo123', description: 'Accès complet au système' },
    { role: 'Secrétaire', email: 'secretaire@samaecole.sn', password: 'demo123', description: 'Gestion élèves et factures' },
    { role: 'Comptable', email: 'comptable@samaecole.sn', password: 'demo123', description: 'Finances et rapports' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError('')
    setLoading(true)

    try {
      console.log('🔑 Tentative de connexion via AuthContext...')
      const result = await login(formData.email, formData.password)

      if (result.error) {
        setError(result.error.message || 'Erreur de connexion')
      } else if (result.success) {
        console.log('✅ Connexion réussie, redirection...')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error)
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (account: typeof demoAccounts[0]) => {
    setFormData({
      email: account.email,
      password: account.password
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Section gauche - Branding */}
        <div className="hidden lg:block">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-3 justify-center lg:justify-start mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <Building className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sama École</h1>
                <p className="text-gray-600">Gestion scolaire moderne</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bienvenue dans votre espace de gestion
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Connectez-vous pour accéder à votre tableau de bord et gérer votre établissement scolaire
            </p>

            {/* Fonctionnalités */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-700">Interface sécurisée et moderne</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-700">Données protégées et sauvegardées</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-gray-700">Support technique 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire */}
        <div className="w-full">
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Sama École</h1>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Connexion</CardTitle>
              <p className="text-gray-600">Accédez à votre espace de gestion</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Messages */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Adresse email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

              {/* Comptes de démonstration */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3 text-center">
                  Comptes de démonstration
                </h3>
                <div className="space-y-2">
                  {demoAccounts.map((account, index) => (
                    <button
                      key={index}
                      onClick={() => handleDemoLogin(account)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{account.role}</div>
                          <div className="text-xs text-gray-500">{account.description}</div>
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {account.email}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Liens */}
              <div className="text-center space-y-2">
                <Link href="/auth/forgot-password" className="text-sm text-purple-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
                <div className="text-sm text-gray-500">
                  Besoin d'aide ?{' '}
                  <a href="mailto:support@samaecole.sn" className="text-purple-600 hover:underline">
                    Contactez le support
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retour à l'accueil */}
          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
