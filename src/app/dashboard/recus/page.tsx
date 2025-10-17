'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Receipt, Search, RefreshCw, Eye, Edit, Trash2, Download,
  Calendar, Users, FileText, CheckCircle, Clock, AlertTriangle,
  TrendingUp, DollarSign, CreditCard, Printer, Send, X, User, Loader2,
  MessageCircle
} from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import { obtenirRecus, obtenirEcole, modifierStatutRecu, supprimerRecu, createAuthenticatedClient } from '@/lib/supabase-functions'
import { generateRecuPDF, generateMultipleRecusPDF, downloadPDF } from '@/lib/pdf-utils'
import { genererPDFRecu, genererPDFRecuObjet } from '@/lib/pdf-recu'
import RecuPDFModal from '@/components/pdf/RecuPDFModal'
import BoutonWhatsApp from '@/components/BoutonWhatsApp'

type ViewMode = 'table' | 'cards' | 'stats'
type StatusFilter = 'all' | 'emis' | 'envoye' | 'whatsapp' | 'imprime'
type ModeFilter = 'all' | 'especes' | 'mobile_money'

interface Recu {
  id: number
  facture_id: number
  numero_recu: string
  date_generation: string
  montant_recu: number
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'mobile_money'
  recu_par: string
  notes?: string
  created_at: string
  // Relations
  factures?: {
    id: number
    numero_facture: string
    eleve_id: number
    eleves?: {
      id: number
      nom: string
      prenom: string
      matricule: string
      classe_id: number
      classes?: {
        niveau: string
        section: string
      }
    }
  }
}

interface RecuStats {
  total: number
  emis: number
  envoyes: number
  whatsapp: number
  imprimes: number
  montantTotal: number
  montantMois: number
}

