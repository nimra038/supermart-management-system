-- =========================================
-- CORE BUSINESS & ACCESS CONTROL
-- =========================================

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  logo_url text,
  tax_rate numeric(5,2) not null default 0,
  currency text not null default 'PKR',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.users (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid not null unique
    references auth.users(id) on delete cascade,

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  full_name text not null,
  phone text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null
    references public.users(id) on delete cascade,

  role_id uuid not null
    references public.roles(id) on delete cascade,

  created_at timestamptz not null default now(),

  primary key (user_id, role_id)
);
-- =========================================
-- EMPLOYEES & ATTENDANCE
-- =========================================

create table public.employees (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  user_id uuid unique
    references public.users(id) on delete set null,

  employee_code text not null,

  full_name text not null,
  phone text,
  designation text,

  salary numeric(12,2),

  joining_date date,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, employee_code)
);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  employee_id uuid not null
    references public.employees(id) on delete cascade,

  clock_in timestamptz not null default now(),
  clock_out timestamptz,

  notes text,

  created_at timestamptz not null default now()
);

-- =========================================
-- PRODUCT CATALOG
-- =========================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  name text not null,
  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, name)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  name text not null,
  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  category_id uuid
    references public.categories(id) on delete set null,

  brand_id uuid
    references public.brands(id) on delete set null,

  name text not null,
  barcode text not null,
  sku text,

  cost_price numeric(12,2) not null default 0,
  retail_price numeric(12,2) not null default 0,
  bulk_price numeric(12,2),

  reorder_level numeric(12,3) not null default 0,

  track_expiry boolean not null default false,

  unit text not null default 'piece',

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, barcode),
  unique (business_id, sku)
);
-- =========================================
-- SUPPLIERS & PURCHASING
-- =========================================

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  name text not null,
  phone text,
  email text,
  address text,
  ntn text,

  opening_balance numeric(12,2) not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, name)
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  supplier_id uuid not null
    references public.suppliers(id) on delete restrict,

  order_number text not null,

  status text not null default 'PENDING'
    check (status in (
      'PENDING',
      'PARTIALLY_RECEIVED',
      'FULLY_RECEIVED',
      'CANCELLED'
    )),

  order_date date not null default current_date,
  expected_delivery_date date,

  notes text,

  created_by uuid
    references public.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, order_number)
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),

  purchase_order_id uuid not null
    references public.purchase_orders(id) on delete cascade,

  product_id uuid not null
    references public.products(id) on delete restrict,

  ordered_quantity numeric(12,3) not null
    check (ordered_quantity > 0),

  received_quantity numeric(12,3) not null default 0
    check (received_quantity >= 0),

  unit_cost numeric(12,2) not null
    check (unit_cost >= 0),

  created_at timestamptz not null default now(),

  unique (purchase_order_id, product_id),

  check (received_quantity <= ordered_quantity)
);

create table public.goods_receipts (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  purchase_order_id uuid not null
    references public.purchase_orders(id) on delete restrict,

  receipt_number text not null,

  received_at timestamptz not null default now(),

  received_by uuid
    references public.users(id) on delete set null,

  notes text,

  created_at timestamptz not null default now(),

  unique (business_id, receipt_number)
);

create table public.goods_receipt_items (
  id uuid primary key default gen_random_uuid(),

  goods_receipt_id uuid not null
    references public.goods_receipts(id) on delete cascade,

  purchase_order_item_id uuid not null
    references public.purchase_order_items(id) on delete restrict,

  product_id uuid not null
    references public.products(id) on delete restrict,

  received_quantity numeric(12,3) not null
    check (received_quantity > 0),

  unit_cost numeric(12,2) not null
    check (unit_cost >= 0),

  batch_number text,
  expiry_date date,

  created_at timestamptz not null default now()
);

create table public.supplier_payments (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  supplier_id uuid not null
    references public.suppliers(id) on delete restrict,

  purchase_order_id uuid
    references public.purchase_orders(id) on delete set null,

  amount numeric(12,2) not null
    check (amount > 0),

  payment_method text not null
    check (payment_method in (
      'CASH',
      'BANK_TRANSFER',
      'CARD',
      'JAZZCASH',
      'EASYPAISA',
      'OTHER'
    )),

  reference_number text,
  notes text,

  payment_date date not null default current_date,

  recorded_by uuid
    references public.users(id) on delete set null,

  created_at timestamptz not null default now()
);
-- =========================================
-- INVENTORY
-- =========================================

