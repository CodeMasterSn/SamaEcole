-- =====================================================
-- DONNÉES DE TEST POUR LE SYSTÈME DE FACTURATION
-- SAMA ÉCOLE - Données d'exemple
-- =====================================================

-- IMPORTANT: Adaptez les IDs selon votre base de données existante
-- Remplacez les valeurs ci-dessous par les vrais IDs de votre école et élèves

-- Variables à adapter (remplacez par vos vrais IDs)
-- SET @ecole_id = 1;  -- ID de votre école
-- SET @eleve_id_1 = 1;  -- ID d'un élève existant
-- SET @eleve_id_2 = 2;  -- ID d'un autre élève existant

-- =====================================================
-- 1. TYPES DE FRAIS DE TEST (si pas déjà insérés)
-- =====================================================

-- Vérifier d'abord qu'on a une école
DO $$
DECLARE
    ecole_count INTEGER;
    premier_ecole_id INTEGER;
BEGIN
    SELECT COUNT(*), MIN(id) INTO ecole_count, premier_ecole_id FROM ecoles;
    
    IF ecole_count = 0 THEN
        RAISE EXCEPTION 'Aucune école trouvée. Créez d''abord une école dans la table ecoles.';
    END IF;
    
    -- Insérer les types de frais pour la première école trouvée
    INSERT INTO types_frais (ecole_id, nom, description, montant_defaut, recurrent, obligatoire) VALUES
    (premier_ecole_id, 'Frais d''inscription', 'Frais d''inscription annuelle', 50000, false, true),
    (premier_ecole_id, 'Mensualité', 'Frais de scolarité mensuelle', 25000, true, true),
    (premier_ecole_id, 'Fournitures scolaires', 'Cahiers, stylos, etc.', 15000, false, false),
    (premier_ecole_id, 'Transport scolaire', 'Frais de transport mensuel', 10000, true, false),
    (premier_ecole_id, 'Cantine', 'Repas à la cantine', 5000, true, false),
    (premier_ecole_id, 'Activités extra-scolaires', 'Sport, musique, etc.', 8000, false, false),
    (premier_ecole_id, 'Uniforme scolaire', 'Tenue obligatoire', 12000, false, false),
    (premier_ecole_id, 'Examens', 'Frais d''examens et évaluations', 3000, false, false)
    ON CONFLICT (ecole_id, nom) DO NOTHING;
    
    RAISE NOTICE 'Types de frais insérés pour l''école ID: %', premier_ecole_id;
END $$;

-- =====================================================
-- 2. FACTURES DE TEST
-- =====================================================

-- Créer des factures de test si on a des élèves
DO $$
DECLARE
    ecole_count INTEGER;
    eleve_count INTEGER;
    premier_ecole_id INTEGER;
    premier_eleve_id INTEGER;
    deuxieme_eleve_id INTEGER;
    type_inscription_id INTEGER;
    type_mensualite_id INTEGER;
    type_fournitures_id INTEGER;
    facture_1_id INTEGER;
    facture_2_id INTEGER;
