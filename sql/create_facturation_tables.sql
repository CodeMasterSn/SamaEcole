-- =================== TABLES POUR LE MODULE DE FACTURATION ===================

-- 1. Table des templates de factures
CREATE TABLE IF NOT EXISTS templates_factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id INTEGER NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  frequence VARCHAR(50) NOT NULL CHECK (frequence IN ('mensuel', 'annuel', 'occasionnel')),
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_templates_factures_ecole_id ON templates_factures(ecole_id);
CREATE INDEX IF NOT EXISTS idx_templates_factures_actif ON templates_factures(actif);

-- 2. Table des frais prédefinis associés aux templates
CREATE TABLE IF NOT EXISTS frais_predefinis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates_factures(id) ON DELETE CASCADE,
  ecole_id INTEGER NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  classe_niveau VARCHAR(50), -- Filtrage par niveau de classe (optionnel)
  nom VARCHAR(255) NOT NULL,
  montant DECIMAL(10,2) NOT NULL CHECK (montant >= 0),
  obligatoire BOOLEAN NOT NULL DEFAULT true,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_frais_predefinis_template_id ON frais_predefinis(template_id);
CREATE INDEX IF NOT EXISTS idx_frais_predefinis_ecole_id ON frais_predefinis(ecole_id);
CREATE INDEX IF NOT EXISTS idx_frais_predefinis_classe_niveau ON frais_predefinis(classe_niveau);
CREATE INDEX IF NOT EXISTS idx_frais_predefinis_actif ON frais_predefinis(actif);

-- 3. Table des éléments de facture (détail des factures)
CREATE TABLE IF NOT EXISTS facture_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id INTEGER NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  montant DECIMAL(10,2) NOT NULL CHECK (montant >= 0),
  quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
  obligatoire BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_facture_elements_facture_id ON facture_elements(facture_id);

-- 4. Table des brouillons de facturation (pour sauvegarder les configurations)
CREATE TABLE IF NOT EXISTS brouillons_facturation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id INTEGER NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  nom VARCHAR(255),
  configurations JSON NOT NULL DEFAULT '{}',
  statut VARCHAR(50) NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'archive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_brouillons_facturation_ecole_id ON brouillons_facturation(ecole_id);
CREATE INDEX IF NOT EXISTS idx_brouillons_facturation_utilisateur_id ON brouillons_facturation(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_brouillons_facturation_statut ON brouillons_facturation(statut);

-- 5. Table des frais par classe (configuration spécifique par classe)
CREATE TABLE IF NOT EXISTS frais_par_classe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id INTEGER NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  classe_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  frais_predefini_id UUID REFERENCES frais_predefinis(id) ON DELETE CASCADE,
  montant_modifie DECIMAL(10,2), -- Pour permettre des montants spécifiques par classe
  obligatoire BOOLEAN NOT NULL DEFAULT true,
  actif BOOLEAN NOT NULL DEFAULT true,
  periode VARCHAR(50), -- Pour les frais saisonniers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons
  CONSTRAINT unique_frais_classe UNIQUE (classe_id, frais_predefini_id, periode)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_frais_par_classe_ecole_id ON frais_par_classe(ecole_id);
CREATE INDEX IF NOT EXISTS idx_frais_par_classe_classe_id ON frais_par_classe(classe_id);
CREATE INDEX IF NOT EXISTS idx_frais_par_classe_actif ON frais_par_classe(actif);

-- =================== POLITIQUES DE SÉCURITÉ (RLS) ===================

-- Activer RLS sur toutes les tables
ALTER TABLE templates_factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE frais_predefinis ENABLE ROW LEVEL SECURITY;
ALTER TABLE facture_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE brouillons_facturation ENABLE ROW LEVEL SECURITY;
ALTER TABLE frais_par_classe ENABLE ROW LEVEL SECURITY;

-- Politiques pour templates_factures
CREATE POLICY "Utilisateurs connectés peuvent voir les templates de leur école" 
  ON templates_factures FOR SELECT 
  TO authenticated 
  USING (
    ecole_id IN (
      SELECT classe.ecole_id 
      FROM classes 
      WHERE classe.id IN (
        SELECT ecole_id FROM eleves WHERE eleves.id = auth.uid()::text::integer
      )
    )
  );

CREATE POLICY "Admins peuvent modifier les templates de leur école" 
  ON templates_factures FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs 
      WHERE utilisateurs.id = auth.uid() 
      AND utilisateurs.role = 'admin'
      AND utilisateurs.ecole_id = templates_factures.ecole_id
    )
  );

