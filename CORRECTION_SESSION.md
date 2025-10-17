# 🔧 CORRECTION DÉCONNEXION AUTOMATIQUE

## PROBLÈME IDENTIFIÉ

La déconnexion automatique est causée par une logique d'authentification trop stricte qui ne distingue pas entre :
- **Refresh token expiré** (déconnexion légitime)
- **Chargement initial** (déconnexion temporaire)
- **Erreur réseau** (fausse déconnexion)

## SOLUTION ÉTAPE PAR ÉTAPE

### 1. MODIFIER AuthContext.tsx

Remplacer la fonction `getInitialSession` par :

```typescript
useEffect(() => {
  const initAuth = async () => {
    try {
      console.log('🔍 Vérification session Supabase...')
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Erreur récupération session:', error)
        setIsLoading(false)
        return
      }
      
      if (session?.user) {
        console.log('✅ Session existante trouvée:', session.user.email)
        setSupabaseUser(session.user)
        
        // Charger le profil utilisateur depuis la DB
        const { data: profile, error: profileError } = await supabase
          .from('utilisateurs')
          .select('id, email, nom, prenom, role, actif, ecole_id')
          .eq('email', session.user.email)
          .eq('actif', true)
          .single()

        if (profileError || !profile) {
          console.error('❌ Profil utilisateur introuvable:', profileError)
          await supabase.auth.signOut()
          return
        }

        const userData: User = {
          id: profile.id,
          email: profile.email,
          nom: profile.nom,
          prenom: profile.prenom,
          role: profile.role,
          actif: profile.actif,
          ecole_id: profile.ecole_id || 1,
          permissions: ROLE_PERMISSIONS[profile.role] || [],
          lastActivity: new Date().toISOString()
        }

        setUser(userData)
        console.log('✅ Profil utilisateur chargé:', profile.role)
        
      } else {
        console.log('ℹ️ Aucune session active')
      }
    } catch (error) {
      console.error('❌ Erreur init auth:', error)
      setUser(null)
      setSupabaseUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  initAuth()

  // Écouter les changements de session avec gestion différenciée
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth state change:', event, session?.user?.email)
    
    switch (event) {
      case 'SIGNED_IN':
        if (session?.user) {
          setSupabaseUser(session.user)
          await loadUserProfile(session.user)
        }
        break
        
      case 'SIGNED_OUT':
        console.log('🚪 Déconnexion explicite détectée')
        setSupabaseUser(null)
        setUser(null)
        break
        
      case 'TOKEN_REFRESHED':
        // Token rafraîchi avec succès
        console.log('🔄 Token refraîchi')
        break
        
      case 'USER_UPDATED':
        if (session?.user) {
          console.log('👤 Utilisateur mis à jour')
          setSupabaseUser(session.user)
        }
        break
    }
    
    setIsLoading(false)
  })

  return () => subscription.unsubscribe()
}, [])
```

### 2. AMÉLIORER ProtectedRoute.tsx

Modifier la logique de vérification :

```typescript
useEffect(() => {
  // Attendre la fin du chargement initial
  if (!isLoading) {
    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated) {
      console.log('🚫 Utilisateur non authentifié, redirection vers login')
      router.push(fallbackUrl)
      return
    }

    // Vérifier les permissions uniquement si nécessaire
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
      if (!hasAllPermissions) {
        console.log('🚫 Permissions insuffisantes')
        router.push('/dashboard/unauthorized')
        return
      }
    }

    // Vérifier les rôles uniquement si nécessaire
    if (requiredRoles.length > 0) {
      const hasRequiredRole = hasRole(requiredRoles)
      if (!hasRequiredRole) {
        console.log('🚫 Rôle insuffisant')
        router.push('/dashboard/unauthorized')
        return
      }
    }
  }
}, [isAuthenticated, isLoading, requiredPermissions, requiredRoles, router, hasPermission, hasRole, fallbackUrl])

// Améliorer l'affichage de chargement
if (isLoading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sama École</h2>
        <p className="text-gray-600">Initialisation de la session...</p>
        <div className="mt-4 w-64 bg-gray-200 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  )
}

// Si pas authentifié mais pas en train de charger
if (!isAuthenticated && !isLoading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Session requise</h2>
        <p className="text-gray-600 mb-4">Veuillez vous connecter pour accéder à cette page</p>
        <button 
          onClick={() => router.push('/auth/login')}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Se connecter
        </button>
      </div>
    </div>
  )
}
```

### 3. AJOUTER DÉLAI DANS AuthContext

Ajouter un délai pour éviter les vérifications trop rapides :

```typescript
const initAuth = async () => {
  // Petit délai pour éviter les vérifications trop rapides
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    // ... reste du code
  } catch (error) {
    console.error('❌ Erreur init auth:', error)
    setUser(null)
    setSupabaseUser(null)
  } finally {
    setIsLoading(false)
  }
}
```

## POINTS CLÉS POUR COMPRENDRE LE PROBLÈME

1. **Timing des vérifications** : Le problème vient souvent du fait que `ProtectedRoute` vérifie l'authentification avant que `AuthContext` ait fini de charger

2. **Différenciation des événements** : Il faut distinguer entre les différents types d'événements Supabase (`SIGNED_OUT`, `TOKEN_REFRESHED`, etc.)

3. **Gestion des erreurs** : Les erreurs temporaires ne doivent pas causer de déconnexion

4. **État de chargement** : Un état `isLoading` bien géré évite les redirections prématurées

## INDICATEURS DE SUCCÈS

✅ L'utilisateur reste connecté après rechargement de page  
✅ La session persiste entre les onglets  
✅ Pas de redirection intempestive vers login  
✅ Les logs montrent le bon déroulement de l'authentification  
✅ Les tokens Supabase sont correctement rafraîchis  




