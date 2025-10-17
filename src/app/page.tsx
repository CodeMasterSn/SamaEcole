'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  GraduationCap, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3,
  Shield,
  Clock,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Building,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: 'Gestion des élèves',
      description: 'Inscriptions, profils, suivi académique complet'
    },
    {
      icon: FileText,
      title: 'Facturation intelligente',
      description: 'Factures automatiques, échéances, rappels'
    },
    {
      icon: CreditCard,
      title: 'Paiements & Reçus',
      description: 'Suivi des paiements, génération de reçus PDF'
    },
    {
      icon: BarChart3,
      title: 'Rapports & Analyses',
      description: 'Tableaux de bord, statistiques, exports Excel'
    },
    {
      icon: Shield,
      title: 'Sécurité avancée',
      description: 'Données protégées, accès contrôlé, sauvegarde'
    },
    {
      icon: Smartphone,
      title: 'Interface moderne',
      description: 'Design responsive, intuitive, facile à utiliser'
    }
  ]

  const stats = [
    { number: '500+', label: 'Écoles utilisatrices' },
    { number: '50K+', label: 'Élèves gérés' },
    { number: '99.9%', label: 'Temps de fonctionnement' },
    { number: '24/7', label: 'Support technique' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sama École</h1>
                <p className="text-xs text-gray-500">Gestion scolaire moderne</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/demo">
                <Button variant="outline" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Démo gratuite
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600">
                  <Shield className="w-4 h-4" />
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <CheckCircle className="w-4 h-4" />
            Solution complète de gestion scolaire
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Simplifiez la gestion de votre
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> école</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Une plateforme moderne et intuitive pour gérer les élèves, les finances, 
            les paiements et générer des rapports détaillés. Conçue spécialement pour les écoles sénégalaises.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/auth/login">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-lg px-8 py-3">
                <ArrowRight className="w-5 h-5" />
                Commencer maintenant
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-3">
                <GraduationCap className="w-5 h-5" />
                Voir la démo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-gray-200">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont votre école a besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une suite complète d'outils pour moderniser la gestion de votre établissement scolaire
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-4">
              Prêt à moderniser votre école ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez les centaines d'écoles qui font confiance à Sama École 
              pour simplifier leur gestion quotidienne
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/login">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-3">
                  <Shield className="w-5 h-5" />
                  Accéder au système
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" className="gap-2 text-lg px-8 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white hover:text-purple-600 transition-all duration-300">
                  <Mail className="w-5 h-5" />
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Sama École</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                La solution de gestion scolaire moderne, conçue pour simplifier 
                la vie des établissements éducatifs au Sénégal et en Afrique.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4" />
                  Dakar, Sénégal
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4">Fonctionnalités</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features/eleves" className="hover:text-white">Gestion élèves</Link></li>
                <li><Link href="/features/finances" className="hover:text-white">Facturation</Link></li>
                <li><Link href="/features/rapports" className="hover:text-white">Rapports</Link></li>
                <li><Link href="/features/securite" className="hover:text-white">Sécurité</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  contact@samaecole.sn
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +221 XX XXX XX XX
                </li>
                <li>
                  <Link href="/support" className="hover:text-white">Support technique</Link>
          </li>
                <li>
                  <Link href="/demo" className="hover:text-white">Demander une démo</Link>
          </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2025 Sama École. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
                Conditions d'utilisation
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}