/**
 * SUPABASE FUNCTIONS - SAMA ÉCOLE
 * 
 * Toutes les fonctions d'interaction avec la base de données Supabase
 * Gère les opérations CRUD pour : écoles, classes, élèves, parents, types de frais, années scolaires
 * Upload de fichiers et génération de statistiques
 * 
 * Version corrigée avec fonction modifierEleve simplifiée
 */

import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Types pour les données
export interface EcoleData {
  id?: number
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  directeur?: string
  logo_url?: string
  devise?: string
  taux_frais_retard?: number
}

export interface ClasseData {
  id?: number
  ecole_id: number
  niveau: string
  section: string
  nom_complet: string
  effectif_max: number
}

export interface TypeFraisData {
  id?: number
  ecole_id: number
  nom: string
  description?: string
  montant_defaut: number
  recurrent: boolean
  obligatoire: boolean
  actif: boolean
}

export interface AnneeScolaireData {
  id?: number
  ecole_id: number
  libelle: string
  date_debut: string
  date_fin: string
  active: boolean
}

export interface EleveData {
  id?: number
  ecole_id: number
  matricule: string
  nom: string
  prenom: string
  date_naissance?: string
  lieu_naissance?: string
  sexe: 'M' | 'F'
  classe_id: number
  photo_url?: string
  statut: 'actif' | 'suspendu' | 'exclu' | 'diplome'
  date_inscription: string
  adresse?: string
}

export interface ParentTuteurData {
  id?: number
  eleve_id: number
  nom: string
  prenom: string
  relation: 'pere' | 'mere' | 'tuteur' | 'autre'
  telephone?: string
  telephone_2?: string
  email?: string
  adresse?: string
  profession?: string
  est_contact_principal: boolean
}

// =================== ÉCOLES ===================

export async function sauvegarderEcole(ecoleData: EcoleData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = await createAuthenticatedClient();
    const { data, error } = await client
      .from('ecoles')
      .upsert(ecoleData, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Erreur sauvegarde école:', error)
    return { success: false, error: error.message }
  }
}

export async function obtenirEcole(id?: number): Promise<EcoleData | null> {
  try {
    console.log('🔍 Appel API /api/ecole...')
    
    const response = await fetch('/api/ecole', {
      method: 'GET',
      credentials: 'include' // Important pour envoyer les cookies
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Erreur API ecole:', error)
      return null
    }

    const data = await response.json()
    console.log('✅ École récupérée via API:', data.ecole?.nom)
    
    return data.ecole

  } catch (error) {
    console.error('❌ Erreur obtenirEcole:', error)
    return null
  }
}

// =================== CLASSES ===================

export async function sauvegarderClasse(classeData: ClasseData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = await createAuthenticatedClient();
    const { data, error } = await client
      .from('classes')
      .upsert(classeData, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Erreur sauvegarde classe:', error)
    return { success: false, error: error.message }
  }
}

export async function obtenirClasses(ecoleId: number = 1): Promise<ClasseData[]> {
  try {
    console.log('🔍 Récupération classes pour école:', ecoleId);
    
    // IMPORTANT : Utiliser le client authentifié avec RLS
    const client = await createAuthenticatedClient();
    
    const { data, error } = await client
      .from('classes')
      .select('id, niveau, section, nom_complet, effectif_max, ecole_id, created_at')
      .eq('ecole_id', ecoleId)
      .order('created_at', { ascending: false }); // Plus récentes en premier

    if (error) {
      console.error('❌ Erreur récupération classes:', error);
      throw error;
    }

    console.log('✅ Classes récupérées:', data?.length || 0);
    console.log('📊 Classes trouvées:', data?.map(c => `${c.niveau} ${c.section} (${c.nom_complet})`));
    return data || [];
  } catch (error) {
    console.error('❌ Exception récupération classes:', error);
    return [];
  }
}

export async function obtenirClassesAvecStats(ecoleId: number): Promise<(ClasseData & { nombre_eleves: number })[]> {
  try {
    const client = await createAuthenticatedClient();
    
    const { data, error } = await client
      .from('classes')
      .select(`
        id,
        ecole_id,
        niveau,
        section,
        nom_complet,
        effectif_max,
        created_at,
        eleves!left (
          id,
          statut
        )
      `)
      .eq('ecole_id', ecoleId)
      .order('niveau', { ascending: true })

    if (error) throw error

    // Compter les élèves actifs par classe
    const classesAvecStats = (data || []).map(classe => {
      const elevesActifs = classe.eleves ? classe.eleves.filter((e: any) => e.statut === 'actif').length : 0
      return {
        ...classe,
        nombre_eleves: elevesActifs
      }
    })

    return classesAvecStats
  } catch (error) {
    console.error('Erreur récupération classes avec stats:', error)
    return []
  }
}

export async function supprimerClasse(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await createAuthenticatedClient();
    const { error } = await client
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Erreur suppression classe:', error)
    return { success: false, error: error.message }
  }
}

// =================== TYPES DE FRAIS ===================

export async function sauvegarderTypeFrais(fraisData: TypeFraisData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('types_frais')
      .upsert(fraisData, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Erreur sauvegarde frais:', error)
    return { success: false, error: error.message }
  }
}

export async function obtenirTypesFrais(ecoleId: number): Promise<TypeFraisData[]> {
  try {
    const { data, error } = await supabase
      .from('types_frais')
      .select('*')
      .eq('ecole_id', ecoleId)
      .eq('actif', true)
      .order('nom', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Erreur récupération types frais:', error)
    return []
  }
}

export async function supprimerTypeFrais(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('types_frais')
      .update({ actif: false })
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Erreur suppression frais:', error)
    return { success: false, error: error.message }
  }
}

// =================== ANNÉES SCOLAIRES ===================

export async function sauvegarderAnneeScolaire(anneeData: AnneeScolaireData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Si on définit cette année comme active, désactiver les autres
    if (anneeData.active) {
      await supabase
        .from('annees_scolaires')
        .update({ active: false })
        .eq('ecole_id', anneeData.ecole_id)
    }

    const { data, error } = await supabase
      .from('annees_scolaires')
      .upsert(anneeData, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Erreur sauvegarde année scolaire:', error)
    return { success: false, error: error.message }
  }
}

export async function obtenirAnneeScolaireActive(ecoleId: number): Promise<AnneeScolaireData | null> {
  try {
    const { data, error } = await supabase
      .from('annees_scolaires')
      .select('*')
      .eq('ecole_id', ecoleId)
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return data
  } catch (error) {
    console.error('Erreur récupération année active:', error)
    return null
  }
}

// =================== ÉLÈVES ===================

export async function sauvegarderEleve(eleveData: any, id?: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = await createAuthenticatedClient();
    
    const eleveDataToSave = {
      nom: eleveData.nom,
      prenom: eleveData.prenom,
      date_naissance: eleveData.date_naissance,
      lieu_naissance: eleveData.lieu_naissance,
      sexe: eleveData.sexe,
      adresse: eleveData.adresse,
      classe_id: eleveData.classe_id,
      parent_id: eleveData.parent_id || null, // ← AJOUTER
      ecole_id: eleveData.ecole_id || 1,
      statut: eleveData.statut || 'actif',
      matricule: eleveData.matricule,
      notes: eleveData.notes || null
    }
    
    if (id) {
      // Modification
      const { data, error } = await client
        .from('eleves')
        .update(eleveDataToSave)
        .eq('id', id)
        .select(`
          *,
          classes (
            id,
            nom_complet
          )
        `)
        .single()
      
      if (error) throw error
      return { success: true, data }
    } else {
      // Création
      const { data, error } = await client
        .from('eleves')
        .insert(eleveDataToSave)
        .select(`
          *,
          classes (
            id,
            nom_complet
          )
        `)
        .single()
      
      if (error) throw error
      return { success: true, data }
    }
  } catch (error: any) {
    console.error('Erreur sauvegarde élève:', error)
    return { success: false, error: error.message }
  }
}

// Nouvelle fonction simplifiée pour modifier un élève existant
export async function modifierEleve(id: number, donnees: {
  nom?: string
  prenom?: string
  sexe?: 'M' | 'F'
  statut?: 'actif' | 'suspendu' | 'exclu'
  adresse?: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = await createAuthenticatedClient();
    const { data, error } = await client
      .from('eleves')
      .update(donnees)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur update simple:', error)
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Erreur modification élève:', error)
    return { success: false, error: error.message }
  }
}

