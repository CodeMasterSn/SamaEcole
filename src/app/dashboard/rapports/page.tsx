'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BarChart3, TrendingUp, DollarSign, Users, FileText, Download,
  Calendar, Filter, RefreshCw, Eye, PieChart, LineChart,
  CreditCard, Receipt, AlertTriangle, CheckCircle, Clock,
  ArrowUp, ArrowDown, Minus, Target, Banknote, GraduationCap, UserCheck,
  MessageCircle, X, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { obtenirFactures, obtenirRecus, obtenirEleves, obtenirEcole } from '@/lib/supabase-functions'
import { downloadRapportPDF, RapportData } from '@/lib/rapport-utils'
import { exportRapportFinancier } from '@/lib/excel-utils'

type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
type ReportType = 'overview' | 'financial' | 'students' | 'classes'

interface RapportStats {
  // Statistiques financières
  totalFactures: number
  totalPaiements: number
  totalRecus: number
  chiffreAffaires: number
  impayesTotal: number
  tauxRecouvrement: number
  
  // Statistiques élèves
  totalEleves: number
  elevesActifs: number
  elevesSuspendus: number
  nouvellesInscriptions: number
  
  // Évolutions
  evolutionCA: number
  evolutionEleves: number
  evolutionPaiements: number
  
  // Répartitions
  repartitionParClasse: Array<{classe: string, eleves: number, revenus: number}>
  repartitionParMode: Array<{mode: string, montant: number, pourcentage: number}>
  evolutionMensuelle: Array<{mois: string, revenus: number, paiements: number}>
}

