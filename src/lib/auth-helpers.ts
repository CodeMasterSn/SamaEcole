import { supabase } from '@/lib/supabase'

export async function logout() {
  const client = supabase
  
  // Vérifier si c'est un super admin
  const { data: { user } } = await client.auth.getUser()
  
  let redirectUrl = '/login' // Par défaut, connexion école
  
  if (user) {
    const { data: role } = await client
      .from('roles_globaux')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    // Si super admin, rediriger vers login super admin
    if (role?.role === 'super_admin') {
      redirectUrl = '/superadmin/login'
    }
  }
  
  const { error } = await client.auth.signOut()
  
  if (error) {
    console.error('Erreur déconnexion:', error)
    alert('Erreur lors de la déconnexion')
    return false
  }
  
  // Rediriger
  window.location.href = redirectUrl
  return true
}
