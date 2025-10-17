'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Download, 
  Eye, 
  Loader2, 
  FileText,
  Printer,
  Share
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FactureComplet } from '@/lib/supabase-functions'
import FacturePDFPure from './FacturePDFPure'
import { generateFacturePDF, previewPDF, downloadPDF } from '@/lib/pdf-utils'

interface FacturePDFModalProps {
  facture: FactureComplet
  ecole: {
    nom: string
    adresse?: string
    telephone?: string
    email?: string
  }
  isOpen: boolean
  onClose: () => void
}

export default function FacturePDFModal({ facture, ecole, isOpen, onClose }: FacturePDFModalProps) {
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const afficherMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleDownload = async () => {
    setGenerating(true)
    try {
      console.log('🔍 Génération PDF pour facture:', facture.numero_facture)
      console.log('📊 Données facture:', facture)
      console.log('🏫 Données école:', ecole)
      
      const result = await generateFacturePDF(facture, ecole, { download: true })
      
      if (result.success) {
        afficherMessage('success', 'PDF téléchargé avec succès!')
      } else {
        console.error('❌ Erreur génération PDF:', result.error)
        throw new Error(result.error || 'Erreur inconnue lors de la génération PDF')
      }
    } catch (error: any) {
      console.error('❌ Exception génération PDF:', error)
      afficherMessage('error', `Erreur PDF: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handlePreview = async () => {
    setGenerating(true)
    try {
      const result = await generateFacturePDF(facture, ecole, { preview: true })
      
      if (result.success) {
        afficherMessage('success', 'PDF ouvert dans un nouvel onglet')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      afficherMessage('error', `Erreur: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header du modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Aperçu de la facture
              </h2>
              <p className="text-gray-600">
                {facture.numero_facture} • {facture.eleve?.prenom} {facture.eleve?.nom}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {message.text && (
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              )}>
                {message.text}
              </div>
            )}
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={generating}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </Button>
            
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={generating}
            >
              Fermer
            </Button>
            
            <Button
              onClick={handleDownload}
              disabled={generating}
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {generating ? 'Génération...' : 'Télécharger PDF'}
            </Button>
          </div>
        </div>

        {/* Contenu de la facture */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="bg-white rounded-lg shadow-lg">
            <FacturePDFPure facture={facture} ecole={ecole} />
          </div>
        </div>
      </div>
    </div>
  )
}