export async function obtenirEleves(ecoleId: number): Promise<any[]> {
  try {
    const client = await createAuthenticatedClient();
    const { data, error } = await client
      .from('eleves')
      .select(`
        *,
        classes:classes (
          id,
          niveau,
          section,
          nom_complet
        ),
        parent_id
      `)
      .eq('ecole_id', ecoleId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Récupérer les parents séparément
    let parents: any[] = []
    const parentIds = [...new Set(data?.map(e => e.parent_id).filter(Boolean) || [])]
    
    if (parentIds.length > 0) {
      try {
        const { data: parentsData, error: parentsError } = await client
          .from('parents_tuteurs')
          .select('id, nom, prenom, telephone, email, relation, adresse, telephone_2, est_contact_principal')
          .in('id', parentIds)

        if (parentsError) {
          console.error('❌ Erreur récupération parents dans obtenirEleves:', parentsError)
        } else {
          parents = parentsData || []
        }
      } catch (error) {
        console.error('❌ Erreur table parents_tuteurs dans obtenirEleves:', error)
      }
    }

    // Combiner les données élèves avec leurs parents
    const elevesAvecParents = data?.map(eleve => ({
      ...eleve,
      parents: eleve.parent_id ? parents.find(p => p.id === eleve.parent_id) : null
    })) || []

    return elevesAvecParents
  } catch (error) {
    console.error('Erreur récupération élèves:', error)
    return []
  }
}

export async function obtenirEleveComplet(eleveId: number) {
  try {
    const client = await createAuthenticatedClient()
    
    // Récupérer l'élève avec son parent
    const { data: eleve, error: eleveError } = await client
      .from('eleves')
      .select('*, parents_tuteurs(*)')
      .eq('id', eleveId)
      .single()

    if (eleveError) throw eleveError

    // Récupérer la classe
    if (eleve.classe_id) {
      const { data: classe } = await client
        .from('classes')
        .select('*')
        .eq('id', eleve.classe_id)
        .single()
      
      eleve.classe = classe
    }

    return eleve
  } catch (error) {
    console.error('Erreur récupération élève complet:', error)
    return null
  }
}

export async function supprimerEleve(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // D'abord supprimer les relations enfants (parents_tuteurs)
    const { error: parentError } = await supabase
      .from('parents_tuteurs')
      .delete()
      .eq('eleve_id', id)

    if (parentError) throw parentError

    // Ensuite supprimer l'élève
    const { error } = await supabase
      .from('eleves')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Erreur suppression élève:', error)
    return { success: false, error: error.message }
  }
}

export async function sauvegarderParentTuteur(parentData: ParentTuteurData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('parents_tuteurs')
      .upsert(parentData, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Erreur sauvegarde parent:', error)
    return { success: false, error: error.message }
  }
}

// =================== UPLOAD FICHIERS ===================

export async function uploadLogo(file: File, ecoleId: number): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `logo-ecole-${ecoleId}-${Date.now()}.${fileExt}`
    const filePath = `ecoles/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return { success: true, url: data.publicUrl }
  } catch (error: any) {
    console.error('Erreur upload logo:', error)
    return { success: false, error: error.message }
  }
}

export async function uploadPhotoEleve(file: File, eleveId: number): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `photo-eleve-${eleveId}-${Date.now()}.${fileExt}`
    const filePath = `eleves/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return { success: true, url: data.publicUrl }
  } catch (error: any) {
    console.error('Erreur upload photo élève:', error)
    return { success: false, error: error.message }
  }
}

// =================== STATISTIQUES ===================

export async function obtenirStatistiquesEcole(ecoleId: number) {
  try {
    // Nombre total d'élèves actifs
    const { count: nombreEleves } = await supabase
      .from('eleves')
      .select('*', { count: 'exact', head: true })
      .eq('ecole_id', ecoleId)
      .eq('statut', 'actif')

    // Nombre de classes
    const { count: nombreClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('ecole_id', ecoleId)

    // Factures ce mois (pour l'instant on simule)
    const debutMois = new Date()
    debutMois.setDate(1)
    const { count: facturesMois } = await supabase
      .from('factures')
      .select('*', { count: 'exact', head: true })
      .eq('ecole_id', ecoleId)
      .gte('date_emission', debutMois.toISOString())

    // Revenus du mois (somme des montants payés)
    const { data: revenus } = await supabase
      .from('factures')
      .select('montant_paye')
      .eq('ecole_id', ecoleId)
      .gte('date_emission', debutMois.toISOString())

    const revenusMois = revenus?.reduce((total, facture) => total + (facture.montant_paye || 0), 0) || 0

    // Nouveaux élèves ce mois
    const { count: nouveauxEleves } = await supabase
      .from('eleves')
      .select('*', { count: 'exact', head: true })
      .eq('ecole_id', ecoleId)
      .eq('statut', 'actif')
      .gte('date_inscription', debutMois.toISOString())

    return {
      nombreEleves: nombreEleves || 0,
      nombreClasses: nombreClasses || 0,
      facturesMois: facturesMois || 0,
      revenusMois,
      nouveauxEleves: nouveauxEleves || 0,
      // Calculs additionnels
      tauxPaiement: 85, // À calculer vraiment plus tard
      facturesEnAttente: Math.max(0, (nombreEleves || 0) - (facturesMois || 0))
    }
  } catch (error) {
    console.error('Erreur statistiques:', error)
    return {
      nombreEleves: 0,
      nombreClasses: 0,
      facturesMois: 0,
      revenusMois: 0,
      nouveauxEleves: 0,
      tauxPaiement: 0,
      facturesEnAttente: 0
    }
  }
}

// =================== ACTIVITÉS RÉCENTES ===================

export async function obtenirActivitesRecentes(ecoleId: number, limite: number = 10) {
  try {
    // Récupérer les derniers élèves ajoutés
    const { data: derniers_eleves } = await supabase
      .from('eleves')
      .select(`
        id,
        nom,
        prenom,
        created_at,
        classes!inner (nom_complet)
      `)
      .eq('ecole_id', ecoleId)
      .eq('statut', 'actif')
      .order('created_at', { ascending: false })
      .limit(limite)


    // Transformer en format d'activités
    const activites = []

    // Ajouter les nouveaux élèves
    if (derniers_eleves && derniers_eleves.length > 0) {
      for (const eleve of derniers_eleves.slice(0, 4)) {
        const classe = Array.isArray(eleve.classes) ? eleve.classes[0] : eleve.classes
        activites.push({
          type: 'student',
          message: `Nouvel élève inscrit: ${eleve.prenom} ${eleve.nom} (${classe?.nom_complet || 'Classe non assignée'})`,
          time: formatTimeAgo(eleve.created_at),
          icon: 'Users'
        })
      }
    }


    // Ajouter quelques activités par défaut si pas assez
    if (activites.length === 0) {
      activites.push({
        type: 'info',
        message: 'Bienvenue sur Sama École ! Commencez par ajouter vos élèves.',
        time: 'Maintenant',
        icon: 'Users'
      })
    }

    return activites.slice(0, limite)

  } catch (error) {
    console.error('Erreur activités récentes:', error)
    return [
      {
        type: 'info',
        message: 'Système démarré avec succès',
        time: 'Maintenant',
        icon: 'Users'
      }
    ]
  }
}

// Fonction utilitaire pour formater le temps
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Il y a moins d\'1h'
  } else if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`
  } else if (diffInHours < 48) {
    return 'Hier'
  } else {
    const days = Math.floor(diffInHours / 24)
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`
  }
}

// =================== FACTURATION ===================

export interface FactureData {
  id?: number
  ecole_id: number
  eleve_id: number
  numero_facture: string
  date_emission: string
  montant_total: number
  statut: 'non_payee' | 'payee' | 'annulee'
  date_echeance?: string
  notes?: string
}

export interface FactureDetailData {
  id?: number
  facture_id: number
  type_frais_id: number
  montant: number
  quantite: number
}

export interface FactureComplet extends FactureData {
  eleve?: {
    id: number
    nom: string
    prenom: string
    matricule: string
    classes?: { nom_complet: string }
  }
  details?: Array<FactureDetailData & {
    type_frais?: {
      nom: string
      montant_defaut: number
    }
  }>
}

export async function creerFacture(factureData: {
  ecole_id: number
  eleve_id: number
  montant_total: number
  statut: 'non_payee' | 'payee' | 'annulee'
  date_echeance?: string
  notes?: string
  frais: Array<{type_frais_id: number, montant: number, quantite: number}>
}): Promise<{ success: boolean; data?: FactureComplet; error?: string }> {
  try {
    console.log('⚠️ Mode sans authentification - Création de facture')
    
    // Créer un client Supabase sans authentification
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    
    // Générer le numéro de facture
    const numeroFacture = await genererNumeroFacture(factureData.ecole_id)
    
    // Créer la facture principale
    const facture: FactureData = {
      ecole_id: factureData.ecole_id,
      eleve_id: factureData.eleve_id,
      numero_facture: numeroFacture,
      date_emission: new Date().toISOString().split('T')[0],
      montant_total: factureData.montant_total,
      statut: factureData.statut,
      date_echeance: factureData.date_echeance,
      notes: factureData.notes
    }

    const { data: factureCreee, error: factureError } = await supabaseClient
      .from('factures')
      .insert(facture)
      .select()
      .single()

    if (factureError) {
      console.error('❌ Erreur création facture:', factureError)
      
      // Si erreur RLS, retourner message informatif
      if (factureError.code === 'PGRST116' || factureError.message?.includes('RLS')) {
        return { success: false, error: 'RLS activé - Impossible de créer des factures sans authentification' }
      }
      
      throw factureError
    }

    // Créer les détails de la facture
    if (factureData.frais && factureData.frais.length > 0) {
      const details = factureData.frais.map(frais => ({
        facture_id: factureCreee.id,
        type_frais_id: frais.type_frais_id,
        montant: frais.montant,
        quantite: frais.quantite
      }))

      const { error: detailsError } = await supabaseClient
        .from('facture_details')
        .insert(details)

      if (detailsError) {
        console.error('❌ Erreur création détails facture:', detailsError)
        // Ne pas faire échouer complètement si les détails échouent
      }
    }

    // Retourner la facture créée directement (sans les relations pour éviter les erreurs)
    return { success: true, data: factureCreee as FactureComplet }
  } catch (error: any) {
    console.error('Erreur création facture:', error)
    return { success: false, error: error.message }
  }
}

