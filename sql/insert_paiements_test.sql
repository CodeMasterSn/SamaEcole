-- Insertion de données de test pour les paiements
-- À exécuter APRÈS avoir créé la table paiements et avoir des factures existantes

-- Vérifier qu'il y a des factures existantes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM factures LIMIT 1) THEN
        RAISE EXCEPTION 'Aucune facture trouvée. Créez d''abord des factures avant d''insérer des paiements.';
    END IF;
END $$;

-- Insérer des paiements de test pour les factures existantes
WITH factures_existantes AS (
    SELECT id, numero_facture, montant_total 
    FROM factures 
    ORDER BY created_at DESC 
    LIMIT 5
)
INSERT INTO paiements (
    facture_id, 
    montant_paye, 
    date_paiement, 
    mode_paiement, 
    reference_paiement, 
    notes, 
    statut,
    created_at
) 
SELECT 
    f.id,
    -- Différents montants pour tester les statuts
    CASE 
        WHEN f.id % 3 = 0 THEN f.montant_total  -- Paiement complet
        WHEN f.id % 3 = 1 THEN f.montant_total * 0.5  -- Paiement partiel
        ELSE f.montant_total * 0.8  -- Paiement partiel
    END,
    -- Dates variées
    CURRENT_DATE - (f.id % 30) * INTERVAL '1 day',
    -- Modes de paiement variés
    CASE 
        WHEN f.id % 4 = 0 THEN 'especes'
        WHEN f.id % 4 = 1 THEN 'cheque'
        WHEN f.id % 4 = 2 THEN 'virement'
        ELSE 'mobile_money'
    END,
    -- Références de paiement
    CASE 
        WHEN f.id % 4 = 1 THEN 'CHQ-' || LPAD(f.id::text, 6, '0')
        WHEN f.id % 4 = 2 THEN 'VIR-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || f.id
        WHEN f.id % 4 = 3 THEN 'MM-' || f.id || '-' || EXTRACT(epoch FROM NOW())::bigint
        ELSE NULL
    END,
    -- Notes variées
    CASE 
        WHEN f.id % 3 = 0 THEN 'Paiement complet reçu'
        WHEN f.id % 3 = 1 THEN 'Acompte - solde à recevoir'
        ELSE 'Paiement partiel reçu'
    END,
    -- Statuts
    CASE 
        WHEN f.id % 3 = 0 THEN 'complet'
        ELSE 'partiel'
    END,
    -- Dates de création variées
    NOW() - (f.id % 10) * INTERVAL '1 hour'
FROM factures_existantes f;

-- Ajouter quelques paiements en attente
INSERT INTO paiements (
    facture_id, 
    montant_paye, 
    date_paiement, 
    mode_paiement, 
    reference_paiement, 
    notes, 
    statut,
    created_at
) 
SELECT 
    f.id,
    f.montant_total * 0.3,  -- Petit acompte
    CURRENT_DATE + 2,  -- Date future
    'virement',
    'VIR-PENDING-' || f.id,
    'Paiement en cours de traitement',
    'en_attente',
    NOW()
FROM factures 
WHERE id IN (
    SELECT id FROM factures ORDER BY created_at DESC LIMIT 2
);

-- Afficher un résumé des paiements créés
SELECT 
    'Paiements créés avec succès!' as message,
    COUNT(*) as nombre_paiements,
    SUM(montant_paye) as montant_total,
    COUNT(DISTINCT facture_id) as factures_concernees
FROM paiements;

-- Afficher la répartition par mode de paiement
SELECT 
    mode_paiement,
    COUNT(*) as nombre,
    SUM(montant_paye) as montant_total
FROM paiements
GROUP BY mode_paiement
ORDER BY mode_paiement;

-- Afficher la répartition par statut
SELECT 
    statut,
    COUNT(*) as nombre,
    SUM(montant_paye) as montant_total
FROM paiements
GROUP BY statut
ORDER BY statut;






