/**
 * LAYOUT DASHBOARD - SAMA ÉCOLE
 * 
 * Composant principal du layout avec sidebar et header
 * Gère la navigation entre toutes les pages du dashboard
 * 
 * Corrections appliquées:
 * - Ajout du scroll vertical pour la sidebar (overflow-y-auto)
 * - Différenciation des couleurs : Accueil (violet) vs autres menus actifs (bleu)
 * - Gestion des sous-menus avec états visuels distincts
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  GraduationCap, 
  FileText, 
  Receipt,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Plus,
  BookOpen,
  UserCheck,
  Calendar,
  BarChart3,
  Building,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/ui/user-menu'

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  children?: SidebarItem[]
}

interface SidebarItemWithPermissions extends SidebarItem {
  requiredPermissions?: string[]
  requiredRoles?: string[]
}

const sidebarItems: SidebarItemWithPermissions[] = [
  {
    title: 'Accueil',
    href: '/dashboard',
    icon: Home,
    // Accueil accessible à tous
  },
  {
    title: 'Élèves',
    href: '/dashboard/eleves',
    icon: Users,
    requiredPermissions: ['students.view'],
    children: [
      { title: 'Tous les élèves', href: '/dashboard/eleves', icon: Users, requiredPermissions: ['students.view'] },
      { title: 'Ajouter élève', href: '/dashboard/eleves/nouveau', icon: Plus, requiredPermissions: ['students.create'] },
    ]
  },
  {
    title: 'Classes',
    href: '/dashboard/classes',
    icon: GraduationCap,
    requiredPermissions: ['classes.view'],
  },
  {
    title: 'Facturation',
    href: '/dashboard/factures',
    icon: FileText,
    requiredPermissions: ['invoices.view'],
    children: [
      { title: 'Factures', href: '/dashboard/factures', icon: FileText, requiredPermissions: ['invoices.view'] },
      { title: 'Catalogue des frais', href: '/dashboard/facturation/frais', icon: FileText, requiredPermissions: ['frais.view'] },
      { title: 'Créer facture', href: '/dashboard/factures/nouvelle', icon: Plus, requiredPermissions: ['invoices.create'] },
    ]
  },
  {
    title: 'Reçus',
    href: '/dashboard/recus',
    icon: Receipt,
    requiredPermissions: ['receipts.view'],
  },
  {
    title: 'Rapports',
    href: '/dashboard/rapports',
    icon: BarChart3,
    requiredPermissions: ['reports.view'],
  },
  {
    title: 'Utilisateurs',
    href: '/dashboard/utilisateurs',
    icon: UserCheck,
    requiredRoles: ['admin'],
  },
  {
    title: 'Paramètres',
    href: '/dashboard/parametres',
    icon: Settings,
    requiredRoles: ['admin'], // Seul l'admin peut voir les paramètres
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { user, userRole, userProfile, logout, hasPermission, hasRole } = useAuth()

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }


  // Fonction pour vérifier si un élément de menu doit être affiché
  const canViewMenuItem = (item: SidebarItemWithPermissions): boolean => {
    // Si pas d'utilisateur connecté, ne rien afficher
    if (!user) return false

    // Vérifier les rôles requis
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const hasRequiredRole = item.requiredRoles.some(role => hasRole(role))
      if (!hasRequiredRole) return false
    }

    // Vérifier les permissions requises
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      const hasRequiredPermissions = item.requiredPermissions.every(permission => hasPermission(permission))
      if (!hasRequiredPermissions) return false
    }

    return true
  }

  // Fonction pour déterminer si c'est la page d'accueil
  const isHomePage = (href: string) => href === '/dashboard' && pathname === '/dashboard'
  
  // Fonction pour déterminer si un menu est actif (mais pas l'accueil)
  const isActiveMenu = (href: string) => {
    if (href === '/dashboard') return false // Traité séparément
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      {/* Sidebar - Fix: Ajout du scroll vertical */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white shadow-xl border-r border-purple-100 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-purple-100 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sama École</h1>
            <p className="text-sm text-gray-500">Gestion scolaire</p>
          </div>
        </div>

        {/* Navigation - Fix: Scroll activé */}
        <nav className="p-4 space-y-2 overflow-y-auto flex-1">
          {sidebarItems.filter(canViewMenuItem).map((item) => (
            <div key={item.title}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                  // Fix: Différenciation Accueil (violet) vs autres menus actifs (bleu)
                  isHomePage(item.href)
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                    : isActiveMenu(item.href)
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                    : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
                {item.children && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleExpanded(item.title)
                    }}
                    className="ml-auto p-1 hover:bg-white/20 rounded"
                  >
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 transition-transform",
                        expandedItems.includes(item.title) ? "rotate-180" : ""
                      )} 
                    />
                  </button>
                )}
              </Link>

              {/* Sous-menu */}
              {item.children && expandedItems.includes(item.title) && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children.filter(child => canViewMenuItem(child as SidebarItemWithPermissions)).map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                        pathname === child.href
                          ? "bg-blue-100 text-blue-700 border-l-2 border-blue-500"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                      )}
                    >
                      <child.icon className="w-4 h-4" />
                      {child.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Informations utilisateur */}
        <div className="p-4 border-t border-purple-100 flex-shrink-0">
          {user && (
            <div className="space-y-3">
              {/* Profil utilisateur */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {userProfile?.prenom?.charAt(0)?.toUpperCase() || ''}
                  {userProfile?.nom?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {userProfile?.prenom && userProfile?.nom 
                      ? `${userProfile.prenom} ${userProfile.nom}`
                      : user?.email || 'Utilisateur'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {userRole === 'admin' ? 'Directeur' : 
                     userRole === 'secretaire' ? 'Secrétaire' :
                     userRole === 'comptable' ? 'Comptable' : 
                     userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Non défini'}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-purple-100">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un élève, une facture..."
                  className="pl-10 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* User Menu */}
              <UserMenu onLogout={logout} />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}