-- Politiques pour frais_predefinis
CREATE POLICY "Utilisateurs connectés peuvent voir les frais de leur école" 
  ON frais_predefinis FOR SELECT 
  TO authenticated 
  USING (
    ecole_id IN (
      SELECT classe.ecole_id 
      FROM classes 
      WHERE classe.id IN (
        SELECT ecole_id FROM eleves WHERE eleves.id = auth.uid()::text::integer
      )
    )
  );

-- Politiques pour facture_elements (identique à factures)
CREATE POLICY "Utilisateurs connectés peuvent voir les éléments des factures de leur école" 
  ON facture_elements FOR SELECT 
  TO authenticated 
  USING (
    facture_id IN (
      SELECT factures.id 
      FROM factures 
      WHERE factures.ecole_id IN (
        SELECT classe.ecole_id 
        FROM classes 
        WHERE classe.id IN (
          SELECT ecole_id FROM eleves WHERE eleves.id = auth.uid()::text::integer
        )
      )
    )
  );

-- Politiques pour brouillons_facturation
CREATE POLICY "Utilisateurs peuvent gérer leurs propres brouillons" 
  ON brouillons_facturation FOR ALL 
  TO authenticated 
  USING (
    utilisateur_id = auth.uid()
  );

-- Politiques pour frais_par_classe
CREATE POLICY "Utilisateurs connectés peuvent voir les frais par classe de leur école" 
  ON frais_par_classe FOR SELECT 
  TO authenticated 
  USING (
    ecole_id IN (
      SELECT classe.ecole_id 
      FROM classes 
      WHERE classe.id IN (
        SELECT ecole_id FROM eleves WHERE eleves.id = auth.uid()::text::integer
      )
    )
  );

-- =================== DONNÉES D'EXEMPLE ===================

-- Templates par défaut pour l'école avec ecole_id = 1
INSERT INTO templates_factures (ecole_id, nom, description, frequence) VALUES
  (1, 'Mensualité Mensuelle', 'Facturation récurrente des frais de scolarité pour chaque mois', 'mensuel'),
  (1, 'Frais d''Inscription', 'Facturation des frais d''inscription annuels et des frais divers', 'annuel'),
  (1, 'Frais Cantine', 'Gestion des frais de restauration scolaire mensuelle', 'mensuel'),
  (1, 'Transport Scolaire', 'Facturation des frais de transport mensuels', 'mensuel');

-- Frais prédéfinis par défaut
INSERT INTO frais_predefinis (template_id, ecole_id, nom, montant, obligatoire) VALUES
  -- Mensualité Mensuelle
  ((SELECT id FROM templates_factures WHERE nom = 'Mensualité Mensuelle' AND ecole_id = 1), 1, 'Frais de scolarité', 25000.00, true),
  ((SELECT id FROM templates_factures WHERE nom = 'Mensualité Mensuelle' AND ecole_id = 1), 1, 'Frais d''examen', 5000.00, true),
  
  -- Frais d'Inscription
  ((SELECT id FROM templates_factures WHERE nom = 'Frais d''Inscription' AND ecole_id = 1), 1, 'Frais d''inscription', 50000.00, true),
  ((SELECT id FROM templates_factures WHERE nom = 'Frais d''Inscription' AND ecole_id = 1), 1, 'Fournitures scolaires', 15000.00, false),
  ((SELECT id FROM templates_factures WHERE nom = 'Frais d''Inscription' AND ecole_id = 1), 1, 'Uniforme scolaire', 12000.00, true),
  
  -- Frais Cantine
  ((SELECT id FROM templates_factures WHERE nom = 'Frais Cantine' AND ecole_id = 1), 1, 'Repas mensuel', 5000.00, true),
  
  -- Transport Scolaire
  ((SELECT id FROM templates_factures WHERE nom = 'Transport Scolaire' AND ecole_id = 1), 1, 'Transport mensuel', 10000.00, true);

-- =================== COMMENTAIRES ===================

COMMENT ON TABLE templates_factures IS 'Modèles de factures réutilisables pour chaque école';
COMMENT ON TABLE frais_predefinis IS 'Éléments de facturation associés aux templates';
COMMENT ON TABLE facture_elements IS 'Détail des éléments spécifiques pour chaque facture';
COMMENT ON TABLE brouillons_facturation IS 'Sauvegarde des configurations de facturation en cours';
COMMENT ON TABLE frais_par_classe IS 'Configuration spécifique des frais par classe';

