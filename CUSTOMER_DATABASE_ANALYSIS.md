# Customer Database Analysis

## Executive Summary

This ClickEats application uses a **denormalized customer data model** where customer information is stored directly within the `orders` table rather than in a separate dedicated customers table. This design choice simplifies the data model but has implications for customer relationship management and analytics.

---

## Database Architecture

### 1. Customer Data Storage

**Primary Table: `orders`**

Customer information is embedded in each order record. The customer data fields are:

```sql
-- Customer Identification
customer_name       text NOT NULL        -- Customer's full name
contact_number      text NOT NULL        -- Primary phone number
ip_address          text                 -- IP address for fraud prevention

-- Service Preferences
service_type        text NOT NULL        -- 'dine-in', 'pickup', or 'delivery'
address             text                 -- Delivery address (if applicable)
pickup_time         text                 -- Preferred pickup time
party_size          integer              -- Number of guests (dine-in)
dine_in_time        timestamptz          -- Reservation time (dine-in)

-- Payment Information
payment_method      text NOT NULL        -- Payment method used
reference_number    text                 -- Payment reference
receipt_url         text                 -- URL to uploaded receipt image

-- Order Metadata
total               numeric(12,2)        -- Order total amount
status              text                 -- Order status
notes               text                 -- Customer notes
created_at          timestamptz          -- Order timestamp
```

### 2. Customer Identification Strategy

**Unique Customer Key:**
```
`${customer_name}-${contact_number}`.toLowerCase()
```

Customers are identified by the combination of their name and contact number. This approach:
- ✅ **Pros:** Simple, no additional tables needed
- ⚠️ **Cons:** 
  - Same person with different name variations = multiple customer records
  - Same phone number with different names = multiple customer records
  - No single source of truth for customer data

### 3. Related Tables

#### `order_items`
Stores individual line items for each order:
```sql
order_id      uuid        -- Links to orders table
item_id       text        -- Menu item ID
name          text        -- Item name
variation     jsonb       -- Selected variation
add_ons       jsonb       -- Selected add-ons
unit_price    numeric     -- Price per unit
quantity      integer     -- Quantity ordered
subtotal      numeric     -- Line total
```

---

## Security & Rate Limiting

### IP-Based Rate Limiting
```sql
-- Prevents spam orders from same IP within 60 seconds
CREATE FUNCTION prevent_spam_orders_per_ip()
```

**Rate Limit Rules:**
1. Maximum 1 order per IP address per 60 seconds
2. Maximum 1 order per contact number per 60 seconds
3. At least one identifier (IP or contact number) required
4. IP address auto-populated from request headers if not provided

### Row Level Security (RLS)
```sql
-- Public can insert orders (anyone can place orders)
CREATE POLICY "Public can insert orders" ON orders FOR INSERT TO public;

-- Public can view orders (consider restricting later)
CREATE POLICY "Public can select orders" ON orders FOR SELECT TO public;
```

⚠️ **Security Note:** Currently, anyone can view all orders. Consider restricting to authenticated admin users only.

---

## Customer Analytics (CustomersManager Component)

### Aggregated Customer Metrics

The `CustomersManager` component extracts customer insights by:

1. **Grouping orders by customer key** (`name + contact_number`)
2. **Calculating metrics:**
   - Total orders per customer
   - Total revenue per customer
   - Average order value
   - First order date
   - Last order date
   - Service type preferences
   - Delivery addresses used

