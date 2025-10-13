-- Diagnostic SQL Queries for Availability Update Issues
-- Run these in your Supabase SQL Editor

-- ============================================
-- 1. CHECK CURRENT TRIGGER STATUS
-- ============================================
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  tgenabled as is_enabled
FROM pg_trigger 
WHERE tgname = 'trg_sync_menu_item_availability';

-- ============================================
-- 2. CHECK TRIGGER FUNCTION
-- ============================================
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc 
WHERE proname = 'sync_menu_item_availability';

-- ============================================
-- 3. CHECK RLS POLICIES
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'menu_items';

-- ============================================
-- 4. CHECK RECENT UPDATES
-- ============================================
SELECT 
  id,
  name,
  available,
  track_inventory,
  stock_quantity,
  low_stock_threshold,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_ago
FROM menu_items
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================
-- 5. TEST TRIGGER MANUALLY
-- ============================================
-- This will show you what the trigger does
-- Replace 'YOUR_ITEM_ID' with an actual item ID

SELECT 
  id,
  name,
  available as current_available,
  track_inventory,
  stock_quantity,
  low_stock_threshold,
  -- Simulate what trigger would do
  CASE 
    WHEN track_inventory AND stock_quantity <= low_stock_threshold THEN false
    WHEN track_inventory AND stock_quantity > low_stock_threshold THEN true
    ELSE available
  END as trigger_would_set_to
FROM menu_items
WHERE id = 'YOUR_ITEM_ID';  -- Replace this!

-- ============================================
-- 6. CHECK FOR ITEMS WITH INVENTORY TRACKING
-- ============================================
SELECT 
  id,
  name,
  available,
  track_inventory,
  stock_quantity,
  low_stock_threshold,
  CASE 
    WHEN track_inventory AND stock_quantity <= low_stock_threshold THEN 'SHOULD BE UNAVAILABLE'
    WHEN track_inventory AND stock_quantity > low_stock_threshold THEN 'SHOULD BE AVAILABLE'
    ELSE 'MANUAL CONTROL'
  END as expected_status
FROM menu_items
WHERE track_inventory = true;

-- ============================================
-- 7. CHECK FOR ITEMS WITHOUT INVENTORY TRACKING
-- ============================================
SELECT 
  id,
  name,
  available,
  track_inventory,
  CASE 
    WHEN track_inventory = false THEN 'MANUAL CONTROL (SHOULD RESPECT YOUR CHANGES)'
    ELSE 'AUTO CONTROLLED'
  END as control_type
FROM menu_items
WHERE track_inventory = false OR track_inventory IS NULL;

-- ============================================
-- 8. FIND ITEMS THAT MIGHT HAVE ISSUES
-- ============================================
-- Items with inventory tracking but no stock
SELECT 
  id,
  name,
  available,
  track_inventory,
  stock_quantity,
  low_stock_threshold,
  'Has inventory tracking but stock_quantity is NULL' as issue
FROM menu_items
WHERE track_inventory = true AND stock_quantity IS NULL;

-- Items where availability doesn't match inventory
SELECT 
  id,
  name,
  available,
  track_inventory,
  stock_quantity,
  low_stock_threshold,
  CASE 
    WHEN available = true AND stock_quantity <= low_stock_threshold THEN 'SHOULD BE UNAVAILABLE'
    WHEN available = false AND stock_quantity > low_stock_threshold THEN 'SHOULD BE AVAILABLE'
    ELSE 'OK'
  END as issue
FROM menu_items
WHERE track_inventory = true
  AND (
    (available = true AND stock_quantity <= low_stock_threshold)
    OR
    (available = false AND stock_quantity > low_stock_threshold)
  );

-- ============================================
-- 9. CHECK UPDATE HISTORY (if you have audit logs)
-- ============================================
-- This requires audit logging to be enabled
-- Uncomment if you have it set up:

-- SELECT 
--   id,
--   table_name,
--   action,
--   old_data,
--   new_data,
--   created_at
-- FROM audit_log
-- WHERE table_name = 'menu_items'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- ============================================
-- 10. FIX COMMON ISSUES
-- ============================================

-- Fix: Set stock_quantity to 0 for items with NULL stock
UPDATE menu_items
SET stock_quantity = 0
WHERE track_inventory = true AND stock_quantity IS NULL;

-- Fix: Set low_stock_threshold to 0 for items with NULL threshold
UPDATE menu_items
SET low_stock_threshold = 0
WHERE track_inventory = true AND low_stock_threshold IS NULL;

-- Fix: Sync availability for all items with inventory tracking
UPDATE menu_items
SET available = (stock_quantity > low_stock_threshold)
WHERE track_inventory = true;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================

/*
QUERY 1 - Trigger Status:
  - If no results: Trigger doesn't exist, need to create it
  - If tgenabled = 'O': Trigger is enabled
  - If tgenabled = 'D': Trigger is disabled

QUERY 2 - Trigger Function:
  - Shows the actual code of the trigger
  - Look for the logic that sets 'available'

QUERY 3 - RLS Policies:
  - Should have a policy allowing authenticated users to update
  - If missing, create one

QUERY 4 - Recent Updates:
  - Shows what was updated recently
  - Check if 'available' changed when you expected

QUERY 5 - Test Trigger:
  - Shows what the trigger WOULD do
  - Compare 'current_available' vs 'trigger_would_set_to'

QUERY 6 - Items with Inventory:
  - Shows items that are auto-controlled
  - Check if availability matches stock levels

QUERY 7 - Items without Inventory:
  - Shows items you can manually control
  - These should respect your manual changes

QUERY 8 - Problem Items:
  - Finds items with potential issues
  - Fix these with queries in section 10

QUERY 9 - Update History:
  - Only works if audit logging is enabled
  - Shows what changed and when

QUERY 10 - Fixes:
  - Use these to fix common issues
  - Run one at a time and check results
*/