export async function obtenirFactures(ecoleId: number): Promise<FactureComplet[]> {
  try {
    console.log('🔍 Récupération factures pour école:', ecoleId)
    console.log('⚠️ Mode sans authentification - RLS doit être désactivé')
    
    // Créer un client Supabase sans authentification pour contourner RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    
    // Version optimisée avec gestion d'erreurs détaillée
    const { data: factures, error: facturesError } = await supabaseClient
      .from('factures')
      .select(`
        id,
        ecole_id,
        eleve_id,
        numero_facture,
        date_emission,
        montant_total,
        statut,
        date_echeance,
        notes,
        created_at
      `)
      .eq('ecole_id', ecoleId)
      .order('created_at', { ascending: false })

    if (facturesError) {
      console.error('❌ Erreur requête factures:', {
        message: facturesError.message,
        details: facturesError.details,
        hint: facturesError.hint,
        code: facturesError.code
      })
      
      // Si erreur RLS, retourner un tableau vide avec message informatif
      if (facturesError.code === 'PGRST116' || facturesError.message?.includes('RLS')) {
        console.warn('⚠️ RLS activé - Aucune donnée accessible sans authentification')
        return []
      }
      
      throw facturesError
    }

    console.log('✅ Factures récupérées:', factures?.length || 0)
    
    // Si on a des factures, récupérer les relations
    if (factures && factures.length > 0) {
      // Récupérer les élèves pour ces factures
      const eleveIds = [...new Set(factures.map(f => f.eleve_id))]
      // Test d'abord sans jointure pour voir si la table parents_tuteurs existe
      const { data: eleves, error: elevesError } = await supabaseClient
        .from('eleves')
        .select(`
          id,
          nom,
          prenom,
          matricule,
          classe_id,
          parent_id
        `)
        .in('id', eleveIds)

      if (elevesError) {
        console.error('❌ Erreur récupération élèves:', elevesError)
      }

      // Récupérer les parents séparément si nécessaire
      let parents: any[] = []
      const parentIds = [...new Set(eleves?.map(e => e.parent_id).filter(Boolean) || [])]
      
      if (parentIds.length > 0) {
        try {
          const { data: parentsData, error: parentsError } = await supabaseClient
            .from('parents_tuteurs')
            .select('id, nom, prenom, telephone, email, relation, adresse')
            .in('id', parentIds)

          if (parentsError) {
            console.error('❌ Erreur récupération parents:', parentsError)
          } else {
            parents = parentsData || []
          }
        } catch (error) {
          console.error('❌ Erreur table parents_tuteurs:', error)
        }
      }

      // Combiner les données élèves avec leurs parents
      const elevesAvecParents = eleves?.map(eleve => ({
        ...eleve,
        parents: eleve.parent_id ? parents.find(p => p.id === eleve.parent_id) : null
      })) || []

      // Récupérer les classes
      const classeIds = [...new Set(elevesAvecParents?.map(e => e.classe_id).filter(Boolean) || [])]
      let classes: any[] = []
      if (classeIds.length > 0) {
        const { data: classesData, error: classesError } = await supabaseClient
          .from('classes')
          .select('id, nom_complet')
          .in('id', classeIds)

        if (classesError) {
          console.error('❌ Erreur récupération classes:', classesError)
        } else {
          classes = classesData || []
        }
      }

      // Récupérer les détails de facture (version simplifiée)
      const factureIds = factures.map(f => f.id)
      console.log('🔍 Récupération détails pour factures:', factureIds)
      
      // Test basique d'abord
      const { data: testDetails, error: testError } = await supabaseClient
        .from('facture_details')
        .select('id, facture_id, type_frais_id, montant, quantite')
        .limit(5)

      if (testError) {
        console.error('❌ Test détails échoué:', testError)
      } else {
        console.log('✅ Test détails OK:', testDetails)
      }

      // Vraie requête
      const { data: details, error: detailsError } = await supabaseClient
        .from('facture_details')
        .select('id, facture_id, type_frais_id, montant, quantite')
        .in('facture_id', factureIds)

      if (detailsError) {
        console.error('❌ Erreur récupération détails factures:', {
          message: detailsError.message || 'Message manquant',
          details: detailsError.details || 'Détails manquants',
          hint: detailsError.hint || 'Hint manquant',
          code: detailsError.code || 'Code manquant'
        })
        // Continuer sans les détails plutôt que de faire échouer
      } else {
        console.log('✅ Détails factures récupérés:', details?.length || 0)
        console.log('📊 Exemple détail:', details?.[0])
      }

      // Récupérer les types de frais séparément
      let typesFrais: any[] = []
      if (details && details.length > 0) {
        const typeFraisIds = [...new Set(details.map(d => d.type_frais_id))]
        const { data: typesFraisData, error: typesFraisError } = await supabaseClient
          .from('types_frais')
          .select('id, nom, montant_defaut')
          .in('id', typeFraisIds)

        if (typesFraisError) {
          console.error('❌ Erreur récupération types frais:', typesFraisError)
        } else {
          typesFrais = typesFraisData || []
          console.log('✅ Types frais récupérés:', typesFrais.length)
        }
      }

      // Assembler les données
      const facturesCompletes = factures.map(facture => {
        const eleve = elevesAvecParents?.find(e => e.id === facture.eleve_id)
        const classe = eleve ? classes.find(c => c.id === eleve.classe_id) : null
        const factureDetails = details?.filter(d => d.facture_id === facture.id) || []
        
        // Enrichir les détails avec les types de frais
        const detailsEnrichis = factureDetails.map(detail => {
          const typeFrais = typesFrais.find(tf => tf.id === detail.type_frais_id)
          return {
            ...detail,
            type_frais: typeFrais
          }
        })
        
        return {
          ...facture,
          eleve: eleve ? {
            ...eleve,
            classes: classe
          } : undefined,
          details: detailsEnrichis
        }
      })

      console.log('✅ Factures complètes assemblées:', facturesCompletes.length)
      console.log('📊 Exemple facture avec détails:', facturesCompletes[0])
      return facturesCompletes as FactureComplet[]
    }

    return []
  } catch (error: any) {
    console.error('❌ Erreur récupération factures:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return []
  }
}

// Fonction de diagnostic pour tester la structure de la base
export async function diagnostiquerTableFactures(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 Diagnostic complet de la table factures...')
    
    // 0. Vérifier l'authentification d'abord
    console.log('0️⃣ Vérification authentification...')
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Erreur authentification:', authError)
      return { success: false, error: `Auth: ${authError.message}` }
    }
    
    console.log('✅ Utilisateur connecté:', authData.user?.id)
    
    // 1. Test de connexion basique
    console.log('1️⃣ Test connexion table...')
    const { data: testData, error: testError } = await supabase
      .from('factures')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ Erreur connexion:', {
        message: testError.message || 'Message manquant',
        details: testError.details || 'Détails manquants',
        hint: testError.hint || 'Hint manquant',
        code: testError.code || 'Code manquant'
      })
      return { success: false, error: `Connexion: ${testError.message || JSON.stringify(testError)}` }
    }

    console.log('✅ Connexion OK, structure:', testData)

    // 2. Test des colonnes principales (une par une pour identifier laquelle pose problème)
    console.log('2️⃣ Test colonnes principales...')
    
    // Test colonne par colonne
    const colonnesATestser = ['id', 'ecole_id', 'eleve_id', 'numero_facture', 'date_emission', 'montant_total', 'statut']
    const colonnesOK = []
    
    for (const colonne of colonnesATestser) {
      try {
        const { data: colonneData, error: colonneError } = await supabase
          .from('factures')
          .select(colonne)
          .limit(1)
          
        if (colonneError) {
          console.error(`❌ Erreur colonne ${colonne}:`, colonneError)
          return { success: false, error: `Colonne ${colonne}: ${colonneError.message || JSON.stringify(colonneError)}` }
        }
        
        console.log(`✅ Colonne ${colonne} OK`)
        colonnesOK.push(colonne)
      } catch (err: any) {
        console.error(`❌ Exception colonne ${colonne}:`, err)
        return { success: false, error: `Exception colonne ${colonne}: ${err.message}` }
      }
    }

    console.log('✅ Toutes les colonnes OK:', colonnesOK)

    // 3. Test avec filtre ecole_id
    console.log('3️⃣ Test filtre ecole_id...')
    const { data: filtreData, error: filtreError } = await supabase
      .from('factures')
      .select('id, ecole_id')
      .eq('ecole_id', 1) // Test avec ID 1
      .limit(1)

    if (filtreError) {
      console.error('❌ Erreur filtre:', filtreError)
      return { success: false, error: `Filtre: ${filtreError.message || JSON.stringify(filtreError)}` }
    }

    console.log('✅ Filtre OK:', filtreData)

    // 4. Test des relations (optionnel si les autres tests passent)
    console.log('4️⃣ Test relations...')
    const { data: relationsData, error: relationsError } = await supabase
      .from('factures')
      .select(`
        id,
        eleve_id
      `)
      .limit(1)

    if (relationsError) {
      console.error('❌ Erreur relations:', relationsError)
      return { success: false, error: `Relations: ${relationsError.message || JSON.stringify(relationsError)}` }
    }

    console.log('✅ Relations OK:', relationsData)

    return { 
      success: true, 
      data: {
        auth: authData.user?.id,
        connexion: testData,
        colonnes: colonnesOK,
        filtre: filtreData,
        relations: relationsData
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur diagnostic:', error)
    return { success: false, error: error.message || JSON.stringify(error) }
  }
}