### Customer Statistics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Total Customers    │ Total Orders  │ Total Revenue           │
│ Avg Orders/Customer│ Repeat Customers                        │
└─────────────────────────────────────────────────────────────┘
```

### Customer Profile View

Each customer profile shows:
- **Contact Information:** Name and phone number
- **Order Statistics:** Total orders, total spent, average order value
- **Order History:** First and last order dates
- **Service Preferences:** Which service types they use (dine-in, pickup, delivery)
- **Delivery Addresses:** All addresses used for delivery orders

### Export Functionality

Customers can be exported to CSV with the following fields:
- Customer Name
- Contact Number
- Total Orders
- Total Spent
- First Order Date
- Last Order Date
- Service Types (comma-separated)
- Delivery Addresses (comma-separated)

---

## Data Quality Considerations

### Current Limitations

1. **No Customer Master Table**
   - Customer data is duplicated across multiple orders
   - No single source of truth for customer information
   - Changes to customer info (e.g., phone number) create new customer records

2. **Name Variations**
   - "John Smith" vs "John A. Smith" = 2 different customers
   - Typos in names create duplicate customer records
   - No name normalization or matching

3. **Contact Number Issues**
   - Different formats: "+63-912-345-6789" vs "09123456789" = 2 customers
   - No phone number normalization or validation

4. **No Customer History Tracking**
   - Cannot track changes to customer preferences over time
   - No customer lifecycle management

5. **Limited Customer Segmentation**
   - Basic metrics only (order count, total spent)
   - No advanced segmentation (VIP, at-risk, churned)
   - No customer lifetime value (CLV) calculations

---

## Recommendations for Improvement

### Short-Term (Quick Wins)

1. **Add Phone Number Normalization**
   ```sql
   -- Create function to normalize phone numbers
   CREATE FUNCTION normalize_phone(phone text) RETURNS text AS $$
   BEGIN
     RETURN regexp_replace(phone, '[^0-9]', '', 'g');
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Add Customer Index**
   ```sql
   CREATE INDEX idx_orders_customer_lookup 
   ON orders(customer_name, contact_number, created_at DESC);
   ```

3. **Implement Customer Search**
   - Add fuzzy name matching
   - Add phone number search with normalization

### Medium-Term (Architectural Changes)

1. **Create Dedicated Customers Table**
   ```sql
   CREATE TABLE customers (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text NOT NULL,
     contact_number text NOT NULL UNIQUE,
     email text,
     preferred_service_type text,
     total_orders integer DEFAULT 0,
     total_spent numeric(12,2) DEFAULT 0,
     first_order_date timestamptz,
     last_order_date timestamptz,
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );
   ```

2. **Add Customer Addresses Table**
   ```sql
   CREATE TABLE customer_addresses (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     customer_id uuid REFERENCES customers(id),
     label text, -- "Home", "Work", etc.
     address text NOT NULL,
     is_default boolean DEFAULT false,
     created_at timestamptz DEFAULT now()
   );
   ```

3. **Add Customer Segmentation**
   - VIP customers (top 10% by revenue)
   - Repeat customers (3+ orders)
   - At-risk customers (no orders in 90 days)
   - New customers (first order in last 30 days)

### Long-Term (Advanced Features)

1. **Customer Loyalty Program**
   - Points system
   - Rewards and discounts
   - Referral tracking

2. **Customer Communication**
   - SMS notifications for order updates
   - Email marketing campaigns
   - Push notifications

3. **Advanced Analytics**
   - Customer lifetime value (CLV)
   - Customer acquisition cost (CAC)
   - Churn prediction
   - Purchase behavior analysis

4. **Customer Relationship Management (CRM)**
   - Interaction history
   - Notes and tags
   - Customer service tickets
   - Feedback and reviews

---

## Current Customer Data Flow

```
1. Customer Places Order
   ↓
2. Order Created in `orders` table
   ├─ customer_name
   ├─ contact_number
   ├─ service_type
   ├─ address
   └─ payment_method
   ↓
3. Order Items Created in `order_items` table
   └─ Linked via order_id
   ↓
4. CustomersManager Aggregates Data
   ├─ Groups by name + contact_number
   ├─ Calculates metrics
   └─ Displays in dashboard
   ↓
5. Customer Profile View
   └─ Shows all orders and statistics
```

---

## Database Indexes

Current indexes for customer-related queries:

