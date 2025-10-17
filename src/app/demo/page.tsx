'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Play, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3,
  Building,
  CheckCircle,
  ArrowRight,
  Clock
} from 'lucide-react'

export default function DemoPage() {
  const demoFeatures = [
    {
      icon: Users,
      title: 'Gestion des élèves',
      description: 'Découvrez comment inscrire et gérer vos élèves',
      time: '3 min',
      available: true
    },
    {
      icon: FileText,
      title: 'Création de factures',
      description: 'Apprenez à créer des factures automatiquement',
      time: '5 min',
      available: true
    },
    {
      icon: CreditCard,
      title: 'Suivi des paiements',
      description: 'Gérez les paiements et générez des reçus',
      time: '4 min',
      available: true
    },
    {
      icon: BarChart3,
      title: 'Rapports financiers',
      description: 'Analysez les performances de votre école',
      time: '6 min',
      available: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sama École</h1>
                <p className="text-xs text-gray-500">Démonstration</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600">
                  <ArrowRight className="w-4 h-4" />
                  Accéder au système
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Play className="w-4 h-4" />
            Démonstration interactive
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Découvrez Sama École en action
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Explorez toutes les fonctionnalités de notre plateforme de gestion scolaire 
            à travers ces démonstrations interactives
          </p>
        </div>

        {/* Demo Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {demoFeatures.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {feature.time}
                      </div>
                    </div>
                  </div>
                  {feature.available && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Disponible</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <Button className="w-full gap-2 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600">
                  <Play className="w-4 h-4" />
                  Lancer la démo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Prêt à tester avec vos données ?
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Accédez directement au système complet avec un compte de démonstration
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/login">
                <Button size="lg" variant="secondary" className="gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Accès démo complet
                </Button>
              </Link>
              <div className="text-sm opacity-75">
                Aucune inscription requise
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            Besoin d'aide ? Contactez notre équipe support à{' '}
            <a href="mailto:support@samaecole.sn" className="text-purple-600 hover:underline">
              support@samaecole.sn
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