export default function RecusPage() {
  // États de base
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recus, setRecus] = useState<Recu[]>([])
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Vue et filtres
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterMode, setFilterMode] = useState<ModeFilter>('all')
  
  // Sélection multiple
  const [selectedRecus, setSelectedRecus] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [selectedRecu, setSelectedRecu] = useState<Recu | null>(null)
  const [editingRecu, setEditingRecu] = useState<Recu | null>(null)
  const [selectedRecuForPDF, setSelectedRecuForPDF] = useState<Recu | null>(null)

  // États PDF
  const [ecole, setEcole] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    chargerRecus()
  }, [])

  const afficherMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  // Fonctions de filtrage
  const getFilteredRecus = () => {
    let filtered = recus

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(recu => {
        const facture = recu.factures
        const eleve = facture?.eleves
        
        const matches = recu.numero_recu.toLowerCase().includes(searchTerm.toLowerCase()) ||
               facture?.numero_facture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               `${eleve?.prenom || ''} ${eleve?.nom || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
               eleve?.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
        
        // Log pour debug si nécessaire
        if (matches) {
          console.log('🔍 Recherche trouvée:', {
            searchTerm,
            numero_recu: recu.numero_recu,
            numero_facture: facture?.numero_facture,
            eleve: `${eleve?.prenom} ${eleve?.nom}`,
            matricule: eleve?.matricule
          })
        }
        
        return matches
      })
    }

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(recu => recu.statut === filterStatus)
    }

    // Filtre par mode de paiement
    if (filterMode !== 'all') {
      filtered = filtered.filter(recu => recu.mode_paiement === filterMode)
    }

    return filtered
  }

  // Calcul des statistiques
  const calculateStats = (): RecuStats => {
    const filtered = getFilteredRecus()
    const thisMonth = new Date()
    thisMonth.setDate(1)
    
    return {
      total: filtered.length,
      emis: filtered.length, // Tous les reçus sont considérés comme émis
      envoyes: 0, // Pas de statut envoyé pour les reçus
      whatsapp: 0, // Pas de statut whatsapp pour les reçus
      imprimes: 0, // Pas de statut imprimé pour les reçus
      montantTotal: filtered.reduce((sum, r) => sum + r.montant_recu, 0),
      montantMois: filtered.filter(r => new Date(r.date_generation) >= thisMonth)
        .reduce((sum, r) => sum + r.montant_recu, 0)
    }
  }

  const chargerRecus = async () => {
    const wasRefreshing = refreshing
    if (!wasRefreshing) setLoading(true)
    
    try {
      const ecoleData = await obtenirEcole()
      setEcole(ecoleData) // Stocker les données de l'école pour PDF
      
      if (ecoleData?.id) {
        const client = await createAuthenticatedClient()
        
        // ÉTAPE 1 : Charger les reçus avec les factures (relation directe)
        const { data: recusData, error: recusError } = await client
          .from('recus')
          .select('*, factures(id, numero_facture, eleve_id)')
          .order('date_generation', { ascending: false })
        
        if (recusError) {
          console.error('Erreur chargement reçus:', recusError)
          setRecus([])
          return
        }

        // ÉTAPE 2 : Pour chaque reçu, charger l'élève correspondant
        const recusAvecEleves = await Promise.all(
          (recusData || []).map(async (recu) => {
            if (!recu.factures?.eleve_id) {
              return { ...recu, factures: { ...recu.factures, eleves: null } }
            }

            const { data: eleve } = await client
              .from('eleves')
              .select('id, nom, prenom, matricule, classe_id, parent_id, classes(niveau, section)')
              .eq('id', recu.factures.eleve_id)
              .single()
            
            // ÉTAPE 3 : Si l'élève a un parent_id, récupérer les données du parent
            let eleveAvecParent = eleve
            if (eleve?.parent_id) {
              try {
                const { data: parent } = await client
                  .from('parents_tuteurs')
                  .select('id, nom, prenom, telephone, email, relation, adresse')
                  .eq('id', eleve.parent_id)
                  .single()
                
                eleveAvecParent = {
                  ...eleve,
                  parents: parent
                }
              } catch (error) {
                console.error('Erreur récupération parent pour élève', eleve.id, ':', error)
                eleveAvecParent = {
                  ...eleve,
                  parents: null
                }
              }
            } else {
              eleveAvecParent = {
                ...eleve,
                parents: null
              }
            }
            
            return {
              ...recu,
              factures: {
                ...recu.factures,
                eleves: eleveAvecParent
              }
            }
          })
        )
        
        console.log('✅ Reçus chargés avec succès:', recusAvecEleves.length)
        
        // Debug: Vérifier la structure des données
        if (recusAvecEleves.length > 0) {
          console.log('🔍 Debug structure reçu (page):', {
            recu: recusAvecEleves[0],
            facture: recusAvecEleves[0]?.factures,
            eleve: recusAvecEleves[0]?.factures?.eleves,
            parents: recusAvecEleves[0]?.factures?.eleves?.parents,
            telephone: recusAvecEleves[0]?.factures?.eleves?.parents?.telephone
          })
        }
        
        setRecus(recusAvecEleves)
      }
    } catch (error) {
      console.error('Erreur chargement reçus:', error)
      setRecus([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const actualiserDonnees = async () => {
    setRefreshing(true)
    await chargerRecus()
  }

  // Fonction pour télécharger un reçu
  const telechargerRecu = async (recu: any) => {
    try {
      setGenerating(true)
      
      // Récupérer les données complètes
      const facture = recu.factures
      const eleve = facture?.eleves
      
      if (!facture || !eleve) {
        alert('Données incomplètes pour générer le reçu')
        return
      }
      
      // Générer le PDF du reçu
      await genererPDFRecu(recu, facture, eleve, ecole)
      
    } catch (error) {
      console.error('Erreur génération reçu:', error)
      alert('Erreur lors de la génération du reçu')
    } finally {
      setGenerating(false)
    }
  }

  // Fonction pour prévisualiser un reçu
  const previsualiserRecu = async (recu: any) => {
    try {
      setGenerating(true)
      
      // Récupérer les données complètes
      const facture = recu.factures
      const eleve = facture?.eleves
      
      if (!facture || !eleve) {
        alert('Données incomplètes pour prévisualiser le reçu')
        return
      }
      
      // Générer le PDF en mémoire
      const doc = await genererPDFRecuObjet(recu, facture, eleve, ecole)
      
      // Ouvrir dans un nouvel onglet
      const pdfBlob = doc.output('blob')
      const url = URL.createObjectURL(pdfBlob)
      window.open(url, '_blank')
      
      // Nettoyer l'URL après un délai
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      
    } catch (error) {
      console.error('Erreur aperçu:', error)
      alert('Erreur lors de l\'aperçu')
    } finally {
      setGenerating(false)
    }
  }

  // Actions sur les reçus
  const voirDetails = (recu: Recu) => {
    setSelectedRecu(recu)
    setShowDetailModal(true)
  }

  const ouvrirEdition = (recu: Recu) => {
    setEditingRecu({...recu})
    setShowEditModal(true)
  }

  const confirmerSuppression = (recu: Recu) => {
    setSelectedRecu(recu)
    setShowDeleteModal(true)
  }

  const sauvegarderEdition = async () => {
    if (!editingRecu) return

    setSaving(true)
    try {
      const result = await modifierStatutRecu(editingRecu.id, editingRecu.statut)
      
      if (result.success) {
        await chargerRecus()
        afficherMessage('success', 'Reçu modifié avec succès!')
        setShowEditModal(false)
        setEditingRecu(null)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const supprimerRecuConfirme = async () => {
    if (!selectedRecu) return

    setSaving(true)
    try {
      const result = await supprimerRecu(selectedRecu.id)
      
      if (result.success) {
        await chargerRecus()
        afficherMessage('success', 'Reçu supprimé avec succès!')
        setShowDeleteModal(false)
        setSelectedRecu(null)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Actions PDF
  const ouvrirPDFModal = (recu: Recu) => {
    setSelectedRecuForPDF(recu)
    setShowPDFModal(true)
  }

  const fermerPDFModal = () => {
    setShowPDFModal(false)
    setSelectedRecuForPDF(null)
  }

  const telechargerPDFDirect = async (recu: Recu) => {
    setGenerating(true)
    try {
      console.log('🧾 Téléchargement direct PDF reçu:', recu.numero_recu)
      const pdfBlob = await generateRecuPDF(recu, ecole)
      const filename = `${recu.numero_recu.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      await downloadPDF(pdfBlob, filename)
      afficherMessage('success', 'PDF téléchargé avec succès!')
    } catch (error: any) {
      console.error('Erreur téléchargement PDF:', error)
      afficherMessage('error', `Erreur PDF: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const genererPDFMultiple = async (merged: boolean = false) => {
    if (selectedRecus.length === 0) {
      afficherMessage('error', 'Aucun reçu sélectionné')
      return
    }

    setGenerating(true)
    try {
      const recusAGenerer = recus.filter(r => selectedRecus.includes(r.id))
      console.log('🧾 Génération PDF multiple:', recusAGenerer.length, 'reçus')
      
      const pdfs = await generateMultipleRecusPDF(recusAGenerer, ecole, merged)
      
      if (merged) {
        // PDF fusionné
        await downloadPDF(pdfs as Blob, `recus_${new Date().toISOString().split('T')[0]}.pdf`)
      } else {
        // PDFs séparés - télécharger chacun
        const pdfArray = pdfs as Blob[]
        for (let i = 0; i < pdfArray.length; i++) {
          const filename = `${recusAGenerer[i].numero_recu.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
          await downloadPDF(pdfArray[i], filename)
        }
      }
      
      afficherMessage('success', `${recusAGenerer.length} PDF(s) téléchargé(s)!`)
    } catch (error: any) {
      console.error('Erreur génération PDF multiple:', error)
      afficherMessage('error', `Erreur PDF: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  // Gestion de la sélection multiple
  const toggleRecuSelection = (recuId: number) => {
    setSelectedRecus(prev => {
      const newSelection = prev.includes(recuId)
        ? prev.filter(id => id !== recuId)
        : [...prev, recuId]
      
      setShowBulkActions(newSelection.length > 0)
      return newSelection
    })
  }

  const selectAllRecus = () => {
    const filtered = getFilteredRecus()
    const allIds = filtered.map(r => r.id)
    setSelectedRecus(allIds)
    setShowBulkActions(allIds.length > 0)
  }

  const clearSelection = () => {
    setSelectedRecus([])
    setShowBulkActions(false)
  }

  const isAllSelected = () => {
    const filtered = getFilteredRecus()
    const allIds = filtered.map(r => r.id)
    return allIds.length > 0 && allIds.every(id => selectedRecus.includes(id))
  }

  const getModeLabel = (mode: string) => {
    const modes = {
      'especes': 'Espèces',
      'mobile_money': 'Mobile Money'
    }
    return modes[mode as keyof typeof modes] || mode
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'emis': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'envoye': return 'bg-green-100 text-green-800 border-green-300'
      case 'whatsapp': return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'imprime': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'especes': return DollarSign
      case 'mobile_money': return CreditCard
      default: return CreditCard
    }
  }

  const stats = calculateStats()
  const recusFiltered = getFilteredRecus()

  // Composants modernes de l'interface
  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium mb-1">Total Reçus</p>
              <p className="text-2xl font-bold text-purple-900">{stats.total}</p>
              <p className="text-xs text-purple-600 mt-1">Tous les reçus</p>
            </div>
            <Receipt className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-1">Reçus Émis</p>
              <p className="text-2xl font-bold text-blue-900">{stats.emis}</p>
              <p className="text-xs text-blue-600 mt-1">Générés automatiquement</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium mb-1">Montant Ce Mois</p>
              <p className="text-2xl font-bold text-orange-900">{stats.montantMois.toLocaleString()} F</p>
              <p className="text-xs text-orange-600 mt-1">Total encaissé</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ViewModeSelector = () => (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('table')}
        className="gap-1 px-2"
      >
        <FileText className="w-3 h-3" />
        <span className="hidden md:inline text-xs">Table</span>
      </Button>
      <Button
        variant={viewMode === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('cards')}
        className="gap-1 px-2"
      >
        <Receipt className="w-3 h-3" />
        <span className="hidden md:inline text-xs">Cards</span>
      </Button>
      <Button
        variant={viewMode === 'stats' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('stats')}
        className="gap-1 px-2"
      >
        <TrendingUp className="w-3 h-3" />
        <span className="hidden md:inline text-xs">Stats</span>
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Receipt className="w-8 h-8 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des reçus...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message.text && (
        <Card className={`border-l-4 ${
          message.type === 'success' 
            ? 'border-green-500 bg-green-50' 
            : 'border-red-500 bg-red-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header optimisé responsive */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gestion des Reçus</h1>
              <p className="text-sm text-gray-600">
                {recusFiltered.length} reçu{recusFiltered.length > 1 ? 's' : ''} • {stats.montantTotal.toLocaleString()} FCFA
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ViewModeSelector />
          </div>
        </div>

        {/* Ligne des actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={actualiserDonnees}
            disabled={refreshing}
            className={cn(
              "gap-1 transition-all duration-200",
              refreshing && "bg-blue-50 border-blue-300"
            )}
          >
            <RefreshCw className={cn(
              "w-3 h-3 transition-transform duration-500", 
              refreshing && "animate-spin"
            )} />
            <span className="hidden sm:inline">
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </span>
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <StatsCards />

      {/* Barre de recherche compacte */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  placeholder="Rechercher reçu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="emis">Émis</option>
                <option value="imprime">Imprimés</option>
              </select>
              
              <select 
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as ModeFilter)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="all">Tous les modes</option>
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message si aucun reçu */}
      {recusFiltered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {recus.length === 0 ? 'Table reçus à configurer' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 mb-4">
              {recus.length === 0 
                ? 'Exécutez le script SQL pour créer la table reçus et ajouter des données de test.' 
                : 'Essayez de modifier vos critères de recherche.'
              }
            </p>
            {recus.length === 0 && (
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-purple-900 mb-2">📋 Instructions</h4>
                  <ol className="text-sm text-purple-800 space-y-1">
                    <li>1. Allez dans Supabase → SQL Editor</li>
                    <li>2. Exécutez <code className="bg-purple-100 px-1 rounded">sql/create_recus_table.sql</code></li>
                    <li>3. Puis <code className="bg-purple-100 px-1 rounded">sql/insert_recus_test.sql</code></li>
                    <li>4. Actualisez cette page</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Contenu selon la vue sélectionnée */}
          {viewMode === 'table' && (
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white p-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Liste des reçus ({recusFiltered.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-2 font-medium text-gray-900 text-xs">REÇU</th>
                        <th className="text-left p-2 font-medium text-gray-900 text-xs">FACTURE</th>
                        <th className="text-left p-2 font-medium text-gray-900 text-xs">ÉLÈVE</th>
                        <th className="text-left p-2 font-medium text-gray-900 text-xs">MONTANT</th>
                        <th className="text-left p-2 font-medium text-gray-900 text-xs hidden sm:table-cell">DATE</th>
                        <th className="text-left p-2 font-medium text-gray-900 text-xs">MODE</th>
                        <th className="text-left p-2 font-medium text-gray-900 text-xs">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recusFiltered.map((recu) => {
                        const facture = recu.factures
                        const eleve = facture?.eleves
                        const ModeIcon = getModeIcon(recu.mode_paiement)
                        
                        return (
                          <tr key={recu.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-2">
                              <div className="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                {recu.numero_recu}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {facture?.numero_facture || 'N/A'}
                              </div>
                            </td>
                            <td className="p-2">
                              <div>
                                <div className="font-medium text-sm text-gray-900 truncate max-w-24">
                                  {eleve ? `${eleve.nom} ${eleve.prenom}` : 'Élève inconnu'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {eleve?.matricule || ''}
                                </div>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="font-bold text-sm text-purple-600">
                                {recu.montant_recu.toLocaleString()} F
                              </div>
                            </td>
                            <td className="p-2 hidden sm:table-cell">
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Calendar className="w-3 h-3" />
                                {new Date(recu.date_generation).toLocaleDateString('fr-FR')}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <ModeIcon className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium truncate max-w-16">
                                  {getModeLabel(recu.mode_paiement)}
                                </span>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                {/* Bouton Aperçu */}
                                <button
                                  onClick={() => previsualiserRecu(recu)}
                                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                  title="Aperçu du reçu"
                                  disabled={generating}
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                
                                {/* Bouton Télécharger */}
                                <button
                                  onClick={() => telechargerRecu(recu)}
                                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                  title="Télécharger le reçu"
                                  disabled={generating}
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                                
                                {/* Bouton WhatsApp - avec génération PDF */}
                                <BoutonWhatsApp
                                  numeroDestinataire={recu.factures?.eleves?.parents?.telephone}
                                  message={`Bonjour ${recu.factures?.eleves?.parents?.prenom || ''},\n\nVoici le reçu de paiement pour ${recu.factures?.eleves?.prenom || ''} ${recu.factures?.eleves?.nom || ''}.\n\nMontant: ${recu.montant_recu?.toLocaleString() || ''} FCFA\nNuméro: ${recu.numero_recu}\n\nMerci,\nÉcole Sénégalaise`}
                                  typeDocument="recu"
                                  documentData={{
                                    recu: recu,
                                    facture: recu.factures,
                                    eleve: recu.factures?.eleves
                                  }}
                                  onMettreAJour={() => router.push(`/dashboard/eleves?id=${recu.factures?.eleve_id}`)}
                                  className="p-2 hover:bg-green-50"
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recusFiltered.map((recu) => {
                const ModeIcon = getModeIcon(recu.mode_paiement)
                
                return (
                  <Card 
                    key={recu.id} 
                    className={cn(
                      "hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-purple-300",
                      selectedRecus.includes(recu.id) && "ring-2 ring-purple-500 shadow-lg border-purple-300"
                    )}
                    onClick={() => toggleRecuSelection(recu.id)}
                  >
                    <CardHeader className="pb-4">
                      {/* Ligne 1: Numéro de reçu et statut */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-mono text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 font-medium">
                          {recu.numero_recu}
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 shrink-0",
                          getStatutColor(recu.statut)
                        )}>
                          {recu.statut === 'emis' && <FileText className="w-3 h-3" />}
                          {recu.statut === 'envoye' && <Send className="w-3 h-3" />}
                          {recu.statut === 'whatsapp' && <MessageCircle className="w-3 h-3" />}
                          {recu.statut === 'imprime' && <Printer className="w-3 h-3" />}
                          <span>{recu.statut}</span>
                        </span>
                      </div>
                      
                      {/* Ligne 2: Icône, montant et mode */}
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
                          <ModeIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl text-gray-900 flex items-baseline gap-1 mb-1">
                            <span>{recu.montant_recu.toLocaleString()}</span>
                            <span className="text-sm font-medium text-gray-600">FCFA</span>
                          </div>
                          <div className="text-sm font-medium text-purple-600">
                            {getModeLabel(recu.mode_paiement)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Informations élève */}
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {recu.factures?.eleves ? 
                              `${recu.factures.eleves.prenom.charAt(0)}${recu.factures.eleves.nom.charAt(0)}` : 
                              '??'
                            }
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {recu.factures?.eleves ? 
                                `${recu.factures.eleves.prenom} ${recu.factures.eleves.nom}` : 
                                'Élève inconnu'
                              }
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {recu.factures?.eleves?.matricule || ''}
                            </div>
                          </div>
                        </div>
                        
                        {/* Facture et date */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="font-mono text-xs bg-blue-50 px-2 py-1 rounded">
                              {recu.factures?.numero_facture || `#${recu.facture_id}`}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span>{new Date(recu.date_generation).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2 hover:bg-blue-50 border-blue-200 text-blue-600 h-9" 
                            onClick={(e) => {
                              e.stopPropagation()
                              previsualiserRecu(recu)
                            }}
                            disabled={generating}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">Aperçu</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2 hover:bg-green-50 border-green-200 text-green-600 h-9" 
                            onClick={(e) => {
                              e.stopPropagation()
                              telechargerRecu(recu)
                            }}
                            disabled={generating}
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-sm">Télécharger</span>
                          </Button>
                          {/* Bouton WhatsApp - avec génération PDF */}
                          <BoutonWhatsApp
                            numeroDestinataire={recu.factures?.eleves?.parents?.telephone}
                            message={`Bonjour ${recu.factures?.eleves?.parents?.prenom || ''},\n\nVoici le reçu de paiement pour ${recu.factures?.eleves?.prenom || ''} ${recu.factures?.eleves?.nom || ''}.\n\nMontant: ${recu.montant_recu?.toLocaleString() || ''} FCFA\nNuméro: ${recu.numero_recu}\n\nMerci,\nÉcole Sénégalaise`}
                            typeDocument="recu"
                            documentData={{
                              recu: recu,
                              facture: recu.factures,
                              eleve: recu.factures?.eleves
                            }}
                            onMettreAJour={() => router.push(`/dashboard/eleves?id=${recu.factures?.eleve_id}`)}
                            className="flex-1 h-9 text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {viewMode === 'stats' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Analyses des reçus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Répartition par statut</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Émis</span>
                          </div>
                          <span className="font-medium">{stats.emis}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span>Imprimés</span>
                          </div>
                          <span className="font-medium">{stats.imprimes}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Revenus par mode</h3>
                      <div className="space-y-3">
                        {recusFiltered.reduce((acc: any, r) => {
                          acc[r.mode_paiement] = (acc[r.mode_paiement] || 0) + r.montant_recu
                          return acc
                        }, {}) && Object.entries(recusFiltered.reduce((acc: any, r) => {
                          acc[r.mode_paiement] = (acc[r.mode_paiement] || 0) + r.montant_recu
                          return acc
                        }, {})).map(([mode, montant]: [string, any]) => (
                          <div key={mode} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="text-sm text-purple-600 mb-1">{getModeLabel(mode)}</div>
                            <div className="text-2xl font-bold text-purple-900">{montant.toLocaleString()} F</div>
                            <div className="text-xs text-purple-600">
                              {stats.montantTotal > 0 ? Math.round((montant / stats.montantTotal) * 100) : 0}% du total
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Modal de détails - Version premium */}
      {showDetailModal && selectedRecu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-xl border border-gray-200">
            {/* Header avec gradient violet */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 bg-opacity-30 rounded-lg">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Détails du reçu</h3>
                    <p className="text-purple-100 text-sm">
                      {selectedRecu.numero_recu}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:bg-purple-500 hover:bg-opacity-30 rounded-lg h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4">
              {/* Informations principales - Compactes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Montant - Card compacte */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs font-medium text-purple-600 mb-1">Montant reçu</div>
                    <div className="text-xl font-bold text-purple-800 flex items-baseline justify-center gap-1">
                      <span>{selectedRecu.montant_recu.toLocaleString()}</span>
                      <span className="text-sm font-medium text-purple-700">FCFA</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Statut - Card compacte */}
                <Card className={cn(
                  "border",
                  selectedRecu.statut === 'emis' && "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300",
                  selectedRecu.statut === 'envoye' && "bg-gradient-to-br from-green-50 to-green-100 border-green-300",
                  selectedRecu.statut === 'whatsapp' && "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300",
                  selectedRecu.statut === 'imprime' && "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300"
                )}>
                  <CardContent className="p-4 text-center">
                    <div className="text-xs font-medium text-gray-600 mb-2">Statut</div>
                    <div className="flex justify-center mb-2">
                      {selectedRecu.statut === 'emis' && <FileText className="w-8 h-8 text-blue-600" />}
                      {selectedRecu.statut === 'envoye' && <Send className="w-8 h-8 text-green-600" />}
                      {selectedRecu.statut === 'whatsapp' && <MessageCircle className="w-8 h-8 text-emerald-600" />}
                      {selectedRecu.statut === 'imprime' && <Printer className="w-8 h-8 text-purple-600" />}
                    </div>
                    <div className={cn(
                      "text-sm font-bold capitalize",
                      selectedRecu.statut === 'emis' && "text-blue-800",
                      selectedRecu.statut === 'envoye' && "text-green-800",
                      selectedRecu.statut === 'whatsapp' && "text-emerald-800",
                      selectedRecu.statut === 'imprime' && "text-purple-800"
                    )}>
                      {selectedRecu.statut}
                    </div>
                  </CardContent>
                </Card>

                {/* Mode de paiement - Card compacte */}
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs font-medium text-indigo-600 mb-2">Mode</div>
                    <div className="flex justify-center mb-2">
                      {React.createElement(getModeIcon(selectedRecu.mode_paiement), { 
                        className: "w-8 h-8 text-indigo-600" 
                      })}
                    </div>
                    <div className="text-sm font-bold text-indigo-800">
                      {getModeLabel(selectedRecu.mode_paiement)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Informations détaillées - Layout simplifié */}
              <div className="space-y-4">
                {/* Élève et Facture - Une seule ligne */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {selectedRecu.factures?.eleves ? 
                            `${selectedRecu.factures.eleves.prenom.charAt(0)}${selectedRecu.factures.eleves.nom.charAt(0)}` : 
                            '??'
                          }
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {selectedRecu.factures?.eleves ? 
                              `${selectedRecu.factures.eleves.prenom} ${selectedRecu.factures.eleves.nom}` : 
                              'Élève inconnu'
                            }
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            {selectedRecu.factures?.eleves?.matricule || 'Matricule non disponible'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-mono font-bold text-blue-800">
                            {selectedRecu.factures?.numero_facture || `#${selectedRecu.facture_id}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            Reçu #{selectedRecu.numero_recu}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Dates et Informations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-600">Date d'émission</div>
                            <div className="font-semibold text-gray-900">
                              {new Date(selectedRecu.date_generation).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-600">Créé le</div>
                            <div className="text-sm text-gray-700">
                              {new Date(selectedRecu.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedRecu.paiements?.reference_paiement && (
                    <Card className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium text-gray-600 mb-1">Référence paiement</div>
                            <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border text-gray-800">
                              {selectedRecu.paiements.reference_paiement}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Notes */}
                {selectedRecu.notes && (
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-600 mb-2">Notes</div>
                      <div className="bg-gray-50 p-3 rounded border text-gray-700 text-sm italic">
                        "{selectedRecu.notes}"
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Footer avec actions - Compact */}
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDetailModal(false)}
                  className="gap-1"
                >
                  <X className="w-3 h-3" />
                  Fermer
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    setShowDetailModal(false)
                    ouvrirEdition(selectedRecu)
                  }}
                  className="gap-1 bg-gradient-to-r from-purple-600 to-purple-700"
                >
                  <Edit className="w-3 h-3" />
                  Modifier
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-1 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  onClick={() => {
                    setShowDetailModal(false)
                    ouvrirPDFModal(selectedRecu)
                  }}
                  disabled={generating}
                >
                  <Download className="w-3 h-3" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition - Interface soignée */}
      {showEditModal && editingRecu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl border border-gray-200">
            {/* Header avec gradient */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 bg-opacity-30 rounded-lg">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Modifier le reçu</h3>
                    <p className="text-orange-100 text-sm">
                      {editingRecu.numero_recu}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:bg-orange-500 hover:bg-opacity-30 rounded-lg h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              {/* Informations de contexte */}
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {editingRecu.factures?.eleves ? 
                          `${editingRecu.factures.eleves.prenom.charAt(0)}${editingRecu.factures.eleves.nom.charAt(0)}` : 
                          '??'
                        }
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {editingRecu.factures?.eleves ? 
                            `${editingRecu.factures.eleves.prenom} ${editingRecu.factures.eleves.nom}` : 
                            'Élève inconnu'
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          {editingRecu.factures?.numero_facture || `Facture #${editingRecu.facture_id}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Montant</div>
                      <div className="font-bold text-lg text-gray-900">
                        {editingRecu.montant_recu.toLocaleString()} F
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulaire d'édition - Simplifié pour les reçus */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="statut" className="text-sm font-medium text-gray-700">
                    Statut du reçu *
                  </Label>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      id="statut"
                      value={editingRecu.statut}
                      onChange={(e) => setEditingRecu(prev => prev ? {
                        ...prev,
                        statut: e.target.value as any
                      } : null)}
                      className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="emis">📄 Émis (généré)</option>
                      <option value="imprime">🖨️ Imprimé sur papier</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Mise à jour du statut de traitement du reçu
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes additionnelles
                  </Label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={editingRecu.notes || ''}
                    onChange={(e) => setEditingRecu(prev => prev ? {
                      ...prev,
                      notes: e.target.value
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    placeholder="Commentaires sur ce reçu..."
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Informations complémentaires sur le traitement du reçu
                  </div>
                </div>
              </div>

              {/* Footer avec actions */}
              <div className="flex justify-between items-center gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  * Champs obligatoires
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEditModal(false)}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </Button>
                  <Button 
                    onClick={sauvegarderEdition} 
                    disabled={saving}
                    className="gap-2 bg-gradient-to-r from-orange-600 to-orange-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedRecu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                  <p className="text-gray-600">Cette action est irréversible.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="text-sm text-gray-600 mb-2">Reçu à supprimer :</div>
                <div className="font-mono text-purple-600 mb-1">
                  {selectedRecu.numero_recu}
                </div>
                <div className="font-bold text-lg text-purple-600">
                  {selectedRecu.montant_recu.toLocaleString()} FCFA
                </div>
                <div className="text-sm text-gray-500">
                  {selectedRecu.factures?.eleves ? 
                    `${selectedRecu.factures.eleves.prenom} ${selectedRecu.factures.eleves.nom}` : 
                    'Élève inconnu'
                  }
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={supprimerRecuConfirme}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {showPDFModal && selectedRecuForPDF && (
        <RecuPDFModal
          recu={selectedRecuForPDF}
          ecole={ecole}
          isOpen={showPDFModal}
          onClose={fermerPDFModal}
        />
      )}
    </div>
  )
}