```sql
-- Order creation timestamp (for chronological ordering)
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- IP-based rate limiting
CREATE INDEX idx_orders_ip_created_at ON orders(ip_address, created_at DESC);

-- Receipt URL lookup
CREATE INDEX idx_orders_receipt_url ON orders(receipt_url) WHERE receipt_url IS NOT NULL;

-- Order items lookup
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

**Missing Indexes:**
- Customer lookup by name and contact number
- Service type filtering
- Status filtering

---

## Data Privacy & Compliance

### Current State
- Customer data stored in plain text
- No data encryption at rest
- No data retention policies
- No GDPR/CCPA compliance features

### Recommendations
1. **Add Data Encryption**
   - Encrypt sensitive fields (phone numbers, addresses)
   - Use Supabase encryption features

2. **Implement Data Retention**
   - Archive old orders after X years
   - Anonymize customer data after inactivity period

3. **Add Privacy Controls**
   - Customer data export (GDPR right to data portability)
   - Customer data deletion (GDPR right to be forgotten)
   - Consent management

---

## Performance Considerations

### Current Query Patterns

**Customer Lookup (Most Common)**
```sql
-- CustomersManager aggregates all orders
SELECT * FROM orders ORDER BY created_at DESC;
-- Then groups by customer in application code
```

**Performance Impact:**
- Loads ALL orders into memory
- Grouping done in JavaScript (not optimized)
- No pagination for large datasets

### Optimization Strategies

1. **Add Database-Level Aggregation**
   ```sql
   CREATE VIEW customer_summary AS
   SELECT 
     customer_name,
     contact_number,
     COUNT(*) as order_count,
     SUM(total) as total_spent,
     MIN(created_at) as first_order,
     MAX(created_at) as last_order
   FROM orders
   GROUP BY customer_name, contact_number;
   ```

2. **Implement Pagination**
   - Load customers in batches of 50
   - Use cursor-based pagination for better performance

3. **Add Caching**
   - Cache customer summaries
   - Refresh every 5 minutes
   - Invalidate on new order

---

## Monitoring & Alerts

### Recommended Metrics to Track

1. **Customer Metrics**
   - New customers per day/week/month
   - Repeat customer rate
   - Average orders per customer
   - Customer acquisition rate
   - Customer churn rate

2. **Revenue Metrics**
   - Revenue per customer
   - Average order value
   - Customer lifetime value
   - Revenue by customer segment

3. **Service Metrics**
   - Orders by service type
   - Most popular service type
   - Service type preferences by customer

### Recommended Alerts

1. **High-Value Customer Alerts**
   - VIP customer places order
   - Customer reaches milestone (10th order, etc.)

2. **At-Risk Customer Alerts**
   - Customer hasn't ordered in 60 days
   - Customer order frequency declining

3. **Data Quality Alerts**
   - Duplicate customer records detected
   - Invalid phone numbers
   - Missing customer information

---

## Conclusion

The current customer database design is **functional but not optimal** for long-term customer relationship management. While it works for a simple ordering system, it lacks:

- ❌ Dedicated customer records
- ❌ Customer data normalization
- ❌ Advanced customer analytics
- ❌ Customer segmentation
- ❌ Data quality controls

**Recommended Next Steps:**
1. ✅ Document current state (this analysis)
2. 🔄 Implement phone number normalization
3. 🔄 Add customer lookup index
4. 📋 Plan migration to dedicated customers table
5. 📋 Implement customer segmentation
6. 📋 Add advanced analytics

---

## Appendix: Database Schema Reference

### Complete Orders Table Schema

```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('dine-in','pickup','delivery')),
  address text,
  pickup_time text,
  party_size integer,
  dine_in_time timestamptz,
  payment_method text NOT NULL,
  reference_number text,
  notes text,
  total numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  ip_address text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Complete Order Items Table Schema

```sql
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  name text NOT NULL,
  variation jsonb,
  add_ons jsonb,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Author:** AI Assistant  
**Project:** ClickEats Template 2

