'use client'

import { useAuth } from '@/contexts/AuthContext'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
  fallback?: React.ReactNode
  showFallback?: boolean
}

export default function PermissionGuard({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [],
  fallback = null,
  showFallback = false
}: PermissionGuardProps) {
  const { user, hasPermission, hasRole } = useAuth()

  // Si pas d'utilisateur connecté, ne rien afficher
  if (!user) {
    return showFallback ? <>{fallback}</> : null
  }

  // Vérifier les rôles requis
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role))
    if (!hasRequiredRole) {
      return showFallback ? <>{fallback}</> : null
    }
  }

  // Vérifier les permissions requises
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => hasPermission(permission))
    if (!hasRequiredPermissions) {
      return showFallback ? <>{fallback}</> : null
    }
  }

  return <>{children}</>
}

// Hook utilitaire pour vérifier les permissions dans les composants
export function usePermissions() {
  const { hasPermission, hasRole, user } = useAuth()

  const canView = (permissions: string[] = [], roles: string[] = []): boolean => {
    if (!user) return false

    if (roles.length > 0) {
      const hasRequiredRole = roles.some(role => hasRole(role))
      if (!hasRequiredRole) return false
    }

    if (permissions.length > 0) {
      return permissions.every(permission => hasPermission(permission))
    }

    return true
  }

  const canEdit = (module: string): boolean => {
    return hasPermission(`${module}.edit`)
  }

  const canCreate = (module: string): boolean => {
    return hasPermission(`${module}.create`)
  }

  const canDelete = (module: string): boolean => {
    return hasPermission(`${module}.delete`)
  }

  const isAdmin = (): boolean => {
    return hasRole('admin')
  }

  return {
    canView,
    canEdit,
    canCreate,
    canDelete,
    isAdmin,
    hasPermission,
    hasRole,
    user
  }
}