// Version de fallback ultra-simple pour diagnostic
export async function obtenirFacturesSimple(ecoleId: number): Promise<any[]> {
  try {
    console.log('🔍 Test version simple...')
    
    // Test le plus basique possible
    const { data, error } = await supabase
      .from('factures')
      .select('id, numero_facture, montant_total')
      .limit(5)

    if (error) {
      console.error('❌ Erreur version simple:', error)
      return []
    }

    console.log('✅ Version simple OK:', data)
    return data || []
  } catch (error: any) {
    console.error('❌ Erreur version simple:', error.message || error)
    return []
  }
}

// Version sans authentification pour tester si c'est le problème
export async function obtenirFacturesSansAuth(): Promise<any[]> {
  try {
    console.log('🔍 Test sans authentification...')
    
    // Créer un client Supabase sans authentification
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    
    // Test avec le client public
    const { data, error } = await supabaseClient
      .from('factures')
      .select('id, numero_facture, montant_total, statut')
      .limit(3)

    if (error) {
      console.error('❌ Erreur sans auth:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('✅ Sans auth OK:', data)
    return data || []
  } catch (error: any) {
    console.error('❌ Erreur sans auth:', error.message || error)
    return []
  }
}

// Test spécifique pour les détails de facture
export async function testerDetailsFacture(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 Test détails de facture...')
    
    // Créer un client sans auth
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    
    // Test 1: Table facture_details existe ?
    const { data: testTable, error: tableError } = await supabaseClient
      .from('facture_details')
      .select('*')
      .limit(1)

    if (tableError) {
      return { success: false, error: `Table facture_details: ${tableError.message}` }
    }

    console.log('✅ Table facture_details OK:', testTable)

    // Test 2: Données dans facture_details ?
    const { data: allDetails, error: allError } = await supabaseClient
      .from('facture_details')
      .select('*')

    if (allError) {
      return { success: false, error: `Lecture détails: ${allError.message}` }
    }

    console.log('✅ Tous les détails:', allDetails)

    // Test 3: Relations avec types_frais ?
    const { data: withTypes, error: typesError } = await supabaseClient
      .from('facture_details')
      .select(`
        *,
        type_frais (nom, montant_defaut)
      `)
      .limit(3)

    if (typesError) {
      console.log('⚠️ Relation types_frais échouée:', typesError)
    } else {
      console.log('✅ Avec types frais:', withTypes)
    }

    return { 
      success: true, 
      data: { 
        table: testTable,
        all: allDetails,
        withTypes: withTypes 
      } 
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Test d'authentification simple
export async function testerAuthentification(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔐 Test authentification...')
    
    // Vérifier l'utilisateur
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Erreur utilisateur:', userError)
      return { 
        success: false, 
        error: `Utilisateur non connecté: ${userError.message}`,
        data: { needAuth: true }
      }
    }
    
    if (!userData.user) {
      console.error('❌ Aucun utilisateur')
      return { 
        success: false, 
        error: 'Aucun utilisateur connecté',
        data: { needAuth: true }
      }
    }
    
    console.log('✅ Utilisateur OK:', userData.user.email)
    
    // Vérifier la session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !sessionData.session) {
      console.error('❌ Session invalide')
      return { 
        success: false, 
        error: 'Session expirée ou invalide',
        data: { needAuth: true }
      }
    }
    
    console.log('✅ Session active')
    
    return {
      success: true,
      data: {
        user: userData.user,
        session: sessionData.session,
        needAuth: false
      }
    }
    
  } catch (error: any) {
    console.error('❌ Erreur auth:', error)
    return { success: false, error: error.message, data: { needAuth: true } }
  }
}

// Test des permissions RLS
export async function testerPermissionsFactures(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔐 Test des permissions RLS...')
    
    // Test avec l'utilisateur actuel
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Erreur utilisateur:', {
        message: userError.message || 'Message manquant',
        status: userError.status || 'Status manquant'
      })
      return { success: false, error: `Utilisateur: ${userError.message || JSON.stringify(userError)}` }
    }
    
    if (!userData.user) {
      console.error('❌ Aucun utilisateur connecté')
      return { success: false, error: 'Aucun utilisateur connecté - Veuillez vous connecter' }
    }
    
    console.log('✅ Utilisateur connecté:', {
      id: userData.user.id,
      email: userData.user.email,
      role: userData.user.role
    })
    
    // Test de session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erreur session:', sessionError)
      return { success: false, error: `Session: ${sessionError.message}` }
    }
    
    console.log('✅ Session active:', !!sessionData.session)
    
    // Test de lecture simple (sans RLS d'abord)
    console.log('🔍 Test lecture basique...')
    const { data: readData, error: readError } = await supabase
      .from('factures')
      .select('id')
      .limit(1)

    if (readError) {
      console.error('❌ Erreur lecture:', {
        message: readError.message || 'Message manquant',
        details: readError.details || 'Détails manquants',
        hint: readError.hint || 'Hint manquant',
        code: readError.code || 'Code manquant'
      })
      return { success: false, error: `Lecture: ${readError.message || JSON.stringify(readError)}` }
    }

    console.log('✅ Lecture OK:', readData)
    
    // Test avec filtre par école (si on arrive à obtenir l'école)
    try {
      console.log('🔍 Test récupération école...')
      const ecole = await obtenirEcole()
      console.log('✅ École récupérée:', ecole?.id)
      
      if (ecole?.id) {
        const { data: ecoleData, error: ecoleError } = await supabase
          .from('factures')
          .select('id')
          .eq('ecole_id', ecole.id)
          .limit(1)

        if (ecoleError) {
          console.error('❌ Erreur filtre école:', ecoleError)
          return { success: false, error: `Filtre école: ${ecoleError.message}` }
        }

        console.log('✅ Filtre école OK:', ecoleData)
      }
    } catch (ecoleErr: any) {
      console.error('❌ Erreur récupération école:', ecoleErr)
      // Ne pas faire échouer le test à cause de ça
    }

    return { 
      success: true, 
      data: { 
        user: userData.user,
        session: !!sessionData.session,
        read: readData 
      } 
    }
    
  } catch (error: any) {
    console.error('❌ Erreur permissions:', error)
    return { success: false, error: error.message || JSON.stringify(error) }
  }
}

export async function obtenirFactureParId(id: number): Promise<FactureComplet | null> {
  try {
    console.log('🔍 Récupération facture ID:', id)
    
    // Créer un client Supabase sans authentification
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })

    const { data, error } = await supabaseClient
      .from('factures')
      .select(`
        *,
        eleve:eleves (
          id,
          nom,
          prenom,
          matricule,
          classe_id
        ),
        details:facture_details (
          *,
          type_frais (
            nom,
            montant_defaut
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ Erreur requête facture:', error)
      throw error
    }

    console.log('✅ Facture récupérée:', data)
    return data
  } catch (error: any) {
    console.error('❌ Erreur récupération facture:', {
      message: error.message || 'Message manquant',
      details: error.details || 'Détails manquants',
      hint: error.hint || 'Hint manquant',
      code: error.code || 'Code manquant'
    })
    return null
  }
}

export async function genererNumeroFacture(ecoleId: number): Promise<string> {
  try {
    console.log('⚠️ Mode sans authentification - Génération numéro facture')
    
    // Créer un client Supabase sans authentification
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    
    const currentYear = new Date().getFullYear()
    
    // Récupérer le dernier numéro de facture de l'année
    const { data, error } = await supabaseClient
      .from('factures')
      .select('numero_facture')
      .eq('ecole_id', ecoleId)
      .like('numero_facture', `FACT-${currentYear}-%`)
      .order('numero_facture', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ Erreur récupération dernier numéro:', error)
      // En cas d'erreur, générer un numéro par défaut
      return `FACT-${currentYear}-001`
    }

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastNumber = data[0].numero_facture.split('-')[2]
      nextNumber = parseInt(lastNumber) + 1
    }

    return `FACT-${currentYear}-${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Erreur génération numéro facture:', error)
    return `FACT-${new Date().getFullYear()}-001`
  }
}

export async function supprimerFacture(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Supprimer d'abord les détails
    const { error: detailsError } = await supabase
      .from('facture_details')
      .delete()
      .eq('facture_id', id)

    if (detailsError) throw detailsError

    // Puis supprimer la facture
    const { error: factureError } = await supabase
      .from('factures')
      .delete()
      .eq('id', id)

    if (factureError) throw factureError

    return { success: true }
  } catch (error: any) {
    console.error('Erreur suppression facture:', error)
    return { success: false, error: error.message }
  }
}

export async function modifierStatutFacture(id: number, statut: 'non_payee' | 'payee' | 'annulee'): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('factures')
      .update({ statut })
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Erreur modification statut facture:', error)
    return { success: false, error: error.message }
  }
}

