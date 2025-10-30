'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenirEleves, obtenirClasses, obtenirFrais, obtenirInfosEcole, obtenirEleveComplet, createAuthenticatedClient } from '@/lib/supabase-functions'
import { genererNumeroFacture } from '@/lib/utils'
import { genererPDFFacture } from '@/lib/pdf-facture'
import { Search, Plus, X, FileText, Calculator } from 'lucide-react'

export default function NouvelleFacturePage() {
  const router = useRouter()
  
  // État
  const [etape, setEtape] = useState(1)
  const [classes, setClasses] = useState([])
  const [tousLesEleves, setTousLesEleves] = useState([])
  const [eleves, setEleves] = useState([]) // Pour l'affichage filtré
  const [frais, setFrais] = useState([])
  const [modeMultiEleves, setModeMultiEleves] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Sélections
  const [classeSelectionnee, setClasseSelectionnee] = useState(null)
  const [elevesSelectionnes, setElevesSelectionnes] = useState([])
  const [lignesFacture, setLignesFacture] = useState([])
  const [searchEleve, setSearchEleve] = useState('')

  useEffect(() => {
    chargerDonnees()
  }, [])

  useEffect(() => {
    if (classeSelectionnee) {
      chargerElevesClasse()
    }
  }, [classeSelectionnee])

  // Détecter le mode selon le nombre d'élèves sélectionnés
  useEffect(() => {
    const nbEleves = elevesSelectionnes.length
    
    if (nbEleves === 0) {
      setFrais([])
      setLignesFacture([])
      setModeMultiEleves(false)
    } else if (nbEleves === 1) {
      setModeMultiEleves(false)
      chargerFraisUnEleve(elevesSelectionnes[0])
    } else {
      setModeMultiEleves(true)
      chargerTousLesFrais()
    }
  }, [elevesSelectionnes])

  // Charger les données via API
  const chargerDonnees = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/factures/donnees', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erreur chargement données')
      }

      const data = await response.json()
      
      console.log('✅ Données chargées:', {
        eleves: data.eleves?.length,
        classes: data.classes?.length,
        frais: data.frais?.length
      })
      
      // Stocker les élèves avec leurs relations
      setTousLesEleves(data.eleves || [])
      setEleves(data.eleves || [])
      
      // Stocker les classes
      setClasses(data.classes || [])
      
      // Stocker les frais
      setFrais(data.frais || [])
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const chargerElevesClasse = async () => {
    // Les élèves sont déjà chargés via l'API, on filtre juste
    if (classeSelectionnee) {
      const elevesFiltres = tousLesEleves.filter(e => e.classe_id === classeSelectionnee)
      setEleves(elevesFiltres)
      console.log('Élèves filtrés par classe:', elevesFiltres.length)
    } else {
      setEleves(tousLesEleves)
      console.log('Tous les élèves affichés:', tousLesEleves.length)
    }
  }

  /**
   * MODE 1 ÉLÈVE : Filtrer selon sa classe
   */
  const chargerFraisUnEleve = async (eleveId: number) => {
    try {
      const eleve = tousLesEleves.find(e => e.id === eleveId)
      if (!eleve) return

      // Utiliser les frais déjà chargés par l'API
      // Filtrer par classe si nécessaire
      const fraisFiltre = frais.filter(f => {
        // Si le frais a une classe spécifique, vérifier la correspondance
        if (f.classe_niveau && eleve.classes?.niveau) {
          return f.classe_niveau === eleve.classes.niveau
        }
        // Sinon, c'est un frais pour toutes les classes
        return true
      })

      console.log(`Frais pour ${eleve.nom} (classe ${eleve.classes?.nom_complet}):`, fraisFiltre.length)
      // Ne pas utiliser setFrais ici car on utilise déjà les frais chargés
      // Juste logger pour debug
    } catch (error) {
      console.error('Erreur chargerFraisUnEleve:', error)
    }
  }

  /**
   * MODE MULTI-ÉLÈVES : Frais pertinents pour les classes sélectionnées
   */
  const chargerTousLesFrais = async () => {
    try {
      // Les frais sont déjà chargés par l'API dans le state "frais"
      console.log('Tous les frais disponibles:', frais.length)
      // Pas besoin de setFrais car les frais sont déjà chargés
    } catch (error) {
      console.error('Erreur chargerTousLesFrais:', error)
    }
  }

  const ajouterFrais = (frais) => {
    const nouvelleLigne = {
      frais_id: frais.id,
      type_frais: frais.type_frais,
      classe_id: frais.classe_id,
      designation: frais.designation,
      quantite: 1,
      tarif: frais.montant,
      montant: frais.montant
    }
    setLignesFacture([...lignesFacture, nouvelleLigne])
  }

  const retirerLigne = (index) => {
    setLignesFacture(lignesFacture.filter((_, i) => i !== index))
  }

  /**
   * Adapter les frais selon la classe de l'élève (MODE MULTI uniquement)
   */
  const adapterFraisPourEleve = async (eleve, lignesSelectionnees) => {
    const client = await createAuthenticatedClient()
    const lignesAdaptees = []

    for (const ligne of lignesSelectionnees) {
      // Frais universel : garder tel quel
      if (!ligne.classe_id) {
        lignesAdaptees.push({
          frais_id: ligne.frais_id,
          designation: ligne.designation,
          quantite: ligne.quantite,
          tarif: ligne.tarif,
          montant: ligne.tarif * ligne.quantite
        })
        continue
      }

      // Frais spécifique : chercher dans les frais déjà chargés
      const fraisCorrespondant = frais.find(f => 
        f.designation === ligne.designation ||
        (f.type_frais && ligne.type_frais && f.type_frais === ligne.type_frais)
      )

      if (fraisCorrespondant) {
        lignesAdaptees.push({
          frais_id: fraisCorrespondant.id,
          designation: fraisCorrespondant.designation,
          quantite: ligne.quantite,
          tarif: fraisCorrespondant.montant,
          montant: fraisCorrespondant.montant * ligne.quantite
        })
      } else {
        console.warn(`Frais non trouvé pour ligne: ${ligne.designation}`)
      }
    }

    return lignesAdaptees
  }

  const modifierQuantite = (index, quantite) => {
    const nouvelles = [...lignesFacture]
    nouvelles[index].quantite = quantite
    nouvelles[index].montant = quantite * nouvelles[index].tarif
    setLignesFacture(nouvelles)
  }

  const calculerTotal = () => {
    return lignesFacture.reduce((sum, ligne) => sum + ligne.montant, 0)
  }

  const genererFactures = async () => {
    if (elevesSelectionnes.length === 0 || lignesFacture.length === 0) {
      alert('Sélectionnez au moins un élève et un frais')
      return
    }

    setLoading(true)
    try {
      // Récupérer l'école de l'utilisateur connecté
      const ecoleResponse = await fetch('/api/ecole', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (!ecoleResponse.ok) {
        throw new Error('Erreur récupération école')
      }
      
      const ecoleData = await ecoleResponse.json()
      const ecole = ecoleData.ecole
      const ecoleId = ecole.id
      
      for (const eleveId of elevesSelectionnes) {
        const eleveComplet = await obtenirEleveComplet(eleveId)
        
        if (!eleveComplet) {
          console.error('Élève introuvable:', eleveId)
          continue
        }

        // ADAPTATION : nécessaire uniquement en mode multi-élèves
        const lignesFinales = modeMultiEleves 
          ? await adapterFraisPourEleve(eleveComplet, lignesFacture)
          : lignesFacture.map(l => ({
              frais_id: l.frais_id,
              designation: l.designation,
              quantite: l.quantite,
              tarif: l.tarif,
              montant: l.montant
            }))
        
        if (lignesFinales.length === 0) {
          console.warn(`Aucun frais pour ${eleveComplet.nom}`)
          continue
        }

        const montantTotal = lignesFinales.reduce((sum, l) => sum + l.montant, 0)

        const factureData = {
          ecole_id: ecoleId,
          eleve_id: eleveId,
          numero_facture: genererNumeroFacture(),
          date_emission: new Date().toISOString().split('T')[0],
          date_echeance: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          montant_total: montantTotal,
          montant_paye: 0,
          montant_restant: montantTotal,
          statut: 'non_payee',
          notes: `Facture pour ${eleveComplet.nom} ${eleveComplet.prenom}`
        }

        // Appeler l'API pour créer la facture
        const response = await fetch('/api/factures/creer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            factureData: factureData,
            lignes: lignesFinales
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erreur création facture')
        }

        const data = await response.json()
        console.log('✅ Facture créée via API:', data.facture.numero_facture)
        
        // Générer le PDF
        await genererPDFFacture(data.facture, eleveComplet, ecole, lignesFinales)
      }

      const message = modeMultiEleves
        ? `${elevesSelectionnes.length} factures créées avec adaptation automatique`
        : 'Facture créée avec succès'
      
      alert(message)
      router.push('/dashboard/factures')
    } catch (error) {
      console.error('Erreur génération factures:', error)
      alert('Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const elevesAffiches = eleves.filter(e => 
    e.nom.toLowerCase().includes(searchEleve.toLowerCase()) ||
    e.prenom.toLowerCase().includes(searchEleve.toLowerCase()) ||
    e.matricule?.toLowerCase().includes(searchEleve.toLowerCase())
  )

  if (loading && classes.length === 0) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nouvelle Facture</h1>
            <p className="text-gray-600">Créez des factures pour vos élèves</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/factures')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Étape 1 : Sélection Élèves */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Sélectionner les élèves
              </h2>

              {/* Filtre par classe */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Filtrer par classe</label>
                <select
                  value={classeSelectionnee || ''}
                  onChange={(e) => setClasseSelectionnee(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Toutes les classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.niveau} {c.section} - {c.nom_complet}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recherche élève */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou matricule..."
                    value={searchEleve}
                    onChange={(e) => setSearchEleve(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Liste élèves */}
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {elevesAffiches.map(eleve => (
                  <label
                    key={eleve.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={elevesSelectionnes.includes(eleve.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setElevesSelectionnes([...elevesSelectionnes, eleve.id])
                        } else {
                          setElevesSelectionnes(elevesSelectionnes.filter(id => id !== eleve.id))
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{eleve.nom} {eleve.prenom}</p>
                        {eleve.classe && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            {eleve.classe.niveau} {eleve.classe.section}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{eleve.matricule}</p>
                    </div>
                  </label>
                ))}
              </div>

              <p className="mt-2 text-sm text-gray-600">
                {elevesSelectionnes.length} élève(s) sélectionné(s)
              </p>

              {/* Badges des classes concernées */}
              {elevesSelectionnes.length > 0 && (() => {
                const classesUniques = [...new Set(
                  tousLesEleves
                    .filter(e => elevesSelectionnes.includes(e.id))
                    .map(e => e.classe ? `${e.classe.niveau} ${e.classe.section}` : null)
                    .filter(Boolean)
                )]
                
                return classesUniques.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-600">Classes :</span>
                    {classesUniques.map((classe, i) => (
                      <span 
                        key={i}
                        className="inline-flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium"
                      >
                        {classe}
                      </span>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Étape 2 : Sélection Frais */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Ajouter des frais
              </h2>

              {/* Message contextuel selon le mode */}
              {elevesSelectionnes.length === 1 && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>1 élève sélectionné</strong> - Frais filtrés automatiquement
                  </p>
                </div>
              )}
              
              {elevesSelectionnes.length > 1 && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    {elevesSelectionnes.length} élèves de {[...new Set(
                      tousLesEleves
                        .filter(e => elevesSelectionnes.includes(e.id))
                        .map(e => e.classe?.niveau)
                        .filter(Boolean)
                    )].join(', ')} sélectionnés
                  </p>
                  <p className="text-xs text-blue-700">
                    Les frais seront adaptés automatiquement selon chaque classe lors de la génération.
                  </p>
                </div>
              )}

              {/* Catalogue de frais */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {elevesSelectionnes.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Sélectionnez un ou plusieurs élèves
                  </p>
                )}
                
                {frais.map(f => (
                  <button
                    key={f.id}
                    onClick={() => ajouterFrais(f)}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{f.designation}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600 capitalize">{f.type_frais}</span>
                        {f.classes ? (
                          modeMultiEleves ? (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              Adapté par classe
                            </span>
                          ) : (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {f.classes.niveau}
                            </span>
                          )
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Montant unique
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{f.montant.toLocaleString()} FCFA</span>
                      <Plus className="w-5 h-5 text-purple-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite - Prévisualisation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Prévisualisation
              </h2>

              {/* Lignes de facture */}
              <div className="space-y-2 mb-4">
                {lignesFacture.map((ligne, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ligne.designation}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min="1"
                          value={ligne.quantite}
                          onChange={(e) => modifierQuantite(index, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border rounded text-sm"
                        />
                        <span className="text-sm text-gray-600">×</span>
                        <span className="text-sm">{ligne.tarif.toLocaleString()} FCFA</span>
                      </div>
                      <p className="text-sm font-semibold mt-1">{ligne.montant.toLocaleString()} FCFA</p>
                    </div>
                    <button
                      onClick={() => retirerLigne(index)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {lignesFacture.length === 0 && (
                  <p className="text-center text-gray-500 py-8 text-sm">
                    Aucun frais ajouté
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Total
                  </span>
                  <span className="text-2xl font-bold text-purple-600">
                    {calculerTotal().toLocaleString()} FCFA
                  </span>
                </div>

                <button
                  onClick={genererFactures}
                  disabled={loading || elevesSelectionnes.length === 0 || lignesFacture.length === 0}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Génération...' : `Générer ${elevesSelectionnes.length} facture(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}