-- Création de la table recus pour Sama École
-- Version corrigée

-- Supprimer la table si elle existe déjà (pour recommencer proprement)
DROP TABLE IF EXISTS recus CASCADE;

-- Créer la table recus avec la bonne structure
CREATE TABLE recus (
  id BIGSERIAL PRIMARY KEY,
  paiement_id BIGINT NOT NULL,
  numero_recu VARCHAR(50) NOT NULL,
  date_emission DATE NOT NULL,
  montant_recu DECIMAL(10,2) NOT NULL,
  mode_paiement VARCHAR(20) NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'emis',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les contraintes après la création
ALTER TABLE recus 
ADD CONSTRAINT fk_recus_paiement 
FOREIGN KEY (paiement_id) REFERENCES paiements(id) ON DELETE CASCADE;

ALTER TABLE recus 
ADD CONSTRAINT check_montant_recu_positif 
CHECK (montant_recu > 0);

ALTER TABLE recus 
ADD CONSTRAINT check_mode_paiement_recu 
CHECK (mode_paiement IN ('especes', 'cheque', 'virement', 'mobile_money'));

ALTER TABLE recus 
ADD CONSTRAINT check_statut_recu 
CHECK (statut IN ('emis', 'envoye', 'whatsapp', 'imprime'));

-- Ajouter la contrainte unique sur numero_recu
ALTER TABLE recus 
ADD CONSTRAINT unique_numero_recu 
UNIQUE (numero_recu);

-- Créer les index pour optimiser les performances
CREATE INDEX idx_recus_paiement_id ON recus(paiement_id);
CREATE INDEX idx_recus_numero ON recus(numero_recu);
CREATE INDEX idx_recus_date ON recus(date_emission);
CREATE INDEX idx_recus_statut ON recus(statut);
CREATE INDEX idx_recus_mode ON recus(mode_paiement);

-- Désactiver RLS pour le développement
ALTER TABLE recus DISABLE ROW LEVEL SECURITY;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_recus_updated_at
    BEFORE UPDATE ON recus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vérification de la création
SELECT 'Table recus créée avec succès!' as message;

-- Vérifier la structure créée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'recus' 
ORDER BY ordinal_position;