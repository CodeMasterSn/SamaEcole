-- Création de la table paiements pour Sama École
-- À exécuter dans Supabase SQL Editor

-- Créer la table paiements si elle n'existe pas
CREATE TABLE IF NOT EXISTS paiements (
  id BIGSERIAL PRIMARY KEY,
  facture_id BIGINT NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  montant_paye DECIMAL(10,2) NOT NULL CHECK (montant_paye > 0),
  date_paiement DATE NOT NULL,
  mode_paiement VARCHAR(20) NOT NULL CHECK (mode_paiement IN ('especes', 'cheque', 'virement', 'mobile_money')),
  reference_paiement VARCHAR(100), -- Numéro de chèque, référence virement, etc.
  notes TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'complet' CHECK (statut IN ('complet', 'partiel', 'en_attente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_paiements_facture_id ON paiements(facture_id);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(date_paiement);
CREATE INDEX IF NOT EXISTS idx_paiements_mode ON paiements(mode_paiement);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut);

-- Ajouter une contrainte unique pour éviter les doublons de références
CREATE UNIQUE INDEX IF NOT EXISTS idx_paiements_reference_unique 
ON paiements(reference_paiement) 
WHERE reference_paiement IS NOT NULL;

-- Désactiver RLS pour le développement (à activer plus tard avec l'authentification)
ALTER TABLE paiements DISABLE ROW LEVEL SECURITY;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_paiements_updated_at ON paiements;
CREATE TRIGGER update_paiements_updated_at
    BEFORE UPDATE ON paiements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vérification de la création
SELECT 'Table paiements créée avec succès!' as message;

-- Afficher la structure de la table
\d paiements;






