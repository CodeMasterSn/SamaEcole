'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Loader2, 
  RefreshCw,
  Calendar,
  User,
  CreditCard,
  Grid3X3,
  List,
  BarChart3,
  Filter,
  CheckSquare,
  Square,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Send,
  Archive,
  MoreVertical,
  ChevronDown,
  X,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  obtenirFactures, 
  obtenirClassesAvecStats,
  obtenirEcole, 
  supprimerFacture,
  modifierStatutFacture,
  testerDetailsFacture,
  obtenirInfosEcole,
  obtenirEleveComplet,
  createAuthenticatedClient,
  type FactureComplet,
  type ClasseData,
  creerRecu,
  obtenirRecuParFacture
} from '@/lib/supabase-functions'
import { FacturePreview } from '@/components/FacturePreview'
import { genererPDFFacture } from '@/lib/pdf-facture'
import { genererPDFRecu } from '@/lib/pdf-recu'
import FacturePDFModal from '@/components/pdf/FacturePDFModal'
import { generateMultipleFacturesPDF } from '@/lib/pdf-utils'
import { useAuth } from '@/contexts/AuthContext'
import BoutonWhatsApp from '@/components/BoutonWhatsApp'

type ViewMode = 'table' | 'cards' | 'stats'
type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'custom'

interface FactureStats {
  total: number
  brouillon: number
  envoyee: number
  payee: number
  totalMontant: number
  montantPaye: number
  montantEnAttente: number
}