create table public.inventory_batches (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  product_id uuid not null
    references public.products(id) on delete restrict,

  supplier_id uuid
    references public.suppliers(id) on delete set null,

  goods_receipt_item_id uuid
    references public.goods_receipt_items(id) on delete set null,

  batch_number text,

  received_quantity numeric(12,3) not null
    check (received_quantity > 0),

  remaining_quantity numeric(12,3) not null
    check (remaining_quantity >= 0),

  unit_cost numeric(12,2) not null
    check (unit_cost >= 0),

  expiry_date date,

  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  check (remaining_quantity <= received_quantity)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  product_id uuid not null
    references public.products(id) on delete restrict,

  batch_id uuid
    references public.inventory_batches(id) on delete set null,

  movement_type text not null
    check (movement_type in (
      'PURCHASE',
      'SALE',
      'RETURN',
      'DAMAGE',
      'WASTAGE',
      'ADJUSTMENT_IN',
      'ADJUSTMENT_OUT'
    )),

  quantity_change numeric(12,3) not null
    check (quantity_change <> 0),

  reference_type text,
  reference_id uuid,

  reason text,

  performed_by uuid
    references public.users(id) on delete set null,

  created_at timestamptz not null default now()
);
-- =========================================
-- CUSTOMERS & SALES
-- =========================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  name text not null,
  phone text,
  email text,
  address text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, phone)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  customer_id uuid
    references public.customers(id) on delete set null,

  cashier_user_id uuid
    references public.users(id) on delete set null,

  invoice_number text not null,

  status text not null default 'COMPLETED'
    check (status in (
      'DRAFT',
      'COMPLETED',
      'REFUNDED',
      'PARTIALLY_REFUNDED',
      'CANCELLED'
    )),

  subtotal numeric(12,2) not null default 0
    check (subtotal >= 0),

  discount_amount numeric(12,2) not null default 0
    check (discount_amount >= 0),

  tax_amount numeric(12,2) not null default 0
    check (tax_amount >= 0),

  total_amount numeric(12,2) not null default 0
    check (total_amount >= 0),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, invoice_number)
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),

  sale_id uuid not null
    references public.sales(id) on delete cascade,

  product_id uuid not null
    references public.products(id) on delete restrict,

  product_name text not null,

  quantity numeric(12,3) not null
    check (quantity > 0),

  unit_price numeric(12,2) not null
    check (unit_price >= 0),

  unit_cost numeric(12,2) not null
    check (unit_cost >= 0),

  discount_amount numeric(12,2) not null default 0
    check (discount_amount >= 0),

  line_total numeric(12,2) not null
    check (line_total >= 0),

  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),

  sale_id uuid not null
    references public.sales(id) on delete cascade,

  payment_method text not null
    check (payment_method in (
      'CASH',
      'CARD',
      'JAZZCASH',
      'EASYPAISA'
    )),

  amount numeric(12,2) not null
    check (amount > 0),

  reference_number text,

  created_at timestamptz not null default now()
);

-- =========================================
-- RETURNS
-- =========================================

create table public.returns (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  sale_id uuid not null
    references public.sales(id) on delete restrict,

  processed_by uuid
    references public.users(id) on delete set null,

  return_number text not null,

  refund_amount numeric(12,2) not null default 0
    check (refund_amount >= 0),

  reason text,

  created_at timestamptz not null default now(),

  unique (business_id, return_number)
);

create table public.return_items (
  id uuid primary key default gen_random_uuid(),

  return_id uuid not null
    references public.returns(id) on delete cascade,

  sale_item_id uuid not null
    references public.sale_items(id) on delete restrict,

  product_id uuid not null
    references public.products(id) on delete restrict,

  quantity numeric(12,3) not null
    check (quantity > 0),

  refund_amount numeric(12,2) not null
    check (refund_amount >= 0),

  condition text not null
    check (condition in (
      'RESTOCKABLE',
      'DAMAGED'
    )),

  created_at timestamptz not null default now()
);
-- =========================================
-- PROMOTIONS
-- =========================================

