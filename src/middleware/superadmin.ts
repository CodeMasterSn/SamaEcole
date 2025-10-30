import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function requireSuperAdmin() {
  const client = supabase
  
  // Vérifier authentification
  const { data: { user }, error: authError } = await client.auth.getUser()
  
  if (authError || !user) {
    redirect('/superadmin/login')
  }
  
  // Vérifier rôle super_admin
  const { data: role } = await client
    .from('roles_globaux')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (!role || role.role !== 'super_admin') {
    redirect('/dashboard')
  }
  
  return user
}