export default function FacturesPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Données
  const [factures, setFactures] = useState<FactureComplet[]>([])
  const [classes, setClasses] = useState<ClasseData[]>([])
  const [ecole, setEcole] = useState<any>(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Modal PDF
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [selectedFactureForPDF, setSelectedFactureForPDF] = useState<FactureComplet | null>(null)
  
  // États pour modal d'aperçu
  const [factureSelectionnee, setFactureSelectionnee] = useState(null)
  const [eleveApercu, setEleveApercu] = useState(null)
  const [ecoleApercu, setEcoleApercu] = useState(null)
  const [lignesApercu, setLignesApercu] = useState([])
  const [showModal, setShowModal] = useState(false)
  
  // Vue et filtres
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('all')
  const [filterClass, setFilterClass] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Sélection multiple
  const [selectedFactures, setSelectedFactures] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Dates personnalisées
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')

  // Auth
  const { user } = useAuth()

  useEffect(() => {
    chargerFactures()
  }, [])

  const chargerFactures = async () => {
    const wasRefreshing = refreshing
    if (!wasRefreshing) setLoading(true)
    
    try {
      const ecoleData = await obtenirEcole()
      if (ecoleData?.id) {
        const [facturesData, classesData] = await Promise.all([
          obtenirFactures(ecoleData.id),
          obtenirClassesAvecStats(ecoleData.id)
        ])
        
        setFactures(facturesData)
        setClasses(classesData)
        setEcole(ecoleData)
      }
    } catch (error) {
      console.error('❌ Erreur chargement factures:', error)
      afficherMessage('error', 'Erreur lors du chargement des factures')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const actualiserDonnees = async () => {
    setRefreshing(true)
    await chargerFactures()
  }

  const afficherMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }


  // Fonctions de filtrage avancé
  const getFilteredFactures = () => {
    let filtered = factures

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(facture =>
        facture.numero_facture.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${facture.eleve?.prenom} ${facture.eleve?.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.eleve?.matricule.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (filterStatut !== 'all') {
      filtered = filtered.filter(facture => facture.statut === filterStatut)
    }

    // Filtre par classe
    if (filterClass !== 'all') {
      filtered = filtered.filter(facture => 
        facture.eleve?.classe_id === parseInt(filterClass)
      )
    }

    // Filtre par période
    if (filterPeriod !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(facture => {
        const factureDate = new Date(facture.date_emission)
        
        switch (filterPeriod) {
          case 'today':
            return factureDate >= today
          case 'week':
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return factureDate >= weekAgo
          case 'month':
            const monthAgo = new Date(today)
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return factureDate >= monthAgo
          case 'custom':
            if (customDateStart && customDateEnd) {
              const startDate = new Date(customDateStart)
              const endDate = new Date(customDateEnd)
              return factureDate >= startDate && factureDate <= endDate
            }
            return true
          default:
            return true
        }
      })
    }

    return filtered
  }

  // Calcul des statistiques
  const calculateStats = (): FactureStats => {
    const filtered = getFilteredFactures()
    
    return {
      total: filtered.length,
      brouillon: filtered.filter(f => f.statut === 'brouillon').length,
      envoyee: filtered.filter(f => f.statut === 'envoyee').length,
      payee: filtered.filter(f => f.statut === 'payee').length,
      totalMontant: filtered.reduce((sum, f) => sum + f.montant_total, 0),
      montantPaye: filtered.filter(f => f.statut === 'payee').reduce((sum, f) => sum + f.montant_total, 0),
      montantEnAttente: filtered.filter(f => f.statut !== 'payee').reduce((sum, f) => sum + f.montant_total, 0)
    }
  }

  // Gestion de la sélection multiple
  const toggleFactureSelection = (factureId: number) => {
    setSelectedFactures(prev => {
      const newSelection = prev.includes(factureId)
        ? prev.filter(id => id !== factureId)
        : [...prev, factureId]
      
      setShowBulkActions(newSelection.length > 0)
      return newSelection
    })
  }

  const selectAllFactures = () => {
    const filtered = getFilteredFactures()
    const allIds = filtered.map(f => f.id!).filter(Boolean)
    setSelectedFactures(allIds)
    setShowBulkActions(allIds.length > 0)
  }

  const clearSelection = () => {
    setSelectedFactures([])
    setShowBulkActions(false)
  }

  const isAllSelected = () => {
    const filtered = getFilteredFactures()
    const allIds = filtered.map(f => f.id!).filter(Boolean)
    return allIds.length > 0 && allIds.every(id => selectedFactures.includes(id))
  }

  // Actions groupées
  const bulkChangeStatus = async (newStatus: 'brouillon' | 'envoyee' | 'payee') => {
    setSaving(true)
    try {
      let successCount = 0
      
      for (const factureId of selectedFactures) {
        const result = await modifierStatutFacture(factureId, newStatus)
        if (result.success) successCount++
      }
      
      if (successCount === selectedFactures.length) {
        setFactures(prev => prev.map(f => 
          selectedFactures.includes(f.id!) ? { ...f, statut: newStatus } : f
        ))
        afficherMessage('success', `${successCount} facture(s) mise(s) à jour`)
        clearSelection()
      } else {
        afficherMessage('error', `Seulement ${successCount}/${selectedFactures.length} factures mises à jour`)
      }
    } catch (error: any) {
      afficherMessage('error', `Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const bulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedFactures.length} facture(s) ?`)) return

    setSaving(true)
    try {
      let successCount = 0
      
      for (const factureId of selectedFactures) {
        const result = await supprimerFacture(factureId)
        if (result.success) successCount++
      }
      
      if (successCount === selectedFactures.length) {
        setFactures(prev => prev.filter(f => !selectedFactures.includes(f.id!)))
        afficherMessage('success', `${successCount} facture(s) supprimée(s)`)
        clearSelection()
      } else {
        afficherMessage('error', `Seulement ${successCount}/${selectedFactures.length} factures supprimées`)
      }
    } catch (error: any) {
      afficherMessage('error', `Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Fonctions PDF
  const openPDFModal = (facture: FactureComplet) => {
    setSelectedFactureForPDF(facture)
    setShowPDFModal(true)
  }

  const closePDFModal = () => {
    setShowPDFModal(false)
    setSelectedFactureForPDF(null)
  }

  const generateBulkPDF = async () => {
    if (selectedFactures.length === 0) {
      afficherMessage('error', 'Veuillez sélectionner au moins une facture')
      return
    }

    setSaving(true)
    try {
      const selectedFactureObjects = factures.filter(f => selectedFactures.includes(f.id!))
      
      const result = await generateMultipleFacturesPDF(selectedFactureObjects, ecole, {
        separate: true,
        download: true
      })
      
      if (result.success) {
        afficherMessage('success', `${result.count} PDF(s) généré(s) avec succès!`)
        clearSelection()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Fonctions utilitaires
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'envoyee': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'payee': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'Brouillon'
      case 'envoyee': return 'Envoyée'
      case 'payee': return 'Payée'
      default: return statut
    }
  }

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'brouillon': return <Edit className="w-3 h-3" />
      case 'envoyee': return <Send className="w-3 h-3" />
      case 'payee': return <CheckCircle className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  const stats = calculateStats()
  const facturesFiltered = getFilteredFactures()

  const supprimerFactureFunc = async (id: number, numeroFacture: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la facture ${numeroFacture} ?`)) return

    setSaving(true)
    try {
      const result = await supprimerFacture(id)
      
      if (result.success) {
        setFactures(factures.filter(f => f.id !== id))
        afficherMessage('success', 'Facture supprimée avec succès!')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const changerStatutFacture = async (id: number, nouveauStatut: 'brouillon' | 'envoyee' | 'payee') => {
    setSaving(true)
    try {
      const result = await modifierStatutFacture(id, nouveauStatut)
      
      if (result.success) {
        setFactures(factures.map(f => 
          f.id === id ? { ...f, statut: nouveauStatut } : f
        ))
        afficherMessage('success', 'Statut de la facture mis à jour!')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Fonction d'aperçu de facture
  const ouvrirApercu = async (facture: any) => {
    try {
      // Charger données complètes
      const [eleve, ecole] = await Promise.all([
        obtenirEleveComplet(facture.eleve_id),
        obtenirInfosEcole(1)
      ])
      
      // Charger lignes de facture
      const client = await createAuthenticatedClient()
      const { data: lignes } = await client
        .from('facture_lignes')
        .select('*')
        .eq('facture_id', facture.id)
      
      setFactureSelectionnee(facture)
      setEleveApercu(eleve)
      setEcoleApercu(ecole)
      setLignesApercu(lignes || [])
      setShowModal(true)
    } catch (error) {
      console.error('Erreur aperçu:', error)
      alert('Impossible de charger l\'aperçu')
    }
  }

  // Fonction changement statut améliorée
  const changerStatut = async (factureId: number, nouveauStatut: string) => {
    try {
      const client = await createAuthenticatedClient()
      const { error } = await client
        .from('factures')
        .update({ statut: nouveauStatut })
        .eq('id', factureId)
      
      if (error) throw error
      
      // Si la facture est marquée comme payée, générer automatiquement un reçu
      if (nouveauStatut === 'payee') {
        const recuExistant = await obtenirRecuParFacture(factureId)
        
        if (!recuExistant) {
          const resultat = await creerRecu(factureId, {
            modePaiement: 'especes',
            recuPar: user?.email?.split('@')[0] || 'Comptable', // Utiliser le nom avant @
            notes: 'Paiement intégral reçu - Merci'
          })
          
          if (resultat.success) {
            console.log('✅ Reçu généré automatiquement:', resultat.data.numero_recu)
          }
        }
      }
      
      // Recharger la liste sans alert
      chargerFactures()
    } catch (error) {
      console.error('Erreur changement statut:', error)
      alert('Erreur lors du changement de statut')
    }
  }

  // Fonction pour générer un reçu
  const genererRecu = async (facture: any) => {
    try {
      setSaving(true)
      
      // Vérifier si un reçu existe déjà
      const recuExistant = await obtenirRecuParFacture(facture.id)
      if (recuExistant) {
        // Si le reçu existe, générer directement le PDF
        const eleve = await obtenirEleveComplet(facture.eleve_id)
        const ecole = await obtenirInfosEcole(1)
        await genererPDFRecu(recuExistant, facture, eleve, ecole)
        return
      }
      
      // Créer un nouveau reçu
      const result = await creerRecu(facture.id, {
        modePaiement: 'especes',
        recuPar: user?.email?.split('@')[0] || 'Comptable',
        notes: 'Paiement intégral reçu - Merci'
      })
      
      if (result.success) {
        // Générer le PDF du reçu
        const eleve = await obtenirEleveComplet(facture.eleve_id)
        const ecole = await obtenirInfosEcole(1)
        await genererPDFRecu(result.data, facture, eleve, ecole)
        
        // Recharger les factures pour mettre à jour l'affichage
        chargerFactures()
      } else {
        alert('Erreur lors de la création du reçu')
      }
    } catch (error) {
      console.error('Erreur génération reçu:', error)
      alert('Erreur lors de la génération du reçu')
    } finally {
      setSaving(false)
    }
  }

  // Composants de l'interface
  const StatsCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-xs font-medium">Total</p>
              <p className="text-lg font-bold text-blue-900">{stats.total}</p>
            </div>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-xs font-medium">Payées</p>
              <p className="text-lg font-bold text-green-900">{stats.payee}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-xs font-medium">Attente</p>
              <p className="text-lg font-bold text-orange-900">{stats.envoyee}</p>
            </div>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-xs font-medium">Revenus</p>
              <p className="text-sm font-bold text-purple-900">{formatCurrency(stats.montantPaye)}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-purple-600" />
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
        <List className="w-3 h-3" />
        <span className="hidden md:inline text-xs">Table</span>
      </Button>
      <Button
        variant={viewMode === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('cards')}
        className="gap-1 px-2"
      >
        <Grid3X3 className="w-3 h-3" />
        <span className="hidden md:inline text-xs">Cards</span>
      </Button>
      <Button
        variant={viewMode === 'stats' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('stats')}
        className="gap-1 px-2"
      >
        <BarChart3 className="w-3 h-3" />
        <span className="hidden md:inline text-xs">Stats</span>
      </Button>
    </div>
  )

  const AdvancedFilters = () => (
    <Card className={cn("transition-all duration-300", showAdvancedFilters ? "opacity-100" : "opacity-0 h-0 overflow-hidden")}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium">Période</Label>
            <select 
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as PeriodFilter)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les périodes</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="custom">Période personnalisée</option>
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium">Classe</Label>
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les classes</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom_complet}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium">Statut</Label>
            <select 
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="envoyee">Envoyée</option>
              <option value="payee">Payée</option>
            </select>
          </div>
        </div>

        {filterPeriod === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-sm font-medium">Date de début</Label>
              <Input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Date de fin</Label>
              <Input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const BulkActionsBar = () => (
    <Card className={cn(
      "transition-all duration-300 border-blue-200 bg-blue-50",
      showBulkActions ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
    )}>
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900">
              {selectedFactures.length} sélectionnée(s)
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="gap-1">
              <X className="w-3 h-3" />
              <span className="hidden sm:inline text-xs">Annuler</span>
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={generateBulkPDF}
              disabled={saving}
              className="gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Download className="w-3 h-3" />
              <span className="text-xs">{saving ? 'PDF...' : 'PDF'}</span>
            </Button>
            
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkChangeStatus('brouillon')}
              disabled={saving}
              className="gap-1"
            >
              <Edit className="w-3 h-3" />
              <span className="hidden sm:inline text-xs">Brouillon</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkChangeStatus('envoyee')}
              disabled={saving}
              className="gap-1"
            >
              <Send className="w-3 h-3" />
              <span className="hidden sm:inline text-xs">Envoyée</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkChangeStatus('payee')}
              disabled={saving}
              className="gap-1 text-green-600 border-green-300 hover:bg-green-50"
            >
              <CheckCircle className="w-3 h-3" />
              <span className="hidden sm:inline text-xs">Payée</span>
            </Button>
            
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={bulkDelete}
              disabled={saving}
              className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline text-xs">Supprimer</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des factures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gestion des Factures</h1>
              <p className="text-sm text-gray-600">
                {facturesFiltered.length} facture{facturesFiltered.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ViewModeSelector />
            
            <Link href="/dashboard/factures/nouvelle">
              <Button size="sm" className="gap-1 bg-gradient-to-r from-blue-600 to-blue-700">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouvelle</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Ligne des actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-1"
          >
            <Filter className="w-3 h-3" />
            <span className="hidden sm:inline">Filtres</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", showAdvancedFilters && "rotate-180")} />
          </Button>
          
          {facturesFiltered.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const allIds = facturesFiltered.map(f => f.id!).filter(Boolean)
                setSelectedFactures(allIds)
                setShowBulkActions(true)
                generateBulkPDF()
              }}
              disabled={saving}
              className="gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Download className="w-3 h-3" />
              PDF ({facturesFiltered.length})
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={actualiserDonnees}
            disabled={refreshing}
            className="gap-1"
          >
            <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <StatsCards />

      {/* Filtres avancés */}
      <AdvancedFilters />

      {/* Barre d'actions groupées */}
      <BulkActionsBar />

      {/* Barre de recherche compacte */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            
            {facturesFiltered.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={isAllSelected() ? clearSelection : selectAllFactures}
                className="gap-1"
              >
                {isAllSelected() ? (
                  <CheckSquare className="w-3 h-3" />
                ) : (
                  <Square className="w-3 h-3" />
                )}
                <span className="text-xs">{isAllSelected() ? 'Aucun' : 'Tout'}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contenu selon la vue sélectionnée */}
      {viewMode === 'table' && (
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5 text-blue-600" />
                Liste des factures ({facturesFiltered.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {facturesFiltered.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {factures.length === 0 ? 'Aucune facture créée' : 'Aucun résultat'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {factures.length === 0 
                    ? 'Commencez par créer votre première facture.'
                    : 'Essayez de modifier vos critères de recherche.'
                  }
                </p>
                {factures.length === 0 && (
                  <Link href="/dashboard/factures/nouvelle">
                    <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
                      <Plus className="w-4 h-4" />
                      Créer une facture
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-900 text-xs">
                        <input
                          type="checkbox"
                          checked={isAllSelected()}
                          onChange={isAllSelected() ? clearSelection : selectAllFactures}
                          className="w-3 h-3 text-blue-600 rounded"
                        />
                      </th>
                      <th className="text-left p-2 font-medium text-gray-900 text-xs">NUMÉRO</th>
                      <th className="text-left p-2 font-medium text-gray-900 text-xs">ÉLÈVE</th>
                      <th className="text-left p-2 font-medium text-gray-900 text-xs">DATE</th>
                      <th className="text-left p-2 font-medium text-gray-900 text-xs">MONTANT</th>
                      <th className="text-left p-2 font-medium text-gray-900 text-xs">STATUT</th>
                      <th className="text-left p-2 font-medium text-gray-900 text-xs">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturesFiltered.map((facture) => (
                      <tr 
                        key={facture.id} 
                        className={cn(
                          "border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group",
                          selectedFactures.includes(facture.id!) && "bg-blue-50"
                        )}
                        onDoubleClick={() => ouvrirApercu(facture)}
                        title="Double-cliquez pour voir l'aperçu de la facture"
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedFactures.includes(facture.id!)}
                            onChange={() => toggleFactureSelection(facture.id!)}
                            className="w-3 h-3 text-blue-600 rounded"
                          />
                        </td>
                        <td className="p-2">
                          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-1 py-1 rounded">
                            {facture.numero_facture}
                          </span>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium text-sm text-gray-900 truncate max-w-32">
                              {facture.eleve?.prenom} {facture.eleve?.nom}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-32">
                              {facture.eleve?.matricule}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="font-medium text-sm text-gray-900">
                            {formatCurrency(facture.montant_total)}
                          </div>
                        </td>
                        <td className="p-2">
                          <select
                            value={facture.statut}
                            onChange={(e) => changerStatut(facture.id, e.target.value)}
                            className={`
                              w-full px-4 py-2 rounded-lg text-sm font-medium 
                              border-2 cursor-pointer
                              focus:outline-none focus:ring-2 focus:ring-offset-2
                              ${facture.statut === 'payee' 
                                ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500' 
                                : facture.statut === 'envoyee'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500'
                                : 'bg-gray-50 text-gray-700 border-gray-200 focus:ring-gray-500'
                              }
                            `}
                          >
                            <option value="brouillon">📝 Brouillon</option>
                            <option value="envoyee">📤 Envoyée</option>
                            <option value="payee">✅ Payée</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-purple-50" 
                              title="Télécharger PDF"
                              onClick={async () => {
                                const eleve = await obtenirEleveComplet(facture.eleve_id)
                                const ecole = await obtenirInfosEcole(1)
                                const client = await createAuthenticatedClient()
                                const { data: lignes } = await client
                                  .from('facture_lignes')
                                  .select('*')
                                  .eq('facture_id', facture.id)
                                
                                await genererPDFFacture(facture, eleve, ecole, lignes || [])
                              }}
                            >
                              <Download className="w-3 h-3 text-purple-600" />
                            </Button>
                            {/* Bouton WhatsApp - avec génération PDF */}
                            <BoutonWhatsApp
                              numeroDestinataire={facture.eleve?.parents?.telephone}
                              message={`Bonjour ${facture.eleve?.parents?.prenom || ''},\n\nVoici la facture de ${facture.eleve?.prenom || ''} ${facture.eleve?.nom || ''} pour le mois en cours.\n\nMontant: ${facture.montant_total?.toLocaleString() || ''} FCFA\nRéférence: ${facture.numero_facture}\n\nCordialement,\nÉcole Sénégalaise`}
                              typeDocument="facture"
                              documentData={{
                                facture: facture,
                                eleve: facture.eleve,
                                lignes: [] // Chargé dynamiquement dans BoutonWhatsApp
                              }}
                              onMettreAJour={() => router.push(`/dashboard/eleves?id=${facture.eleve_id}`)}
                              className="h-6 px-2 text-xs"
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" 
                              title="Supprimer"
                              onClick={() => supprimerFactureFunc(facture.id!, facture.numero_facture)}
                              disabled={saving}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facturesFiltered.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture trouvée</h3>
              <p className="text-gray-600">Essayez de modifier vos critères de recherche.</p>
            </div>
          ) : (
            facturesFiltered.map((facture) => (
              <Card 
                key={facture.id} 
                className={cn(
                  "hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-violet-300",
                  selectedFactures.includes(facture.id!) && "ring-2 ring-violet-500 shadow-lg border-violet-300"
                )}
                onClick={() => toggleFactureSelection(facture.id!)}
              >
                <CardHeader className="pb-4">
                  {/* Ligne 1: Numéro de facture et statut */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-mono text-sm text-violet-600 bg-violet-50 px-3 py-1 rounded-lg border border-violet-200 font-medium">
                      {facture.numero_facture}
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 shrink-0",
                      getStatutColor(facture.statut)
                    )}>
                      {getStatutIcon(facture.statut)}
                      <span>{getStatutLabel(facture.statut)}</span>
                    </span>
                  </div>
                  
                  {/* Ligne 2: Icône, montant et date */}
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xl text-gray-900 flex items-baseline gap-1 mb-1">
                        <span>{formatCurrency(facture.montant_total).replace(' FCFA', '')}</span>
                        <span className="text-sm font-medium text-gray-600">FCFA</span>
                      </div>
                      <div className="text-sm font-medium text-violet-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Informations élève */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {facture.eleve ? 
                          `${facture.eleve.prenom.charAt(0)}${facture.eleve.nom.charAt(0)}` : 
                          '??'
                        }
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {facture.eleve ? 
                            `${facture.eleve.prenom} ${facture.eleve.nom}` : 
                            'Élève inconnu'
                          }
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {facture.eleve?.matricule || ''}
                        </div>
                      </div>
                    </div>
                    
                    {/* Détails de la facture */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-blue-500" />
                        <span>{facture.eleve?.classe?.nom_complet || 'Classe non assignée'}</span>
                      </div>
                      
                      {facture.details && facture.details.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CreditCard className="w-4 h-4 text-emerald-500" />
                          <span>{facture.details.length} type{facture.details.length > 1 ? 's' : ''} de frais</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions - Layout optimisé */}
                    <div className="flex items-center gap-1 pt-3 border-t border-gray-200">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1 hover:bg-blue-50 border-blue-200 text-blue-600 h-8 text-xs" 
                        onClick={(e) => {
                          e.stopPropagation()
                          openPDFModal(facture)
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        <span>PDF</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1 hover:bg-violet-50 border-violet-200 text-violet-600 h-8 text-xs" 
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Implémenter l'édition de facture
                          console.log('Modifier facture:', facture.id)
                        }}
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </Button>
                      {/* Bouton WhatsApp - avec génération PDF */}
                      <BoutonWhatsApp
                        numeroDestinataire={facture.eleve?.parents?.telephone}
                        message={`Bonjour ${facture.eleve?.parents?.prenom || ''},\n\nVoici la facture de ${facture.eleve?.prenom || ''} ${facture.eleve?.nom || ''} pour le mois en cours.\n\nMontant: ${facture.montant_total?.toLocaleString() || ''} FCFA\nRéférence: ${facture.numero_facture}\n\nCordialement,\nÉcole Sénégalaise`}
                        typeDocument="facture"
                        documentData={{
                          facture: facture,
                          eleve: facture.eleve,
                          lignes: [] // Chargé dynamiquement dans BoutonWhatsApp
                        }}
                        onMettreAJour={() => router.push(`/dashboard/eleves?id=${facture.eleve_id}`)}
                        className="flex-1 h-8 text-xs"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1 text-red-600 hover:bg-red-50 border-red-200 h-8 text-xs" 
                        onClick={(e) => {
                          e.stopPropagation()
                          supprimerFactureFunc(facture.id!, facture.numero_facture)
                        }}
                        disabled={saving}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Del</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {viewMode === 'stats' && (
        <div className="space-y-6">
          {/* Graphiques de revenus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Analyse des revenus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Répartition par statut</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span>Brouillons</span>
                      </div>
                      <span className="font-medium">{stats.brouillon}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Envoyées</span>
                      </div>
                      <span className="font-medium">{stats.envoyee}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Payées</span>
                      </div>
                      <span className="font-medium">{stats.payee}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Revenus</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm text-green-600 mb-1">Montant encaissé</div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatCurrency(stats.montantPaye)}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-sm text-orange-600 mb-1">En attente</div>
                      <div className="text-2xl font-bold text-orange-900">
                        {formatCurrency(stats.montantEnAttente)}
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-600 mb-1">Total général</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatCurrency(stats.totalMontant)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Factures récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Factures récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {facturesFiltered.slice(0, 5).map((facture) => (
                  <div key={facture.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1",
                        getStatutColor(facture.statut)
                      )}>
                        {getStatutIcon(facture.statut)}
                        {getStatutLabel(facture.statut)}
                      </span>
                      <div>
                        <div className="font-medium">{facture.numero_facture}</div>
                        <div className="text-sm text-gray-600">
                          {facture.eleve?.prenom} {facture.eleve?.nom}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(facture.montant_total)}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Modal PDF */}
      {showPDFModal && selectedFactureForPDF && ecole && (
        <FacturePDFModal
          facture={selectedFactureForPDF}
          ecole={ecole}
          isOpen={showPDFModal}
          onClose={closePDFModal}
        />
      )}

      {/* Modal Aperçu */}
      {showModal && factureSelectionnee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Aperçu Facture</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <FacturePreview
                facture={factureSelectionnee}
                eleve={eleveApercu}
                ecole={ecoleApercu}
                lignes={lignesApercu}
              />
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Fermer
              </button>
              <button
                onClick={async () => {
                  await genererPDFFacture(factureSelectionnee, eleveApercu, ecoleApercu, lignesApercu)
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
