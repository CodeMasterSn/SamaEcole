/**
 * PAGE GESTION DES CLASSES - SAMA ÉCOLE
 * 
 * Fonctionnalités:
 * - Affichage de toutes les classes configurées sous forme de cards
 * - Ajout rapide de nouvelles classes (niveau, section, effectif max)
 * - Modification des classes existantes via modal popup
 * - Suppression de classes avec confirmation
 * - Recherche et filtrage des classes
 * - Statistiques en temps réel (nombre de classes, capacité totale, élèves inscrits)
 * - Navigation vers la liste des élèves par classe
 * 
 * Correction appliquée:
 * - Fix du bug d'input "effectif maximum" qui ne se vidait pas complètement
 * - Gestion correcte des valeurs vides avec état séparé pour l'affichage
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  GraduationCap, 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  Search,
  Loader2,
  RefreshCw,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  obtenirClassesAvecStats,
  sauvegarderClasse,
  supprimerClasse,
  obtenirEcole,
  type ClasseData
} from '@/lib/supabase-functions'

interface ClasseAvecStats extends ClasseData {
  nombre_eleves?: number
}

export default function ClassesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editingClasse, setEditingClasse] = useState<ClasseAvecStats | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Données
  const [classes, setClasses] = useState<ClasseAvecStats[]>([])
  const [ecoleId, setEcoleId] = useState<number | null>(null)
  const [newClasse, setNewClasse] = useState({ niveau: '', section: '', effectif_max: 30 })

  // États pour gérer les inputs d'effectif (fix du bug)
  const [newClasseEffectifInput, setNewClasseEffectifInput] = useState('30')
  const [editEffectifInput, setEditEffectifInput] = useState('')

  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    const wasRefreshing = refreshing
    if (!wasRefreshing) setLoading(true)
    
    try {
      const ecole = await obtenirEcole()
      if (ecole?.id) {
        setEcoleId(ecole.id)
        const classesData = await obtenirClassesAvecStats(ecole.id)
        setClasses(classesData)
      }
    } catch (error) {
      console.error('Erreur chargement classes:', error)
      afficherMessage('error', 'Erreur lors du chargement')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const actualiserDonnees = async () => {
    setRefreshing(true)
    await chargerDonnees()
  }

  const afficherMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  // Fix: Nouvelle fonction pour gérer l'effectif du formulaire d'ajout
  const handleNewClasseEffectifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewClasseEffectifInput(value)
    
    // Mettre à jour l'état avec un nombre valide ou 30 par défaut
    const numericValue = value === '' ? 30 : parseInt(value) || 30
    setNewClasse({...newClasse, effectif_max: numericValue})
  }

  const ajouterClasse = async () => {
    if (!ecoleId || !newClasse.niveau || !newClasse.section) {
      afficherMessage('error', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    setSaving(true)
    try {
      const classeData: ClasseData = {
        ecole_id: ecoleId,
        niveau: newClasse.niveau,
        section: newClasse.section,
        nom_complet: `${newClasse.niveau} ${newClasse.section}`,
        effectif_max: newClasse.effectif_max
      }

      const result = await sauvegarderClasse(classeData)
      
      if (result.success) {
        await chargerDonnees() // Recharger les données pour avoir les stats à jour
        setNewClasse({ niveau: '', section: '', effectif_max: 30 })
        setNewClasseEffectifInput('30') // Reset de l'input
        afficherMessage('success', '✅ Classe ajoutée avec succès !')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const ouvrirEdition = (classe: ClasseAvecStats) => {
    setEditingClasse({...classe})
    // Fix: Initialiser l'input avec la valeur actuelle
    setEditEffectifInput(classe.effectif_max?.toString() || '30')
    setShowEditModal(true)
  }

  const fermerEdition = () => {
    setEditingClasse(null)
    setEditEffectifInput('')
    setShowEditModal(false)
  }

  // Fix: Nouvelle fonction pour gérer l'effectif du modal d'édition
  const handleEditEffectifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEditEffectifInput(value)
    
    if (editingClasse) {
      // Permettre une chaîne vide pendant la saisie, mais garder une valeur numérique valide
      const numericValue = value === '' ? 0 : parseInt(value) || 0
      setEditingClasse({
        ...editingClasse, 
        effectif_max: numericValue
      })
    }
  }

  const sauvegarderEdition = async () => {
    if (!editingClasse || !ecoleId) return

    // Validation: s'assurer qu'on a un effectif valide
    const effectifFinal = editEffectifInput === '' || parseInt(editEffectifInput) <= 0 
      ? 30 
      : parseInt(editEffectifInput)

    setSaving(true)
    try {
      const classeData: ClasseData = {
        id: editingClasse.id,
        ecole_id: ecoleId,
        niveau: editingClasse.niveau,
        section: editingClasse.section,
        nom_complet: `${editingClasse.niveau} ${editingClasse.section}`,
        effectif_max: effectifFinal
      }

      const result = await sauvegarderClasse(classeData)
      
      if (result.success) {
        await chargerDonnees() // Recharger les données pour avoir les stats à jour
        afficherMessage('success', '✅ Classe modifiée avec succès !')
        fermerEdition()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const supprimerClasseFunc = async (id: number, nomClasse: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la classe "${nomClasse}" ?`)) return

    try {
      const result = await supprimerClasse(id)
      
      if (result.success) {
        await chargerDonnees() // Recharger les données pour avoir les stats à jour
        afficherMessage('success', '✅ Classe supprimée !')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    }
  }

  // Filtrage des classes
  const classesFiltered = classes.filter(classe => 
    classe.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classe.niveau.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classe.section.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestion des Classes
            </h1>
            <p className="text-gray-600">
              {classesFiltered.length} classe{classesFiltered.length > 1 ? 's' : ''} configurée{classesFiltered.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={actualiserDonnees}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          <Link href="/dashboard/parametres?tab=classes">
            <Button variant="outline" className="gap-2">
              <Edit className="w-4 h-4" />
              Paramètres
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages de feedback */}
      {message.text && (
        <Card className={`border-l-4 ${
          message.type === 'success' 
            ? 'border-green-500 bg-green-50' 
            : 'border-red-500 bg-red-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className={message.type === 'success' ? 'text-green-600' : 'text-red-600'}>
                {message.type === 'success' ? '✅' : '❌'}
              </span>
              <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire Ajout Rapide */}
      <Card className="bg-gradient-to-r from-purple-50 to-white border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-600" />
            Ajouter une nouvelle classe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Niveau *</Label>
              <Input
                placeholder="CP, CE1, 6ème..."
                value={newClasse.niveau}
                onChange={(e) => setNewClasse({...newClasse, niveau: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Section *</Label>
              <Input
                placeholder="A, B, C..."
                value={newClasse.section}
                onChange={(e) => setNewClasse({...newClasse, section: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Effectif max</Label>
              {/* Fix: Utilisation de l'état séparé pour l'input */}
              <Input
                type="number"
                placeholder="30"
                value={newClasseEffectifInput}
                onChange={handleNewClasseEffectifChange}
                min="1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={ajouterClasse} 
                disabled={!ecoleId || !newClasse.niveau || !newClasse.section || saving}
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-purple-700"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des Classes */}
      {classesFiltered.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {classes.length === 0 ? 'Aucune classe configurée' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-600 mb-4">
            {classes.length === 0 
              ? 'Commencez par ajouter votre première classe ci-dessus.'
              : 'Essayez de modifier votre recherche.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classesFiltered.map((classe) => (
            <Card key={classe.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {classe.nom_complet}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {classe.niveau} • Section {classe.section}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-blue-50" 
                      onClick={() => ouvrirEdition(classe)}
                      title="Modifier la classe"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => supprimerClasseFunc(classe.id!, classe.nom_complet)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer la classe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Effectif maximum</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{classe.effectif_max}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Élèves inscrits</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-600">{classe.nombre_eleves || 0}</span>
                      <span className="text-gray-400">/ {classe.effectif_max}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <Link href={`/dashboard/eleves?classe_id=${classe.id}&classe_nom=${encodeURIComponent(classe.nom_complet)}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2 hover:bg-purple-50 hover:border-purple-200"
                      >
                        <Users className="w-4 h-4" />
                        Voir les élèves
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{classes.length}</p>
                <p className="text-sm text-gray-600">Classes au total</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {classes.reduce((total, classe) => total + classe.effectif_max, 0)}
                </p>
                <p className="text-sm text-gray-600">Capacité totale</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {classes.reduce((total, classe) => total + (classe.nombre_eleves || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Élèves inscrits</p>
              </div>
              <BookOpen className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal d'édition */}
      {showEditModal && editingClasse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Modifier la classe
              </h3>
              <Button variant="ghost" size="sm" onClick={fermerEdition}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Niveau *</Label>
                <Input
                  value={editingClasse.niveau}
                  onChange={(e) => setEditingClasse({...editingClasse, niveau: e.target.value})}
                  placeholder="CP, CE1, 6ème..."
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Section *</Label>
                <Input
                  value={editingClasse.section}
                  onChange={(e) => setEditingClasse({...editingClasse, section: e.target.value})}
                  placeholder="A, B, C..."
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Effectif maximum</Label>
                {/* Fix: Utilisation de l'état séparé pour l'input d'édition */}
                <Input
                  type="number"
                  value={editEffectifInput}
                  onChange={handleEditEffectifChange}
                  placeholder="30"
                  min="1"
                />
              </div>

              {editingClasse.nombre_eleves && editingClasse.nombre_eleves > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800 text-sm">
                    <span className="text-orange-600">⚠️</span>
                    <span>
                      Cette classe contient {editingClasse.nombre_eleves} élève{editingClasse.nombre_eleves > 1 ? 's' : ''}.
                      Assurez-vous que l'effectif maximum soit suffisant.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={fermerEdition} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={sauvegarderEdition}
                disabled={!editingClasse.niveau || !editingClasse.section || saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>✅</span>}
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}