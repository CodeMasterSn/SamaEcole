import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Client admin pour bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()

    // Créer client Supabase SSR pour récupérer l'utilisateur
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Pas besoin de set en lecture seule
          },
        },
      }
    )

    // Récupérer l'utilisateur authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Non authentifié:', authError?.message)
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    console.log('✅ User authentifié:', user.email)

    // Utiliser le client admin pour récupérer les données (bypass RLS)
    const { data: utilisateur, error: userError } = await supabaseAdmin
      .from('utilisateurs')
      .select(`
        id,
        email,
        ecole_id,
        role,
        nom,
        prenom,
        ecoles (
          id,
          nom,
          adresse,
          telephone,
          email,
          logo_url,
          statut,
          type_compte
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !utilisateur) {
      console.error('❌ Utilisateur non trouvé:', userError)
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (!utilisateur.ecole_id) {
      console.error('❌ Pas d\'école associée')
      return NextResponse.json({ error: 'Pas d\'école associée' }, { status: 404 })
    }

    console.log('✅ École récupérée:', utilisateur.ecoles?.nom)

    return NextResponse.json({
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role
      },
      ecole: utilisateur.ecoles
    })

  } catch (error) {
    console.error('❌ Erreur API /api/ecole:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}