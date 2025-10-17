'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Eye, Loader2 } from 'lucide-react'
import { generateRecuPDF, downloadPDF } from '@/lib/pdf-utils'
import RecuPDFTemplate from './RecuPDFTemplate'

interface RecuPDFModalProps {
  recu: {
    id: number
    numero_recu: string
    date_emission: string
    montant_recu: number
    mode_paiement: string
    statut: string
    notes?: string
    paiements?: {
      id: number
      facture_id: number
      reference_paiement?: string
      factures?: {
        numero_facture: string
        eleves?: {
          nom: string
          prenom: string
          matricule: string
          classes?: {
            nom_complet: string
          }
        }
      }
    }
  }
  ecole?: {
    nom: string
    adresse?: string
    telephone?: string
    email?: string
    logo_url?: string
  }
  isOpen: boolean
  onClose: () => void
}

export default function RecuPDFModal({ recu, ecole, isOpen, onClose }: RecuPDFModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Générer le PDF dès l'ouverture du modal
  useEffect(() => {
    if (isOpen && recu) {
      generatePDFPreview()
    }
    
    return () => {
      // Nettoyer l'URL blob quand le modal se ferme
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }
    }
  }, [isOpen, recu])

  const generatePDFPreview = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      console.log('🧾 Génération preview PDF reçu:', recu.numero_recu)
      const pdfBlob = await generateRecuPDF(recu, ecole)
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
    } catch (error: any) {
      console.error('Erreur génération preview PDF reçu:', error)
      setError(error.message || 'Erreur lors de la génération du PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!pdfUrl) {
      await generatePDFPreview()
      return
    }

    try {
      // Télécharger le PDF déjà généré
      const response = await fetch(pdfUrl)
      const blob = await response.blob()
      const filename = `${recu.numero_recu.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      
      await downloadPDF(blob, filename)
      console.log('✅ PDF reçu téléchargé:', filename)
    } catch (error: any) {
      console.error('Erreur téléchargement PDF reçu:', error)
      setError('Erreur lors du téléchargement')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 bg-opacity-30 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Prévisualisation du reçu</h3>
                <p className="text-purple-100 text-sm">
                  {recu.numero_recu} • {recu.montant_recu.toLocaleString()} FCFA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                disabled={isGenerating}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border border-opacity-30"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Télécharger
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-white hover:bg-purple-500 hover:bg-opacity-30 rounded-lg h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <X className="w-5 h-5" />
                <span className="font-medium">Erreur de génération PDF</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Button 
                onClick={generatePDFPreview}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Réessayer
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Génération du reçu PDF...
                </h3>
                <p className="text-gray-600">
                  Création du document officiel pour {recu.numero_recu}
                </p>
              </div>
            </div>
          )}

          {!isGenerating && !error && pdfUrl && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Prévisualisation PDF intégrée */}
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px] border-0"
                  title={`Prévisualisation ${recu.numero_recu}`}
                />
              </div>
            </div>
          )}

          {!isGenerating && !error && !pdfUrl && (
            <div className="p-12">
              {/* Fallback: Affichage du template React */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="transform scale-75 origin-top">
                  <RecuPDFTemplate recu={recu} ecole={ecole} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Reçu officiel</span> • 
              Généré le {new Date().toLocaleDateString('fr-FR')}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}





