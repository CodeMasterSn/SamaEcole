'use client'

import { useEffect, useState } from 'react'

interface StatsPlateforme {
  total_ecoles: number
  ecoles_actives: number
  ecoles_demo: number
  total_utilisateurs: number
  total_eleves: number
  logs_24h: number
  erreurs_24h: number
}

interface SanteEcole {
  id: number
  nom: string
  statut: string
  type_compte: string
  nb_eleves: number
  erreurs_24h: number
  requetes_lentes_24h: number
  derniere_activite: string | null
  etat_sante: string
}

interface LogActivite {
  id: number
  ecole_id: number | null
  user_id: string | null
  type: string
  niveau: string
  action: string
  details: any
  error_message: string | null
  created_at: string
  ecole_nom?: string
}

export default function MonitoringPage() {
  const [stats, setStats] = useState<StatsPlateforme | null>(null)
  const [santeEcoles, setSanteEcoles] = useState<SanteEcole[]>([])
  const [logs, setLogs] = useState<LogActivite[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(() => {
    // Charger depuis localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('monitoring-auto-refresh')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  // Filtres
  const [filtreType, setFiltreType] = useState('tous')
  const [filtreNiveau, setFiltreNiveau] = useState('tous')
  const [filtreEcole, setFiltreEcole] = useState('tous')

  useEffect(() => {
    chargerDonnees()
  }, [filtreType, filtreNiveau, filtreEcole])

  // Timer de rafraîchissement automatique
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      console.log('🔄 Rafraîchissement automatique en arrière-plan...')
      chargerDonnees(true) // true = auto-refresh
      setLastUpdate(new Date())
    }, 30000) // 30 secondes
    
    return () => clearInterval(interval)
  }, [autoRefresh, filtreType, filtreNiveau, filtreEcole])

  const chargerDonnees = async (isAutoRefresh = false) => {
    try {
      // Si c'est un auto-refresh, ne pas afficher le loader complet
      if (isAutoRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log('🔍 Chargement données via API...')

      // Appeler l'API avec les filtres
      const params = new URLSearchParams({
        type: filtreType,
        niveau: filtreNiveau,
        ecole: filtreEcole
      })

      const response = await fetch(`/api/superadmin/monitoring?${params}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erreur API:', response.status, errorText)
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()

      console.log('✅ Données reçues:', {
        stats: data.stats,
        nb_ecoles: data.santeEcoles?.length,
        nb_logs: data.logs?.length
      })

      // Mettre à jour les states
      setStats(data.stats)
      setSanteEcoles(data.santeEcoles)
      setLogs(data.logs)

    } catch (error) {
      console.error('💥 Erreur chargement monitoring:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getNiveauBadge = (niveau: string) => {
    const config = {
      info: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'ℹ️' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠️' },
      error: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
      critical: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🔴' }
    }
    const c = config[niveau as keyof typeof config] || config.info
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${c.bg} ${c.text}`}>
        <span>{c.icon}</span>
        {niveau}
      </span>
    )
  }

  const getTooltipSante = (etat: string) => {
    const tooltips = {
      ok: 'École en bonne santé : élèves actifs, pas d\'erreurs récentes',
      attention: 'Attention requise : aucun élève ou quelques erreurs détectées',
      critique: 'État critique : nombreuses erreurs, intervention nécessaire'
    }
    return tooltips[etat as keyof typeof tooltips] || ''
  }

  const getEtatSanteBadge = (etat: string) => {
    const config = {
      ok: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      attention: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠️' },
      critique: { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴' }
    }
    const c = config[etat as keyof typeof config] || config.ok
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${c.bg} ${c.text}`}>
        <span>{c.icon}</span>
        {etat}
      </span>
    )
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoring & Santé</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble de la plateforme en temps réel</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Toggle auto-refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newValue = !autoRefresh
                setAutoRefresh(newValue)
                localStorage.setItem('monitoring-auto-refresh', String(newValue))
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </span>
          </div>
          
          {/* Dernière mise à jour */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {refreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            )}
            <span>Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}</span>
          </div>
          
          {/* Bouton refresh manuel */}
          <button
            onClick={() => {
              chargerDonnees()
              setLastUpdate(new Date())
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      {/* KPIs Globaux */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 transition-opacity duration-500 ${refreshing ? 'opacity-70' : 'opacity-100'}`}>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Écoles</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_ecoles || 0}</p>
              <p className="text-xs text-green-600 mt-1">{stats?.ecoles_actives || 0} actives</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏫</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Élèves</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.total_eleves || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Logs 24h</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.logs_24h || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Erreurs 24h</p>
              <p className={`text-3xl font-bold mt-2 ${(stats?.erreurs_24h || 0) > 10 ? 'text-red-600' : 'text-green-600'}`}>
                {stats?.erreurs_24h || 0}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${(stats?.erreurs_24h || 0) > 10 ? 'bg-red-100' : 'bg-green-100'}`}>
              <span className="text-2xl">{(stats?.erreurs_24h || 0) > 10 ? '🔴' : '✅'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Santé par École */}
      <div className={`bg-white rounded-xl shadow-sm border transition-opacity duration-500 ${refreshing ? 'opacity-70' : 'opacity-100'}`}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">🏫 Santé par École</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">École</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Élèves</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erreurs 24h</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santé</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {santeEcoles.map((ecole) => (
                <tr key={ecole.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{ecole.nom}</div>
                    <div className="text-sm text-gray-500">ID: {ecole.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{ecole.statut}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{ecole.nb_eleves}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${ecole.erreurs_24h > 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {ecole.erreurs_24h}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div title={getTooltipSante(ecole.etat_sante)} className="cursor-help">
                      {getEtatSanteBadge(ecole.etat_sante)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs d'Activité */}
      <div className={`bg-white rounded-xl shadow-sm border transition-opacity duration-500 ${refreshing ? 'opacity-70' : 'opacity-100'}`}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">📜 Logs d'Activité</h2>
              <span className="text-sm text-gray-500">
                {logs.length} / 50 logs max
              </span>
            </div>
            
            {/* Filtres */}
            <div className="flex gap-2">
              <select
                value={filtreType}
                onChange={(e) => setFiltreType(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="tous">Tous types</option>
                <option value="action">Actions</option>
                <option value="error">Erreurs</option>
                <option value="warning">Warnings</option>
                <option value="security">Sécurité</option>
              </select>

              <select
                value={filtreNiveau}
                onChange={(e) => setFiltreNiveau(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="tous">Tous niveaux</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>

              <button
                onClick={chargerDonnees}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                🔄 Rafraîchir
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">École</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-5xl">📋</div>
                      <p className="text-gray-900 font-medium">Aucun log trouvé</p>
                      <p className="text-sm text-gray-500">
                        {filtreType !== 'tous' || filtreNiveau !== 'tous' || filtreEcole !== 'tous' 
                          ? 'Essayez de modifier les filtres pour voir plus de résultats'
                          : 'Les logs d\'activité apparaîtront ici au fur et à mesure'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-700">{log.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getNiveauBadge(log.niveau)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{log.action || '-'}</div>
                      <div className="text-xs text-gray-500">{log.module}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.ecole_nom || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                      {log.error_message || JSON.stringify(log.details) || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}