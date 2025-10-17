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

export default function FacturePDFTemplateSimple({ facture, ecole }: FacturePDFTemplateProps) {
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
        color: '#333333',
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
            margin: '0 0 8px 0'
          }}>
            {ecole.nom}
          </h1>
          <div style={{ color: '#6b7280', lineHeight: '1.6' }}>
            {ecole.adresse && <div style={{ marginBottom: '4px' }}>{ecole.adresse}</div>}
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
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#374151', 
          marginBottom: '12px', 
          borderBottom: '1px solid #d1d5db', 
          paddingBottom: '4px',
          margin: '0 0 12px 0'
        }}>
          FACTURÉ À
        </h2>
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '18px', 
            color: '#111827',
            marginBottom: '4px'
          }}>
            {facture.eleve?.prenom} {facture.eleve?.nom}
          </div>
          <div style={{ color: '#6b7280', lineHeight: '1.6' }}>
            <div>Matricule: {facture.eleve?.matricule}</div>
            <div>Classe: {facture.eleve?.classes?.nom_complet}</div>
          </div>
        </div>
      </div>

      {/* Détails de la facture */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#374151', 
          marginBottom: '12px', 
          borderBottom: '1px solid #d1d5db', 
          paddingBottom: '4px',
          margin: '0 0 12px 0'
        }}>
          DÉTAIL DES FRAIS
        </h2>
        
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          border: '1px solid #d1d5db'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#eff6ff' }}>
              <th style={{ 
                border: '1px solid #d1d5db', 
                padding: '12px', 
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#374151'
              }}>
                DÉSIGNATION
              </th>
              <th style={{ 
                border: '1px solid #d1d5db', 
                padding: '12px', 
                textAlign: 'center', 
                fontWeight: '600', 
                color: '#374151',
                width: '80px'
              }}>
                QTÉ
              </th>
              <th style={{ 
                border: '1px solid #d1d5db', 
                padding: '12px', 
                textAlign: 'right', 
                fontWeight: '600', 
                color: '#374151',
                width: '120px'
              }}>
                TARIF
              </th>
              <th style={{ 
                border: '1px solid #d1d5db', 
                padding: '12px', 
                textAlign: 'right', 
                fontWeight: '600', 
                color: '#374151',
                width: '120px'
              }}>
                MONTANT
              </th>
            </tr>
          </thead>
          <tbody>
            {facture.details && facture.details.length > 0 ? (
              facture.details.map((detail, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ border: '1px solid #d1d5db', padding: '12px' }}>
                    <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                      {detail.type_frais?.nom || 'Frais non spécifié'}
                    </div>
                    {detail.type_frais?.nom && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Frais de {detail.type_frais.nom.toLowerCase()}
                      </div>
                    )}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'center' }}>
                    {detail.quantite || 1}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'right' }}>
                    {formatCurrency(detail.montant)}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                    {formatCurrency(detail.montant * (detail.quantite || 1))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ border: '1px solid #d1d5db', padding: '12px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '2px' }}>Frais scolaires</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Détails non disponibles</div>
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'center' }}>1</td>
                <td style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'right' }}>
                  {formatCurrency(facture.montant_total)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                  {formatCurrency(facture.montant_total)}
                </td>
              </tr>
            )}
            
            {/* Ligne de total */}
            <tr style={{ backgroundColor: '#2563eb', color: 'white' }}>
              <td style={{ 
                border: '1px solid #2563eb', 
                padding: '12px', 
                fontWeight: 'bold',
                textAlign: 'left'
              }} colSpan={3}>
                TOTAL À PAYER
              </td>
              <td style={{ 
                border: '1px solid #2563eb', 
                padding: '12px', 
                textAlign: 'right', 
                fontWeight: 'bold', 
                fontSize: '18px' 
              }}>
                {formatCurrency(facture.montant_total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Informations de paiement */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#374151', 
          marginBottom: '12px', 
          borderBottom: '1px solid #d1d5db', 
          paddingBottom: '4px',
          margin: '0 0 12px 0'
        }}>
          INFORMATIONS DE PAIEMENT
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ 
            backgroundColor: '#fefce8', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #fde047'
          }}>
            <h3 style={{ 
              fontWeight: '600', 
              color: '#a16207', 
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              Modes de paiement acceptés
            </h3>
            <div style={{ color: '#a16207', lineHeight: '1.6' }}>
              <div>• Espèces au secrétariat</div>
              <div>• Chèque à l'ordre de "{ecole.nom}"</div>
              <div>• Virement bancaire</div>
              <div>• Mobile Money (Orange Money, Wave)</div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#eff6ff', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #3b82f6'
          }}>
            <h3 style={{ 
              fontWeight: '600', 
              color: '#1e40af', 
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              Informations importantes
            </h3>
            <div style={{ color: '#1e40af', lineHeight: '1.6' }}>
              <div>• Paiement avant le {facture.date_echeance ? formatDate(facture.date_echeance) : '30/12/2025'}</div>
              <div>• Conserver ce document</div>
              <div>• Présenter lors du paiement</div>
              <div>• Reçu délivré après paiement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes additionnelles */}
      {facture.notes && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '12px', 
            borderBottom: '1px solid #d1d5db', 
            paddingBottom: '4px',
            margin: '0 0 12px 0'
          }}>
            NOTES
          </h2>
          <div style={{ 
            backgroundColor: '#f9fafb', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ color: '#374151', margin: 0 }}>{facture.notes}</p>
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div style={{ 
        marginTop: '48px', 
        paddingTop: '24px', 
        borderTop: '1px solid #d1d5db',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
      }}>
        <div style={{ color: '#6b7280' }}>
          <div style={{ fontSize: '12px' }}>
            Document généré le {formatDate(new Date().toISOString())}
          </div>
          <div style={{ fontSize: '10px', marginTop: '4px' }}>
            Sama École - Système de gestion scolaire
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#6b7280', marginBottom: '8px', fontSize: '12px' }}>
            Signature et cachet de l'école
          </div>
          <div style={{ 
            border: '1px solid #d1d5db', 
            width: '192px', 
            height: '64px', 
            borderRadius: '4px',
            backgroundColor: '#f9fafb'
          }}></div>
        </div>
      </div>
    </div>
  )
}






