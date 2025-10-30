'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Stats {
  ecoles_actives: number
  ecoles_demo: number
  demandes_attente: number
  total_eleves: number
  factures_30j: number
  ca_30j: number
}

interface Ecole {
  id: number
  nom: string
  statut: string
  type_compte: string
  nb_eleves: number
  created_at: string
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [ecoles, setEcoles] = useState<Ecole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    const client = supabase
    
    // Charger statistiques globales
    const { data: statsData } = await client
      .from('stats_globales')
      .select('*')
      .single()
    
    setStats(statsData)
    
    // Charger les écoles récentes
    const { data: ecolesData } = await client
      .from('ecoles')
      .select('id, nom, statut, type_compte, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Charger les stats depuis sante_ecoles
    const { data: santeEcoles } = await client
      .from('sante_ecoles')
      .select('id, nb_eleves')

    // Fusionner les données
    const ecolesAvecStats = ecolesData?.map(ecole => ({
      ...ecole,
      nb_eleves: santeEcoles?.find(s => s.id === ecole.id)?.nb_eleves || 0
    })) || []

    setEcoles(ecolesAvecStats)
    setLoading(false)
  }

  const getStatutBadge = (statut: string) => {
    const styles = {
      actif: 'bg-green-100 text-green-800',
      demo: 'bg-orange-100 text-orange-800',
      suspendu: 'bg-yellow-100 text-yellow-800',
      bloque: 'bg-red-100 text-red-800'
    }
    return styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Super Admin</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de la plateforme Sama École</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Écoles Actives</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.ecoles_actives || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏫</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Demandes en attente</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {stats?.demandes_attente || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Élèves</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats?.total_eleves?.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CA 30 jours</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {(stats?.ca_30j || 0).toLocaleString()} F
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste écoles récentes */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Écoles récentes</h2>
            <a 
              href="/superadmin/ecoles" 
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Voir tout →
            </a>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  École
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Élèves
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date création
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ecoles.map((ecole) => (
                <tr key={ecole.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{ecole.nom}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadge(ecole.statut)}`}>
                      {ecole.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ecole.type_compte}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {ecole.nb_eleves}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(ecole.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