create table public.promotions (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  name text not null,

  discount_type text not null
    check (discount_type in (
      'PERCENTAGE',
      'FIXED'
    )),

  discount_value numeric(12,2) not null
    check (discount_value > 0),

  start_at timestamptz,
  end_at timestamptz,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    end_at is null
    or start_at is null
    or end_at > start_at
  )
);

create table public.promotion_products (
  promotion_id uuid not null
    references public.promotions(id) on delete cascade,

  product_id uuid not null
    references public.products(id) on delete cascade,

  created_at timestamptz not null default now(),

  primary key (promotion_id, product_id)
);

create table public.promotion_categories (
  promotion_id uuid not null
    references public.promotions(id) on delete cascade,

  category_id uuid not null
    references public.categories(id) on delete cascade,

  created_at timestamptz not null default now(),

  primary key (promotion_id, category_id)
);

-- =========================================
-- EXPENSES
-- =========================================

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  name text not null,
  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, name)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  category_id uuid
    references public.expense_categories(id) on delete set null,

  amount numeric(12,2) not null
    check (amount > 0),

  description text,

  expense_date date not null default current_date,

  recorded_by uuid
    references public.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- WASTAGE
-- =========================================

create table public.wastage (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  product_id uuid not null
    references public.products(id) on delete restrict,

  batch_id uuid
    references public.inventory_batches(id) on delete set null,

  quantity numeric(12,3) not null
    check (quantity > 0),

  reason text not null
    check (reason in (
      'EXPIRED',
      'DAMAGED',
      'THEFT',
      'SPOILAGE',
      'OTHER'
    )),

  notes text,

  cost_value numeric(12,2) not null default 0
    check (cost_value >= 0),

  recorded_by uuid
    references public.users(id) on delete set null,

  created_at timestamptz not null default now()
);

-- =========================================
-- DAY CLOSING
-- =========================================

create table public.day_closings (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  closing_date date not null,

  total_sales numeric(12,2) not null default 0
    check (total_sales >= 0),

  cash_sales numeric(12,2) not null default 0
    check (cash_sales >= 0),

  card_sales numeric(12,2) not null default 0
    check (card_sales >= 0),

  digital_sales numeric(12,2) not null default 0
    check (digital_sales >= 0),

  total_returns numeric(12,2) not null default 0
    check (total_returns >= 0),

  total_expenses numeric(12,2) not null default 0
    check (total_expenses >= 0),

  gross_profit numeric(12,2) not null default 0,
  net_profit numeric(12,2) not null default 0,

  closed_by uuid
    references public.users(id) on delete set null,

  closed_at timestamptz not null default now(),

  unique (business_id, closing_date)
);

-- =========================================
-- AUDIT LOGS
-- =========================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete restrict,

  user_id uuid
    references public.users(id) on delete set null,

  action text not null,

  entity_type text not null,
  entity_id uuid,

  old_data jsonb,
  new_data jsonb,

  ip_address text,

  created_at timestamptz not null default now()
);

-- =========================================
-- SETTINGS
-- =========================================

create table public.settings (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  setting_key text not null,
  setting_value jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, setting_key)
);
-- =========================================
-- DEFAULT ROLES
-- =========================================

insert into public.roles (name, description)
values
  ('OWNER', 'Full business access'),
  ('MANAGER', 'Operational management access'),
  ('CASHIER', 'POS and billing access'),
  ('STOCK_KEEPER', 'Inventory and stock management access');


-- =========================================
-- DEFAULT PERMISSIONS
-- =========================================

insert into public.permissions (code, description)
values
  ('product.view', 'View products'),
  ('product.create', 'Create products'),
  ('product.update', 'Update products'),

  ('sale.create', 'Create sales'),
  ('sale.view', 'View sales'),
  ('sale.refund', 'Process returns and refunds'),

  ('inventory.view', 'View inventory'),
  ('inventory.adjust', 'Adjust inventory'),

  ('purchase.view', 'View purchase orders'),
  ('purchase.create', 'Create purchase orders'),
  ('purchase.receive', 'Receive purchase orders'),

  ('customer.manage', 'Manage customers'),

  ('employee.manage', 'Manage employees'),
  ('attendance.manage', 'Manage attendance'),

  ('expense.manage', 'Manage expenses'),
  ('wastage.manage', 'Manage wastage'),

  ('report.view', 'View reports'),

  ('user.manage', 'Manage users and roles'),
  ('settings.manage', 'Manage business settings');


