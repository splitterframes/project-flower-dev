-- Quick migration to update German butterfly names to Latin
-- This should be run directly on the Neon database

-- Show current German butterfly names in userButterflies
SELECT id, "butterflyId", "butterflyName" FROM "userButterflies" 
WHERE "butterflyName" LIKE '%Falter%' OR "butterflyName" LIKE '%Weißling%' OR "butterflyName" LIKE '%Silberner%' 
LIMIT 10;

-- Show current German butterfly names in fieldButterflies  
SELECT id, "butterflyId", "butterflyName" FROM "fieldButterflies"
WHERE "butterflyName" LIKE '%Falter%' OR "butterflyName" LIKE '%Weißling%' OR "butterflyName" LIKE '%Silberner%'
LIMIT 10;

-- Show current German butterfly names in exhibitionButterflies
SELECT id, "butterflyId", "butterflyName" FROM "exhibitionButterflies"
WHERE "butterflyName" LIKE '%Falter%' OR "butterflyName" LIKE '%Weißling%' OR "butterflyName" LIKE '%Silberner%'
LIMIT 10;
