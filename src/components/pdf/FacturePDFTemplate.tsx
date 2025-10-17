'use client'

import React from 'react'
import { FactureComplet } from '@/lib/supabase-functions'

interface FacturePDFTemplateProps {
  facture: FactureComplet
  ecole: {
    nom: string
    adresse?: string
    telephone?: string
    email?: string
  }
}

export default function FacturePDFTemplate({ facture, ecole }: FacturePDFTemplateProps) {
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div 
      id="facture-pdf-content" 
      style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#333',
        backgroundColor: '#ffffff',
        padding: '32px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '1000px'
      }}
    >
      {/* En-tête */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '32px', 
        paddingBottom: '24px', 
        borderBottom: '2px solid #2563eb' 
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#2563eb', 
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            {ecole.nom}
          </h1>
          <div style={{ color: '#6b7280', lineHeight: '1.6' }}>
            {ecole.adresse && <div>{ecole.adresse}</div>}
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              {ecole.telephone && <span>Tél: {ecole.telephone}</span>}
              {ecole.email && <span>Email: {ecole.email}</span>}
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            backgroundColor: '#2563eb', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            display: 'inline-block', 
            marginBottom: '8px' 
          }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>FACTURE</span>
          </div>
          <div style={{ color: '#6b7280', lineHeight: '1.6' }}>
            <div>N° {facture.numero_facture}</div>
            <div>Date: {formatDate(facture.date_emission)}</div>
            {facture.date_echeance && (
              <div>Échéance: {formatDate(facture.date_echeance)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Informations élève */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
          FACTURÉ À
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="font-semibold text-lg text-gray-900">
            {facture.eleve?.prenom} {facture.eleve?.nom}
          </div>
          <div className="text-gray-600 mt-1">
            <div>Matricule: {facture.eleve?.matricule}</div>
            <div>Classe: {facture.eleve?.classes?.nom_complet}</div>
          </div>
        </div>
      </div>

      {/* Détails de la facture */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
          DÉTAIL DES FRAIS
        </h2>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-gray-300 p-3 text-left font-semibold text-gray-800">
                DÉSIGNATION
              </th>
              <th className="border border-gray-300 p-3 text-center font-semibold text-gray-800 w-20">
                QTÉ
              </th>
              <th className="border border-gray-300 p-3 text-right font-semibold text-gray-800 w-32">
                TARIF
              </th>
              <th className="border border-gray-300 p-3 text-right font-semibold text-gray-800 w-32">
                MONTANT
              </th>
            </tr>
          </thead>
          <tbody>
            {facture.details && facture.details.length > 0 ? (
              facture.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">
                    <div className="font-medium">{detail.type_frais?.nom || 'Frais non spécifié'}</div>
                    {detail.type_frais?.nom && (
                      <div className="text-sm text-gray-600">
                        Frais de {detail.type_frais.nom.toLowerCase()}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    {detail.quantite || 1}
                  </td>
                  <td className="border border-gray-300 p-3 text-right">
                    {formatCurrency(detail.montant)}
                  </td>
                  <td className="border border-gray-300 p-3 text-right font-medium">
                    {formatCurrency(detail.montant * (detail.quantite || 1))}
                  </td>
                </tr>
              ))
            ) : (
              // Si pas de détails, afficher une ligne générique
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3">
                  <div className="font-medium">Frais scolaires</div>
                  <div className="text-sm text-gray-600">Détails non disponibles</div>
                </td>
                <td className="border border-gray-300 p-3 text-center">1</td>
                <td className="border border-gray-300 p-3 text-right">
                  {formatCurrency(facture.montant_total)}
                </td>
                <td className="border border-gray-300 p-3 text-right font-medium">
                  {formatCurrency(facture.montant_total)}
                </td>
              </tr>
            )}
            
            {/* Ligne de total */}
            <tr className="bg-blue-600 text-white">
              <td className="border border-blue-600 p-3 font-bold text-left" colSpan={3}>
                TOTAL À PAYER
              </td>
              <td className="border border-blue-600 p-3 text-right font-bold text-lg">
                {formatCurrency(facture.montant_total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Informations de paiement */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
          INFORMATIONS DE PAIEMENT
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">Modes de paiement acceptés</h3>
            <ul className="text-yellow-700 space-y-1">
              <li>• Espèces au secrétariat</li>
              <li>• Chèque à l'ordre de "{ecole.nom}"</li>
              <li>• Virement bancaire</li>
              <li>• Mobile Money (Orange Money, Wave)</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Informations importantes</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Paiement avant le {facture.date_echeance ? formatDate(facture.date_echeance) : '30/12/2025'}</li>
              <li>• Conserver ce document</li>
              <li>• Présenter lors du paiement</li>
              <li>• Reçu délivré après paiement</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notes additionnelles */}
      {facture.notes && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
            NOTES
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">{facture.notes}</p>
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div className="mt-12 pt-6 border-t border-gray-300">
        <div className="flex justify-between items-end">
          <div className="text-gray-600">
            <div className="text-sm">Document généré le {formatDate(new Date().toISOString())}</div>
            <div className="text-xs mt-1">Sama École - Système de gestion scolaire</div>
          </div>
          
          <div className="text-right">
            <div className="text-gray-600 mb-2">Signature et cachet de l'école</div>
            <div className="border border-gray-300 w-48 h-16 rounded"></div>
          </div>
        </div>
      </div>

      {/* Styles pour l'impression */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          #facture-pdf-content {
            box-shadow: none;
            margin: 0;
            padding: 20px;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
