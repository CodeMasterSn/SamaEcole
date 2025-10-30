'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  X, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  FileText,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FactureComplet } from '@/lib/supabase-functions'

interface ModalEnregistrerPaiementProps {
  facture: FactureComplet
  isOpen: boolean
  onClose: () => void
  onPaiementEnregistre: () => void
}

type ModePaiement = 'especes' | 'mobile_money' | 'virement' | 'cheque'

interface PaiementData {
  modePaiement: ModePaiement
  montant: number
  referencePaiement: string
  datePaiement: string
  recuPar: string
  notes: string
}

export default function ModalEnregistrerPaiement({ 
  facture, 
  isOpen, 
  onClose, 
  onPaiementEnregistre 
}: ModalEnregistrerPaiementProps) {
  const [paiement, setPaiement] = useState<PaiementData>({
    modePaiement: 'especes',
    montant: facture.montant_total,
    referencePaiement: '',
    datePaiement: new Date().toISOString().split('T')[0],
    recuPar: '',
    notes: ''
  })
  
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const afficherMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paiement.montant <= 0) {
      afficherMessage('error', 'Le montant doit être supérieur à 0')
      return
    }

    if (paiement.montant > facture.montant_total) {
      afficherMessage('error', 'Le montant ne peut pas dépasser le total de la facture')
      return
    }

    setSaving(true)
    try {
      // TODO: Implémenter l'enregistrement du paiement
      console.log('Enregistrement paiement:', paiement)
      
      // Simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      afficherMessage('success', 'Paiement enregistré avec succès!')
      
      // Fermer le modal après succès
      setTimeout(() => {
        onPaiementEnregistre()
        onClose()
      }, 1500)
      
    } catch (error: any) {
      console.error('Erreur enregistrement paiement:', error)
      afficherMessage('error', `Erreur: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getModeIcon = (mode: ModePaiement) => {
    switch (mode) {
      case 'especes': return DollarSign
      case 'mobile_money': return Smartphone
      case 'virement': return CreditCard
      case 'cheque': return FileText
      default: return CreditCard
    }
  }

  const getModeLabel = (mode: ModePaiement) => {
    switch (mode) {
      case 'especes': return 'Espèces'
      case 'mobile_money': return 'Mobile Money'
      case 'virement': return 'Virement bancaire'
      case 'cheque': return 'Chèque'
      default: return mode
    }
  }

  const getModeColor = (mode: ModePaiement) => {
    switch (mode) {
      case 'especes': return 'text-green-600 bg-green-50 border-green-200'
      case 'mobile_money': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'virement': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'cheque': return 'text-purple-600 bg-purple-50 border-purple-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 bg-opacity-30 rounded-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Enregistrer un paiement</h3>
                <p className="text-green-100 text-sm">
                  Facture {facture.numero_facture}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-green-500 hover:bg-opacity-30 rounded-lg h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Message de statut */}
          {message.text && (
            <Card className={`border-l-4 mb-6 ${
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

          {/* Informations de la facture */}
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {facture.eleve ? 
                      `${facture.eleve.prenom.charAt(0)}${facture.eleve.nom.charAt(0)}` : 
                      '??'
                    }
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {facture.eleve ? 
                        `${facture.eleve.prenom} ${facture.eleve.nom}` : 
                        'Élève inconnu'
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {facture.eleve?.matricule || 'Matricule non disponible'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Montant total</div>
                  <div className="font-bold text-lg text-gray-900">
                    {facture.montant_total.toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire de paiement */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode de paiement */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Mode de paiement *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {(['especes', 'mobile_money'] as ModePaiement[]).map((mode) => {
                  const Icon = getModeIcon(mode)
                  const isSelected = paiement.modePaiement === mode
                  
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaiement(prev => ({ ...prev, modePaiement: mode }))}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-2",
                        isSelected 
                          ? getModeColor(mode) + " border-2"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{getModeLabel(mode)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Montant et référence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="montant" className="text-sm font-medium text-gray-700">
                  Montant payé *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="montant"
                    type="number"
                    value={paiement.montant}
                    onChange={(e) => setPaiement(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))}
                    className="pl-10"
                    placeholder="0"
                    min="0"
                    max={facture.montant_total}
                    required
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Maximum: {facture.montant_total.toLocaleString()} FCFA
                </div>
              </div>

              <div>
                <Label htmlFor="reference" className="text-sm font-medium text-gray-700">
                  Référence paiement
                </Label>
                <Input
                  id="reference"
                  type="text"
                  value={paiement.referencePaiement}
                  onChange={(e) => setPaiement(prev => ({ ...prev, referencePaiement: e.target.value }))}
                  placeholder="Ex: TRANS123456789"
                  className="font-mono text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Numéro de transaction ou référence
                </div>
              </div>
            </div>

            {/* Date et reçu par */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Date du paiement *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="date"
                    type="date"
                    value={paiement.datePaiement}
                    onChange={(e) => setPaiement(prev => ({ ...prev, datePaiement: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recuPar" className="text-sm font-medium text-gray-700">
                  Reçu par *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="recuPar"
                    type="text"
                    value={paiement.recuPar}
                    onChange={(e) => setPaiement(prev => ({ ...prev, recuPar: e.target.value }))}
                    className="pl-10"
                    placeholder="Nom du comptable"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes additionnelles
              </Label>
              <textarea
                id="notes"
                rows={3}
                value={paiement.notes}
                onChange={(e) => setPaiement(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                placeholder="Commentaires sur le paiement..."
              />
              <div className="text-xs text-gray-500 mt-1">
                Informations complémentaires sur le paiement
              </div>
            </div>

            {/* Footer avec actions */}
            <div className="flex justify-between items-center gap-4 pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                * Champs obligatoires
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="gap-2"
                  disabled={saving}
                >
                  <X className="w-4 h-4" />
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={saving}
                  className="gap-2 bg-gradient-to-r from-green-600 to-green-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Enregistrer le paiement
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