COMMENT ON COLUMN templates_factures.frequence IS 'Fréquence de génération des factures : mensuel, annuel, occasionnel';
COMMENT ON COLUMN frais_predefinis.classe_niveau IS 'Niveau de classe pour conditionner l''affichage (ex: primaire, secondaire)';
COMMENT ON COLUMN frais_par_classe.montant_modifie IS 'Montant spécifique pour cette classe, sinon utiliser celui des frais prédéfinis';
COMMENT ON COLUMN frais_par_classe.periode IS 'Période spécifique pour les frais saisonniers (ex: T1, T2, T3)';

-- =================== FONCTIONS UTILITAIRES ===================

-- Fonction pour créer un template avec ses frais en une transaction
CREATE OR REPLACE FUNCTION creer_template_complet(
  p_ecole_id INTEGER,
  p_nom VARCHAR(255),
  p_description TEXT,
  p_frequence VARCHAR(50),
  p_frais_data JSON
) RETURNS UUID AS $$
DECLARE
  template_id UUID;
  frais_item JSON;
BEGIN
  -- Créer le template
  INSERT INTO templates_factures (ecole_id, nom, description, frequence)
  VALUES (p_ecole_id, p_nom, p_description, p_frequence)
  RETURNING id INTO template_id;
  
  -- Ajouter les frais prédéfinis
  FOR frais_item IN SELECT * FROM json_array_elements(p_frais_data)
  LOOP
    INSERT INTO frais_predefinis (
      template_id, 
      ecole_id, 
      nom, 
      montant, 
      obligatoire,
      classe_niveau
    ) VALUES (
      template_id,
      p_ecole_id,
      frais_item->>'nom',
      (frais_item->>'montant')::DECIMAL,
      COALESCE((frais_item->>'obligatoire')::BOOLEAN, true),
      frais_item->>'classe_niveau'
    );
  END LOOP;
  
  RETURN template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour désactiver automatiquement les vieux brouillons
CREATE OR REPLACE FUNCTION nettoyer_brouillons_anciens() RETURNS INTEGER AS $$
DECLARE
  supprime_count INTEGER;
BEGIN
  DELETE FROM brouillons_facturation 
  WHERE statut = 'brouillon' 
  AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS supprime_count = ROW_COUNT;
  RETURN supprime_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION creer_template_complet(INTEGER, VARCHAR(255), TEXT, VARCHAR(50), JSON) IS 'Créer un template avec ses frais prédéfinis en une seule transaction';
COMMENT ON FUNCTION nettoyer_brouillons_anciens() IS 'Supprime automatiquement les brouillons de plus de 30 jours';

-- =================== VUES UTILITAIRES ===================

-- Vue pour obtenir les templates avec leurs frais
CREATE OR REPLACE VIEW templates_complets AS
SELECT 
  t.id,
  t.ecole_id,
  t.nom,
  t.description,
  t.frequence,
  t.actif,
  t.created_at,
  t.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', f.id,
        'nom', f.nom,
        'montant', f.montant,
        'obligatoire', f.obligatoire,
        'classe_niveau', f.classe_niveau
      )
    ) FILTER (WHERE f.id IS NOT NULL),
    '[]'::json
  ) as frais_predefinis
FROM templates_factures t
LEFT JOIN frais_predefinis f ON t.id = f.template_id AND f.actif = true
WHERE t.actif = true
GROUP BY t.id, t.ecole_id, t.nom, t.description, t.frequence, t.actif, t.created_at, t.updated_at;

COMMENT ON VIEW templates_complets IS 'Vue complète des templates avec leurs frais prédéfinis';

-- Vue pour obtenir les statistiques de facturation par template
CREATE OR REPLACE VIEW stats_templates_facturation AS
SELECT 
  t.id as template_id,
  t.nom,
  t.frequence,
  COUNT(fa.id) as nombre_factures,
  SUM(fa.montant_total) as montant_total,
  COUNT(fa.id) FILTER (WHERE fa.statut = 'payee') as factures_payees,
  COUNT(fa.id) FILTER (WHERE fa.statut = 'emise') as factures_emises,
  COUNT(fa.id) FILTER (WHERE fa.statut = 'brouillon') as factures_brouillon
FROM templates_factures t
LEFT JOIN factures fa ON fa.template_id = t.id  -- Cette colonne devra être ajoutée à la table factures
GROUP BY t.id, t.nom, t.frequence;

COMMENT ON VIEW stats_templates_facturation IS 'Statistiques d''utilisation des templates de facturation';

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON VIEW templates_complets TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON VIEW stats_templates_facturation TO authenticated;