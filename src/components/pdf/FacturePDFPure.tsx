'use client'

import React from 'react'
import { FactureComplet } from '@/lib/supabase-functions'

interface FacturePDFPureProps {
  facture: FactureComplet
  ecole: {
    nom: string
    adresse?: string
    telephone?: string
    email?: string
  }
}

export default function FacturePDFPure({ facture, ecole }: FacturePDFPureProps) {
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

  // Styles CSS purs
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4',
      color: '#333333',
      backgroundColor: '#ffffff',
      padding: '32px',
      width: '800px',
      margin: '0 auto',
      minHeight: '1000px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '32px',
      paddingBottom: '24px',
      borderBottom: '2px solid #2563eb'
    },
    schoolInfo: {
      flex: 1
    },
    schoolName: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#2563eb',
      margin: '0 0 8px 0'
    },
    schoolDetails: {
      color: '#6b7280',
      lineHeight: '1.6'
    },
    invoiceInfo: {
      textAlign: 'right' as const
    },
    invoiceBadge: {
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '8px',
      display: 'inline-block',
      marginBottom: '8px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '12px',
      borderBottom: '1px solid #d1d5db',
      paddingBottom: '4px',
      margin: '0 0 12px 0'
    },
    studentCard: {
      backgroundColor: '#f9fafb',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '32px'
    },
    studentName: {
      fontWeight: '600',
      fontSize: '18px',
      color: '#111827',
      marginBottom: '4px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      border: '1px solid #d1d5db',
      marginBottom: '32px'
    },
    tableHeader: {
      backgroundColor: '#eff6ff',
      border: '1px solid #d1d5db',
      padding: '12px',
      fontWeight: '600',
      color: '#374151'
    },
    tableCell: {
      border: '1px solid #d1d5db',
      padding: '12px'
    },
    totalRow: {
      backgroundColor: '#2563eb',
      color: 'white'
    },
    paymentGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      marginBottom: '32px'
    },
    paymentCard: {
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #fde047'
    },
    footer: {
      marginTop: '48px',
      paddingTop: '24px',
      borderTop: '1px solid #d1d5db',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end'
    },
    signatureBox: {
      border: '1px solid #d1d5db',
      width: '192px',
      height: '64px',
      borderRadius: '4px',
      backgroundColor: '#f9fafb'
    }
  }

  return (
    <div id="facture-pdf-content" style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <div style={styles.schoolInfo}>
          <h1 style={styles.schoolName}>{ecole.nom}</h1>
          <div style={styles.schoolDetails}>
            {ecole.adresse && <div style={{ marginBottom: '4px' }}>{ecole.adresse}</div>}
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              {ecole.telephone && <span>Tél: {ecole.telephone}</span>}
              {ecole.email && <span>Email: {ecole.email}</span>}
            </div>
          </div>
        </div>
        
        <div style={styles.invoiceInfo}>
          <div style={styles.invoiceBadge}>
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
      <div>
        <h2 style={styles.sectionTitle}>FACTURÉ À</h2>
        <div style={styles.studentCard}>
          <div style={styles.studentName}>
            {facture.eleve?.prenom} {facture.eleve?.nom}
          </div>
          <div style={{ color: '#6b7280', lineHeight: '1.6' }}>
            <div>Matricule: {facture.eleve?.matricule}</div>
            <div>Classe: {facture.eleve?.classes?.nom_complet}</div>
          </div>
        </div>
      </div>

      {/* Détails de la facture */}
      <div>
        <h2 style={styles.sectionTitle}>DÉTAIL DES FRAIS</h2>
        
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.tableHeader, textAlign: 'left' }}>DÉSIGNATION</th>
              <th style={{ ...styles.tableHeader, textAlign: 'center', width: '80px' }}>QTÉ</th>
              <th style={{ ...styles.tableHeader, textAlign: 'right', width: '120px' }}>TARIF</th>
              <th style={{ ...styles.tableHeader, textAlign: 'right', width: '120px' }}>MONTANT</th>
            </tr>
          </thead>
          <tbody>
            {facture.facture_lignes && facture.facture_lignes.length > 0 ? (
              facture.facture_lignes.map((detail, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={styles.tableCell}>
                    <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                      {detail.designation || 'Frais non spécifié'}
                    </div>
                    {detail.type_frais?.nom && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Frais de {detail.type_frais.nom.toLowerCase()}
                      </div>
                    )}
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                    {detail.quantite || 1}
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: 'right' }}>
                    {formatCurrency(detail.tarif)}
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '500' }}>
                    {formatCurrency(detail.montant)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: '500', marginBottom: '2px' }}>Frais scolaires</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Détails non disponibles</div>
                </td>
                <td style={{ ...styles.tableCell, textAlign: 'center' }}>1</td>
                <td style={{ ...styles.tableCell, textAlign: 'right' }}>
                  {formatCurrency(facture.montant_total)}
                </td>
                <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '500' }}>
                  {formatCurrency(facture.montant_total)}
                </td>
              </tr>
            )}
            
            {/* Ligne de total */}
            <tr style={styles.totalRow}>
              <td style={{ 
                ...styles.tableCell, 
                border: '1px solid #2563eb',
                fontWeight: 'bold',
                textAlign: 'left'
              }} colSpan={3}>
                TOTAL À PAYER
              </td>
              <td style={{ 
                ...styles.tableCell,
                border: '1px solid #2563eb',
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
      <div>
        <h2 style={styles.sectionTitle}>INFORMATIONS DE PAIEMENT</h2>
        
        <div style={styles.paymentGrid}>
          <div style={{ 
            ...styles.paymentCard,
            backgroundColor: '#fefce8',
            borderColor: '#fde047'
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
            ...styles.paymentCard,
            backgroundColor: '#eff6ff',
            borderColor: '#3b82f6'
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
          <h2 style={styles.sectionTitle}>NOTES</h2>
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
      <div style={styles.footer}>
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
          <div style={styles.signatureBox}></div>
        </div>
      </div>
    </div>
  )
}






