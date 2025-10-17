/**
 * USER MENU - SAMA ÉCOLE
 * 
 * Menu déroulant pour les actions utilisateur
 * Affiche les informations dynamiques et les actions disponibles
 */

'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Shield,
  Building,
  Clock,
  ChevronDown,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface UserMenuProps {
  onLogout: () => void
}

export function UserMenu({ onLogout }: UserMenuProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Fonction pour obtenir les initiales du nom
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Fonction pour obtenir le nom du rôle en français
  const getRoleName = (role: string) => {
    const roles: { [key: string]: string } = {
      'admin': 'Administrateur',
      'secretaire': 'Secrétaire',
      'comptable': 'Comptable'
    }
    return roles[role] || role
  }

  // Fonction pour obtenir la couleur du rôle
  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'admin': 'bg-purple-100 text-purple-800',
      'secretaire': 'bg-blue-100 text-blue-800',
      'comptable': 'bg-green-100 text-green-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-3 p-2 hover:bg-gray-50 transition-colors"
        >
          {/* Avatar */}
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white text-sm font-semibold">
              {user?.nom_complet ? getInitials(user.nom_complet) : 'AD'}
            </AvatarFallback>
          </Avatar>

          {/* Informations utilisateur */}
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">
              {user?.nom_complet || 'Admin École'}
            </p>
            <p className="text-gray-500 text-xs">
              {user?.role ? getRoleName(user.role) : 'Administrateur'}
            </p>
          </div>

          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        {/* En-tête avec informations détaillées */}
        <DropdownMenuLabel className="p-4 pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white font-semibold text-sm">
                {user?.nom_complet ? getInitials(user.nom_complet) : 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {user?.nom_complet || 'Admin École'}
              </p>
              <p className="text-xs text-gray-600 mt-1 break-all">
                {user?.email || 'admin@ecole.com'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`text-xs px-2 py-1 ${getRoleColor(user?.role || 'admin')}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role ? getRoleName(user.role) : 'Administrateur'}
                </Badge>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Actions utilisateur */}
        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3">
          <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm">Mon profil</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3">
          <Bell className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm">Notifications</span>
          <Badge variant="destructive" className="ml-auto text-xs px-2 py-1">
            3
          </Badge>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3">
          <Building className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm">Informations école</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3">
          <UserCheck className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm">Gérer utilisateurs</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3">
          <Settings className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm">Paramètres</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
