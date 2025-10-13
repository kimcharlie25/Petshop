# Availability Update Testing Guide

## What I've Added

### 1. Console Logging
Added detailed debug logging to track the availability update flow:
- `AdminDashboard.tsx` - Logs form data and payload
- `useMenu.ts` - Logs update data and Supabase response

### 2. Test Script
Created `test-availability.js` to verify the logic works correctly

## How to Test

### Step 1: Open Browser Console
1. Open your app in the browser
2. Press `F12` or `Cmd+Option+I` to open Developer Tools
3. Go to the "Console" tab

### Step 2: Test Availability Update

#### Test Case 1: Simple Availability Toggle (No Inventory Tracking)
1. Go to Admin Dashboard → Menu Items
2. Click "Edit" on any item
3. **Make sure "Track inventory" is UNCHECKED**
4. Toggle "Available for Order" checkbox
5. Click "Save"
6. **Check the console** - You should see:
   ```
   [DEBUG] handleSaveItem - formData: { ... available: false ... }
   [DEBUG] handleSaveItem - payload: { ... available: false ... }
   [DEBUG] updateMenuItem called with: { id: '...', updates: { ... available: false ... } }
   [DEBUG] updateData being sent to Supabase: { available: false }
   [DEBUG] Supabase response: { data: [...], error: null }
   ```

#### Test Case 2: Availability with Inventory Tracking
1. Go to Admin Dashboard → Menu Items
2. Click "Edit" on any item
3. **Check "Track inventory"**
4. Set stock quantity to 10
5. Set low stock threshold to 5
6. Toggle "Available for Order" to false
7. Click "Save"
8. **Check the console** - Look for the updateData

### Step 3: Check Database

After saving, run this SQL in your Supabase SQL Editor:

```sql
-- Check the latest update
SELECT 
  id,
  name,
  available,
  track_inventory,
  stock_quantity,
  low_stock_threshold,
  updated_at
FROM menu_items
ORDER BY updated_at DESC
LIMIT 5;
```

## What to Look For

### ✅ Success Indicators
- Console shows `available: false` in all debug logs
- Supabase response has no error
- Database shows `available = false` after update
- Item shows as "Unavailable" in the menu

### ❌ Problem Indicators

#### Problem 1: Console shows `available: true` when you set it to false
**Cause**: Form state not updating
**Check**: 
```javascript
// In console, after clicking checkbox:
formData.available  // Should be false
```

#### Problem 2: updateData is empty `{}`
**Cause**: `available` is `undefined` in updates
**Check**:
```javascript
// In console, look for:
[DEBUG] updateMenuItem called with: { id: '...', updates: { ... } }
// Check if 'available' is in the updates object
```

#### Problem 3: Supabase returns error
**Cause**: Database constraint or trigger issue
**Check**:
```javascript
// In console:
[DEBUG] Supabase response: { data: null, error: { ... } }
// Copy the error and check what it says
```

#### Problem 4: Update succeeds but availability reverts
**Cause**: Database trigger overriding the value
**Check**:
```sql
-- Run this to see if trigger is working:
SELECT 
  id,
  name,
  available,
  track_inventory,
  stock_quantity,
  low_stock_threshold
FROM menu_items
WHERE id = 'your-item-id';
```

## Common Issues & Solutions

### Issue: Trigger Overriding Manual Availability

**Symptoms**: You set `available = false`, but it becomes `true` after save

**Solution**: The database trigger needs to be updated. Run this SQL:

```sql
-- Check current trigger
SELECT * FROM pg_trigger WHERE tgname = 'trg_sync_menu_item_availability';

-- Drop and recreate with fix
DROP TRIGGER IF EXISTS trg_sync_menu_item_availability ON menu_items;

CREATE OR REPLACE FUNCTION sync_menu_item_availability()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(NEW.track_inventory, false) THEN
    NEW.stock_quantity := GREATEST(COALESCE(NEW.stock_quantity, 0), 0);
    NEW.low_stock_threshold := GREATEST(COALESCE(NEW.low_stock_threshold, 0), 0);

    -- Only auto-calculate if stock fields changed
    IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity OR 
       OLD.low_stock_threshold IS DISTINCT FROM NEW.low_stock_threshold OR
       OLD.track_inventory IS DISTINCT FROM NEW.track_inventory THEN
      
      IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        NEW.available := false;
      ELSE
        NEW.available := true;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_menu_item_availability
BEFORE INSERT OR UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION sync_menu_item_availability();
```

### Issue: RLS Policy Blocking Update

**Symptoms**: Supabase error about permissions

**Solution**: Check RLS policies:

```sql
-- View current policies
SELECT * FROM pg_policies WHERE tablename = 'menu_items';

-- Ensure authenticated users can update
CREATE POLICY "Authenticated users can manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

## Quick Diagnostic Checklist

- [ ] Browser console is open
- [ ] Debug logs are showing
- [ ] `formData.available` is correct when checkbox is toggled
- [ ] `payload.available` is correct before save
- [ ] `updateData` contains `{ available: ... }`
- [ ] Supabase response has no error
- [ ] Database shows correct value after update
- [ ] Database trigger is not overriding the value

## Report Your Findings

When testing, please share:

1. **Console logs** - Copy all `[DEBUG]` lines
2. **Database query result** - The SQL query output
3. **What you tried** - Which test case
4. **What happened** - Expected vs actual behavior

This will help identify exactly where the issue is!

