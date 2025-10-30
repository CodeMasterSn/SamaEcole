'use client'

import { usePathname } from 'next/navigation'
import Head from 'next/head'
import { logout } from '@/lib/auth-helpers'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Fonction pour obtenir le titre selon la page
  const getPageTitle = () => {
    switch (pathname) {
      case '/superadmin':
        return 'Dashboard Super Admin - Sama École'
      case '/superadmin/ecoles':
        return 'Gestion des Écoles - Super Admin'
      case '/superadmin/demandes':
        return 'Demandes d\'Inscription - Super Admin'
      case '/superadmin/monitoring':
        return 'Monitoring - Super Admin'
      case '/superadmin/login':
        return 'Connexion Super Admin - Sama École'
      default:
        return 'Super Admin - Sama École'
    }
  }

  // Si on est sur la page de login, afficher UNIQUEMENT le contenu (pas de layout)
  if (pathname === '/superadmin/login') {
    return (
      <>
        <Head>
          <title>{getPageTitle()}</title>
        </Head>
        {children}
      </>
    )
  }

  // Layout complet avec bannière et navigation pour les autres pages
  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Bannière Super Admin */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <h1 className="font-bold text-lg">MODE SUPER ADMIN</h1>
              <p className="text-xs text-red-100">Accès complet à la plateforme</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <a 
              href="/dashboard" 
              className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              ← Retour école
            </a>
            <button
              onClick={logout}
              className="text-sm bg-red-800 hover:bg-red-900 px-4 py-2 rounded-lg transition font-medium flex items-center gap-2"
            >
              <span>🚪</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Navigation Super Admin */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex gap-6">
            <a href="/superadmin" className="text-gray-700 hover:text-red-600 font-medium">
              📊 Dashboard
            </a>
            <a href="/superadmin/ecoles" className="text-gray-700 hover:text-red-600 font-medium">
              🏫 Écoles
            </a>
            <a href="/superadmin/demandes" className="text-gray-700 hover:text-red-600 font-medium">
              📝 Demandes
            </a>
            <a href="/superadmin/monitoring" className="text-gray-700 hover:text-red-600 font-medium">
              🚨 Monitoring
            </a>
          </nav>
        </div>
      </div>
      
      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </div>
      </div>
    </>
  )
}
