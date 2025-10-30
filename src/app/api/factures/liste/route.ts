import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Client admin
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

    // Créer client SSR pour auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    // Vérifier auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer ecole_id
    const { data: utilisateur } = await supabaseAdmin
      .from('utilisateurs')
      .select('ecole_id')
      .eq('id', user.id)
      .single()

    if (!utilisateur?.ecole_id) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const ecoleId = utilisateur.ecole_id

    console.log(`🔍 Chargement factures pour école ${ecoleId}`)

    // Charger les factures avec admin (bypass RLS)
    const { data: factures, error: facturesError } = await supabaseAdmin
      .from('factures')
      .select(`
        *,
        eleves (
          id,
          nom,
          prenom,
          matricule,
          classe_id,
          classes (
            id,
            niveau,
            section,
            nom_complet
          ),
          parents_tuteurs (
            id,
            nom,
            prenom,
            telephone,
            email,
            relation
          )
        ),
        details:facture_lignes (
          id,
          designation,
          quantite,
          tarif,
          montant
        )
      `)
      .eq('ecole_id', ecoleId)
      .order('created_at', { ascending: false })

    if (facturesError) {
      console.error('❌ Erreur chargement factures:', facturesError)
      return NextResponse.json({ error: 'Erreur chargement' }, { status: 500 })
    }

    console.log(`✅ ${factures?.length || 0} factures chargées pour école ${ecoleId}`)

    return NextResponse.json({
      factures: factures || []
    })

  } catch (error) {
    console.error('❌ Erreur API /api/factures/liste:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

