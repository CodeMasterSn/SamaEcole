-- Insertion de données de test pour les reçus
-- À exécuter APRÈS avoir créé la table recus et avoir des paiements existants

-- Vérifier qu'il y a des paiements existants
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM paiements LIMIT 1) THEN
        RAISE EXCEPTION 'Aucun paiement trouvé. Créez d''abord des paiements avant d''insérer des reçus.';
    END IF;
END $$;

-- Générer des reçus pour les paiements existants
WITH paiements_existants AS (
    SELECT 
        p.id,
        p.montant,
        p.date_paiement,
        p.mode_paiement,
        p.facture_id,
        f.numero_facture,
        ROW_NUMBER() OVER (ORDER BY p.created_at) as row_num
    FROM paiements p
    JOIN factures f ON p.facture_id = f.id
    ORDER BY p.created_at DESC 
    LIMIT 10
)
INSERT INTO recus (
    paiement_id,
    numero_recu,
    date_emission,
    montant_recu,
    mode_paiement,
    statut,
    notes,
    created_at
) 
SELECT 
    p.id,
    -- Numérotation séquentielle des reçus
    'RECU-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(p.row_num::text, 3, '0'),
    -- Date d'émission = date de paiement ou aujourd'hui
    COALESCE(p.date_paiement, CURRENT_DATE),
    p.montant,
    p.mode_paiement,
    -- Statuts variés pour tester
    CASE 
        WHEN p.id % 3 = 0 THEN 'imprime'
        WHEN p.id % 3 = 1 THEN 'envoye'
        ELSE 'emis'
    END,
    -- Notes automatiques
    'Reçu généré automatiquement pour le paiement de la facture ' || p.numero_facture,
    -- Date de création légèrement après le paiement
    NOW() - (p.row_num % 5) * INTERVAL '1 hour'
FROM paiements_existants p;

-- Afficher un résumé des reçus créés
SELECT 
    'Reçus créés avec succès!' as message,
    COUNT(*) as nombre_recus,
    SUM(montant_recu) as montant_total,
    COUNT(DISTINCT paiement_id) as paiements_concernes
FROM recus;

-- Afficher la répartition par statut
SELECT 
    statut,
    COUNT(*) as nombre,
    SUM(montant_recu) as montant_total
FROM recus
GROUP BY statut
ORDER BY statut;

-- Afficher la répartition par mode de paiement
SELECT 
    mode_paiement,
    COUNT(*) as nombre,
    SUM(montant_recu) as montant_total
FROM recus
GROUP BY mode_paiement
ORDER BY mode_paiement;

-- Vérifier les relations avec les paiements et factures
SELECT 
    r.numero_recu,
    r.montant_recu,
    r.statut,
    p.id as paiement_id,
    f.numero_facture
FROM recus r
JOIN paiements p ON r.paiement_id = p.id
JOIN factures f ON p.facture_id = f.id
LIMIT 5;






