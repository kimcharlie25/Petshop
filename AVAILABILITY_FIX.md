# Menu Item Availability Update Fix

## Problem
Menu item availability was not updating properly when manually changed in the admin dashboard.

## Root Causes

### 1. Database Trigger Override
The database trigger `sync_menu_item_availability()` was automatically recalculating the `available` field whenever `track_inventory` was enabled, even when you manually tried to change it.

### 2. Undefined Field Handling
The `updateMenuItem` function was sending `undefined` values to the database for fields that weren't explicitly set, which could cause issues.

## Solutions Applied

### 1. Fixed Database Trigger ✅
**File**: `supabase/migrations/20250103000000_fix_availability_trigger.sql`

The trigger now:
- Only auto-calculates availability when stock-related fields change
- Preserves manual availability changes
- Only overrides availability when:
  - `track_inventory` is true AND
  - `stock_quantity` or `low_stock_threshold` is being modified

**Before**:
```sql
-- Always overrode availability when tracking inventory
IF COALESCE(NEW.track_inventory, false) THEN
  IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
    NEW.available := false;
  ELSE
    NEW.available := true;
  END IF;
END IF;
```

**After**:
```sql
-- Only overrides when stock fields actually change
IF COALESCE(NEW.track_inventory, false) THEN
  IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity OR 
     OLD.low_stock_threshold IS DISTINCT FROM NEW.low_stock_threshold THEN
    -- Auto-calculate based on stock
    IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
      NEW.available := false;
    ELSE
      NEW.available := true;
    END IF;
  END IF;
  -- Otherwise preserves existing availability
END IF;
```

### 2. Fixed Update Logic ✅
**File**: `src/hooks/useMenu.ts`

The `updateMenuItem` function now:
- Only sends defined fields to the database
- Prevents `undefined` values from being sent
- Allows partial updates without affecting other fields

**Before**:
```typescript
.update({
  name: updates.name,
  available: updates.available,  // Could be undefined!
  // ... all fields sent even if undefined
})
```

**After**:
```typescript
const updateData: any = {};
if (updates.available !== undefined) updateData.available = updates.available;
// Only sends fields that are explicitly defined
.update(updateData)
```

## How to Apply the Fix

### Step 1: Apply Database Migration

Run the new migration in your Supabase project:

```bash
# Option 1: Via Supabase CLI (if you have it installed)
supabase db push

# Option 2: Via Supabase Dashboard
# Go to SQL Editor and run the contents of:
# supabase/migrations/20250103000000_fix_availability_trigger.sql
```

Or manually run this SQL in your Supabase SQL Editor:

```sql
-- Drop the old trigger
DROP TRIGGER IF EXISTS trg_sync_menu_item_availability ON menu_items;

-- Create improved availability sync function
CREATE OR REPLACE FUNCTION sync_menu_item_availability()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(NEW.track_inventory, false) THEN
    NEW.stock_quantity := GREATEST(COALESCE(NEW.stock_quantity, 0), 0);
    NEW.low_stock_threshold := GREATEST(COALESCE(NEW.low_stock_threshold, 0), 0);

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

-- Recreate the trigger
CREATE TRIGGER trg_sync_menu_item_availability
BEFORE INSERT OR UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION sync_menu_item_availability();
```

### Step 2: Restart Your Development Server

The code changes are already applied. Just restart your dev server:

```bash
npm run dev
```

## Testing the Fix

### Test Case 1: Manual Availability Toggle (No Inventory Tracking)
1. Go to Admin Dashboard → Menu Items
2. Edit an item that has `track_inventory = false`
3. Toggle the "Available for Order" checkbox
4. Save the item
5. ✅ **Expected**: Availability should update immediately
6. Refresh the page
7. ✅ **Expected**: Availability should persist

### Test Case 2: Manual Availability Override (With Inventory Tracking)
1. Go to Admin Dashboard → Menu Items
2. Edit an item with `track_inventory = true`, `stock_quantity = 5`, `low_stock_threshold = 3`
3. Manually toggle "Available for Order" to false
4. Save the item
5. ✅ **Expected**: Availability should be false (manual override)
6. Go to Inventory Manager
7. Change stock quantity to 10
8. ✅ **Expected**: Availability should auto-calculate to true (stock > threshold)

### Test Case 3: Auto-Disable When Stock Low
1. Go to Inventory Manager
2. Find an item with `track_inventory = true`
3. Set stock quantity to 2
4. Set low stock threshold to 5
5. Save
6. ✅ **Expected**: Item should auto-disable (stock ≤ threshold)

### Test Case 4: Auto-Enable When Stock Restocked
1. In Inventory Manager
2. Find the item from Test Case 3
3. Increase stock quantity to 10
4. Save
5. ✅ **Expected**: Item should auto-enable (stock > threshold)

## How It Works Now

### Scenario 1: Manual Toggle (No Inventory Tracking)
```
Admin toggles "Available" → Saves
Database receives: { available: true/false }
Trigger: Does nothing (track_inventory = false)
Result: ✅ Availability updated
```

### Scenario 2: Manual Toggle (With Inventory Tracking)
```
Admin toggles "Available" → Saves
Database receives: { available: true/false }
Trigger: Sees no stock changes, preserves manual value
Result: ✅ Availability updated (manual override respected)
```

### Scenario 3: Stock Change
```
Admin changes stock quantity → Saves
Database receives: { stock_quantity: 5 }
Trigger: Detects stock change, auto-calculates availability
Result: ✅ Availability auto-updated based on stock
```

## Rollback (If Needed)

If you need to rollback to the old behavior:

```sql
-- Revert to old trigger
DROP TRIGGER IF EXISTS trg_sync_menu_item_availability ON menu_items;

CREATE OR REPLACE FUNCTION sync_menu_item_availability()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(NEW.track_inventory, false) THEN
    NEW.stock_quantity := GREATEST(COALESCE(NEW.stock_quantity, 0), 0);
    NEW.low_stock_threshold := GREATEST(COALESCE(NEW.low_stock_threshold, 0), 0);

    IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
      NEW.available := false;
    ELSE
      NEW.available := true;
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

## Summary

✅ **Fixed**: Availability updates now work correctly  
✅ **Fixed**: Manual overrides are preserved  
✅ **Fixed**: Auto-calculation still works for stock changes  
✅ **Fixed**: Undefined fields no longer sent to database  

The system now intelligently balances manual control with automatic inventory management!