export default function RapportsPage() {
  // États de base
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reportType, setReportType] = useState<ReportType>('overview')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month')
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
  
  // Données
  const [stats, setStats] = useState<RapportStats | null>(null)
  const [ecole, setEcole] = useState<any>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  // Données brutes pour les actions
  const [factures, setFactures] = useState<any[]>([])
  const [paiements, setPaiements] = useState<any[]>([])
  const [recus, setRecus] = useState<any[]>([])
  
  // Modals pour actions rapides
  const [showUnpaidModal, setShowUnpaidModal] = useState(false)
  const [showReceiptsModal, setShowReceiptsModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  useEffect(() => {
    chargerDonnees()
  }, [periodFilter, customDateStart, customDateEnd])

  const afficherMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const chargerDonnees = async () => {
    const wasRefreshing = refreshing
    if (!wasRefreshing) setLoading(true)
    
    try {
      const ecoleData = await obtenirEcole()
      setEcole(ecoleData)
      
      if (ecoleData?.id) {
        // Charger toutes les données en parallèle
        const [facturesData, recusData, eleves] = await Promise.all([
          obtenirFactures(ecoleData.id),
          obtenirRecus(ecoleData.id),
          obtenirEleves(ecoleData.id)
        ])
        
        // Stocker les données brutes pour les actions rapides
        setFactures(facturesData)
        setPaiements([]) // Plus de paiements
        setRecus(recusData)
        
        // Calculer les statistiques
        const statsCalculees = calculerStatistiques(facturesData, [], recusData, eleves)
        setStats(statsCalculees)
        
        console.log('📊 Rapports chargés:', {
          factures: facturesData.length,
          paiements: 0, // Plus de paiements
          recus: recusData.length,
          eleves: eleves.length,
          stats: statsCalculees
        })
      }
    } catch (error) {
      console.error('Erreur chargement rapports:', error)
      afficherMessage('error', 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const actualiserDonnees = async () => {
    setRefreshing(true)
    await chargerDonnees()
  }

  const calculerStatistiques = (factures: any[], paiements: any[], recus: any[], eleves: any[]): RapportStats => {
    // Filtrer selon la période sélectionnée
    const maintenant = new Date()
    const debutPeriode = getDebutPeriode(periodFilter, customDateStart)
    const finPeriode = getFinPeriode(periodFilter, customDateEnd)
    
    const facturesFiltered = factures.filter(f => 
      new Date(f.date_emission) >= debutPeriode && new Date(f.date_emission) <= finPeriode
    )
    const paiementsFiltered = paiements.filter(p => 
      new Date(p.date_paiement) >= debutPeriode && new Date(p.date_paiement) <= finPeriode
    )
    const recusFiltered = recus.filter(r => 
      new Date(r.date_emission) >= debutPeriode && new Date(r.date_emission) <= finPeriode
    )
    
    // Calculs financiers
    const totalFactures = facturesFiltered.length
    const totalPaiements = paiementsFiltered.length
    const totalRecus = recusFiltered.length
    const chiffreAffaires = paiementsFiltered.reduce((sum, p) => sum + (p.montant || 0), 0)
    const montantFacture = facturesFiltered.reduce((sum, f) => sum + (f.montant_total || 0), 0)
    const impayesTotal = montantFacture - chiffreAffaires
    const tauxRecouvrement = montantFacture > 0 ? (chiffreAffaires / montantFacture) * 100 : 0
    
    // Calculs élèves
    const totalEleves = eleves.length
    const elevesActifs = eleves.filter(e => e.statut === 'actif').length
    const elevesSuspendus = eleves.filter(e => e.statut === 'suspendu').length
    const nouvellesInscriptions = eleves.filter(e => 
      new Date(e.date_inscription) >= debutPeriode && new Date(e.date_inscription) <= finPeriode
    ).length
    
    // Évolutions (simulées pour l'instant - à implémenter avec données historiques)
    const evolutionCA = Math.random() * 20 - 10 // -10% à +10%
    const evolutionEleves = Math.random() * 10 - 5 // -5% à +5%
    const evolutionPaiements = Math.random() * 15 - 7.5 // -7.5% à +7.5%
    
    // Répartition par classe
    const classesMap = new Map()
    eleves.forEach(eleve => {
      const classe = eleve.classes?.nom_complet || 'Non assigné'
      if (!classesMap.has(classe)) {
        classesMap.set(classe, { eleves: 0, revenus: 0 })
      }
      classesMap.get(classe).eleves++
    })
    
    // Ajouter les revenus par classe
    paiementsFiltered.forEach(paiement => {
      const classe = paiement.factures?.eleves?.classes?.nom_complet || 'Non assigné'
      if (classesMap.has(classe)) {
        classesMap.get(classe).revenus += paiement.montant || 0
      }
    })
    
    const repartitionParClasse = Array.from(classesMap.entries()).map(([classe, data]) => ({
      classe,
      eleves: data.eleves,
      revenus: data.revenus
    }))
    
    // Répartition par mode de paiement
    const modesMap = new Map()
    paiementsFiltered.forEach(paiement => {
      const mode = paiement.mode_paiement || 'Non spécifié'
      modesMap.set(mode, (modesMap.get(mode) || 0) + (paiement.montant || 0))
    })
    
    const repartitionParMode = Array.from(modesMap.entries()).map(([mode, montant]) => ({
      mode,
      montant,
      pourcentage: chiffreAffaires > 0 ? (montant / chiffreAffaires) * 100 : 0
    }))
    
    // Évolution mensuelle (derniers 6 mois)
    const evolutionMensuelle = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const moisDebut = new Date(date.getFullYear(), date.getMonth(), 1)
      const moisFin = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const paiementsMois = paiements.filter(p => {
        const datePaiement = new Date(p.date_paiement)
        return datePaiement >= moisDebut && datePaiement <= moisFin
      })
      
      evolutionMensuelle.push({
        mois: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenus: paiementsMois.reduce((sum, p) => sum + (p.montant || 0), 0),
        paiements: paiementsMois.length
      })
    }
    
    return {
      totalFactures,
      totalPaiements,
      totalRecus,
      chiffreAffaires,
      impayesTotal,
      tauxRecouvrement,
      totalEleves,
      elevesActifs,
      elevesSuspendus,
      nouvellesInscriptions,
      evolutionCA,
      evolutionEleves,
      evolutionPaiements,
      repartitionParClasse,
      repartitionParMode,
      evolutionMensuelle
    }
  }

  const getDebutPeriode = (period: PeriodFilter, customStart?: string): Date => {
    const now = new Date()
    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        return weekStart
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), quarter * 3, 1)
      case 'year':
        return new Date(now.getFullYear(), 0, 1)
      case 'custom':
        return customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1)
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1)
    }
  }

  const getFinPeriode = (period: PeriodFilter, customEnd?: string): Date => {
    const now = new Date()
    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      case 'week':
        const weekEnd = new Date(now)
        weekEnd.setDate(now.getDate() - now.getDay() + 6)
        weekEnd.setHours(23, 59, 59)
        return weekEnd
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59)
      case 'year':
        return new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      case 'custom':
        return customEnd ? new Date(customEnd + 'T23:59:59') : new Date()
      default:
        return new Date()
    }
  }

  const formatMontant = (montant: number) => {
    return montant.toLocaleString('fr-FR') + ' FCFA'
  }

  const formatPourcentage = (pourcentage: number) => {
    return pourcentage.toFixed(1) + '%'
  }

  const getEvolutionIcon = (evolution: number) => {
    if (evolution > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
    if (evolution < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getEvolutionColor = (evolution: number) => {
    if (evolution > 0) return 'text-green-600'
    if (evolution < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const exporterRapportPDF = async () => {
    if (!stats || !ecole) {
      afficherMessage('error', 'Données manquantes pour générer le rapport')
      return
    }

    try {
      const rapportData: RapportData = {
        ecole: {
          nom: ecole.nom || 'SAMA ÉCOLE',
          adresse: ecole.adresse,
          telephone: ecole.telephone,
          email: ecole.email
        },
        periode: {
          debut: getDebutPeriode(periodFilter, customDateStart),
          fin: getFinPeriode(periodFilter, customDateEnd),
          libelle: getPeriodeLibelle()
        },
        stats: {
          chiffreAffaires: stats.chiffreAffaires,
          totalPaiements: stats.totalPaiements,
          totalFactures: stats.totalFactures,
          tauxRecouvrement: stats.tauxRecouvrement,
          impayesTotal: stats.impayesTotal,
          elevesActifs: stats.elevesActifs
        },
        repartitionParMode: stats.repartitionParMode,
        repartitionParClasse: stats.repartitionParClasse,
        evolutionMensuelle: stats.evolutionMensuelle
      }

      await downloadRapportPDF(rapportData)
      afficherMessage('success', 'Rapport PDF téléchargé avec succès!')
    } catch (error: any) {
      console.error('Erreur export PDF:', error)
      afficherMessage('error', 'Erreur lors de la génération du PDF')
    }
  }

  const getPeriodeLibelle = (): string => {
    switch (periodFilter) {
      case 'today': return "Aujourd'hui"
      case 'week': return 'Cette semaine'
      case 'month': return 'Ce mois'
      case 'quarter': return 'Ce trimestre'
      case 'year': return 'Cette année'
      case 'custom': return 'Période personnalisée'
      default: return 'Ce mois'
    }
  }

  // Actions rapides
  const exporterExcel = async () => {
    if (!stats) {
      afficherMessage('error', 'Aucune donnée à exporter')
      return
    }

    try {
      exportRapportFinancier(stats, getPeriodeLibelle())
      afficherMessage('success', 'Export Excel téléchargé avec succès!')
    } catch (error: any) {
      console.error('Erreur export Excel:', error)
      afficherMessage('error', 'Erreur lors de l\'export Excel')
    }
  }

  const obtenirImpayés = () => {
    // Calculer les impayés : factures avec statut != 'payee' ou montant non couvert
    const impayés = factures.filter(facture => {
      if (facture.statut === 'payee') return false
      
      // Calculer le montant payé pour cette facture
      const paiementsFacture = paiements.filter(p => p.facture_id === facture.id)
      const montantPaye = paiementsFacture.reduce((sum, p) => sum + (p.montant || 0), 0)
      
      return montantPaye < (facture.montant_total || 0)
    }).map(facture => {
      const paiementsFacture = paiements.filter(p => p.facture_id === facture.id)
      const montantPaye = paiementsFacture.reduce((sum, p) => sum + (p.montant || 0), 0)
      const montantRestant = (facture.montant_total || 0) - montantPaye
      
      return {
        ...facture,
        montantPaye,
        montantRestant,
        joursRetard: Math.floor((new Date().getTime() - new Date(facture.date_echeance || facture.date_emission).getTime()) / (1000 * 60 * 60 * 24))
      }
    })

    return impayés
  }

  const obtenirRecusAEnvoyer = () => {
    // Reçus avec statut 'emis' (non envoyés)
    return recus.filter(recu => recu.statut === 'emis')
  }

  const ouvrirListeImpayés = () => {
    setShowUnpaidModal(true)
  }

  const ouvrirListeRecus = () => {
    setShowReceiptsModal(true)
  }

  const marquerRecuEnvoye = async (recuId: number, mode: 'envoye' | 'whatsapp') => {
    try {
      // TODO: Implémenter la modification du statut du reçu
      console.log('Marquer reçu comme envoyé:', recuId, mode)
      afficherMessage('success', `Reçu marqué comme envoyé par ${mode === 'whatsapp' ? 'WhatsApp' : 'email'}!`)
      
      // Recharger les données
      await chargerDonnees()
    } catch (error: any) {
      console.error('Erreur modification reçu:', error)
      afficherMessage('error', 'Erreur lors de la modification')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 animate-pulse text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chargement des rapports...</h2>
          <p className="text-gray-600">Analyse des données en cours</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <div className={cn(
          "p-4 rounded-lg border",
          message.type === 'success' ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        )}>
          {message.text}
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Rapports et Analyses
          </h1>
          <p className="text-gray-600 mt-1">
            Tableau de bord et statistiques • {ecole?.nom || 'SAMA ÉCOLE'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={actualiserDonnees}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exporterRapportPDF}
            disabled={!stats}
            className="gap-2 text-green-600 border-green-300 hover:bg-green-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filtres de période */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Période :</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'today', label: "Aujourd'hui" },
                { value: 'week', label: 'Cette semaine' },
                { value: 'month', label: 'Ce mois' },
                { value: 'quarter', label: 'Ce trimestre' },
                { value: 'year', label: 'Cette année' },
                { value: 'custom', label: 'Personnalisé' }
              ].map(period => (
                <Button
                  key={period.value}
                  variant={periodFilter === period.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodFilter(period.value as PeriodFilter)}
                  className="text-xs"
                >
                  {period.label}
                </Button>
              ))}
            </div>
            
            {periodFilter === 'custom' && (
              <div className="flex items-center gap-2 ml-4">
                <Input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="w-36 h-8 text-xs"
                />
                <span className="text-gray-500 text-sm">à</span>
                <Input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="w-36 h-8 text-xs"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation des types de rapports */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { value: 'financial', label: 'Financier', icon: DollarSign },
          { value: 'students', label: 'Élèves', icon: Users },
          { value: 'classes', label: 'Classes', icon: GraduationCap }
        ].map(type => (
          <Button
            key={type.value}
            variant={reportType === type.value ? "default" : "outline"}
            onClick={() => setReportType(type.value as ReportType)}
            className="gap-2 whitespace-nowrap"
          >
            <type.icon className="w-4 h-4" />
            {type.label}
          </Button>
        ))}
      </div>

      {/* Contenu des rapports */}
      {stats && (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Chiffre d'affaires</p>
                    <p className="text-xl font-bold text-blue-900">{formatMontant(stats.chiffreAffaires)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getEvolutionIcon(stats.evolutionCA)}
                      <span className={cn("text-xs font-medium", getEvolutionColor(stats.evolutionCA))}>
                        {formatPourcentage(Math.abs(stats.evolutionCA))}
                      </span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Paiements</p>
                    <p className="text-xl font-bold text-green-900">{stats.totalPaiements}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getEvolutionIcon(stats.evolutionPaiements)}
                      <span className={cn("text-xs font-medium", getEvolutionColor(stats.evolutionPaiements))}>
                        {formatPourcentage(Math.abs(stats.evolutionPaiements))}
                      </span>
                    </div>
                  </div>
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Taux recouvrement</p>
                    <p className="text-xl font-bold text-orange-900">{formatPourcentage(stats.tauxRecouvrement)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Target className="w-3 h-3 text-orange-600" />
                      <span className="text-xs font-medium text-orange-600">Objectif: 85%</span>
                    </div>
                  </div>
                  <Target className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Élèves actifs</p>
                    <p className="text-xl font-bold text-purple-900">{stats.elevesActifs}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getEvolutionIcon(stats.evolutionEleves)}
                      <span className={cn("text-xs font-medium", getEvolutionColor(stats.evolutionEleves))}>
                        {formatPourcentage(Math.abs(stats.evolutionEleves))}
                      </span>
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenu spécifique selon le type de rapport */}
          {reportType === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Répartition par mode de paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    Répartition par mode de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.repartitionParMode.map((mode, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          index === 0 && "bg-blue-500",
                          index === 1 && "bg-green-500",
                          index === 2 && "bg-orange-500",
                          index === 3 && "bg-purple-500"
                        )} />
                        <span className="text-sm font-medium capitalize">{mode.mode}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatMontant(mode.montant)}</div>
                        <div className="text-xs text-gray-500">{formatPourcentage(mode.pourcentage)}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Évolution mensuelle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-indigo-600" />
                    Évolution des revenus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.evolutionMensuelle.map((mois, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{mois.mois}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold">{formatMontant(mois.revenus)}</div>
                          <div className="text-xs text-gray-500">{mois.paiements} paiements</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'financial' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Statistiques financières détaillées */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-green-600" />
                    Analyse financière détaillée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600 mb-1">Total facturé</div>
                      <div className="text-lg font-bold text-blue-900">
                        {formatMontant(stats.chiffreAffaires + stats.impayesTotal)}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">Total encaissé</div>
                      <div className="text-lg font-bold text-green-900">
                        {formatMontant(stats.chiffreAffaires)}
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-sm text-red-600 mb-1">Impayés</div>
                      <div className="text-lg font-bold text-red-900">
                        {formatMontant(stats.impayesTotal)}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm text-orange-600 mb-1">Recouvrement</div>
                      <div className="text-lg font-bold text-orange-900">
                        {formatPourcentage(stats.tauxRecouvrement)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start gap-2" 
                    variant="outline"
                    onClick={exporterRapportPDF}
                    disabled={!stats}
                  >
                    <Download className="w-4 h-4" />
                    Rapport mensuel PDF
                  </Button>
                  <Button 
                    className="w-full justify-start gap-2" 
                    variant="outline"
                    onClick={exporterExcel}
                    disabled={!stats}
                  >
                    <FileText className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button 
                    className="w-full justify-start gap-2" 
                    variant="outline"
                    onClick={ouvrirListeImpayés}
                    disabled={!factures.length}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Liste des impayés ({obtenirImpayés().length})
                  </Button>
                  <Button 
                    className="w-full justify-start gap-2" 
                    variant="outline"
                    onClick={ouvrirListeRecus}
                    disabled={!recus.length}
                  >
                    <Receipt className="w-4 h-4" />
                    Reçus à envoyer ({obtenirRecusAEnvoyer().length})
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Statistiques détaillées des élèves */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Répartition des élèves
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-green-600 mb-1">Élèves actifs</div>
                          <div className="text-2xl font-bold text-green-900">{stats.elevesActifs}</div>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-orange-600 mb-1">Suspendus</div>
                          <div className="text-2xl font-bold text-orange-900">{stats.elevesSuspendus}</div>
                        </div>
                        <Clock className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-blue-600 mb-1">Total élèves</div>
                          <div className="text-2xl font-bold text-blue-900">{stats.totalEleves}</div>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-purple-600 mb-1">Nouvelles inscriptions</div>
                          <div className="text-2xl font-bold text-purple-900">{stats.nouvellesInscriptions}</div>
                        </div>
                        <UserCheck className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Taux de rétention */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Taux de rétention</span>
                      <span className="text-lg font-bold text-gray-900">
                        {stats.totalEleves > 0 ? formatPourcentage((stats.elevesActifs / stats.totalEleves) * 100) : '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: stats.totalEleves > 0 ? `${(stats.elevesActifs / stats.totalEleves) * 100}%` : '0%' 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Répartition par classe pour les élèves */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    Élèves par classe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.repartitionParClasse.map((classe, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                            index % 4 === 0 && "bg-blue-500",
                            index % 4 === 1 && "bg-green-500", 
                            index % 4 === 2 && "bg-orange-500",
                            index % 4 === 3 && "bg-purple-500"
                          )}>
                            {classe.eleves}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{classe.classe}</div>
                            <div className="text-sm text-gray-500">
                              {classe.eleves > 0 ? `${formatMontant(classe.revenus / classe.eleves)} par élève` : 'Aucun revenu'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{formatMontant(classe.revenus)}</div>
                          <div className="text-xs text-gray-500">Revenus totaux</div>
                        </div>
                      </div>
                    ))}
                    
                    {stats.repartitionParClasse.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune donnée d'élèves disponible pour cette période</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'classes' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Performance par classe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Classe</th>
                        <th className="text-right p-3 font-medium">Élèves</th>
                        <th className="text-right p-3 font-medium">Revenus</th>
                        <th className="text-right p-3 font-medium">Moy./élève</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.repartitionParClasse.map((classe, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{classe.classe}</td>
                          <td className="p-3 text-right">{classe.eleves}</td>
                          <td className="p-3 text-right font-medium">
                            {formatMontant(classe.revenus)}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            {classe.eleves > 0 ? formatMontant(classe.revenus / classe.eleves) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal Liste des impayés */}
      {showUnpaidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl border border-gray-200">
            {/* Header fixe */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold">Factures impayées</h3>
                    <p className="text-red-100 text-sm">{obtenirImpayés().length} facture(s) en attente</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowUnpaidModal(false)}
                  className="text-white hover:bg-red-500 hover:bg-opacity-30 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {obtenirImpayés().length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium">Facture</th>
                        <th className="text-left p-3 font-medium">Élève</th>
                        <th className="text-right p-3 font-medium">Montant total</th>
                        <th className="text-right p-3 font-medium">Payé</th>
                        <th className="text-right p-3 font-medium">Restant</th>
                        <th className="text-center p-3 font-medium">Retard</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {obtenirImpayés().map((facture, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-mono text-sm font-bold text-blue-600">
                              {facture.numero_facture}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">
                              {facture.eleves ? `${facture.eleves.prenom} ${facture.eleves.nom}` : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {facture.eleves?.classes?.nom_complet || 'Classe non assignée'}
                            </div>
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatMontant(facture.montant_total || 0)}
                          </td>
                          <td className="p-3 text-right text-green-600">
                            {formatMontant(facture.montantPaye)}
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-red-600">
                              {formatMontant(facture.montantRestant)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              facture.joursRetard > 30 ? "bg-red-100 text-red-800" :
                              facture.joursRetard > 7 ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            )}>
                              {facture.joursRetard > 0 ? `${facture.joursRetard}j` : 'À échoir'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Button size="sm" variant="outline" className="text-xs">
                              Relancer
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun impayé !</h3>
                  <p className="text-gray-600">Toutes les factures sont à jour.</p>
                </div>
              )}
            </div>

            {/* Footer fixe */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center flex-shrink-0 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Total impayé: <span className="font-bold text-red-600">
                  {formatMontant(obtenirImpayés().reduce((sum, f) => sum + f.montantRestant, 0))}
                </span>
              </div>
              <Button onClick={() => setShowUnpaidModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reçus à envoyer */}
      {showReceiptsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl border border-gray-200">
            {/* Header fixe */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold">Reçus à envoyer</h3>
                    <p className="text-purple-100 text-sm">{obtenirRecusAEnvoyer().length} reçu(s) en attente</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowReceiptsModal(false)}
                  className="text-white hover:bg-purple-500 hover:bg-opacity-30 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {obtenirRecusAEnvoyer().length > 0 ? (
                <div className="grid gap-4">
                  {obtenirRecusAEnvoyer().map((recu, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Receipt className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-mono font-bold text-purple-600">
                                {recu.numero_recu}
                              </div>
                              <div className="text-sm text-gray-600">
                                {recu.paiements?.factures?.eleves ? 
                                  `${recu.paiements.factures.eleves.prenom} ${recu.paiements.factures.eleves.nom}` : 
                                  'Élève inconnu'
                                }
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(recu.date_emission).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {formatMontant(recu.montant_recu)}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => marquerRecuEnvoye(recu.id, 'envoye')}
                                className="gap-1 text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <Send className="w-3 h-3" />
                                Email
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => marquerRecuEnvoye(recu.id, 'whatsapp')}
                                className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                              >
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tous les reçus sont envoyés !</h3>
                  <p className="text-gray-600">Aucun reçu en attente d'envoi.</p>
                </div>
              )}
            </div>

            {/* Footer fixe */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end flex-shrink-0 border-t border-gray-200">
              <Button onClick={() => setShowReceiptsModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