-- =========================================
-- ROLE PERMISSION MAPPINGS
-- =========================================

-- OWNER gets all permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'OWNER';


-- MANAGER
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.code in (
    'product.view',
    'product.create',
    'product.update',

    'sale.create',
    'sale.view',
    'sale.refund',

    'inventory.view',
    'inventory.adjust',

    'purchase.view',
    'purchase.create',
    'purchase.receive',

    'customer.manage',

    'employee.manage',
    'attendance.manage',

    'expense.manage',
    'wastage.manage',

    'report.view'
  )
where r.name = 'MANAGER';


-- CASHIER
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.code in (
    'product.view',
    'sale.create',
    'sale.view',
    'customer.manage'
  )
where r.name = 'CASHIER';


-- STOCK KEEPER
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.code in (
    'product.view',
    'product.create',
    'product.update',

    'inventory.view',
    'inventory.adjust',

    'purchase.view',
    'purchase.receive',

    'wastage.manage'
  )
where r.name = 'STOCK_KEEPER';
-- =========================================
-- UPDATED_AT FUNCTION
-- =========================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =========================================
-- UPDATED_AT TRIGGERS
-- =========================================

create trigger set_businesses_updated_at
before update on public.businesses
for each row
execute function public.set_updated_at();

create trigger set_roles_updated_at
before update on public.roles
for each row
execute function public.set_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create trigger set_employees_updated_at
before update on public.employees
for each row
execute function public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create trigger set_brands_updated_at
before update on public.brands
for each row
execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger set_suppliers_updated_at
before update on public.suppliers
for each row
execute function public.set_updated_at();

create trigger set_purchase_orders_updated_at
before update on public.purchase_orders
for each row
execute function public.set_updated_at();

create trigger set_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create trigger set_sales_updated_at
before update on public.sales
for each row
execute function public.set_updated_at();

create trigger set_promotions_updated_at
before update on public.promotions
for each row
execute function public.set_updated_at();

create trigger set_expense_categories_updated_at
before update on public.expense_categories
for each row
execute function public.set_updated_at();

create trigger set_expenses_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

create trigger set_settings_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();
-- =========================================
-- INDEXES
-- =========================================

create index idx_products_business_id
on public.products (business_id);

create index idx_products_barcode
on public.products (barcode);

create index idx_products_category_id
on public.products (category_id);

create index idx_inventory_batches_product_id
on public.inventory_batches (product_id);

create index idx_inventory_batches_expiry_date
on public.inventory_batches (expiry_date);

create index idx_inventory_movements_product_id
on public.inventory_movements (product_id);

create index idx_inventory_movements_created_at
on public.inventory_movements (created_at);

create index idx_sales_business_id
on public.sales (business_id);

create index idx_sales_created_at
on public.sales (created_at);

create index idx_sales_cashier_user_id
on public.sales (cashier_user_id);

create index idx_sale_items_sale_id
on public.sale_items (sale_id);

create index idx_payments_sale_id
on public.payments (sale_id);

create index idx_purchase_orders_supplier_id
on public.purchase_orders (supplier_id);

create index idx_purchase_orders_status
on public.purchase_orders (status);

create index idx_purchase_order_items_purchase_order_id
on public.purchase_order_items (purchase_order_id);

create index idx_goods_receipts_purchase_order_id
on public.goods_receipts (purchase_order_id);

create index idx_expenses_business_date
on public.expenses (business_id, expense_date);

create index idx_attendance_employee_id
on public.attendance_sessions (employee_id);

create index idx_audit_logs_business_created
on public.audit_logs (business_id, created_at);
-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

alter table public.businesses enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;

alter table public.employees enable row level security;
alter table public.attendance_sessions enable row level security;

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;

alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.goods_receipts enable row level security;
alter table public.goods_receipt_items enable row level security;
alter table public.supplier_payments enable row level security;

alter table public.inventory_batches enable row level security;
alter table public.inventory_movements enable row level security;

alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;

alter table public.returns enable row level security;
alter table public.return_items enable row level security;

alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
alter table public.promotion_categories enable row level security;

alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.wastage enable row level security;

alter table public.day_closings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings enable row level security;

