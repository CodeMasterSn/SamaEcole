'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  Upload, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  GraduationCap,
  Camera,
  User,
  Heart,
  Building,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { generateMatricule } from '@/lib/utils'
import {
  sauvegarderEleve,
  sauvegarderParentTuteur,
  obtenirClasses,
  obtenirEcole,
  uploadPhotoEleve,
  type EleveData,
  type ParentTuteurData,
  type ClasseData
} from '@/lib/supabase-functions'

// Types pour le formulaire
interface NouvelEleve {
  // Informations personnelles
  nom: string
  prenom: string
  date_naissance: string
  lieu_naissance: string
  sexe: 'M' | 'F' | ''
  adresse: string
  
  // Informations scolaires
  classe_id: string
  date_inscription: string
  
  // Photo
  photo_url?: string
  
  // Parent/Tuteur principal
  parent_nom: string
  parent_prenom: string
  parent_relation: 'pere' | 'mere' | 'tuteur' | 'autre' | ''
  parent_telephone: string
  parent_telephone_2?: string
  parent_email?: string
  parent_adresse?: string
  parent_profession?: string
}

export default function NouvelElevePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [eleve, setEleve] = useState<NouvelEleve>({
    nom: '',
    prenom: '',
    date_naissance: '',
    lieu_naissance: '',
    sexe: '',
    adresse: '',
    classe_id: '',
    date_inscription: new Date().toISOString().split('T')[0],
    parent_nom: '',
    parent_prenom: '',
    parent_relation: '',
    parent_telephone: '',
    parent_telephone_2: '',
    parent_email: '',
    parent_adresse: '',
    parent_profession: ''
  })

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Données chargées depuis Supabase
  const [classes, setClasses] = useState<ClasseData[]>([])
  const [ecoleId, setEcoleId] = useState<number | null>(null)

  useEffect(() => {
    chargerDonnees()
  }, [])

  // Recharger les classes quand on revient sur cette page
  useEffect(() => {
    const handleFocus = () => {
      if (ecoleId) {
        console.log('🔄 Rechargement automatique des classes (focus)')
        chargerClasses()
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && ecoleId) {
        console.log('🔄 Rechargement automatique des classes (visibility)')
        chargerClasses()
      }
    }

    // Recharger aussi au montage du composant si ecoleId est déjà défini
    if (ecoleId) {
      console.log('🔄 Rechargement initial des classes')
      chargerClasses()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [ecoleId])

  const chargerDonnees = async () => {
    try {
      // Charger l'école et les classes
      const ecole = await obtenirEcole()
      if (ecole?.id) {
        setEcoleId(ecole.id)
        await chargerClasses(ecole.id)
        
        // Pré-sélectionner la classe si spécifiée dans l'URL
        const classeIdParam = searchParams.get('classe_id')
        if (classeIdParam) {
          console.log('🎯 Classe pré-sélectionnée depuis URL:', classeIdParam)
          setEleve(prev => ({ ...prev, classe_id: classeIdParam }))
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
      afficherMessage('error', 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const chargerClasses = async (ecoleIdParam?: number) => {
    try {
      const id = ecoleIdParam || ecoleId
      if (id) {
        console.log('🔄 Rechargement des classes pour école:', id)
        const classesData = await obtenirClasses(id)
        setClasses(classesData)
        console.log('✅ Classes rechargées:', classesData.length)
        console.log('📋 Détail classes:', classesData?.map(c => ({
          id: c.id,
          niveau: c.niveau,
          section: c.section,
          nom_complet: c.nom_complet
        })))
      }
    } catch (error) {
      console.error('Erreur rechargement classes:', error)
    }
  }

  const afficherMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handlePhotoUpload = (file: File) => {
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const calculateAge = (dateNaissance: string) => {
    if (!dateNaissance) return ''
    const today = new Date()
    const birth = new Date(dateNaissance)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age > 0 ? `${age} ans` : ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ecoleId) {
      afficherMessage('error', 'École non trouvée')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Générer le matricule
      const matricule = generateMatricule()
      
      // 1. Créer/sauvegarder le parent d'abord
      const parentData: ParentTuteurData = {
        nom: eleve.parent_nom,
        prenom: eleve.parent_prenom,
        relation: eleve.parent_relation as any,
        telephone: eleve.parent_telephone,
        telephone_2: eleve.parent_telephone_2 || undefined,
        email: eleve.parent_email || undefined,
        adresse: eleve.parent_adresse || undefined,
        profession: eleve.parent_profession || undefined,
        est_contact_principal: true,
        ecole_id: ecoleId
      }

      const parentResult = await sauvegarderParentTuteur(parentData)
      
      if (!parentResult.success) {
        throw new Error('Erreur création parent: ' + parentResult.error)
      }

      // 2. Créer l'élève avec parent_id
      const eleveData = {
        ecole_id: ecoleId,
        matricule,
        nom: eleve.nom,
        prenom: eleve.prenom,
        date_naissance: eleve.date_naissance || undefined,
        lieu_naissance: eleve.lieu_naissance || undefined,
        sexe: eleve.sexe as 'M' | 'F',
        classe_id: parseInt(eleve.classe_id),
        statut: 'actif',
        date_inscription: eleve.date_inscription,
        parent_id: parentResult.data.id  // ← IMPORTANT : Lier au parent
      }

      const eleveResult = await sauvegarderEleve(eleveData)
      
      if (!eleveResult.success) {
        throw new Error('Erreur création élève: ' + eleveResult.error)
      }

      const eleveId = eleveResult.data.id

      // 3. Upload photo si présente
      if (photoFile && eleveId) {
        const photoResult = await uploadPhotoEleve(photoFile, eleveId)
        if (photoResult.success && photoResult.url) {
          await sauvegarderEleve({
            ...eleveData,
            id: eleveId,
            photo_url: photoResult.url
          })
        }
      }

      afficherMessage('success', '✅ Élève ajouté avec succès !')
      
      // Rediriger vers la liste après un délai
      setTimeout(() => {
        router.push('/dashboard/eleves')
      }, 2000)
      
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout:', error)
      afficherMessage('error', `❌ Erreur: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return eleve.nom && eleve.prenom && eleve.date_naissance && eleve.sexe && eleve.classe_id
      case 2:
        return eleve.parent_nom && eleve.parent_prenom && eleve.parent_relation && eleve.parent_telephone
      default:
        return true
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nouvel Élève
            </h1>
            <p className="text-gray-600">
              Ajouter un élève à l'école
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isStepValid(1) || !isStepValid(2) || isSubmitting}
            className="gap-2 bg-gradient-to-r from-green-600 to-green-700"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations Élève */}
          <Card className="lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informations de l'élève
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                    Nom de famille *
                  </Label>
                  <Input
                    id="nom"
                    placeholder="Diallo"
                    value={eleve.nom}
                    onChange={(e) => setEleve({...eleve, nom: e.target.value})}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prenom" className="text-sm font-medium text-gray-700">
                    Prénom *
                  </Label>
                  <Input
                    id="prenom"
                    placeholder="Amadou"
                    value={eleve.prenom}
                    onChange={(e) => setEleve({...eleve, prenom: e.target.value})}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date_naissance" className="text-sm font-medium text-gray-700">
                    Date de naissance *
                  </Label>
                  <Input
                    id="date_naissance"
                    type="date"
                    value={eleve.date_naissance}
                    onChange={(e) => setEleve({...eleve, date_naissance: e.target.value})}
                    className="mt-1"
                    required
                  />
                  {eleve.date_naissance && (
                    <p className="text-xs text-gray-500 mt-1">
                      Âge: {calculateAge(eleve.date_naissance)}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sexe" className="text-sm font-medium text-gray-700">
                    Sexe *
                  </Label>
                  <select
                    id="sexe"
                    value={eleve.sexe}
                    onChange={(e) => setEleve({...eleve, sexe: e.target.value as 'M' | 'F'})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="classe" className="text-sm font-medium text-gray-700">
                    Classe *
                  </Label>
                  <select
                    id="classe"
                    value={eleve.classe_id}
                    onChange={(e) => setEleve({...eleve, classe_id: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner une classe</option>
                    {console.log('🔍 DEBUG: Rendu select avec classes:', classes?.length)}
                    {classes.map(classe => {
                      console.log('📚 Option classe:', classe.niveau, classe.section, classe.nom_complet);
                      return (
                        <option key={classe.id} value={classe.id}>
                          {classe.nom_complet || `${classe.niveau} ${classe.section}`}
                        </option>
                      );
                    })}
                  </select>
                  {classes.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {classes.length} classe{classes.length > 1 ? 's' : ''} disponible{classes.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="lieu_naissance" className="text-sm font-medium text-gray-700">
                  Lieu de naissance
                </Label>
                <Input
                  id="lieu_naissance"
                  placeholder="Dakar, Sénégal"
                  value={eleve.lieu_naissance}
                  onChange={(e) => setEleve({...eleve, lieu_naissance: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="adresse" className="text-sm font-medium text-gray-700">
                  Adresse de l'élève
                </Label>
                <textarea
                  id="adresse"
                  placeholder="Quartier, Ville, Région"
                  value={eleve.adresse}
                  onChange={(e) => setEleve({...eleve, adresse: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="date_inscription" className="text-sm font-medium text-gray-700">
                  Date d'inscription
                </Label>
                <Input
                  id="date_inscription"
                  type="date"
                  value={eleve.date_inscription}
                  onChange={(e) => setEleve({...eleve, date_inscription: e.target.value})}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Photo */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                Photo de l'élève
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {photoPreview ? (
                  <div className="text-center">
                    <img 
                      src={photoPreview} 
                      alt="Aperçu photo élève" 
                      className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-purple-200"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      {photoFile?.name}
                    </p>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoPreview('')
                      }}
                      className="mt-2 text-red-600"
                    >
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-3">
                      Photo de l'élève (optionnel)
                    </p>
                    <label className="cursor-pointer">
                      <span className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                        Choisir une photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handlePhotoUpload(file)
                          }
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG jusqu'à 2MB
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Famille */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-orange-600" />
              Contact de la famille
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="parent_nom" className="text-sm font-medium text-gray-700">
                  Nom du parent/tuteur *
                </Label>
                <Input
                  id="parent_nom"
                  placeholder="Fall"
                  value={eleve.parent_nom}
                  onChange={(e) => setEleve({...eleve, parent_nom: e.target.value})}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="parent_prenom" className="text-sm font-medium text-gray-700">
                  Prénom *
                </Label>
                <Input
                  id="parent_prenom"
                  placeholder="Mariama"
                  value={eleve.parent_prenom}
                  onChange={(e) => setEleve({...eleve, parent_prenom: e.target.value})}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="parent_relation" className="text-sm font-medium text-gray-700">
                  Relation *
                </Label>
                <select
                  id="parent_relation"
                  value={eleve.parent_relation}
                  onChange={(e) => setEleve({...eleve, parent_relation: e.target.value as any})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="pere">Père</option>
                  <option value="mere">Mère</option>
                  <option value="tuteur">Tuteur/Tutrice</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent_telephone" className="text-sm font-medium text-gray-700">
                  Téléphone principal *
                </Label>
                <Input
                  id="parent_telephone"
                  placeholder="+221 77 123 45 67"
                  value={eleve.parent_telephone}
                  onChange={(e) => setEleve({...eleve, parent_telephone: e.target.value})}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="parent_telephone_2" className="text-sm font-medium text-gray-700">
                  Téléphone secondaire
                </Label>
                <Input
                  id="parent_telephone_2"
                  placeholder="+221 78 987 65 43"
                  value={eleve.parent_telephone_2}
                  onChange={(e) => setEleve({...eleve, parent_telephone_2: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent_email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="parent_email"
                  type="email"
                  placeholder="parent@email.com"
                  value={eleve.parent_email}
                  onChange={(e) => setEleve({...eleve, parent_email: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="parent_profession" className="text-sm font-medium text-gray-700">
                  Profession
                </Label>
                <Input
                  id="parent_profession"
                  placeholder="Enseignant, Commerçant..."
                  value={eleve.parent_profession}
                  onChange={(e) => setEleve({...eleve, parent_profession: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="parent_adresse" className="text-sm font-medium text-gray-700">
                Adresse de la famille
              </Label>
              <textarea
                id="parent_adresse"
                placeholder="Adresse complète de la famille"
                value={eleve.parent_adresse}
                onChange={(e) => setEleve({...eleve, parent_adresse: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Récapitulatif */}
        {(eleve.nom || eleve.prenom) && (
          <Card className="bg-gradient-to-r from-green-50 to-white border-green-200">
            <CardHeader>
              <CardTitle className="text-base text-green-800">
                Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-green-700">
                <p><strong>Élève:</strong> {eleve.prenom} {eleve.nom}</p>
                {eleve.date_naissance && <p><strong>Âge:</strong> {calculateAge(eleve.date_naissance)}</p>}
                {eleve.classe_id && <p><strong>Classe:</strong> {classes.find(c => c.id?.toString() === eleve.classe_id)?.nom_complet}</p>}
                {eleve.parent_nom && <p><strong>Contact:</strong> {eleve.parent_prenom} {eleve.parent_nom} ({eleve.parent_telephone})</p>}
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}