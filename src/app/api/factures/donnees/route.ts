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

    // Récupérer ecole_id de l'utilisateur
    const { data: utilisateur } = await supabaseAdmin
      .from('utilisateurs')
      .select('ecole_id')
      .eq('id', user.id)
      .single()

    if (!utilisateur?.ecole_id) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const ecoleId = utilisateur.ecole_id

    // Charger toutes les données en parallèle (avec admin, bypass RLS)
    const [elevesRes, classesRes, fraisRes] = await Promise.all([
      // Élèves avec leurs classes et parents
      supabaseAdmin
        .from('eleves')
        .select(`
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
        `)
        .eq('ecole_id', ecoleId)
        .eq('statut', 'actif')
        .order('nom'),

      // Classes
      supabaseAdmin
        .from('classes')
        .select('id, niveau, section, nom_complet')
        .eq('ecole_id', ecoleId)
        .order('niveau'),

      // Frais prédéfinis
      supabaseAdmin
        .from('frais_predefinis')
        .select('id, designation, montant, classe_niveau, obligatoire, actif')
        .eq('ecole_id', ecoleId)
        .eq('actif', true)
        .order('designation')
    ])

    if (elevesRes.error) {
      console.error('Erreur élèves:', elevesRes.error)
      return NextResponse.json({ error: 'Erreur chargement élèves' }, { status: 500 })
    }

    if (classesRes.error) {
      console.error('Erreur classes:', classesRes.error)
      return NextResponse.json({ error: 'Erreur chargement classes' }, { status: 500 })
    }

    if (fraisRes.error) {
      console.error('Erreur frais:', fraisRes.error)
      return NextResponse.json({ error: 'Erreur chargement frais' }, { status: 500 })
    }

    return NextResponse.json({
      eleves: elevesRes.data || [],
      classes: classesRes.data || [],
      frais: fraisRes.data || []
    })

  } catch (error) {
    console.error('Erreur API /api/factures/donnees:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
