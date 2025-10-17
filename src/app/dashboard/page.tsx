'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, GraduationCap, FileText, CreditCard, Plus, Loader2, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { obtenirStatistiquesEcole, obtenirEcole } from '@/lib/supabase-functions'
import { createAuthenticatedClient } from '@/lib/supabase-functions'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    nombreEleves: 0,
    nombreClasses: 0,
    facturesMois: 0,
    revenusMois: 0
  })
  const [kpiData, setKpiData] = useState({
    caMois: 0,
    elevesActifs: 0,
    tauxPaiement: 0,
    montantImpayes: 0
  })
  const [chartData, setChartData] = useState([])
  const [activites, setActivites] = useState([])
  const [ecoleNom, setEcoleNom] = useState('École')

  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        const ecole = await obtenirEcole()
        if (ecole) {
          setEcoleNom(ecole.nom || 'École')
          const statsData = await obtenirStatistiquesEcole(ecole.id!)
          setStats(statsData)
          
          // Charger les données KPI
          await chargerKPI()
          
          // Charger les données du graphique
          await chargerDonneesGraphique()
          
          // Charger les activités récentes
          await chargerActivitesRecentes()
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }
    
    const chargerKPI = async () => {
      try {
        const supabase = await createAuthenticatedClient()
        const maintenant = new Date()
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)

        // CA ce mois
        const { data: facturesMois } = await supabase
          .from('factures')
          .select('montant_total')
          .eq('statut', 'payee')
          .gte('date_emission', debutMois.toISOString())

        const caMois = facturesMois?.reduce((sum, f) => sum + (f.montant_total || 0), 0) || 0

        // Élèves actifs
        const { count: nbEleves } = await supabase
          .from('eleves')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'actif')

        // Taux paiement
        const { count: totalFactures } = await supabase
          .from('factures')
          .select('*', { count: 'exact', head: true })

        const { count: facturesPayees } = await supabase
          .from('factures')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'payee')

        const tauxPaiement = totalFactures && totalFactures > 0 ? Math.round((facturesPayees / totalFactures) * 100) : 0

        // Impayés
        const { data: facturesImpayees } = await supabase
          .from('factures')
          .select('montant_total')
          .eq('statut', 'impayee')

        const montantImpayes = facturesImpayees?.reduce((sum, f) => sum + (f.montant_total || 0), 0) || 0

        setKpiData({
          caMois,
          elevesActifs: nbEleves || 0,
          tauxPaiement,
          montantImpayes
        })
      } catch (error) {
        console.error('Erreur KPI:', error)
      }
    }
    
    const chargerDonneesGraphique = async () => {
      try {
        const supabase = await createAuthenticatedClient()
        const maintenant = new Date()
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
        const jourActuel = maintenant.getDate()

        const joursData = []

        // Pour chaque jour du mois jusqu'à aujourd'hui
        for (let jour = 1; jour <= jourActuel; jour++) {
          const dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), jour, 0, 0, 0)
          const dateFin = new Date(maintenant.getFullYear(), maintenant.getMonth(), jour, 23, 59, 59)
          
          const { data } = await supabase
            .from('factures')
            .select('montant_total')
            .eq('statut', 'payee')
            .gte('date_emission', dateDebut.toISOString())
            .lte('date_emission', dateFin.toISOString())
          
          const caJour = data?.reduce((sum, f) => sum + (f.montant_total || 0), 0) || 0
          
          joursData.push({
            jour: jour.toString(),
            montant: caJour
          })
        }

        console.log('Données graphique jour par jour:', joursData)
        setChartData(joursData)
      } catch (error) {
        console.error('Erreur graphique:', error)
      }
    }
    
    const chargerActivitesRecentes = async () => {
      try {
        const supabase = await createAuthenticatedClient()
        
        console.log('Début chargement activités...')
        
        // Charger les 5 dernières factures
        const { data: dernieresFactures, error: errorFactures } = await supabase
          .from('factures')
          .select(`
            id,
            numero_facture,
            montant_total,
            created_at,
            eleves (
              nom,
              prenom
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (errorFactures) console.error('Erreur factures:', errorFactures)
        console.log('Dernières factures:', dernieresFactures)

        // Charger les 5 derniers reçus
        const { data: derniersRecus, error: errorRecus } = await supabase
          .from('recus')
          .select(`
            id,
            numero_recu,
            montant_recu,
            created_at,
            factures (
              numero_facture,
              eleves (
                nom,
                prenom
              )
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (errorRecus) console.error('Erreur reçus:', errorRecus)
        console.log('Derniers reçus:', derniersRecus)

        // Fusionner et formater les activités
        const activitesData = [
          ...(dernieresFactures || []).map(f => ({
            type: 'facture' as const,
            eleve: `${f.eleves?.prenom || ''} ${f.eleves?.nom || ''}`.trim(),
            montant: f.montant_total || 0,
            date: f.created_at,
            reference: f.numero_facture
          })),
          ...(derniersRecus || []).map(r => ({
            type: 'paiement' as const,
            eleve: `${r.factures?.eleves?.prenom || ''} ${r.factures?.eleves?.nom || ''}`.trim(),
            montant: r.montant_recu || 0,
            date: r.created_at,
            reference: r.numero_recu
          }))
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)

        console.log('Activités finales:', activitesData)
        setActivites(activitesData)
      } catch (error) {
        console.error('Erreur activités:', error)
        // En cas d'erreur, mettre des données de test
        setActivites([
          {
            type: 'facture',
            eleve: 'Test Élève',
            montant: 50000,
            date: new Date().toISOString()
          }
        ])
      }
    }
    
    chargerDonnees()
  }, [])

  // Fonction helper pour date relative
  const getTempsRelatif = (date: string) => {
    const maintenant = new Date()
    const dateActivite = new Date(date)
    const diffMs = maintenant.getTime() - dateActivite.getTime()
    const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffJours === 0) return "Aujourd'hui"
    if (diffJours === 1) return "Hier"
    return `Il y a ${diffJours} jours`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Bienvenue sur Sama École ! 👋</h1>
        <p className="text-purple-100 text-lg">Tableau de bord - {ecoleNom}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CA ce mois */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA ce mois</CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{kpiData.caMois.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>

        {/* Élèves actifs */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élèves actifs</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpiData.elevesActifs}</div>
          </CardContent>
        </Card>

        {/* Taux de paiement */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de paiement</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpiData.tauxPaiement}%</div>
          </CardContent>
        </Card>

        {/* Impayés */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impayés</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpiData.montantImpayes.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique CA Mensuel Jour par Jour + Activités Récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique CA */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                CA du mois - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="jour" 
                      label={{ value: 'Jour du mois', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Montant (FCFA)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      domain={[0, 'auto']}
                      tickCount={5}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value.toLocaleString()} FCFA`, 'Montant']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="montant" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Chargement des données...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activités Récentes */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Activités récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {activites.length > 0 ? (
                <div className="space-y-3">
                  {activites.map((activite, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className={`p-2 rounded-lg ${
                        activite.type === 'facture' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {activite.type === 'facture' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activite.eleve}</p>
                        <p className="text-xs text-gray-500">
                          {activite.type === 'facture' ? 'Facture créée' : 'Paiement reçu'}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {activite.montant.toLocaleString()} FCFA
                        </p>
                        <p className="text-xs text-gray-400">
                          {getTempsRelatif(activite.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Chargement des activités...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élèves inscrits</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nombreEleves}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes actives</CardTitle>
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nombreClasses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures ce mois</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.facturesMois}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus (FCFA)</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revenusMois.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/dashboard/eleves/nouveau">
            <Button className="w-full gap-2 bg-gradient-to-r from-purple-600 to-purple-700">
              <Plus className="w-4 h-4" />
              Ajouter un élève
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}