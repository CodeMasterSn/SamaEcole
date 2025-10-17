'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Upload,
  Download,
  X,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { createAuthenticatedClient } from '@/lib/supabase-functions'
import * as XLSX from 'xlsx'

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

export default function ElevesPage() {
  const router = useRouter()
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClasse, setSelectedClasse] = useState<string>('all')
  const [showImportModal, setShowImportModal] = useState(false)
  
  // États pour l'import Excel
  const [fichierImport, setFichierImport] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [donneesExcel, setDonneesExcel] = useState<any[]>([])
  const [chargementFichier, setChargementFichier] = useState(false)
  const [erreurLecture, setErreurLecture] = useState<string | null>(null)
  const [erreursValidation, setErreursValidation] = useState<string[]>([])
  const [importEnCours, setImportEnCours] = useState(false)
  const [progression, setProgression] = useState({ actuel: 0, total: 0 })
  const [resultatsImport, setResultatsImport] = useState<{
    succes: number
    erreurs: number
    details: string[]
  } | null>(null)

  useEffect(() => {
    chargerDonnees()
  }, [])

  useEffect(() => {
    if (fichierImport) {
      lireFichierExcel(fichierImport)
    } else {
      setDonneesExcel([])
      setErreurLecture(null)
      setErreursValidation([])
    }
  }, [fichierImport])

  const chargerDonnees = async () => {
    try {
      const client = await createAuthenticatedClient()
      
      // Charger les élèves avec leurs relations
      const { data: elevesData, error: elevesError } = await client
        .from('eleves')
        .select(`
          *,
          classes(id, niveau, nom_complet),
          parents_tuteurs(id, nom, prenom, telephone, email, relation)
        `)
        .order('created_at', { ascending: false })

      if (elevesError) throw elevesError


      // Charger les classes
      const { data: classesData, error: classesError } = await client
        .from('classes')
        .select('*')
        .order('niveau')

      if (classesError) throw classesError

      setEleves(elevesData || [])
      setClasses(classesData || [])
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }

  const lireFichierExcel = async (file: File) => {
    setChargementFichier(true)
    setErreurLecture(null)
    setErreursValidation([])
    
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, {
        cellDates: true,
        dateNF: 'dd/mm/yyyy'
      })

      // Lire la première feuille
      const premiereFeuille = workbook.Sheets[workbook.SheetNames[0]]
      const donnees = XLSX.utils.sheet_to_json(premiereFeuille, {
        raw: false,
        defval: ''
      })

      console.log('Données lues:', donnees)
      
      if (donnees.length === 0) {
        setErreurLecture('Le fichier Excel est vide')
        return
      }

      setDonneesExcel(donnees)
      
      // Valider les données
      const erreurs = validerDonneesExcel(donnees)
      setErreursValidation(erreurs)
      
    } catch (error) {
      console.error('Erreur lecture Excel:', error)
      setErreurLecture('Erreur lors de la lecture du fichier. Vérifiez le format.')
    } finally {
      setChargementFichier(false)
    }
  }

  const validerDonneesExcel = (donnees: any[]) => {
    const erreurs: string[] = []
    
    if (donnees.length === 0) {
      erreurs.push('Le fichier est vide')
      return erreurs
    }

    // Vérifier les colonnes obligatoires
    const colonnesRequises = ['Nom', 'Prénom', 'Classe']
    const premiereligne = donnees[0]
    const colonnesPresentes = Object.keys(premiereligne)
    
    colonnesRequises.forEach(col => {
      if (!colonnesPresentes.includes(col)) {
        erreurs.push(`Colonne manquante : "${col}"`)
      }
    })

    if (erreurs.length > 0) {
      return erreurs
    }

    // Valider chaque ligne
    donnees.forEach((ligne, index) => {
      const numLigne = index + 2 // +2 car ligne 1 = en-tête
      
      // Nom obligatoire
      if (!ligne.Nom || ligne.Nom.trim() === '') {
        erreurs.push(`Ligne ${numLigne}: Nom manquant`)
      }
      
      // Prénom obligatoire
      if (!ligne.Prénom || ligne.Prénom.trim() === '') {
        erreurs.push(`Ligne ${numLigne}: Prénom manquant`)
      }
      
      // Classe obligatoire
      if (!ligne.Classe || ligne.Classe.trim() === '') {
        erreurs.push(`Ligne ${numLigne}: Classe manquante`)
      }
      
      // Validation téléphone parent (si présent)
      if (ligne['Parent Tél'] && ligne['Parent Tél'].trim() !== '') {
        const tel = ligne['Parent Tél'].toString().replace(/\s/g, '')
        // Format sénégalais : doit contenir 7 et 9 chiffres
        if (!/^(\+221)?7[0-9]{8}$/.test(tel)) {
          erreurs.push(`Ligne ${numLigne}: Téléphone parent invalide (format attendu: +221 7X XXX XX XX)`)
        }
      }
    })

    // Limiter à 10 erreurs affichées
    return erreurs.slice(0, 10)
  }

  const convertirDateExcel = (dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === '') return null
    
    try {
      // Si c'est déjà au format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr
      }
      
      // Si c'est au format DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/')
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      
      // Si c'est un nombre (date Excel)
      const date = new Date((parseFloat(dateStr) - 25569) * 86400 * 1000)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
      
      return null
    } catch {
      return null
    }
  }

  const obtenirDateInscriptionDefaut = (): string => {
    const maintenant = new Date()
    const annee = maintenant.getMonth() >= 8 ? maintenant.getFullYear() : maintenant.getFullYear() - 1
    return `${annee}-09-01`
  }

  const genererMatricule = async (client: any): Promise<string> => {
    const annee = new Date().getFullYear()
    let compteur = 1
    
    while (true) {
      const matricule = `MAT-${annee}-${compteur.toString().padStart(4, '0')}`
      
      const { data } = await client
        .from('eleves')
        .select('id')
        .eq('matricule', matricule)
        .maybeSingle()
      
      if (!data) {
        return matricule
      }
      
      compteur++
    }
  }

  const normaliserRelation = (relation: string): string => {
    if (!relation) return 'tuteur'
    
    const relationLower = relation.toLowerCase().trim()
    
    if (relationLower.includes('père') || relationLower.includes('pere') || relationLower.includes('papa')) {
      return 'pere'
    }
    if (relationLower.includes('mère') || relationLower.includes('mere') || relationLower.includes('maman')) {
      return 'mere'
    }
    if (relationLower.includes('tuteur') || relationLower.includes('guardian')) {
      return 'tuteur'
    }
    
    return 'tuteur' // Par défaut
  }

  const importerEleves = async () => {
    setImportEnCours(true)
    setProgression({ actuel: 0, total: donneesExcel.length })
    const succes: string[] = []
    const erreurs: string[] = []
    
    try {
      const client = await createAuthenticatedClient()
      
      for (let i = 0; i < donneesExcel.length; i++) {
        const ligne = donneesExcel[i]
        setProgression({ actuel: i + 1, total: donneesExcel.length })
        
        try {
          // 1. Créer l'élève d'abord (sans parent_id)
          const matricule = ligne.Matricule || await genererMatricule(client)
          const dateNaissance = convertirDateExcel(ligne['Date naissance'])
          const dateInscription = convertirDateExcel(ligne['Date inscription']) || obtenirDateInscriptionDefaut()
          
          const { data: nouvelEleve, error: errEleve } = await client
            .from('eleves')
            .insert({
              nom: ligne.Nom,
              prenom: ligne.Prénom,
              date_naissance: dateNaissance,
              sexe: ligne.Sexe === 'M' || ligne.Sexe === 'Masculin' ? 'M' :
                    ligne.Sexe === 'F' || ligne.Sexe === 'Féminin' ? 'F' : null,
              matricule: matricule,
              date_inscription: dateInscription,
              classe_id: null, // Sera mis à jour après
              parent_id: null, // Sera mis à jour après
              statut: 'actif',
              ecole_id: 1
            })
            .select()
            .single()
          
          if (errEleve) throw new Error(`Erreur création élève: ${errEleve.message}`)
          
          // 2. Créer ou trouver le parent
          let parentId = null
          if (ligne['Parent Nom'] && ligne['Parent Prénom']) {
            const { data: parentExistant } = await client
              .from('parents_tuteurs')
              .select('id')
              .eq('nom', ligne['Parent Nom'])
              .eq('prenom', ligne['Parent Prénom'])
              .maybeSingle()
            
            if (parentExistant) {
              parentId = parentExistant.id
            } else {
              // Créer nouveau parent
              const telParent = ligne['Parent Tél'] ? 
                ligne['Parent Tél'].toString().replace(/\s/g, '') : null
              
              const { data: nouveauParent, error: errParent } = await client
                .from('parents_tuteurs')
                .insert({
                  eleve_id: nouvelEleve.id, // OBLIGATOIRE pour parents_tuteurs
                  nom: ligne['Parent Nom'],
                  prenom: ligne['Parent Prénom'],
                  telephone: telParent,
                  relation: normaliserRelation(ligne['Parent Relation'] || 'Tuteur')
                })
                .select()
                .single()
              
              if (errParent) throw new Error(`Erreur création parent: ${errParent.message}`)
              parentId = nouveauParent.id
            }
          }
          
          // 3. Trouver ou créer la classe
          let classeId = null
          if (ligne.Classe) {
            const classeNormalisee = ligne.Classe.trim()
            
            // Chercher d'abord par nom exact
            let { data: classe } = await client
              .from('classes')
              .select('id')
              .eq('niveau', classeNormalisee)
              .maybeSingle()
            
            // Si pas trouvé, chercher par correspondance partielle
            if (!classe) {
              const { data: classes } = await client
                .from('classes')
                .select('id, niveau')
              
              const classeTrouvee = classes?.find(c => 
                c.niveau.toLowerCase().includes(classeNormalisee.toLowerCase()) ||
                classeNormalisee.toLowerCase().includes(c.niveau.toLowerCase())
              )
              
              if (classeTrouvee) {
                classe = classeTrouvee
              }
            }
            
            if (classe) {
              classeId = classe.id
            } else {
              // Créer la classe manquante
              const { data: nouvelleClasse, error: errClasse } = await client
                .from('classes')
                .insert({
                  niveau: classeNormalisee,
                  nom_complet: `${classeNormalisee} A`,
                  ecole_id: 1
                })
                .select()
                .single()
              
              if (errClasse) throw new Error(`Erreur création classe: ${errClasse.message}`)
              classeId = nouvelleClasse.id
            }
          }
          
          // 4. Mettre à jour l'élève avec parent_id et classe_id
          const { error: errUpdate } = await client
            .from('eleves')
            .update({
              parent_id: parentId,
              classe_id: classeId
            })
            .eq('id', nouvelEleve.id)
          
          if (errUpdate) throw new Error(`Erreur mise à jour élève: ${errUpdate.message}`)
          
          succes.push(`${ligne.Prénom} ${ligne.Nom}`)
          
        } catch (error: any) {
          erreurs.push(`Ligne ${i + 2}: ${error.message}`)
        }
      }
      
      setResultatsImport({
        succes: succes.length,
        erreurs: erreurs.length,
        details: erreurs
      })
      
      // Recharger la liste des élèves
      if (succes.length > 0) {
        await chargerDonnees()
      }
      
    } catch (error) {
      console.error('Erreur import:', error)
      alert('Erreur lors de l\'import')
    } finally {
      setImportEnCours(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setFichierImport(file)
      } else {
        setErreurLecture('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setFichierImport(file)
      } else {
        setErreurLecture('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)')
      }
    }
  }

  const filtrerEleves = () => {
    return eleves.filter(eleve => {
      const correspondRecherche = 
        eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eleve.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eleve.matricule.toLowerCase().includes(searchTerm.toLowerCase())
      
      const correspondClasse = selectedClasse === 'all' || 
        eleve.classe_id?.toString() === selectedClasse
      
      return correspondRecherche && correspondClasse
    })
  }

  const elevesFiltres = filtrerEleves()

  const exporterVersExcel = () => {
    // Préparer les données pour l'export
    const donneesExport = eleves.map(eleve => ({
      'Nom': eleve.nom,
      'Prénom': eleve.prenom,
      'Matricule': eleve.matricule,
      'Date naissance': eleve.date_naissance || '',
      'Sexe': eleve.sexe === 'M' ? 'Masculin' : eleve.sexe === 'F' ? 'Féminin' : '',
      'Classe': eleve.classes ? `${eleve.classes.niveau}` : 'Non assigné',
      'Statut': eleve.statut,
      'Date inscription': eleve.date_inscription || '',
      'Parent Nom': eleve.parents_tuteurs?.[0]?.nom || '',
      'Parent Prénom': eleve.parents_tuteurs?.[0]?.prenom || '',
      'Parent Téléphone': eleve.parents_tuteurs?.[0]?.telephone || '',
      'Parent Email': eleve.parents_tuteurs?.[0]?.email || '',
      'Parent Relation': eleve.parents_tuteurs?.[0]?.relation || ''
    }))

    // Créer le workbook et la feuille
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(donneesExport)

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 15 }, // Nom
      { wch: 15 }, // Prénom
      { wch: 12 }, // Matricule
      { wch: 12 }, // Date naissance
      { wch: 10 }, // Sexe
      { wch: 15 }, // Classe
      { wch: 10 }, // Statut
      { wch: 12 }, // Date inscription
      { wch: 15 }, // Parent Nom
      { wch: 15 }, // Parent Prénom
      { wch: 18 }, // Parent Téléphone
      { wch: 25 }, // Parent Email
      { wch: 12 }  // Parent Relation
    ]
    ws['!cols'] = colWidths

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Élèves')

    // Générer le fichier avec date
    const date = new Date().toISOString().split('T')[0]
    const nomFichier = `eleves_export_${date}.xlsx`
    
    XLSX.writeFile(wb, nomFichier)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des élèves</h1>
          <p className="text-gray-600">Gérez les élèves de votre école</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exporterVersExcel}
            disabled={eleves.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exporter Excel
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importer Excel
          </button>
          <button
            onClick={() => router.push('/dashboard/eleves/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel élève
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Toutes les classes</option>
            {classes.map(classe => (
              <option key={classe.id} value={classe.id.toString()}>
                {classe.nom_complet}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total élèves</p>
              <p className="text-2xl font-bold text-gray-900">{eleves.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Élèves actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {eleves.filter(e => e.statut === 'actif').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Classes</p>
              <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des élèves */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Élève
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matricule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent/Tuteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {elevesFiltres.map((eleve) => (
                <tr key={eleve.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {eleve.prenom} {eleve.nom}
                      </div>
                      {eleve.date_naissance && (
                        <div className="text-sm text-gray-500">
                          Né(e) le {new Date(eleve.date_naissance).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eleve.matricule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eleve.classes?.nom_complet || 'Non assigné'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eleve.parents_tuteurs && eleve.parents_tuteurs.length > 0 ? (
                      <div>
                        <div className="font-medium">{eleve.parents_tuteurs[0].prenom} {eleve.parents_tuteurs[0].nom}</div>
                        {eleve.parents_tuteurs[0].telephone ? (
                          <div className="text-xs text-gray-600 font-mono">
                            📞 {eleve.parents_tuteurs[0].telephone}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            Pas de téléphone
                          </div>
                        )}
                        {eleve.parents_tuteurs[0].relation && (
                          <div className="text-xs text-gray-500">
                            ({eleve.parents_tuteurs[0].relation})
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">
                        Non assigné
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      eleve.statut === 'actif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {eleve.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/eleves/${eleve.id}`)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/eleves/${eleve.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
                            // TODO: Implémenter la suppression
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {elevesFiltres.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun élève trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedClasse !== 'all' 
                ? 'Essayez de modifier vos critères de recherche.' 
                : 'Commencez par ajouter un nouvel élève.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Importer des élèves depuis Excel</h2>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setFichierImport(null)
                  setDonneesExcel([])
                  setErreurLecture(null)
                  setErreursValidation([])
                  setResultatsImport(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Zone de drag & drop */}
            {!fichierImport && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Glissez votre fichier Excel ici
                </p>
                <p className="text-gray-600 mb-4">ou</p>
                <label className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Sélectionner un fichier
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Formats supportés: .xlsx, .xls
                </p>
              </div>
            )}

            {/* Fichier sélectionné */}
            {fichierImport && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{fichierImport.name}</p>
                      <p className="text-sm text-gray-500">
                        {(fichierImport.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFichierImport(null)
                      setDonneesExcel([])
                      setErreurLecture(null)
                      setErreursValidation([])
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Instructions format */}
            {donneesExcel.length === 0 && !chargementFichier && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">Format attendu :</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Colonnes obligatoires :</strong> Nom, Prénom, Classe</p>
                  <p><strong>Colonnes optionnelles :</strong> Date naissance, Sexe, Matricule, Date inscription</p>
                  <p><strong>Parent/Tuteur :</strong> Parent Nom, Parent Prénom, Parent Tél, Parent Email, Parent Relation</p>
                  <p><strong>Format dates :</strong> DD/MM/YYYY ou YYYY-MM-DD</p>
                  <p><strong>Format téléphone :</strong> +221 7X XXX XX XX</p>
                </div>
              </div>
            )}

            {/* Aperçu des données */}
            {chargementFichier && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="text-sm text-gray-600 mt-2">Lecture du fichier...</p>
              </div>
            )}

            {erreurLecture && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-medium">❌ {erreurLecture}</p>
              </div>
            )}

            {erreursValidation.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-orange-900 mb-2">
                  ⚠️ {erreursValidation.length} erreur(s) détectée(s)
                </h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  {erreursValidation.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
                {erreursValidation.length === 10 && (
                  <p className="text-xs text-orange-600 mt-2">
                    ... et potentiellement d'autres erreurs
                  </p>
                )}
              </div>
            )}

            {donneesExcel.length > 0 && erreursValidation.length === 0 && !chargementFichier && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 font-medium">
                  ✅ Validation réussie : {donneesExcel.length} élèves prêts à être importés
                </p>
              </div>
            )}

            {importEnCours && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Import en cours...
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(progression.actuel / progression.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-blue-800">
                  {progression.actuel} / {progression.total} élèves importés
                </p>
              </div>
            )}

            {resultatsImport && (
              <div className={`border rounded-lg p-4 mb-4 ${
                resultatsImport.erreurs > 0 
                  ? 'bg-orange-50 border-orange-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <h3 className="font-semibold mb-2">
                  Résultats de l'import
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-green-700">✅ {resultatsImport.succes} élèves importés avec succès</p>
                  {resultatsImport.erreurs > 0 && (
                    <p className="text-red-700">❌ {resultatsImport.erreurs} erreurs</p>
                  )}
                  {resultatsImport.details.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-orange-700 font-medium">
                        Voir les détails des erreurs
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-orange-800">
                        {resultatsImport.details.map((detail, idx) => (
                          <li key={idx}>• {detail}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            )}

            {donneesExcel.length > 0 && !chargementFichier && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  Aperçu : {donneesExcel.length} lignes détectées
                </h3>
                <div className="border rounded-lg overflow-auto max-h-60">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {Object.keys(donneesExcel[0]).map((col) => (
                          <th key={col} className="px-4 py-2 text-left font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {donneesExcel.slice(0, 5).map((ligne, idx) => (
                        <tr key={idx} className="border-b">
                          {Object.values(ligne).map((val: any, i) => (
                            <td key={i} className="px-4 py-2">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {donneesExcel.length > 5 && (
                    <p className="text-xs text-gray-500 p-2 text-center">
                      ... et {donneesExcel.length - 5} autres lignes
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setFichierImport(null)
                  setDonneesExcel([])
                  setErreurLecture(null)
                  setErreursValidation([])
                  setResultatsImport(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                {resultatsImport ? 'Fermer' : 'Annuler'}
              </button>
              <button
                onClick={importerEleves}
                disabled={
                  !fichierImport ||
                  chargementFichier ||
                  donneesExcel.length === 0 ||
                  erreursValidation.length > 0 ||
                  importEnCours
                }
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importEnCours 
                  ? 'Import en cours...' 
                  : `Importer ${donneesExcel.length} élèves`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
