import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Client serveur avec accès service_role (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Clé service_role
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filtreType = searchParams.get('type') || 'tous'
    const filtreNiveau = searchParams.get('niveau') || 'tous'
    const filtreEcole = searchParams.get('ecole') || 'tous'

    // Stats globales
    const { count: totalEcoles } = await supabaseAdmin
      .from('ecoles')
      .select('*', { count: 'exact', head: true })

    const { count: ecolesActives } = await supabaseAdmin
      .from('ecoles')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'actif')

    const { count: ecolesDemo } = await supabaseAdmin
      .from('ecoles')
      .select('*', { count: 'exact', head: true })
      .eq('type_compte', 'demo')

    const { count: totalUtilisateurs } = await supabaseAdmin
      .from('utilisateurs')
      .select('*', { count: 'exact', head: true })

    // Élèves depuis sante_ecoles
    const { data: santeData } = await supabaseAdmin
      .from('sante_ecoles')
      .select('nb_eleves')

    const totalEleves = santeData?.reduce((sum, e) => sum + (e.nb_eleves || 0), 0) || 0

    // Logs 24h
    const { count: logs24h } = await supabaseAdmin
      .from('logs_activite')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())

    // Erreurs 24h
    const { count: erreurs24h } = await supabaseAdmin
      .from('logs_activite')
      .select('*', { count: 'exact', head: true })
      .in('niveau', ['error', 'critical'])
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())

    // Santé écoles
    const { data: santeEcoles } = await supabaseAdmin
      .from('sante_ecoles')
      .select('*')
      .order('erreurs_24h', { ascending: false })

    // Logs avec filtres
    let logsQuery = supabaseAdmin
      .from('logs_activite')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (filtreType !== 'tous') logsQuery = logsQuery.eq('type', filtreType)
    if (filtreNiveau !== 'tous') logsQuery = logsQuery.eq('niveau', filtreNiveau)
    if (filtreEcole !== 'tous') logsQuery = logsQuery.eq('ecole_id', parseInt(filtreEcole))

    const { data: logs } = await logsQuery

    // Enrichir logs avec nom école
    const logsAvecEcoles = logs?.map(log => ({
      ...log,
      ecole_nom: santeEcoles?.find(e => e.id === log.ecole_id)?.nom || 'Super Admin'
    }))

    return NextResponse.json({
      stats: {
        total_ecoles: totalEcoles || 0,
        ecoles_actives: ecolesActives || 0,
        ecoles_demo: ecolesDemo || 0,
        total_utilisateurs: totalUtilisateurs || 0,
        total_eleves: totalEleves,
        logs_24h: logs24h || 0,
        erreurs_24h: erreurs24h || 0
      },
      santeEcoles: santeEcoles || [],
      logs: logsAvecEcoles || []
    })

  } catch (error) {
    console.error('Erreur API monitoring:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
