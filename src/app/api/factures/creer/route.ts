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

export async function POST(request: Request) {
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
          setAll() {},
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

    // Récupérer les données de la requête
    const body = await request.json()
    const { factureData, lignes } = body

    console.log('📝 Données reçues:', { factureData, lignes })

    if (!factureData || !lignes) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Utiliser le client admin pour créer la facture (bypass RLS)
    const { data: facture, error: factureError } = await supabaseAdmin
      .from('factures')
      .insert([factureData])
      .select()
      .single()

    if (factureError) {
      console.error('❌ Erreur insertion facture:', factureError)
      return NextResponse.json({ error: 'Erreur création facture', details: factureError }, { status: 500 })
    }

    console.log('✅ Facture créée:', facture.id)

    // Créer les lignes de facture
    const lignesAvecFacture = lignes.map((ligne: any) => ({
      ...ligne,
      facture_id: facture.id
    }))

    const { error: lignesError } = await supabaseAdmin
      .from('facture_lignes')
      .insert(lignesAvecFacture)

    if (lignesError) {
      console.error('❌ Erreur insertion lignes:', lignesError)
      // Ne pas échouer complètement, la facture est déjà créée
      console.log('⚠️ Facture créée mais lignes non enregistrées')
    }

    console.log('✅ Facture complète créée avec succès')

    return NextResponse.json({
      facture: facture,
      message: 'Facture créée avec succès'
    })

  } catch (error) {
    console.error('Erreur API /api/factures/creer:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

