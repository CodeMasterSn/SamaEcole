'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar,
  User,
  GraduationCap,
  FileText,
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

interface Facture {
  id: number
  numero_facture: string
  montant_total: number
  statut: string
  date_emission: string
  created_at: string
}

export default function DetailElevePage() {
  const router = useRouter()
  const params = useParams()
  const eleveId = params.id as string
  
  const [eleve, setEleve] = useState<Eleve | null>(null)
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      // Charger les factures de l'élève (séparément pour éviter de bloquer)
      try {
        const { data: facturesData, error: facturesError } = await client
          .from('factures')
          .select('id, numero_facture, montant_total, statut, date_emission, created_at')
          .eq('eleve_id', parseInt(eleveId))
          .order('date_emission', { ascending: false })

        if (facturesError) {
          console.warn('Erreur chargement factures (non bloquante):', facturesError)
          console.log('ID élève utilisé:', eleveId, 'Type:', typeof eleveId)
          setFactures([])
        } else {
          console.log('Factures chargées:', facturesData?.length || 0)
          setFactures(facturesData || [])
        }
      } catch (factureError) {
        console.warn('Erreur lors du chargement des factures:', factureError)
        setFactures([])
      }

    } catch (error) {
      console.error('Erreur générale:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const calculerAge = (dateNaissance: string) => {
    const aujourdhui = new Date()
    const naissance = new Date(dateNaissance)
    let age = aujourdhui.getFullYear() - naissance.getFullYear()
    const mois = aujourdhui.getMonth() - naissance.getMonth()
    
    if (mois < 0 || (mois === 0 && aujourdhui.getDate() < naissance.getDate())) {
      age--
    }
    
    return age
  }

  const formaterDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formaterStatut = (statut: string) => {
    const statuts = {
      'payee': { label: 'Payée', color: 'bg-green-100 text-green-800' },
      'impayee': { label: 'Impayée', color: 'bg-red-100 text-red-800' },
      'partielle': { label: 'Partielle', color: 'bg-yellow-100 text-yellow-800' },
      'brouillon': { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      'envoyee': { label: 'Envoyée', color: 'bg-blue-100 text-blue-800' }
    }
    
    return statuts[statut as keyof typeof statuts] || { label: statut, color: 'bg-gray-100 text-gray-800' }
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
            onClick={() => router.push('/dashboard/eleves')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {eleve.prenom} {eleve.nom}
            </h1>
            <p className="text-gray-600">Détails de l'élève</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/dashboard/eleves/${eleve.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
                // TODO: Implémenter la suppression
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                <p className="mt-1 text-sm text-gray-900">{eleve.prenom} {eleve.nom}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Matricule</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{eleve.matricule}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                <p className="mt-1 text-sm text-gray-900">
                  {eleve.date_naissance ? (
                    <>
                      {formaterDate(eleve.date_naissance)}
                      {eleve.date_naissance && (
                        <span className="text-gray-500 ml-2">
                          ({calculerAge(eleve.date_naissance)} ans)
                        </span>
                      )}
                    </>
                  ) : (
                    'Non renseignée'
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sexe</label>
                <p className="mt-1 text-sm text-gray-900">
                  {eleve.sexe === 'M' ? 'Masculin' : eleve.sexe === 'F' ? 'Féminin' : 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date d'inscription</label>
                <p className="mt-1 text-sm text-gray-900">{formaterDate(eleve.date_inscription)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                  eleve.statut === 'actif' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {eleve.statut === 'actif' ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* Informations scolaires */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Informations scolaires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Classe actuelle</label>
                <p className="mt-1 text-sm text-gray-900">
                  {eleve.classes?.nom_complet || 'Non assigné'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Niveau</label>
                <p className="mt-1 text-sm text-gray-900">
                  {eleve.classes?.niveau || 'Non renseigné'}
                </p>
              </div>
            </div>
          </div>

          {/* Factures */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Factures ({factures.length})
            </h2>
            {factures.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Facture</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Émission</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Créée le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {factures.map((facture) => {
                      const statutInfo = formaterStatut(facture.statut)
                      return (
                        <tr key={facture.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {facture.numero_facture}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {facture.montant_total.toLocaleString()} FCFA
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statutInfo.color}`}>
                              {statutInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formaterDate(facture.date_emission)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formaterDate(facture.created_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune facture pour cet élève</p>
            )}
          </div>
        </div>

        {/* Informations parent/tuteur */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Parent/Tuteur
            </h2>
            {eleve.parents_tuteurs && eleve.parents_tuteurs.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {eleve.parents_tuteurs?.[0]?.prenom} {eleve.parents_tuteurs?.[0]?.nom}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relation</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {eleve.parents_tuteurs?.[0]?.relation}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Téléphone
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {eleve.parents_tuteurs?.[0]?.telephone || (
                      <span className="text-gray-400 italic">Non renseigné</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {eleve.parents_tuteurs?.[0]?.email || (
                      <span className="text-gray-400 italic">Non renseigné</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun parent assigné</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cet élève n'a pas de parent/tuteur enregistré.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
