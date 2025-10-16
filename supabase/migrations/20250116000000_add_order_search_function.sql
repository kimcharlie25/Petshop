/*
  Order Search Function
  
  Creates a helper function to search orders by UUID as text.
  This allows case-insensitive partial matching on UUID columns.
*/

-- Function to search orders by ID (supports partial UUID matching)
CREATE OR REPLACE FUNCTION search_order_by_id(search_term text)
RETURNS TABLE (
  id uuid,
  customer_name text,
  contact_number text,
  service_type text,
  address text,
  pickup_time text,
  party_size integer,
  dine_in_time timestamptz,
  payment_method text,
  reference_number text,
  notes text,
  total numeric,
  status text,
  created_at timestamptz,
  receipt_url text,
  ip_address text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_name,
    o.contact_number,
    o.service_type,
    o.address,
    o.pickup_time,
    o.party_size,
    o.dine_in_time,
    o.payment_method,
    o.reference_number,
    o.notes,
    o.total,
    o.status,
    o.created_at,
    o.receipt_url,
    o.ip_address
  FROM orders o
  WHERE o.id::text ILIKE '%' || search_term || '%'
  ORDER BY o.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to public (anon users)
GRANT EXECUTE ON FUNCTION search_order_by_id TO public;
GRANT EXECUTE ON FUNCTION search_order_by_id TO anon;
GRANT EXECUTE ON FUNCTION search_order_by_id TO authenticated;

