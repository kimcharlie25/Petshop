/*
  Fix availability trigger to respect manual availability changes
  
  The previous trigger would always override the 'available' field when
  track_inventory was enabled, even if the admin manually set it.
  
  This updated trigger only auto-calculates availability when:
  1. track_inventory is true AND
  2. The stock_quantity or low_stock_threshold is being changed
  
  It preserves manual availability changes in other cases.
*/

-- Drop the old trigger
DROP TRIGGER IF EXISTS trg_sync_menu_item_availability ON menu_items;

-- Create improved availability sync function
CREATE OR REPLACE FUNCTION sync_menu_item_availability()
RETURNS trigger AS $$
BEGIN
  -- Only auto-calculate availability if tracking inventory
  IF COALESCE(NEW.track_inventory, false) THEN
    -- Ensure stock values are non-negative
    NEW.stock_quantity := GREATEST(COALESCE(NEW.stock_quantity, 0), 0);
    NEW.low_stock_threshold := GREATEST(COALESCE(NEW.low_stock_threshold, 0), 0);

    -- Check if stock-related fields changed
    -- If they did, auto-calculate availability
    IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity OR 
       OLD.low_stock_threshold IS DISTINCT FROM NEW.low_stock_threshold OR
       OLD.track_inventory IS DISTINCT FROM NEW.track_inventory THEN
      
      -- Auto-calculate based on stock
      IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        NEW.available := false;
      ELSE
        NEW.available := true;
      END IF;
    END IF;
    -- If stock fields didn't change, preserve the existing availability value
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trg_sync_menu_item_availability
BEFORE INSERT OR UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION sync_menu_item_availability();

