'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Phone, 
  Mail, 
  Calendar,
  User,
  GraduationCap,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { createAuthenticatedClient } from '@/lib/supabase-functions'

interface Eleve {
  id: number
  nom: string
  prenom: string
  matricule: string
  date_naissance: string | null
  sexe: 'M' | 'F' | null
  statut: 'actif' | 'inactif'
  date_inscription: string
  classe_id: number | null
  parent_id: number | null
  ecole_id: number
  classes?: {
    id: number
    niveau: string
    nom_complet: string
  }
  parents_tuteurs?: {
    id: number
    nom: string
    prenom: string
    telephone: string | null
    relation: string
  }
}

interface Classe {
  id: number
  niveau: string
  nom_complet: string
}

export default function EditElevePage() {
  const router = useRouter()
  const params = useParams()
  const eleveId = params.id as string
  
  const [eleve, setEleve] = useState<Eleve | null>(null)
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // États pour l'édition
  const [formData, setFormData] = useState({
    // Élève
    nom: '',
    prenom: '',
    matricule: '',
    date_naissance: '',
    sexe: '' as 'M' | 'F' | '',
    statut: 'actif' as 'actif' | 'inactif',
    date_inscription: '',
    classe_id: '',
    
    // Parent
    parent_nom: '',
    parent_prenom: '',
    parent_telephone: '',
    parent_email: '',
    parent_relation: ''
  })

  useEffect(() => {
    if (eleveId) {
      chargerDonnees()
    }
  }, [eleveId])

  const chargerDonnees = async () => {
    try {
      const client = await createAuthenticatedClient()
      
      // Charger les détails de l'élève
      const { data: eleveData, error: eleveError } = await client
        .from('eleves')
        .select(`
          *,
          classes(id, niveau, nom_complet),
          parents_tuteurs(id, nom, prenom, telephone, email, relation)
        `)
        .eq('id', eleveId)
        .single()

      if (eleveError) {
        console.error('Erreur chargement élève:', eleveError)
        setError('Élève non trouvé')
        return
      }

      setEleve(eleveData)

      // Pré-remplir le formulaire
      setFormData({
        nom: eleveData.nom,
        prenom: eleveData.prenom,
        matricule: eleveData.matricule,
        date_naissance: eleveData.date_naissance || '',
        sexe: eleveData.sexe || '',
        statut: eleveData.statut,
        date_inscription: eleveData.date_inscription,
        classe_id: eleveData.classe_id?.toString() || '',
        parent_nom: eleveData.parents_tuteurs?.[0]?.nom || '',
        parent_prenom: eleveData.parents_tuteurs?.[0]?.prenom || '',
        parent_telephone: eleveData.parents_tuteurs?.[0]?.telephone || '',
        parent_email: eleveData.parents_tuteurs?.[0]?.email || '',
        parent_relation: eleveData.parents_tuteurs?.[0]?.relation || ''
      })

      // Charger les classes
      const { data: classesData, error: classesError } = await client
        .from('classes')
        .select('*')
        .order('niveau')

      if (classesError) {
        console.error('Erreur chargement classes:', classesError)
      } else {
        setClasses(classesData || [])
      }

    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eleve) return

    setSaving(true)
    setMessage(null)

    console.log('=== DÉBUT SAUVEGARDE ===')
    console.log('Données formulaire:', formData)
    console.log('Élève ID:', eleve.id)
    console.log('Parent ID:', eleve.parents_tuteurs?.id)

    try {
      const client = await createAuthenticatedClient()

      // 1. Mettre à jour l'élève (test simple d'abord)
      console.log('1. Mise à jour élève...')
      const donneesEleve = {
        nom: formData.nom,
        prenom: formData.prenom
      }
      console.log('Données élève à sauvegarder (test simple):', donneesEleve)

      const { error: eleveError } = await client
        .from('eleves')
        .update(donneesEleve)
        .eq('id', eleve.id)

      if (eleveError) {
        console.error('Erreur élève:', eleveError)
        throw new Error(`Erreur mise à jour élève: ${eleveError.message}`)
      }
      console.log('✅ Élève mis à jour avec succès')

      // 2. Gérer le parent (créer ou mettre à jour)
      if (formData.parent_nom && formData.parent_prenom) {
        if (eleve.parents_tuteurs && eleve.parents_tuteurs.length > 0 && eleve.parents_tuteurs[0].id) {
          // Mettre à jour le parent existant
          console.log('2. Mise à jour parent existant...')
          const donneesParent = {
            nom: formData.parent_nom,
            prenom: formData.parent_prenom,
            telephone: formData.parent_telephone || null,
            email: formData.parent_email || null,
            relation: formData.parent_relation || 'tuteur',
            est_contact_principal: true
          }
          console.log('Données parent à sauvegarder:', donneesParent)
          console.log('Parent ID:', eleve.parents_tuteurs[0].id)

          const { error: parentError } = await client
            .from('parents_tuteurs')
            .update(donneesParent)
            .eq('id', eleve.parents_tuteurs[0].id)

          if (parentError) {
            console.error('Erreur parent:', parentError)
            throw new Error(`Erreur mise à jour parent: ${parentError.message}`)
          }
          console.log('✅ Parent mis à jour avec succès')
        } else {
          // Créer un nouveau parent (avec eleve_id obligatoire)
          console.log('2. Création nouveau parent...')
          console.log('🔍 eleve.id avant insert:', eleve.id, typeof eleve.id)

          const { data: nouveauParent, error: parentError } = await client
            .from('parents_tuteurs')
            .insert({
              eleve_id: parseInt(eleve.id),
              nom: formData.parent_nom,
              prenom: formData.parent_prenom,
              telephone: formData.parent_telephone || null,
              email: formData.parent_email || null,
              relation: formData.parent_relation || 'tuteur',
              est_contact_principal: true
            })
            .select()
            .single()

          console.log('📊 Résultat insert parent:', nouveauParent, parentError)

          if (parentError) {
            console.error('Erreur création parent:', parentError)
            throw new Error(`Erreur création parent: ${parentError.message}`)
          }

          console.log('✅ Nouveau parent créé avec succès')
        }
      } else {
        console.log('⚠️ Pas de données parent à sauvegarder')
      }

      setMessage({ type: 'success', text: 'Modifications sauvegardées avec succès !' })
      
      // Recharger les données après 1 seconde
      setTimeout(() => {
        chargerDonnees()
      }, 1000)

    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error)
      console.error('Stack trace:', error.stack)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
      console.log('=== FIN SAUVEGARDE ===')

      // Afficher message succès et rediriger
      alert('✅ Modifications enregistrées avec succès')
      router.push('/dashboard/eleves')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error || !eleve) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Élève non trouvé</h3>
        <p className="mt-1 text-sm text-gray-500">
          L'élève demandé n'existe pas ou a été supprimé.
        </p>
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard/eleves')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/eleves/${eleve.id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Modifier {eleve.prenom} {eleve.nom}
            </h1>
            <p className="text-gray-600">Modifiez les informations de l'élève</p>
          </div>
        </div>
      </div>

      {/* Message de statut */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations personnelles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matricule
                </label>
                <input
                  type="text"
                  value={formData.matricule}
                  onChange={(e) => handleInputChange('matricule', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => handleInputChange('date_naissance', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexe
                  </label>
                  <select
                    value={formData.sexe}
                    onChange={(e) => handleInputChange('sexe', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'inscription *
                  </label>
                  <input
                    type="date"
                    value={formData.date_inscription}
                    onChange={(e) => handleInputChange('date_inscription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut *
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => handleInputChange('statut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Informations scolaires */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Informations scolaires
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classe
                </label>
                <select
                  value={formData.classe_id}
                  onChange={(e) => handleInputChange('classe_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(classe => (
                    <option key={classe.id} value={classe.id.toString()}>
                      {classe.nom_complet}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Informations parent/tuteur */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Parent/Tuteur
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom du parent
              </label>
              <input
                type="text"
                value={formData.parent_prenom}
                onChange={(e) => handleInputChange('parent_prenom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du parent
              </label>
              <input
                type="text"
                value={formData.parent_nom}
                onChange={(e) => handleInputChange('parent_nom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone
                </div>
              </label>
              <input
                type="tel"
                value={formData.parent_telephone}
                onChange={(e) => handleInputChange('parent_telephone', e.target.value)}
                placeholder="+221 7X XXX XX XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
              </label>
              <input
                type="email"
                value={formData.parent_email}
                onChange={(e) => handleInputChange('parent_email', e.target.value)}
                placeholder="parent@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation
              </label>
              <select
                value={formData.parent_relation}
                onChange={(e) => handleInputChange('parent_relation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Sélectionner</option>
                <option value="pere">Père</option>
                <option value="mere">Mère</option>
                <option value="tuteur">Tuteur</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/eleves/${eleve.id}`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  )
}
