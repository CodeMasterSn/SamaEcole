# 🔧 COMMANDE DE DIAGNOSTIC - PROBLÈME SIGNED_IN MULTIPLE

## CORRECTION APPLIQUÉE

### ✅ AuthContext.tsx - Boucle infinie corrigée

**PROBLÈME :** 5 événements `SIGNED_IN` successifs indiquaient une boucle infinie d'authentification.

**CAUSE :** Le listener d'événements se déclenchait en boucle à cause des dépendances dans `useEffect`.

**SOLUTION APPLIQUÉE :**

```typescript
useEffect(() => {
  let mounted = true
  let authListener: any = null

  const initAuth = async () => {
    // ... logique d'initialisation unique
    console.log of profile loaded:', profile.role) // Log unique
  }

  initAuth()

  // Écouter SEULEMENT les événements importants
  authListener = supabase.auth.onAuthStateChange((event, session) => {
    if (!mounted) return
    
    // Ignorer les événements redondants
    if (event === 'TOKEN_REFRESHED') return
    
    console.log('🔑 Auth event:', event) // Log réduit
    
    if (event === 'SIGNED_OUT') {
      setUser(null)
      setUserRole(null) 
      setUserProfile(null)
      router.push('/auth/login')
    } else if (event === 'SIGNED_IN' && session?.user) {
      setUser(session.user)
      // Ne pas recharger le profil ici si déjà fait dans initAuth
    }
  })

  return () => {
    mounted = false
    authListener?.data?.subscription?.unsubscribe()
  }
}, []) // ← Dépendances vides - s'exécute UNE SEULE FOIS
```

## 🧪 COMMANDES DE DIAGNOSTIC

### 1. Vérifier le localStorage (CORRIGÉ)

```javascript
console.log(localStorage.getItem('sama-ecole-auth'))
```

✅ **Majuscule corrigée** : `sama-ecole-auth` au lieu de `SAMA-ECOLE-AUTH`

### 2. Vérifier les événements auth

```javascript
// Dans DevTools, vous devriez maintenant voir :
console.log('🔑 Auth event: INITIAL_SESSION')
console.log('✅ Profil chargé: admin')
console.log('🔑 Auth event: SIGNED_IN') // SEULEMENT 1 fois
```

### 3. Vérifier l'état du contexte

```javascript
// Vérifier que les données sont correctes
console.log({
  user: window.__NEXT_DATA__?.props?.pageProps,
  localStorage: Object.keys(localStorage),
  session: localStorage.getItem('sama-ecole-auth')
})
```

### 4. Dépurer les rechargements

```javascript
// Activser les logs de rechargement de page
let pageLoads = window.pageLoads || 0
window.pageLoads = ++pageLoads
console.log('📄 Page chargée:', pageLoads)

// Vérifier si le composant se re-monte
window.authMounts = window.authMounts || 0
```

## 🎯 RÉSULTATS ATTENDUS APRÈS CORRECTION

### ✅ Logs normaux (UN SEUL ÉVÉNEMENT)
```
🔑 Auth event: INITIAL_SESSION
✅ Profil chargé: admin
```

### ✅ Ou si reconnexion
```
🔑 Auth event: INITIAL_SESSION  
🔑 Auth event: SIGNED_IN
✅ Profil chargé: admin
```

### ❌ Logs anormaux (SI PROBLÈME PERSISTE)
```
🔑 Auth event: SIGNED_IN
🔑 Auth event: SIGNED_IN  
🔑 Auth event: SIGNED_IN  // ← Plusieurs fois = problème
```

## 🔧 ÉTAPES SUIVANTES

1. **Exécutez** la commande localStorage corrigée
2. **Vérifiez** que vous voyez seulement 1-2 événements auth
3. **Confirmez** que le dashboard se charge sans redirection vers login
4. **Testez** la navigation entre les pages

La boucle infinie des événements `SIGNED_IN` devrait maintenant être **résolue** !




