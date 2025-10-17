'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building,
  GraduationCap,
  CreditCard,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
  Users,
  BookOpen,
  Settings,
  CheckCircle,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react'
import {
  sauvegarderEcole,
  obtenirEcole,
  sauvegarderClasse,
  obtenirClasses,
  supprimerClasse,
  sauvegarderTypeFrais,
  obtenirTypesFrais,
  supprimerTypeFrais,
  sauvegarderAnneeScolaire,
  obtenirAnneeScolaireActive,
  uploadLogo,
  type EcoleData,
  type ClasseData,
  type TypeFraisData,
  type AnneeScolaireData
} from '@/lib/supabase-functions'

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState('ecole')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // États pour les données
  const [ecoleId, setEcoleId] = useState<number | null>(null)
  const [ecoleInfo, setEcoleInfo] = useState<EcoleData>({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    directeur: '',
    devise: 'FCFA',
    taux_frais_retard: 5.00
  })

  const [classes, setClasses] = useState<ClasseData[]>([])
  const [typesFrais, setTypesFrais] = useState<TypeFraisData[]>([])
  const [anneeScolaire, setAnneeScolaire] = useState<AnneeScolaireData>({
    ecole_id: 0,
    libelle: '2024-2025',
    date_debut: '',
    date_fin: '',
    active: false
  })

  const [newClasse, setNewClasse] = useState({ niveau: '', section: '', effectif_max: 30 })
  const [newFrais, setNewFrais] = useState({ nom: '', montant_defaut: 0, recurrent: false, obligatoire: true })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  // États pour la modification des classes
  const [showEditClasseModal, setShowEditClasseModal] = useState(false)
  const [editingClasse, setEditingClasse] = useState<ClasseData | null>(null)

  // Charger les données au montage
  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    setLoading(true)
    try {
      // Charger les infos de l'école
      const ecole = await obtenirEcole()
      if (ecole) {
        setEcoleInfo(ecole)
        setEcoleId(ecole.id!)
        setLogoPreview(ecole.logo_url || '')
        
        // Charger les données liées à cette école
        const [classesData, fraisData, anneeData] = await Promise.all([
          obtenirClasses(ecole.id!),
          obtenirTypesFrais(ecole.id!),
          obtenirAnneeScolaireActive(ecole.id!)
        ])
        
        setClasses(classesData)
        setTypesFrais(fraisData)
        
        if (anneeData) {
          setAnneeScolaire(anneeData)
        } else {
          setAnneeScolaire(prev => ({ ...prev, ecole_id: ecole.id! }))
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
      afficherMessage('error', 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const afficherMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const sauvegarderTout = async () => {
    setSaving(true)
    try {
      // 1. Sauvegarder les infos de l'école
      const ecoleResult = await sauvegarderEcole(ecoleInfo)
      if (!ecoleResult.success) {
        throw new Error(ecoleResult.error)
      }

      const currentEcoleId = ecoleResult.data.id

      // 2. Upload du logo si nouveau fichier
      if (logoFile && currentEcoleId) {
        const logoResult = await uploadLogo(logoFile, currentEcoleId)
        if (logoResult.success && logoResult.url) {
          await sauvegarderEcole({ 
            ...ecoleInfo, 
            id: currentEcoleId,
            logo_url: logoResult.url 
          })
          setLogoPreview(logoResult.url)
        }
      }

      // 3. Sauvegarder l'année scolaire si définie
      if (anneeScolaire.libelle && anneeScolaire.date_debut && anneeScolaire.date_fin) {
        await sauvegarderAnneeScolaire({
          ...anneeScolaire,
          ecole_id: currentEcoleId
        })
      }

      setEcoleId(currentEcoleId)
      afficherMessage('success', '✅ Configuration sauvegardée avec succès !')
      
      // Recharger les données pour avoir les dernières infos
      await chargerDonnees()
      
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error)
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const ajouterClasse = async () => {
    if (!ecoleId || !newClasse.niveau || !newClasse.section) return

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
        setClasses([...classes, result.data])
        setNewClasse({ niveau: '', section: '', effectif_max: 30 })
        afficherMessage('success', '✅ Classe ajoutée !')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    }
  }

  const ajouterFrais = async () => {
    if (!ecoleId || !newFrais.nom || newFrais.montant_defaut <= 0) return

    try {
      const fraisData: TypeFraisData = {
        ecole_id: ecoleId,
        nom: newFrais.nom,
        montant_defaut: newFrais.montant_defaut,
        recurrent: newFrais.recurrent,
        obligatoire: newFrais.obligatoire,
        actif: true
      }

      const result = await sauvegarderTypeFrais(fraisData)
      
      if (result.success) {
        setTypesFrais([...typesFrais, result.data])
        setNewFrais({ nom: '', montant_defaut: 0, recurrent: false, obligatoire: true })
        afficherMessage('success', '✅ Type de frais ajouté !')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    }
  }

  const ouvrirEditionClasse = (classe: ClasseData) => {
    setEditingClasse({...classe})
    setShowEditClasseModal(true)
  }

  const sauvegarderEditionClasse = async () => {
    if (!editingClasse || !ecoleId) return

    try {
      const classeData: ClasseData = {
        id: editingClasse.id,
        ecole_id: ecoleId,
        niveau: editingClasse.niveau,
        section: editingClasse.section,
        nom_complet: `${editingClasse.niveau} ${editingClasse.section}`,
        effectif_max: editingClasse.effectif_max
      }

      const result = await sauvegarderClasse(classeData)
      
      if (result.success) {
        setClasses(classes.map(c => c.id === editingClasse.id ? result.data : c))
        afficherMessage('success', '✅ Classe modifiée avec succès !')
        setShowEditClasseModal(false)
        setEditingClasse(null)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    }
  }

  const supprimerClasseFunc = async (id: number) => {
    try {
      const result = await supprimerClasse(id)
      
      if (result.success) {
        setClasses(classes.filter(c => c.id !== id))
        afficherMessage('success', '✅ Classe supprimée !')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    }
  }

  const supprimerFraisFunc = async (id: number) => {
    try {
      const result = await supprimerTypeFrais(id)
      
      if (result.success) {
        setTypesFrais(typesFrais.filter(f => f.id !== id))
        afficherMessage('success', '✅ Type de frais supprimé !')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    }
  }

  const activerAnneeScolaire = async () => {
    if (!ecoleId || !anneeScolaire.libelle || !anneeScolaire.date_debut || !anneeScolaire.date_fin) return

    try {
      const result = await sauvegarderAnneeScolaire({
        ...anneeScolaire,
        ecole_id: ecoleId,
        active: true
      })

      if (result.success) {
        setAnneeScolaire({ ...result.data })
        afficherMessage('success', '✅ Année scolaire activée !')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    }
  }

  const handleLogoUpload = (file: File) => {
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la configuration...</p>
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
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Configuration École
            </h1>
            <p className="text-gray-600">
              Paramétrez votre établissement scolaire
            </p>
          </div>
        </div>
        <Button 
          onClick={sauvegarderTout}
          disabled={saving}
          className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder tout'}
        </Button>
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
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Configuration */}
      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white px-6 py-4">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="ecole" className="gap-2">
                <Building className="w-4 h-4" />
                École
              </TabsTrigger>
              <TabsTrigger value="classes" className="gap-2">
                <GraduationCap className="w-4 h-4" />
                Classes ({classes.length})
              </TabsTrigger>
              <TabsTrigger value="frais" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Frais ({typesFrais.length})
              </TabsTrigger>
              <TabsTrigger value="annee" className="gap-2">
                <Calendar className="w-4 h-4" />
                Année
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Informations École */}
          <TabsContent value="ecole" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Building className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Informations de l'établissement
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nom" className="text-sm font-medium">
                      Nom de l'école *
                    </Label>
                    <Input
                      id="nom"
                      placeholder="Ex: École Primaire Sama"
                      value={ecoleInfo.nom}
                      onChange={(e) => setEcoleInfo({...ecoleInfo, nom: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Input
                      id="directeur"
                      placeholder="M./Mme Nom Prénom"
                      value={ecoleInfo.directeur}
                      onChange={(e) => setEcoleInfo({...ecoleInfo, directeur: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telephone" className="text-sm font-medium">
                      Téléphone
                    </Label>
                    <Input
                      id="telephone"
                      placeholder="+221 33 XXX XX XX"
                      value={ecoleInfo.telephone}
                      onChange={(e) => setEcoleInfo({...ecoleInfo, telephone: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email de l'école
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@monecole.sn"
                      value={ecoleInfo.email}
                      onChange={(e) => setEcoleInfo({...ecoleInfo, email: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="adresse" className="text-sm font-medium">
                      Adresse complète
                    </Label>
                    <textarea
                      id="adresse"
                      placeholder="Quartier, Ville, Région"
                      value={ecoleInfo.adresse}
                      onChange={(e) => setEcoleInfo({...ecoleInfo, adresse: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Logo de l'école
                    </Label>
                    <div className="mt-1 space-y-3">
                      {logoPreview && (
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <img 
                            src={logoPreview} 
                            alt="Logo école" 
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {logoFile?.name || 'Logo actuel'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {logoFile && `${(logoFile.size / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setLogoFile(null)
                              setLogoPreview('')
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Glissez votre logo ici ou{' '}
                          <label className="text-purple-600 cursor-pointer hover:text-purple-700">
                            <span>parcourez</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleLogoUpload(file)
                                }
                              }}
                            />
                          </label>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG jusqu'à 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Classes */}
          <TabsContent value="classes" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Gestion des Classes ({classes.length})
                  </h2>
                </div>
              </div>

              {/* Formulaire Ajouter Classe */}
              <Card className="bg-gradient-to-r from-purple-50 to-white border-purple-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter une nouvelle classe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Niveau</Label>
                      <Input
                        placeholder="CP, CE1, 6ème..."
                        value={newClasse.niveau}
                        onChange={(e) => setNewClasse({...newClasse, niveau: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Section</Label>
                      <Input
                        placeholder="A, B, C..."
                        value={newClasse.section}
                        onChange={(e) => setNewClasse({...newClasse, section: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Effectif max</Label>
                      <Input
                        type="number"
                        value={newClasse.effectif_max || ''}
                        onChange={(e) => setNewClasse({...newClasse, effectif_max: parseInt(e.target.value) || 0})}
                        placeholder="30"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={ajouterClasse} 
                        className="w-full gap-2"
                        disabled={!ecoleId || !newClasse.niveau || !newClasse.section}
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des Classes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((classe) => (
                  <Card key={classe.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {classe.nom_complet}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Niveau: {classe.niveau} • Section: {classe.section}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => ouvrirEditionClasse(classe)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => supprimerClasseFunc(classe.id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        Effectif max: {classe.effectif_max} élèves
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {classes.length === 0 && (
                <div className="text-center py-8">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune classe configurée
                  </h3>
                  <p className="text-gray-600">
                    Commencez par ajouter vos premières classes ci-dessus.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Types de Frais */}
          <TabsContent value="frais" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Types de Frais Scolaires ({typesFrais.length})
                </h2>
              </div>

              {/* Formulaire Ajouter Frais */}
              <Card className="bg-gradient-to-r from-green-50 to-white border-green-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter un type de frais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nom du frais</Label>
                      <Input
                        placeholder="Inscription, Mensualité..."
                        value={newFrais.nom}
                        onChange={(e) => setNewFrais({...newFrais, nom: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Montant (FCFA)</Label>
                      <Input
                        type="number"
                        placeholder="25000"
                        value={newFrais.montant_defaut || ''}
                        onChange={(e) => setNewFrais({...newFrais, montant_defaut: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="flex items-center space-x-4 pt-6">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newFrais.recurrent}
                          onChange={(e) => setNewFrais({...newFrais, recurrent: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <span>Récurrent</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newFrais.obligatoire}
                          onChange={(e) => setNewFrais({...newFrais, obligatoire: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <span>Obligatoire</span>
                      </label>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={ajouterFrais} 
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                        disabled={!ecoleId || !newFrais.nom || newFrais.montant_defaut <= 0}
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des Types de Frais */}
              <div className="space-y-4">
                {typesFrais.map((frais) => (
                  <Card key={frais.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {frais.nom}
                              </h3>
                              <p className="text-lg text-purple-600 font-medium">
                                {frais.montant_defaut.toLocaleString()} FCFA
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {frais.recurrent && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Récurrent
                                </span>
                              )}
                              {frais.obligatoire && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  Obligatoire
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => supprimerFraisFunc(frais.id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {typesFrais.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun type de frais configuré
                  </h3>
                  <p className="text-gray-600">
                    Ajoutez vos premiers types de frais ci-dessus.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Année Scolaire */}
          <TabsContent value="annee" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Année Scolaire
                </h2>
              </div>

              <Card className="bg-gradient-to-r from-orange-50 to-white border-orange-200">
                <CardHeader>
                  <CardTitle className="text-base">
                    Année Scolaire Actuelle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Libellé</Label>
                      <Input 
                        placeholder="2024-2025" 
                        value={anneeScolaire.libelle}
                        onChange={(e) => setAnneeScolaire({...anneeScolaire, libelle: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date de début</Label>
                      <Input 
                        type="date" 
                        value={anneeScolaire.date_debut}
                        onChange={(e) => setAnneeScolaire({...anneeScolaire, date_debut: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date de fin</Label>
                      <Input 
                        type="date" 
                        value={anneeScolaire.date_fin}
                        onChange={(e) => setAnneeScolaire({...anneeScolaire, date_fin: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <Button 
                      className="gap-2"
                      onClick={activerAnneeScolaire}
                      disabled={!ecoleId || !anneeScolaire.libelle || !anneeScolaire.date_debut || !anneeScolaire.date_fin}
                    >
                      <Save className="w-4 h-4" />
                      Définir comme active
                    </Button>
                    {anneeScolaire.active && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        ✅ Année active
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Configuration année scolaire
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Définissez la période de l'année scolaire active pour organiser vos trimestres et évaluations.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Modal d'édition des classes */}
      {showEditClasseModal && editingClasse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Modifier la classe</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditClasseModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Niveau</Label>
                  <Input
                    value={editingClasse.niveau}
                    onChange={(e) => setEditingClasse({...editingClasse, niveau: e.target.value})}
                    placeholder="CP, CE1, 6ème..."
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Section</Label>
                  <Input
                    value={editingClasse.section}
                    onChange={(e) => setEditingClasse({...editingClasse, section: e.target.value})}
                    placeholder="A, B, C..."
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Effectif maximum</Label>
                <Input
                  type="number"
                  value={editingClasse.effectif_max || ''}
                  onChange={(e) => setEditingClasse({...editingClasse, effectif_max: parseInt(e.target.value) || 0})}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setShowEditClasseModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={sauvegarderEditionClasse}
                disabled={!editingClasse.niveau || !editingClasse.section || !editingClasse.effectif_max}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}