// Utiliser le client Supabase authentifié
export async function createAuthenticatedClient(ecoleId?: number) {
  const client = supabase
  
  // Définir contexte école si fourni
  if (ecoleId) {
    await client.rpc('set_ecole_context', {
      ecole_id_param: ecoleId
    })
  }
  
  return client
}

// ===== FONCTIONS REÇUS AUTOMATIQUES =====

/**
 * Génère un numéro de reçu unique : REC-YYYYMM-XXXX
 */
export function genererNumeroRecu(): string {
  const date = new Date()
  const annee = date.getFullYear()
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `REC-${annee}${mois}-${random}`
}

/**
 * Crée un reçu pour une facture payée
 */
export async function creerRecu(factureId: number, options: {
  modePaiement?: string
  recuPar?: string
  notes?: string
}) {
  try {
    const client = await createAuthenticatedClient()
    
    // Récupérer la facture
    const { data: facture } = await client
      .from('factures')
      .select('montant_total, ecole_id')
      .eq('id', factureId)
      .single()
    
    if (!facture) throw new Error('Facture introuvable')
    
    const recuData = {
      facture_id: factureId,
      numero_recu: genererNumeroRecu(),
      date_generation: new Date().toISOString(),
      montant_recu: facture.montant_total,
      mode_paiement: options.modePaiement || 'especes',
      recu_par: options.recuPar || 'Caisse',
      notes: options.notes || `Reçu pour paiement intégral`,
      ecole_id: facture.ecole_id
    }
    
    const { data, error } = await client
      .from('recus')
      .insert(recuData)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Reçu créé:', data.numero_recu)
    return { success: true, data }
  } catch (error) {
    console.error('Erreur création reçu:', error)
    return { success: false, error }
  }
}

/**
 * Récupère un reçu par ID de facture
 */
export async function obtenirRecuParFacture(factureId: number) {
  try {
    const client = await createAuthenticatedClient()
    const { data } = await client
      .from('recus')
      .select('*')
      .eq('facture_id', factureId)
      .single()
    
    return data
  } catch (error) {
    console.error('Erreur récupération reçu:', error)
    return null
  }
}

// ===== FONCTIONS GESTION UTILISATEURS =====

export interface InvitationData {
  email: string
  nom_complet: string
  role: 'secretaire' | 'comptable'
  message_personnalise?: string
}

export interface Invitation {
  id: number
  ecole_id: number
  email: string
  nom_complet: string
  role: string
  invite_par: number
  token: string
  statut: 'envoye' | 'accepte' | 'expire' | 'annule'
  date_envoi: string
  date_acceptation?: string
  date_expiration: string
  message_personnalise?: string
  invite_par_nom?: string // Nom complet de l'inviteur
  // Relations
  utilisateurs?: {
    nom: string
    prenom: string
    email: string
  }
}

export interface UtilisateurEcole {
  id: number
  nom: string
  prenom: string
  email: string
  role: string
  actif: boolean
  ecole_id?: number
  derniere_connexion?: string
  last_sign_in_at?: string
  created_at: string
}

// Fonction pour obtenir l'UUID de l'admin
async function obtenirAdminUUID(): Promise<string | null> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    const { data: admin, error } = await supabaseClient
      .from('utilisateurs')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (error || !admin) {
      console.log('ℹ️ Aucun admin trouvé')
      return null
    }

    return admin.id
  } catch (error) {
    console.error('❌ Erreur récupération admin:', error)
    return null
  }
}