BEGIN
    -- Vérifier qu'on a des données
    SELECT COUNT(*), MIN(id) INTO ecole_count, premier_ecole_id FROM ecoles;
    SELECT COUNT(*) INTO eleve_count FROM eleves WHERE ecole_id = premier_ecole_id;
    
    IF eleve_count < 1 THEN
        RAISE NOTICE 'Aucun élève trouvé. Créez d''abord des élèves pour tester les factures.';
        RETURN;
    END IF;
    
    -- Récupérer les IDs des premiers élèves
    SELECT id INTO premier_eleve_id FROM eleves WHERE ecole_id = premier_ecole_id ORDER BY id LIMIT 1;
    SELECT id INTO deuxieme_eleve_id FROM eleves WHERE ecole_id = premier_ecole_id ORDER BY id LIMIT 1 OFFSET 1;
    
    -- Si on n'a qu'un élève, utiliser le même pour les deux factures
    IF deuxieme_eleve_id IS NULL THEN
        deuxieme_eleve_id := premier_eleve_id;
    END IF;
    
    -- Récupérer les IDs des types de frais
    SELECT id INTO type_inscription_id FROM types_frais WHERE ecole_id = premier_ecole_id AND nom = 'Frais d''inscription';
    SELECT id INTO type_mensualite_id FROM types_frais WHERE ecole_id = premier_ecole_id AND nom = 'Mensualité';
    SELECT id INTO type_fournitures_id FROM types_frais WHERE ecole_id = premier_ecole_id AND nom = 'Fournitures scolaires';
    
    -- Créer la première facture
    INSERT INTO factures (
        ecole_id, 
        eleve_id, 
        numero_facture, 
        date_emission, 
        montant_total, 
        statut,
        notes
    ) VALUES (
        premier_ecole_id,
        premier_eleve_id,
        'FACT-2025-001',
        CURRENT_DATE,
        90000, -- 50000 + 25000 + 15000
        'envoyee',
        'Facture d''inscription et première mensualité'
    ) RETURNING id INTO facture_1_id;
    
    -- Créer les détails de la première facture
    INSERT INTO facture_details (facture_id, type_frais_id, montant, quantite) VALUES
    (facture_1_id, type_inscription_id, 50000, 1),
    (facture_1_id, type_mensualite_id, 25000, 1),
    (facture_1_id, type_fournitures_id, 15000, 1);
    
    -- Créer la deuxième facture
    INSERT INTO factures (
        ecole_id, 
        eleve_id, 
        numero_facture, 
        date_emission, 
        montant_total, 
        statut,
        date_echeance,
        notes
    ) VALUES (
        premier_ecole_id,
        deuxieme_eleve_id,
        'FACT-2025-002',
        CURRENT_DATE - INTERVAL '5 days',
        25000,
        'payee',
        CURRENT_DATE + INTERVAL '30 days',
        'Mensualité de janvier'
    ) RETURNING id INTO facture_2_id;
    
    -- Créer les détails de la deuxième facture
    INSERT INTO facture_details (facture_id, type_frais_id, montant, quantite) VALUES
    (facture_2_id, type_mensualite_id, 25000, 1);
    
    -- Créer une troisième facture en brouillon
    INSERT INTO factures (
        ecole_id, 
        eleve_id, 
        numero_facture, 
        date_emission, 
        montant_total, 
        statut,
        notes
    ) VALUES (
        premier_ecole_id,
        premier_eleve_id,
        'FACT-2025-003',
        CURRENT_DATE,
        15000,
        'brouillon',
        'Transport scolaire - En cours de préparation'
    );
    
    RAISE NOTICE 'Factures de test créées pour l''école ID: % avec les élèves IDs: %, %', 
                 premier_ecole_id, premier_eleve_id, deuxieme_eleve_id;
END $$;

-- =====================================================
-- 3. VÉRIFICATION DES DONNÉES INSÉRÉES
-- =====================================================

-- Afficher un résumé des données créées
SELECT 
    'RÉSUMÉ DONNÉES TEST' as section,
    (SELECT COUNT(*) FROM types_frais) as types_frais_total,
    (SELECT COUNT(*) FROM factures) as factures_total,
    (SELECT COUNT(*) FROM facture_details) as details_total;

-- Afficher les factures créées avec leurs détails
SELECT 
    'FACTURES CRÉÉES' as section,
    f.numero_facture,
    f.montant_total,
    f.statut,
    f.date_emission,
    e.nom || ' ' || e.prenom as eleve,
    c.nom_complet as classe
FROM factures f
LEFT JOIN eleves e ON f.eleve_id = e.id
LEFT JOIN classes c ON e.classe_id = c.id
ORDER BY f.created_at DESC;

-- Afficher les détails des factures
SELECT 
    'DÉTAILS FACTURES' as section,
    f.numero_facture,
    tf.nom as type_frais,
    fd.montant,
    fd.quantite,
    (fd.montant * fd.quantite) as sous_total
FROM facture_details fd
JOIN factures f ON fd.facture_id = f.id
JOIN types_frais tf ON fd.type_frais_id = tf.id
ORDER BY f.numero_facture, tf.nom;






