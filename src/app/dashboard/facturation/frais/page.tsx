'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { obtenirFrais, creerFrais, modifierFrais, supprimerFrais, obtenirClasses } from '@/lib/supabase-functions'
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'

export default function CatalogueFraisPage() {
  const { hasPermission } = useAuth()
  const [frais, setFrais] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFrais, setEditingFrais] = useState(null)

  const canEdit = hasPermission('frais.create')

  useEffect(() => {
    chargerFrais()
  }, [])

  const chargerFrais = async () => {
    setLoading(true)
    const data = await obtenirFrais(1)
    setFrais(data)
    setLoading(false)
  }

  const handleSave = async (formData) => {
    if (editingFrais) {
      await modifierFrais(editingFrais.id, formData)
    } else {
      await creerFrais({ ...formData, ecole_id: 1 })
    }
    await chargerFrais()
    setShowModal(false)
    setEditingFrais(null)
  }

  const handleDelete = async (id) => {
    if (confirm('Supprimer ce frais ?')) {
      await supprimerFrais(id)
      await chargerFrais()
    }
  }

  const groupedFrais = frais.reduce((acc, f) => {
    const type = f.type_frais || 'autre'
    if (!acc[type]) acc[type] = []
    acc[type].push(f)
    return acc
  }, {})

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Catalogue des Frais</h1>
          <p className="text-gray-600">Gérez les frais disponibles pour la facturation</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditingFrais(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Nouveau frais
          </button>
        )}
      </div>

      {/* Liste des frais par catégorie */}
      <div className="space-y-6">
        {Object.entries(groupedFrais).map(([type, items]) => (
          <div key={type} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold capitalize">{type}</h2>
            </div>
            <div className="divide-y">
              {items.map((frais) => (
                <div key={frais.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <h3 className="font-medium">{frais.designation}</h3>
                        {frais.description && (
                          <p className="text-sm text-gray-600">{frais.description}</p>
                        )}
                        {/* Afficher la classe si frais spécifique */}
                        {frais.classes ? (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded mt-1 inline-block">
                            {frais.classes.niveau} {frais.classes.section}
                          </span>
                        ) : frais.classe_niveau && frais.classe_niveau !== 'tous' ? (
                          <span className="text-xs text-gray-500">Niveau: {frais.classe_niveau}</span>
                        ) : (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                            Tous niveaux
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold">{frais.montant.toLocaleString()} FCFA</p>
                      {frais.obligatoire && (
                        <span className="text-xs text-blue-600">Obligatoire</span>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingFrais(frais)
                            setShowModal(true)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(frais.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulaire */}
      {showModal && (
        <FraisModal
          frais={editingFrais}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingFrais(null)
          }}
        />
      )}
    </div>
  )
}

function FraisModal({ frais, onSave, onClose }) {
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState({
    designation: frais?.designation || '',
    montant: frais?.montant || '',
    type_frais: frais?.type_frais || 'mensualite',
    classe_id: frais?.classe_id || null,
    obligatoire: frais?.obligatoire ?? true,
    description: frais?.description || ''
  })

  useEffect(() => {
    chargerClasses()
  }, [])

  const chargerClasses = async () => {
    const data = await obtenirClasses(1)
    setClasses(data)
  }

  const typesNecessitantClasse = ['mensualite', 'inscription', 'fournitures']
  const classeRequise = typesNecessitantClasse.includes(formData.type_frais)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation : si type nécessite classe, vérifier qu'elle est sélectionnée
    if (classeRequise && !formData.classe_id) {
      alert('Veuillez sélectionner une classe pour ce type de frais')
      return
    }
    
    // Si type universel, forcer classe_id à null
    const dataToSave = {
      ...formData,
      classe_id: classeRequise ? formData.classe_id : null
    }
    
    onSave(dataToSave)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header compact */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900">
            {frais ? 'Modifier le frais' : 'Nouveau frais'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Type de frais */}
          <div>
            <label className="block text-sm font-medium mb-1">Type de frais</label>
            <select
              value={formData.type_frais}
              onChange={(e) => setFormData({
                ...formData, 
                type_frais: e.target.value,
                classe_id: null // Reset classe lors du changement de type
              })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="mensualite">Mensualité</option>
              <option value="inscription">Inscription</option>
              <option value="fournitures">Fournitures</option>
              <option value="cantine">Cantine</option>
              <option value="transport">Transport</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Sélecteur de classe - obligatoire pour certains types */}
          {classeRequise && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Classe concernée <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.classe_id || ''}
                onChange={(e) => setFormData({...formData, classe_id: parseInt(e.target.value) || null})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Sélectionner une classe</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.niveau} {c.section}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Ce type de frais doit être associé à une classe spécifique
              </p>
            </div>
          )}

          {/* Message si type universel */}
          {!classeRequise && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Ce frais sera disponible pour tous les élèves, quelle que soit leur classe.
              </p>
            </div>
          )}

          {/* Désignation */}
          <div>
            <label className="block text-sm font-medium mb-1">Désignation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({...formData, designation: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder={
                formData.type_frais === 'mensualite' 
                  ? 'Ex: Mensualité 6ème' 
                  : 'Ex: Cantine'
              }
              required
            />
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium mb-1">Montant (FCFA)</label>
            <input
              type="number"
              value={formData.montant}
              onChange={(e) => setFormData({...formData, montant: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
              step="100"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description (optionnel)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Informations complémentaires..."
            />
          </div>

          {/* Obligatoire */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.obligatoire}
              onChange={(e) => setFormData({...formData, obligatoire: e.target.checked})}
              id="obligatoire"
              className="w-4 h-4 text-purple-600"
            />
            <label htmlFor="obligatoire" className="text-sm">Frais obligatoire</label>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