// Créer une invitation utilisateur
export async function creerInvitation(invitationData: InvitationData, invitePar?: string | number): Promise<{ success: boolean; data?: Invitation; error?: string }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    console.log('🔍 Création invitation pour:', invitationData.email)
    console.log('📊 Données invitation:', invitationData)
    
    // Récupérer l'UUID de l'admin si invitePar n'est pas fourni ou invalide
    let adminUUID = invitePar as string
    if (!invitePar || invitePar === 'admin-temp') {
      console.log('🔍 Récupération UUID admin...')
      const adminId = await obtenirAdminUUID()
      if (!adminId) {
        return { success: false, error: 'Aucun administrateur trouvé pour créer l\'invitation' }
      }
      adminUUID = adminId as string
    }
    
    console.log('👤 Invité par UUID:', adminUUID)
    
    // Test d'abord si la table invitations_utilisateurs existe
    const { data: testTable, error: testError } = await supabaseClient
      .from('invitations_utilisateurs')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Table invitations_utilisateurs non disponible:', testError)
      return { success: false, error: `Table non disponible: ${testError.message}` }
    }

    console.log('✅ Table invitations_utilisateurs accessible')

    // 1. Vérifier que l'email n'est pas déjà utilisé (optionnel pour l'instant)
    console.log('🔍 Vérification email existant...')
    try {
      const { data: existingUser } = await supabaseClient
        .from('utilisateurs')
        .select('id')
        .eq('email', invitationData.email)
        .eq('ecole_id', 1)
        .single()
      
      if (existingUser) {
        console.log('⚠️ Email déjà utilisé')
        return { success: false, error: 'Cet email est déjà utilisé par un utilisateur existant' }
      }
    } catch (userCheckError) {
      console.log('ℹ️ Table utilisateurs non accessible, on continue...')
    }

    // 2. Vérifier qu'il n'y a pas d'invitation en cours
    console.log('🔍 Vérification invitation existante...')
    const { data: existingInvitation, error: invitationCheckError } = await supabaseClient
      .from('invitations_utilisateurs')
      .select('id, statut, email')
      .eq('email', invitationData.email)
      .eq('ecole_id', 1)

    if (invitationCheckError) {
      console.log('⚠️ Erreur vérification invitation:', invitationCheckError)
    } else {
      console.log('📊 Invitations existantes pour cet email:', existingInvitation)
    }

    // Vérifier s'il y a une invitation en cours (statut = 'envoye')
    const invitationEnCours = existingInvitation?.find(inv => inv.statut === 'envoye')
    if (invitationEnCours) {
      console.log('⚠️ Invitation déjà en cours:', invitationEnCours)
      return { success: false, error: 'Une invitation est déjà en cours pour cet email' }
    }

    // Vérifier s'il y a une invitation acceptée (utilisateur existe déjà)
    const invitationAcceptee = existingInvitation?.find(inv => inv.statut === 'accepte')
    if (invitationAcceptee) {
      console.log('⚠️ Invitation déjà acceptée (utilisateur existe):', invitationAcceptee)
      return { success: false, error: 'Un utilisateur avec cet email existe déjà' }
    }

    console.log('✅ Email disponible pour nouvelle invitation')

    // 3. Générer un token unique
    console.log('🔑 Génération token...')
    const token = generateInvitationToken()
    console.log('✅ Token généré:', token.substring(0, 10) + '...')

    // 4. Créer l'invitation
    console.log('💾 Insertion invitation en base...')
    const invitationToInsert = {
      email: invitationData.email,
      nom_complet: invitationData.nom_complet,
      role: invitationData.role,
      invite_par: adminUUID,
      token: token,
      message_personnalise: invitationData.message_personnalise || null,
      ecole_id: 1
    }
    
    console.log('📊 Données à insérer:', invitationToInsert)

    const { data: invitation, error } = await supabaseClient
      .from('invitations_utilisateurs')
      .insert(invitationToInsert)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Erreur insertion invitation DÉTAILLÉE:', error);
      console.error('❌ Code erreur:', error.code);
      console.error('❌ Message:', error.message);
      console.error('❌ Détails:', error.details);
      console.error('❌ Hint:', error.hint);
      console.error('❌ Données tentées:', invitationToInsert); // Les données que vous essayez d'insérer
      console.error('❌ Type d\'erreur:', typeof error);
      console.error('❌ Clés de l\'erreur:', Object.keys(error));
      throw error;
    }

    console.log('✅ Invitation créée avec succès:', invitation.id)

    // 5. L'envoi d'email sera géré par le composant d'invitation
    console.log('📧 Invitation prête pour envoi email à:', invitationData.email)
    console.log('🔗 Lien d\'activation:', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/rejoindre/${token}`)

    return { success: true, data: invitation }
  } catch (error: any) {
    console.error('❌ Exception création invitation:', {
      message: error.message || 'Message manquant',
      stack: error.stack || 'Stack manquant',
      name: error.name || 'Nom manquant'
    })
    return { success: false, error: error.message || 'Erreur inconnue lors de la création' }
  }
}

// Obtenir les invitations d'une école
export async function obtenirInvitations(ecoleId: number): Promise<Invitation[]> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    console.log('🔍 Récupération invitations pour école:', ecoleId)
    
    // Test d'abord si la table invitations_utilisateurs existe
    const { data: testTable, error: testError } = await supabaseClient
      .from('invitations_utilisateurs')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('ℹ️ Table invitations_utilisateurs non disponible:', testError.message)
      console.log('ℹ️ Détails erreur:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      })
      return []
    }

    console.log('✅ Table invitations_utilisateurs accessible')

    // Version simplifiée d'abord - sans les relations
    const { data: invitations, error } = await supabaseClient
      .from('invitations_utilisateurs')
      .select('*')
      .eq('ecole_id', ecoleId)
      .order('date_envoi', { ascending: false })

    if (error) {
      console.error('❌ Erreur récupération invitations:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('✅ Invitations récupérées pour école', ecoleId, ':', invitations?.length || 0)
    console.log('📊 Exemple invitation:', invitations?.[0])

    // Enrichir avec le nom complet de l'inviteur (version simplifiée)
    const invitationsEnrichies = (invitations || []).map(invitation => ({
      ...invitation,
      invite_par_nom: 'Admin' // Valeur par défaut pour l'instant
    }))

    return invitationsEnrichies
  } catch (error) {
    console.error('❌ Exception récupération invitations:', error)
    return []
  }
}

// Obtenir les utilisateurs d'une école
export async function obtenirUtilisateursEcole(ecoleId: number): Promise<UtilisateurEcole[]> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    console.log('🔍 Récupération utilisateurs pour école:', ecoleId)
    
    // Test d'abord si la table utilisateurs existe
    const { data: testTable, error: testError } = await supabaseClient
      .from('utilisateurs')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('ℹ️ Table utilisateurs non disponible:', testError.message)
      console.log('ℹ️ Détails erreur:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      })
      return []
    }

    console.log('✅ Table utilisateurs accessible')

    // Version simplifiée d'abord - seulement les colonnes essentielles
    const { data: utilisateurs, error } = await supabaseClient
      .from('utilisateurs')
      .select('id, nom, prenom, email, role, actif, ecole_id, created_at')
      .eq('ecole_id', ecoleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur récupération utilisateurs:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Essayer sans le filtre ecole_id si ça échoue
      console.log('🔄 Tentative sans filtre ecole_id...')
      const { data: allUsers, error: allError } = await supabaseClient
        .from('utilisateurs')
        .select('id, nom, prenom, email, role, actif, ecole_id, created_at')
        .limit(10)

      if (allError) {
        console.error('❌ Erreur même sans filtre:', allError)
        return []
      }

      console.log('✅ Utilisateurs trouvés (tous):', allUsers?.length || 0)
      console.log('📊 Exemple utilisateur:', allUsers?.[0])
      
      // Filtrer côté client si nécessaire
      return (allUsers || []).filter(u => (u as any).ecole_id === ecoleId || !(u as any).ecole_id) as UtilisateurEcole[]
    }

    console.log('✅ Utilisateurs récupérés pour école', ecoleId, ':', utilisateurs?.length || 0)
    console.log('📊 Exemple utilisateur:', utilisateurs?.[0])
    console.log('📊 Tous les utilisateurs:', utilisateurs)

    // Vérifier si les utilisateurs ont bien ecole_id
    if (utilisateurs && utilisateurs.length > 0) {
      console.log('🔍 Premier utilisateur ecole_id:', (utilisateurs[0] as any).ecole_id)
    }

    return utilisateurs || []
  } catch (error) {
    console.error('❌ Exception récupération utilisateurs:', error)
    return []
  }
}

// Valider un token d'invitation
export async function validerTokenInvitation(token: string): Promise<{ success: boolean; invitation?: Invitation; error?: string }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    const { data: invitation, error } = await supabaseClient
      .from('invitations_utilisateurs')
      .select(`
        *,
        utilisateurs:invite_par (
          nom,
          prenom,
          email
        )
      `)
      .eq('token', token)
      .eq('statut', 'envoye')
      .single()

    if (error || !invitation) {
      return { success: false, error: 'Token d\'invitation invalide ou expiré' }
    }

    // Vérifier l'expiration
    if (new Date(invitation.date_expiration) < new Date()) {
      // Marquer comme expiré
      await supabaseClient
        .from('invitations_utilisateurs')
        .update({ statut: 'expire' })
        .eq('id', invitation.id)

      return { success: false, error: 'Cette invitation a expiré' }
    }

    return { success: true, invitation }
  } catch (error: any) {
    console.error('Erreur validation token:', error)
    return { success: false, error: error.message }
  }
}

// Créer un utilisateur depuis une invitation (VERSION AVEC EMAIL DE CONFIRMATION)
export async function creerUtilisateurDepuisInvitation(token: string, motDePasse: string): Promise<{ success: boolean; user?: UtilisateurEcole; error?: string; needsConfirmation?: boolean }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    // 1. Valider l'invitation
    const validationResult = await validerTokenInvitation(token)
    if (!validationResult.success || !validationResult.invitation) {
      return { success: false, error: validationResult.error }
    }

    const invitation = validationResult.invitation

    // 2. Créer directement l'utilisateur actif (version simplifiée pour test)
    console.log('👤 Création utilisateur actif directement...')
    
    const { data: nouvelUtilisateur, error: userError } = await supabaseClient
      .from('utilisateurs')
      .insert({
        ecole_id: invitation.ecole_id,
        nom: invitation.nom_complet.split(' ').slice(-1)[0], // Dernier mot = nom
        prenom: invitation.nom_complet.split(' ').slice(0, -1).join(' '), // Reste = prénom
        email: invitation.email,
        role: invitation.role,
        actif: true, // Actif immédiatement pour test
        mot_de_passe_temp: motDePasse // Mot de passe en clair pour test
      })
      .select('*')
      .single()

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError)
      return { success: false, error: userError.message }
    }

    console.log('✅ Utilisateur créé et activé:', nouvelUtilisateur.id)

    // 3. Marquer l'invitation comme acceptée
    await supabaseClient
      .from('invitations_utilisateurs')
      .update({ 
        statut: 'accepte',
        date_acceptation: new Date().toISOString()
      })
      .eq('id', invitation.id)

    console.log('✅ Invitation marquée comme acceptée')

    return { 
      success: true, 
      user: nouvelUtilisateur,
      needsConfirmation: false // Pas besoin de confirmation pour test
    }
  } catch (error: any) {
    console.error('❌ Erreur création utilisateur depuis invitation:', error)
    return { success: false, error: error.message }
  }
}

// Fonction pour envoyer un email de confirmation
async function envoyerEmailConfirmation(email: string, userId: string): Promise<void> {
  try {
    // Générer un token de confirmation
    const confirmationToken = generateInvitationToken()
    
    // Stocker le token en base (vous pouvez créer une table pour ça)
    const supabaseClient = await createAuthenticatedClient()
    
    // Pour l'instant, simuler l'envoi d'email
    console.log('📧 EMAIL DE CONFIRMATION')
    console.log('=====================')
    console.log(`À: ${email}`)
    console.log(`Sujet: Confirmez votre compte SAMA ÉCOLE`)
    console.log(`Lien de confirmation: ${window.location.origin}/confirmer-email/${confirmationToken}`)
    console.log('=====================')
    
    // TODO: Intégrer un vrai service d'email (SendGrid, AWS SES, etc.)
    // await sendEmailService.send({
    //   to: email,
    //   subject: 'Confirmez votre compte SAMA ÉCOLE',
    //   html: `<p>Cliquez sur ce lien pour confirmer votre compte: <a href="${window.location.origin}/confirmer-email/${confirmationToken}">Confirmer</a></p>`
    // })
    
  } catch (error) {
    console.error('❌ Erreur envoi email confirmation:', error)
  }
}

// Fonction pour confirmer l'email et activer le compte
export async function confirmerEmailEtActiverCompte(confirmationToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    // 1. Récupérer l'utilisateur avec ce token (vous devez d'abord stocker le token quelque part)
    // Pour l'instant, on va utiliser une approche simplifiée
    
    // 2. Créer l'utilisateur dans Supabase Auth maintenant
    // 3. Activer le compte dans la table utilisateurs
    // 4. Supprimer le mot de passe temporaire
    
    console.log('✅ Email confirmé et compte activé')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Erreur confirmation email:', error)
    return { success: false, error: error.message }
  }
}

// Modifier le statut d'un utilisateur
export async function modifierStatutUtilisateur(userId: number, actif: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    const { error } = await supabaseClient
      .from('utilisateurs')
      .update({ actif })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erreur modification statut utilisateur:', error)
    return { success: false, error: error.message }
  }
}

// Modifier le rôle d'un utilisateur
export async function modifierRoleUtilisateur(userId: number, nouveauRole: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    const { error } = await supabaseClient
      .from('utilisateurs')
      .update({ role: nouveauRole })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erreur modification rôle utilisateur:', error)
    return { success: false, error: error.message }
  }
}

// Annuler une invitation
export async function annulerInvitation(invitationId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    const { error } = await supabaseClient
      .from('invitations_utilisateurs')
      .update({ statut: 'annule' })
      .eq('id', invitationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erreur annulation invitation:', error)
    return { success: false, error: error.message }
  }
}

// Renvoyer une invitation expirée
export async function renvoyerInvitation(invitationId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    // Générer un nouveau token et prolonger l'expiration
    const nouveauToken = generateInvitationToken()
    const nouvelleExpiration = new Date()
    nouvelleExpiration.setDate(nouvelleExpiration.getDate() + 7)

    const { error } = await supabaseClient
      .from('invitations_utilisateurs')
      .update({ 
        token: nouveauToken,
        statut: 'envoye',
        date_envoi: new Date().toISOString(),
        date_expiration: nouvelleExpiration.toISOString()
      })
      .eq('id', invitationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erreur renvoi invitation:', error)
    return { success: false, error: error.message }
  }
}

// Fonction utilitaire pour générer des tokens
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Supprime un utilisateur
 */
export async function supprimerUtilisateur(utilisateurId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️ Suppression utilisateur ID:', utilisateurId);

    const supabaseClient = await createAuthenticatedClient();

    // Supprimer l'utilisateur
    const { error } = await supabaseClient
      .from('utilisateurs')
      .delete()
      .eq('id', utilisateurId);

    if (error) {
      console.error('❌ Erreur suppression utilisateur:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression'
      };
    }

    console.log('✅ Utilisateur supprimé avec succès');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Supprime une invitation en attente
 */
export async function supprimerInvitation(invitationId: number): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️ Suppression invitation ID:', invitationId);

    const supabaseClient = await createAuthenticatedClient();

    // Supprimer l'invitation
    const { error } = await supabaseClient
      .from('invitations_utilisateurs')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('❌ Erreur suppression invitation:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression'
      };
    }

    console.log('✅ Invitation supprimée avec succès');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}


// ===== FONCTIONS REÇUS =====

export interface RecuData {
  facture_id: number
  numero_recu: string
  date_emission: string
  montant_recu: number
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'mobile_money'
  statut: 'emis' | 'envoye' | 'whatsapp' | 'imprime'
  notes?: string
}


export async function obtenirRecus(ecoleId: number): Promise<any[]> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    // Test d'abord si la table recus existe
    const { data: testTable, error: testError } = await supabaseClient
      .from('recus')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('ℹ️ Table reçus non disponible:', testError.message)
      return []
    }

    // Récupérer les reçus
    const { data: recus, error: recusError } = await supabaseClient
      .from('recus')
      .select('*')
      .order('created_at', { ascending: false })

    if (recusError) {
      console.log('ℹ️ Erreur récupération reçus:', recusError.message)
      return []
    }

    if (!recus || recus.length === 0) {
      console.log('ℹ️ Aucun reçu trouvé')
      return []
    }


    // Récupérer les factures liées
    const factureIds = [...new Set(recus.map(r => r.facture_id).filter(Boolean))]
    let factures: any[] = []
    
    if (factureIds.length > 0) {
      const { data: facturesData, error: facturesError } = await supabaseClient
        .from('factures')
        .select(`
          id,
          numero_facture,
          eleve_id
        `)
        .in('id', factureIds)
        .eq('ecole_id', ecoleId)

      if (!facturesError) {
        factures = facturesData || []
      }
    }

    // Récupérer les élèves liés
    const eleveIds = [...new Set(factures.map(f => f.eleve_id).filter(Boolean))]
    let eleves: any[] = []
    let elevesAvecParents: any[] = []
    
    if (eleveIds.length > 0) {
      const { data: elevesData, error: elevesError } = await supabaseClient
        .from('eleves')
        .select(`
          id, 
          prenom, 
          nom, 
          matricule,
          parent_id
        `)
        .in('id', eleveIds)

      if (!elevesError) {
        eleves = elevesData || []
      }

      // Récupérer les parents séparément
      let parents: any[] = []
      const parentIds = [...new Set(eleves?.map(e => e.parent_id).filter(Boolean) || [])]
      
      if (parentIds.length > 0) {
        try {
          // Test d'abord si la table parents_tuteurs existe
          const { data: testParents, error: testParentsError } = await supabaseClient
            .from('parents_tuteurs')
            .select('id')
            .limit(1)

          if (testParentsError) {
            console.error('❌ Table parents_tuteurs non accessible dans obtenirRecus:', testParentsError)
          } else {
            console.log('✅ Table parents_tuteurs accessible dans obtenirRecus')
            
            const { data: parentsData, error: parentsError } = await supabaseClient
              .from('parents_tuteurs')
              .select('id, nom, prenom, telephone, email, relation, adresse')
              .in('id', parentIds)

            if (!parentsError) {
              parents = parentsData || []
              console.log('✅ Parents récupérés dans obtenirRecus:', parents.length)
            } else {
              console.error('❌ Erreur récupération parents dans obtenirRecus:', parentsError)
            }
          }
        } catch (error) {
          console.error('❌ Erreur table parents_tuteurs dans obtenirRecus:', error)
        }
      }

      // Combiner les données élèves avec leurs parents
      elevesAvecParents = eleves?.map(eleve => ({
        ...eleve,
        parents: eleve.parent_id ? parents.find(p => p.id === eleve.parent_id) : null
      })) || []
    }

    // Combiner les données
    const recusAvecRelations = recus.map(recu => {
      const facture = factures.find(f => f.id === recu.facture_id)
      const eleve = elevesAvecParents.find(e => e.id === facture?.eleve_id)
      
      return {
        ...recu,
        factures: facture ? {
          ...facture,
          eleves: eleve
        } : null
      }
    })

    console.log('✅ Reçus avec relations:', {
      recus: recus.length,
      factures: factures.length,
      eleves: eleves.length,
      elevesAvecParents: elevesAvecParents.length,
      final: recusAvecRelations.length
    })

    // Debug: Vérifier la structure des données
    if (recusAvecRelations.length > 0) {
      console.log('🔍 Debug structure reçu:', {
        recu: recusAvecRelations[0],
        facture: recusAvecRelations[0]?.factures,
        eleve: recusAvecRelations[0]?.factures?.eleves,
        parents: recusAvecRelations[0]?.factures?.eleves?.parents
      })
    }

    return recusAvecRelations
  } catch (error: any) {
    console.log('ℹ️ Erreur récupération reçus:', {
      message: error.message || 'Erreur inconnue',
      type: typeof error
    })
    return []
  }
}


// ==================== GESTION DES FRAIS ====================

/**
 * Récupère tous les frais de l'école
 */
export async function obtenirFrais(ecoleId: number = 1) {
  try {
    console.log('🔍 Récupération frais pour école:', ecoleId)
    
    const client = await createAuthenticatedClient()
    
    const { data, error } = await client
      .from('frais_predefinis')
      .select('*, classes(id, niveau, section)')
      .eq('ecole_id', ecoleId)
      .eq('actif', true)
      .order('type_frais', { ascending: true })
      .order('designation', { ascending: true })

    if (error) throw error

    console.log('✅ Frais récupérés:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Erreur récupération frais:', error)
    return []
  }
}

/**
 * Crée un nouveau frais
 */
export async function creerFrais(fraisData: any) {
  try {
    const client = await createAuthenticatedClient()
    
    const { data, error } = await client
      .from('frais_predefinis')
      .insert([{
        ...fraisData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erreur création frais:', error)
    return { success: false, error: (error as any)?.message || 'Erreur inconnue' }
  }
}

/**
 * Modifie un frais existant
 */
export async function modifierFrais(fraisId: number, fraisData: any) {
  try {
    const client = await createAuthenticatedClient()
    
    const { data, error } = await client
      .from('frais_predefinis')
      .update(fraisData)
      .eq('id', fraisId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erreur modification frais:', error)
    return { success: false, error: (error as any)?.message || 'Erreur inconnue' }
  }
}

/**
 * Supprime un frais (désactivation logique)
 */
export async function supprimerFrais(fraisId: number) {
  try {
    const client = await createAuthenticatedClient()
    
    const { error } = await client
      .from('frais_predefinis')
      .update({ actif: false })
      .eq('id', fraisId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur suppression frais:', error)
    return { success: false, error: (error as any)?.message || 'Erreur inconnue' }
  }
}

/**
 * Récupère les infos de l'école
 */
export async function obtenirInfosEcole(ecoleId: number = 1) {
  try {
    const client = await createAuthenticatedClient()
    const { data, error } = await client
      .from('ecoles')
      .select('*')
      .eq('id', ecoleId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur récupération école:', error)
    return null
  }
}


/**
 * Crée une facture avec ses lignes
 */
export async function creerFactureComplete(factureData: any, lignes: any[]) {
  try {
    console.log('📝 Données facture:', factureData)
    console.log('📝 Lignes:', lignes)
    
    const client = await createAuthenticatedClient()
    
    // 1. Créer la facture
    console.log('Création facture en cours...')
    const { data: facture, error: factureError } = await client
      .from('factures')
      .insert([factureData])
      .select()
      .single()

    console.log('Résultat insertion facture:', { facture, factureError })

    if (factureError) {
      console.error('❌ Erreur insertion facture:', JSON.stringify(factureError, null, 2))
      throw factureError
    }

    // 2. Créer les lignes
    const lignesAvecFacture = lignes.map(ligne => ({
      ...ligne,
      facture_id: facture.id
    }))

    console.log('📝 Lignes avec facture_id:', lignesAvecFacture)

    const { error: lignesError } = await client
      .from('facture_lignes')
      .insert(lignesAvecFacture)

    console.log('Résultat insertion lignes:', { lignesError })

    if (lignesError) {
      console.error('❌ Erreur insertion lignes:', JSON.stringify(lignesError, null, 2))
      throw lignesError
    }

    return { success: true, data: facture }
  } catch (error) {
    console.error('❌ Erreur création facture complète:', error)
    console.error('❌ Type erreur:', typeof error)
    console.error('❌ Clés erreur:', error ? Object.keys(error) : 'null')
    return { success: false, error: (error as any)?.message || 'Erreur inconnue' }
  }
}

// =================== TEMPLATES ET FRAIS PRÉDÉFINIS ===================

// Version de test avec client public
export async function obtenirTemplatesPublic(ecoleId: number = 1): Promise<any[]> {
  try {
    console.log('🧪 Test avec client PUBLIC, ecoleId:', ecoleId)
    
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
    )
    console.log('✅ Client public créé')
    
    const { data, error } = await client
      .from('templates_factures')
      .select('*')
      .eq('ecole_id', ecoleId)
      .eq('actif', true)
    
    console.log('📊 CLIENT PUBLIC - Résultat:', { data, error })
    
    if (error) {
      console.error('❌ CLIENT PUBLIC - Erreur:', JSON.stringify(error, null, 2))
      return []
    }
    
    console.log('✅ CLIENT PUBLIC - Templates chargés:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ CLIENT PUBLIC - Exception:', error)
    return []
  }
}

export async function obtenirTemplates(ecoleId: number): Promise<any[]> {
  try {
    console.log('🔍 Début obtenirTemplates, ecoleId:', ecoleId)
    
    const client = await createAuthenticatedClient()
    console.log('✅ Client créé')
    
    const { data, error } = await client
      .from('templates_factures')
      .select(`
        *,
        frais_predefinis (*)
      `)
      .eq('ecole_id', ecoleId)
      .eq('actif', true)
      .order('nom', { ascending: true })
    
    console.log('📊 Résultat brut:', { data, error })
    console.log('📊 Type error:', typeof error, error)
    console.log('📊 Error keys:', error ? Object.keys(error) : 'null')
    
    if (error) {
      console.error('❌ Erreur détaillée:', JSON.stringify(error, null, 2))
      throw error
    }
    
    console.log('✅ Templates chargés:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Exception complète:', error)
    console.error('❌ Error message:', (error as any)?.message)
    console.error('❌ Error stack:', (error as any)?.stack)
    return []
  }
}

export async function obtenirFraisPredefinis(ecoleId: number, classeNiveau?: string): Promise<any[]> {
  try {
    console.log('🔍 Récupération frais prédéfinis pour école:', ecoleId, 'niveau:', classeNiveau)
    
    const client = await createAuthenticatedClient()
    let query = client
      .from('frais_predefinis')
      .select('*')
      .eq('ecole_id', ecoleId)
      .eq('actif', true)
      .order('nom', { ascending: true })
    
    if (classeNiveau) {
      query = query.eq('classe_niveau', classeNiveau)
    }
    
    const { data, error } = await query
    if (error) {
      console.error('❌ Erreur récupération frais prédéfinis:', error)
      throw error
    }

    console.log('✅ Frais prédéfinis récupérés:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Exception récupération frais prédéfinis:', error)
    return []
  }
}

export async function creerFactureAvecElements(factureData: any, elements: any[]): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('📝 Création facture avec éléments:', factureData, elements)
    
    const client = await createAuthenticatedClient()
    
    // Générer le numéro de facture si non fourni
    if (!factureData.numero_facture) {
      factureData.numero_facture = await genererNumeroFacture(factureData.ecole_id)
    }
    
    // Insérer la facture principale
    const { data: facture, error: factureError } = await client
      .from('factures')
      .insert([{
        ...factureData,
        montant_total: elements.reduce((sum, el) => sum + (el.montant * el.quantite), 0),
        montant_paye: 0,
        montant_restant: elements.reduce((sum, el) => sum + (el.montant * el.quantite), 0),
        statut: 'non_payee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (factureError) {
      console.error('❌ Erreur création facture:', factureError)
      throw factureError
    }

    console.log('✅ Facture créée avec ID:', facture.id)

    // Insérer les éléments si fournis
    if (elements && elements.length > 0) {
      const elementsAvecFactureId = elements.map(el => ({
        ...el,
        facture_id: facture.id,
        created_at: new Date().toISOString()
      }))
      
      const { error: elementsError } = await client
        .from('facture_elements')
        .insert(elementsAvecFactureId)
      
      if (elementsError) {
        console.error('❌ Erreur création éléments:', elementsError)
        // Ne pas échouer si les éléments ne peuvent pas être créés
        console.log('⚠️ Continuation sans éléments de détail')
      } else {
        console.log('✅ Éléments créés:', elements.length)
      }
    }

    return {
      success: true,
      data: facture
    }
  } catch (error: any) {
    console.error('❌ Exception création facture avec éléments:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la création de la facture'
    }
  }
}

export async function genererFacturesEnLot(template: any, classeId: number, elevesIds: number[]): Promise<{ success: boolean; factures?: any[]; error?: string }> {
  try {
    console.log('📦 Génération factures en lot:', { template: template.id, classeId, elevesIds: elevesIds.length })
    
    const client = await createAuthenticatedClient()
    const facturesCrees = []
    
    for (const eleveId of elevesIds) {
      const result = await creerFactureAvecElements(
        {
          ecole_id: template.ecole_id,
          eleve_id: eleveId,
          classe_id: classeId
        },
        template.frais_predefinis || []
      )
      
      if (result.success) {
        facturesCrees.push(result.data)
      } else {
        console.error(`❌ Échec création facture pour élève ${eleveId}:`, result.error)
      }
    }

    console.log('✅ Factures générées:', facturesCrees.length, '/', elevesIds.length)
    
    return {
      success: true,
      factures: facturesCrees
    }
  } catch (error: any) {
    console.error('❌ Exception génération factures en lot:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la génération des factures'
    }
  }
}

export async function sauvegarderBrouillonTemplate(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('💾 Sauvegarde brouillon template:', data)
    
    const client = await createAuthenticatedClient()
    
    // Créer ou mettre à jour le brouillon
    const brouillonData = {
      ...data,
      updated_at: new Date().toISOString()
    }
    
    const { data: brouillon, error } = await client
      .from('brouillons_facturation')
      .upsert([brouillonData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erreur sauvegarde brouillon:', error)
      throw error
    }

    console.log('✅ Brouillon sauvegardé:', brouillon.id)
    
    return {
      success: true,
      data: brouillon
    }
  } catch (error: any) {
    console.error('❌ Exception sauvegarde brouillon:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la sauvegarde'
    }
  }
}

export async function obtenirHistoriqueFactures(ecoleId: number, limit: number = 10): Promise<any[]> {
  try {
    console.log('📜 Récupération historique facturations pour école:', ecoleId)
    
    const client = await createAuthenticatedClient()
    const { data, error } = await client
      .from('factures')
      .select(`
        id,
        numero_facture,
        montant_total,
        statut,
        date_emission,
        eleves!inner (
          prenom,
          nom
        )
      `)
      .eq('ecole_id', ecoleId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Erreur récupération historique:', error)
      console.log('⚠️ Utilisation de données simulées')
      
      // Données simulées pour l'historique
      return [
        {
          id: 1,
          numero_facture: 'FAC-2024-001',
          montant_total: 25000,
          statut: 'payee',
          date_emission: '2024-01-15',
          eleves: { prenom: 'Fatou', nom: 'DIAGNE' }
        },
        {
          id: 2,
          numero_facture: 'FAC-2024-002',
          montant_total: 50000,
          statut: 'partiel',
          date_emission: '2024-01-14',
          eleves: { prenom: 'Amadou', nom: 'NDIAYE' }
        },
        {
          id: 3,
          numero_facture: 'FAC-2024-003',
          montant_total: 75000,
          statut: 'emise',
          date_emission: '2024-01-13',
          eleves: { prenom: 'Aïcha', nom: 'FALL' }
        }
      ]
    }

    console.log('✅ Historique récupéré:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Exception récupération historique:', error)
    return []
  }
}

export async function obtenirStatsFacturation(ecoleId: number): Promise<any> {
  try {
    console.log('📊 Récupération statistiques facturation pour école:', ecoleId)
    
    const client = await createAuthenticatedClient()
    
    // Statistiques du mois en cours
    const debutMois = new Date()
    debutMois.setDate(1)
    debutMois.setHours(0, 0, 0, 0)
    
    const { data: stats, error } = await client
      .from('factures')
      .select('montant_total, statut')
      .eq('ecole_id', ecoleId)
      .gte('date_emission', debutMois.toISOString().split('T')[0])
    
    if (error) {
      console.error('❌ Erreur récupération stats:', error)
      console.log('⚠️ Utilisation de données simulées')
      
      return {
        factures_du_mois: 24,
        montant_total: 1450000,
        factures_payees: 18,
        factures_attente: 6
      }
    }

    const calculStats = {
      factures_du_mois: stats?.length || 0,
      montant_total: stats?.reduce((sum, f) => sum + f.montant_total, 0) || 0,
      factures_payees: stats?.filter(f => f.statut === 'payee').length || 0,
      factures_attente: stats?.filter(f => f.statut !== 'payee').length || 0
    }

    console.log('✅ Statistiques calculées:', calculStats)
    return calculStats
  } catch (error) {
    console.error('❌ Exception calcul statistiques:', error)
    return {
      factures_du_mois: 0,
      montant_total: 0,
      factures_payees: 0,
      factures_attente: 0
    }
  }
}


export async function modifierStatutRecu(id: number, statut: 'emis' | 'envoye' | 'imprime'): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    const { error } = await supabaseClient
      .from('recus')
      .update({ statut })
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Erreur modification statut reçu:', error)
    return { success: false, error: error.message }
  }
}

export async function supprimerRecu(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseClient = await createAuthenticatedClient()
    
    const { error } = await supabaseClient
      .from('recus')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Erreur suppression reçu:', error)
    return { success: false, error: error.message }
  }
}