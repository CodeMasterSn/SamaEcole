'use client'

import React from 'react'

interface RecuPDFTemplateProps {
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
}

export default function RecuPDFTemplate({ recu, ecole }: RecuPDFTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatMontant = (montant: number) => {
    return montant.toLocaleString('fr-FR') + ' FCFA'
  }

  const getModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'virement': 'Virement bancaire',
      'mobile_money': 'Mobile Money'
    }
    return modes[mode] || mode
  }

  return (
    <div style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      margin: '0 auto',
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      lineHeight: '1.4',
      color: '#000'
    }}>
      {/* En-tête avec logo et informations école */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '3px solid #7c3aed'
      }}>
        <div style={{ flex: 1 }}>
          {ecole?.logo_url && (
            <img 
              src={ecole.logo_url} 
              alt="Logo école"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                marginBottom: '10px'
              }}
            />
          )}
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#7c3aed',
            marginBottom: '5px'
          }}>
            {ecole?.nom || 'SAMA ÉCOLE'}
          </div>
          {ecole?.adresse && (
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
              📍 {ecole.adresse}
            </div>
          )}
          {ecole?.telephone && (
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
              📞 {ecole.telephone}
            </div>
          )}
          {ecole?.email && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              ✉️ {ecole.email}
            </div>
          )}
        </div>
        
        <div style={{
          textAlign: 'right',
          backgroundColor: '#f8fafc',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#7c3aed',
            marginBottom: '5px'
          }}>
            REÇU
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            {recu.numero_recu}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Date: {formatDate(recu.date_emission)}
          </div>
        </div>
      </div>

      {/* Informations élève */}
      <div style={{
        backgroundColor: '#f1f5f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '25px',
        border: '1px solid #cbd5e1'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#334155',
          marginBottom: '15px',
          borderBottom: '1px solid #cbd5e1',
          paddingBottom: '8px'
        }}>
          👨‍🎓 INFORMATIONS ÉLÈVE
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#475569' }}>Nom complet:</span>
              <br />
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {recu.paiements?.factures?.eleves ? 
                  `${recu.paiements.factures.eleves.prenom} ${recu.paiements.factures.eleves.nom}` : 
                  'Non spécifié'
                }
              </span>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#475569' }}>Matricule:</span>
              <br />
              <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                {recu.paiements?.factures?.eleves?.matricule || 'Non spécifié'}
              </span>
            </div>
          </div>
          
          <div style={{ flex: 1, marginLeft: '20px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#475569' }}>Classe:</span>
              <br />
              <span>
                {recu.paiements?.factures?.eleves?.classes?.nom_complet || 'Non spécifiée'}
              </span>
            </div>
            
            <div>
              <span style={{ fontWeight: 'bold', color: '#475569' }}>Facture associée:</span>
              <br />
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#3b82f6' }}>
                {recu.paiements?.factures?.numero_facture || `#${recu.paiements?.facture_id}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Détails du reçu */}
      <div style={{
        border: '2px solid #7c3aed',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '25px'
      }}>
        <div style={{
          backgroundColor: '#7c3aed',
          color: 'white',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          💰 DÉTAILS DU PAIEMENT REÇU
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                Mode de paiement
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {getModeLabel(recu.mode_paiement)}
              </div>
            </div>
            
            {recu.paiements?.reference_paiement && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                  Référence
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  fontFamily: 'monospace',
                  backgroundColor: '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1'
                }}>
                  {recu.paiements.reference_paiement}
                </div>
              </div>
            )}
          </div>
          
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '5px' }}>
              MONTANT REÇU
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#92400e'
            }}>
              {formatMontant(recu.montant_recu)}
            </div>
          </div>
        </div>
      </div>

      {/* Notes si présentes */}
      {recu.notes && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '15px',
          marginBottom: '25px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#475569',
            marginBottom: '8px'
          }}>
            📝 Notes:
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
            "{recu.notes}"
          </div>
        </div>
      )}

      {/* Pied de page avec signatures */}
      <div style={{ marginTop: '40px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '50px'
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              borderBottom: '1px solid #000',
              width: '150px',
              height: '50px',
              margin: '0 auto 10px'
            }}></div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
              Signature de l'élève/Parent
            </div>
          </div>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              borderBottom: '1px solid #000',
              width: '150px',
              height: '50px',
              margin: '0 auto 10px'
            }}></div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
              Cachet et signature de l'école
            </div>
          </div>
        </div>
        
        {/* Informations légales */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '15px',
          textAlign: 'center',
          fontSize: '10px',
          color: '#64748b'
        }}>
          <div style={{ marginBottom: '5px' }}>
            Ce reçu certifie le paiement des frais scolaires mentionnés ci-dessus.
          </div>
          <div>
            Généré automatiquement le {new Date().toLocaleDateString('fr-FR')} par le système SAMA ÉCOLE
          </div>
        </div>
      </div>
    </div>
  )
}





