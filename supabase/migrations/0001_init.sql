-- Rasa (رَسا) MVP Full Schema: Multi-Tenancy, Cardex, Double-Entry ERP, BNPL, Sales Returns, Cheques, Expenses & Multi-Carrier Shipping (incl. Mahex)
-- Run this once in Supabase Dashboard -> SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tenants (فروشگاه‌ها و تنظیمات فرستنده)
CREATE TABLE IF NOT EXISTS tenants (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                    VARCHAR(63) UNIQUE NOT NULL,
    name                    VARCHAR(160) NOT NULL,
    tax_rate                NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    shipping_wallet_balance BIGINT NOT NULL DEFAULT 5000000,
    sender_phone            VARCHAR(24),
    sender_postal_code      VARCHAR(20),
    sender_address          TEXT,
    bank_card_number        VARCHAR(24),
    enamad_code             TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tenant Users
CREATE TABLE IF NOT EXISTS tenant_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     VARCHAR(160) NOT NULL DEFAULT 'مدیر فروشگاه',
    role          VARCHAR(24) NOT NULL DEFAULT 'OWNER',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

-- 3. Products & Variants
CREATE TABLE IF NOT EXISTS products (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) NOT NULL,
    category_name VARCHAR(120) NOT NULL DEFAULT 'عمومی',
    image_url     TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS product_variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku             VARCHAR(64) NOT NULL,
    barcode         VARCHAR(64),
    attributes      JSONB NOT NULL DEFAULT '{}',
    retail_price    BIGINT NOT NULL CHECK (retail_price >= 0),
    wholesale_price BIGINT,
    weight_grams    INT NOT NULL DEFAULT 500,
    reorder_point   INT NOT NULL DEFAULT 5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, sku)
);

-- 4. Stock Balances, Reservations & Append-Only Inventory Cardex
CREATE TABLE IF NOT EXISTS stock_balances (
    variant_id    UUID PRIMARY KEY REFERENCES product_variants(id) ON DELETE CASCADE,
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    physical_qty  INT NOT NULL DEFAULT 0 CHECK (physical_qty >= 0),
    reserved_qty  INT NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
    avg_unit_cost BIGINT NOT NULL DEFAULT 0 CHECK (avg_unit_cost >= 0),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_cardex (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    variant_id     UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    movement_type  VARCHAR(24) NOT NULL CHECK (movement_type IN ('PURCHASE_IN', 'ONLINE_OUT', 'POS_OUT', 'RETURN_IN', 'ADJUSTMENT')),
    qty_delta      INT NOT NULL,
    unit_cost      BIGINT NOT NULL DEFAULT 0,
    balance_after  INT NOT NULL,
    reference_type VARCHAR(32) NOT NULL,
    reference_id   UUID NOT NULL,
    note           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Double-Entry Accounting, Cheques & Expenses
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code         VARCHAR(20) NOT NULL,
    name         VARCHAR(120) NOT NULL,
    account_type VARCHAR(16) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entry_number BIGINT NOT NULL,
    entry_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    description  TEXT NOT NULL,
    source_type  VARCHAR(32) NOT NULL,
    source_id    UUID NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, entry_number)
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id         BIGSERIAL PRIMARY KEY,
    journal_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit      BIGINT NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit     BIGINT NOT NULL DEFAULT 0 CHECK (credit >= 0),
    CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

CREATE TABLE IF NOT EXISTS cheques (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    direction     VARCHAR(16) NOT NULL CHECK (direction IN ('INCOMING', 'OUTGOING')),
    cheque_number VARCHAR(40) NOT NULL,
    sayadi_id     VARCHAR(32),
    party_name    VARCHAR(160) NOT NULL,
    amount        BIGINT NOT NULL CHECK (amount > 0),
    due_date      DATE NOT NULL,
    status        VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CLEARED', 'BOUNCED')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category       VARCHAR(80) NOT NULL,
    title          VARCHAR(200) NOT NULL,
    amount         BIGINT NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(24) NOT NULL DEFAULT 'CASH',
    expense_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Orders & Order Items (Online, POS, BNPL & Multi-Carrier Shipping)
CREATE TABLE IF NOT EXISTS orders (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number         BIGINT NOT NULL,
    channel              VARCHAR(16) NOT NULL CHECK (channel IN ('ONLINE', 'POS')),
    payment_method       VARCHAR(24) NOT NULL CHECK (payment_method IN ('ONLINE_GATEWAY', 'BNPL', 'POS_CARD', 'CASH', 'CARD_TO_CARD')),
    bnpl_provider        VARCHAR(24),
    bnpl_installments    INT DEFAULT 1,
    customer_name        VARCHAR(160) NOT NULL DEFAULT 'مشتری حضوری',
    customer_mobile      VARCHAR(20),
    shipping_carrier     VARCHAR(24) NOT NULL DEFAULT 'PISHTAZ',
    shipping_status      VARCHAR(24) NOT NULL DEFAULT 'PENDING_PACK',
    tracking_barcode     VARCHAR(40),
    receiver_postal_code VARCHAR(20),
    receiver_address     TEXT,
    total_weight_grams   INT NOT NULL DEFAULT 0,
    status               VARCHAR(24) NOT NULL DEFAULT 'COMPLETED',
    subtotal             BIGINT NOT NULL DEFAULT 0,
    tax_amount           BIGINT NOT NULL DEFAULT 0,
    shipping_cost        BIGINT NOT NULL DEFAULT 0,
    total_amount         BIGINT NOT NULL DEFAULT 0,
    total_cogs           BIGINT NOT NULL DEFAULT 0,
    refunded_amount      BIGINT NOT NULL DEFAULT 0,
    idempotency_key      VARCHAR(120) UNIQUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, order_number)
);

CREATE TABLE IF NOT EXISTS order_items (
    id         BIGSERIAL PRIMARY KEY,
    order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    title      VARCHAR(255) NOT NULL,
    qty        INT NOT NULL CHECK (qty > 0),
    unit_price BIGINT NOT NULL,
    unit_cost  BIGINT NOT NULL
);

-- Safe ALTERs for existing databases
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS shipping_wallet_balance BIGINT NOT NULL DEFAULT 5000000;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(24);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sender_postal_code VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sender_address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_card_number VARCHAR(24);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS enamad_code TEXT;
ALTER TABLE stock_balances ADD COLUMN IF NOT EXISTS reserved_qty INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bnpl_provider VARCHAR(24);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bnpl_installments INT DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(24) NOT NULL DEFAULT 'PISHTAZ';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(24) NOT NULL DEFAULT 'PENDING_PACK';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_barcode VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receiver_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receiver_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_weight_grams INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount BIGINT NOT NULL DEFAULT 0;

-- Refresh payment_method check constraint to include BNPL
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('ONLINE_GATEWAY', 'BNPL', 'POS_CARD', 'CASH', 'CARD_TO_CARD'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variants_tenant_barcode ON product_variants(tenant_id, barcode);
CREATE INDEX IF NOT EXISTS idx_cardex_variant ON inventory_cardex(tenant_id, variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_cardex ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_tenants') THEN
        CREATE POLICY public_read_tenants ON tenants FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_products') THEN
        CREATE POLICY public_read_products ON products FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_variants') THEN
        CREATE POLICY public_read_variants ON product_variants FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_stock') THEN
        CREATE POLICY public_read_stock ON stock_balances FOR SELECT USING (true);
    END IF;
END $$;

-- Helper to ensure new Chart of Accounts codes exist even on older tenants
CREATE OR REPLACE FUNCTION ensure_rasa_accounts(p_tenant_id UUID) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO chart_of_accounts (tenant_id, code, name, account_type) VALUES
        (p_tenant_id, '1101', 'بانک و درگاه پرداخت آنلاین', 'ASSET'),
        (p_tenant_id, '1102', 'صندوق نقدی فروشگاه', 'ASSET'),
        (p_tenant_id, '1201', 'موجودی کالای انبار', 'ASSET'),
        (p_tenant_id, '2101', 'حساب‌های پرداختنی تامین‌کنندگان', 'LIABILITY'),
        (p_tenant_id, '2201', 'مالیات بر ارزش افزوده پرداختنی', 'LIABILITY'),
        (p_tenant_id, '4101', 'درآمد فروش کالا', 'REVENUE'),
        (p_tenant_id, '4102', 'درآمد هزینه ارسال و پست', 'REVENUE'),
        (p_tenant_id, '4103', 'برگشت از فروش کالا', 'REVENUE'),
        (p_tenant_id, '5101', 'بهای تمام‌شده کالای فروش‌رفته (COGS)', 'EXPENSE'),
        (p_tenant_id, '6101', 'هزینه‌های جاری و عملیاتی فروشگاه', 'EXPENSE')
    ON CONFLICT (tenant_id, code) DO NOTHING;
END;
$$;

-- Atomic RPC 1: Zero-Touch Tenant Provisioning
CREATE OR REPLACE FUNCTION provision_rasa_tenant(
    p_name TEXT,
    p_slug TEXT,
    p_email TEXT,
    p_password_hash TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_prod1 UUID;
    v_prod2 UUID;
    v_var1 UUID;
    v_var2 UUID;
    v_purchase_ref UUID := gen_random_uuid();
BEGIN
    INSERT INTO tenants (name, slug, shipping_wallet_balance)
    VALUES (p_name, lower(trim(p_slug)), 5000000)
    RETURNING id INTO v_tenant_id;

    INSERT INTO tenant_users (tenant_id, email, password_hash, full_name, role)
    VALUES (v_tenant_id, lower(trim(p_email)), p_password_hash, 'مدیر ' || p_name, 'OWNER');

    PERFORM ensure_rasa_accounts(v_tenant_id);

    INSERT INTO products (tenant_id, title, slug, category_name, image_url)
    VALUES (v_tenant_id, 'کتانی رانینگ رَسا مدل پرو', 'rasa-running-pro', 'کفش و پوشاک', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600')
    RETURNING id INTO v_prod1;

    INSERT INTO product_variants (tenant_id, product_id, sku, barcode, attributes, retail_price, wholesale_price, weight_grams)
    VALUES (v_tenant_id, v_prod1, 'SHOE-BLK-42', '626000010001', '{"رنگ": "قرمز/مشکی", "سایز": "۴۲"}'::jsonb, 28500000, 24000000, 750)
    RETURNING id INTO v_var1;

    INSERT INTO products (tenant_id, title, slug, category_name, image_url)
    VALUES (v_tenant_id, 'ساعت هوشمند رَسا واچ الترا', 'rasa-watch-ultra', 'لوازم جانبی دیجیتال', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600')
    RETURNING id INTO v_prod2;

    INSERT INTO product_variants (tenant_id, product_id, sku, barcode, attributes, retail_price, wholesale_price, weight_grams)
    VALUES (v_tenant_id, v_prod2, 'WATCH-SLV-01', '626000010002', '{"رنگ": "نقره‌ای", "بند": "سیلیکونی"}'::jsonb, 42000000, 36500000, 300)
    RETURNING id INTO v_var2;

    INSERT INTO stock_balances (variant_id, tenant_id, physical_qty, avg_unit_cost) VALUES
        (v_var1, v_tenant_id, 15, 19000000),
        (v_var2, v_tenant_id, 10, 29000000);

    INSERT INTO inventory_cardex (tenant_id, variant_id, movement_type, qty_delta, unit_cost, balance_after, reference_type, reference_id, note) VALUES
        (v_tenant_id, v_var1, 'PURCHASE_IN', 15, 19000000, 15, 'INITIAL_SEED', v_purchase_ref, 'موجودی اولیه تست'),
        (v_tenant_id, v_var2, 'PURCHASE_IN', 10, 29000000, 10, 'INITIAL_SEED', v_purchase_ref, 'موجودی اولیه تست');

    RETURN jsonb_build_object('tenant_id', v_tenant_id, 'slug', lower(trim(p_slug)));
END;
$$;

-- Atomic RPC 2: Purchase Invoice
CREATE OR REPLACE FUNCTION record_purchase_atomic(
    p_tenant_id UUID,
    p_variant_id UUID,
    p_qty INT,
    p_unit_cost BIGINT,
    p_note TEXT DEFAULT 'فاکتور خرید کالا'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_curr_qty INT;
    v_curr_avg BIGINT;
    v_new_qty INT;
    v_new_avg BIGINT;
    v_total_cost BIGINT;
    v_purchase_id UUID := gen_random_uuid();
    v_journal_id UUID;
    v_next_entry BIGINT;
    v_acc_inv UUID;
    v_acc_ap UUID;
BEGIN
    IF p_qty <= 0 OR p_unit_cost < 0 THEN
        RAISE EXCEPTION 'تعداد و قیمت خرید باید معتبر باشد';
    END IF;

    PERFORM ensure_rasa_accounts(p_tenant_id);

    SELECT physical_qty, avg_unit_cost INTO v_curr_qty, v_curr_avg
    FROM stock_balances WHERE tenant_id = p_tenant_id AND variant_id = p_variant_id FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO stock_balances (variant_id, tenant_id, physical_qty, avg_unit_cost)
        VALUES (p_variant_id, p_tenant_id, 0, 0);
        v_curr_qty := 0;
        v_curr_avg := 0;
    END IF;

    v_new_qty := v_curr_qty + p_qty;
    v_new_avg := ROUND(((v_curr_qty::NUMERIC * v_curr_avg::NUMERIC) + (p_qty::NUMERIC * p_unit_cost::NUMERIC)) / v_new_qty::NUMERIC)::BIGINT;
    v_total_cost := p_qty * p_unit_cost;

    UPDATE stock_balances SET physical_qty = v_new_qty, avg_unit_cost = v_new_avg, updated_at = NOW()
    WHERE tenant_id = p_tenant_id AND variant_id = p_variant_id;

    INSERT INTO inventory_cardex (tenant_id, variant_id, movement_type, qty_delta, unit_cost, balance_after, reference_type, reference_id, note)
    VALUES (p_tenant_id, p_variant_id, 'PURCHASE_IN', p_qty, p_unit_cost, v_new_qty, 'PURCHASE_INVOICE', v_purchase_id, p_note);

    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_next_entry FROM journal_entries WHERE tenant_id = p_tenant_id;
    INSERT INTO journal_entries (tenant_id, entry_number, description, source_type, source_id)
    VALUES (p_tenant_id, v_next_entry, p_note, 'PURCHASE', v_purchase_id) RETURNING id INTO v_journal_id;

    SELECT id INTO v_acc_inv FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '1201';
    SELECT id INTO v_acc_ap FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '2101';

    IF v_total_cost > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES
            (v_journal_id, v_acc_inv, v_total_cost, 0),
            (v_journal_id, v_acc_ap, 0, v_total_cost);
    END IF;

    RETURN jsonb_build_object('new_qty', v_new_qty, 'new_avg_cost', v_new_avg, 'journal_id', v_journal_id);
END;
$$;

-- Atomic RPC 3: Finalize Sale (Online, BNPL or POS)
CREATE OR REPLACE FUNCTION finalize_sale_atomic(
    p_tenant_id UUID,
    p_channel TEXT,
    p_payment_method TEXT,
    p_customer_name TEXT,
    p_customer_mobile TEXT,
    p_shipping_cost BIGINT,
    p_items JSONB,
    p_idempotency_key TEXT DEFAULT NULL,
    p_shipping_carrier TEXT DEFAULT 'PISHTAZ',
    p_receiver_postal_code TEXT DEFAULT NULL,
    p_receiver_address TEXT DEFAULT NULL,
    p_tracking_barcode TEXT DEFAULT NULL,
    p_bnpl_provider TEXT DEFAULT NULL,
    p_bnpl_installments INT DEFAULT 1
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_order UUID;
    v_order_id UUID;
    v_next_order_num BIGINT;
    v_next_entry BIGINT;
    v_journal_id UUID;
    v_tax_rate NUMERIC;
    v_subtotal BIGINT := 0;
    v_tax_amount BIGINT := 0;
    v_total_amount BIGINT := 0;
    v_total_cogs BIGINT := 0;
    v_total_weight INT := 0;
    v_item JSONB;
    v_var_id UUID;
    v_qty INT;
    v_unit_price BIGINT;
    v_weight INT;
    v_title TEXT;
    v_curr_qty INT;
    v_avg_cost BIGINT;
    v_new_qty INT;
    v_movement_type TEXT;
    v_acc_cash UUID;
    v_acc_rev UUID;
    v_acc_tax UUID;
    v_acc_ship UUID;
    v_acc_cogs UUID;
    v_acc_inv UUID;
BEGIN
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_order FROM orders WHERE idempotency_key = p_idempotency_key;
        IF FOUND THEN
            RETURN jsonb_build_object('order_id', v_existing_order, 'idempotent', true);
        END IF;
    END IF;

    PERFORM ensure_rasa_accounts(p_tenant_id);
    SELECT tax_rate INTO v_tax_rate FROM tenants WHERE id = p_tenant_id;
    SELECT COALESCE(MAX(order_number), 1000) + 1 INTO v_next_order_num FROM orders WHERE tenant_id = p_tenant_id;

    v_movement_type := CASE WHEN p_channel = 'ONLINE' THEN 'ONLINE_OUT' ELSE 'POS_OUT' END;

    INSERT INTO orders (
        tenant_id, order_number, channel, payment_method, bnpl_provider, bnpl_installments,
        customer_name, customer_mobile, shipping_cost, idempotency_key,
        shipping_carrier, shipping_status, receiver_postal_code, receiver_address, tracking_barcode
    )
    VALUES (
        p_tenant_id, v_next_order_num, p_channel, p_payment_method, p_bnpl_provider, COALESCE(p_bnpl_installments, 1),
        COALESCE(NULLIF(p_customer_name, ''), 'مشتری حضوری'), p_customer_mobile,
        COALESCE(p_shipping_cost, 0), p_idempotency_key,
        COALESCE(p_shipping_carrier, 'PISHTAZ'),
        CASE WHEN p_channel = 'ONLINE' THEN 'PENDING_PACK' ELSE 'DELIVERED' END,
        p_receiver_postal_code, p_receiver_address, p_tracking_barcode
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_var_id := (v_item->>'variant_id')::UUID;
        v_qty := (v_item->>'qty')::INT;

        SELECT pv.retail_price, COALESCE(pv.weight_grams, 500), p.title
        INTO v_unit_price, v_weight, v_title
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE pv.id = v_var_id AND pv.tenant_id = p_tenant_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'کالای انتخاب‌شده یافت نشد';
        END IF;

        SELECT physical_qty, avg_unit_cost INTO v_curr_qty, v_avg_cost
        FROM stock_balances WHERE variant_id = v_var_id AND tenant_id = p_tenant_id FOR UPDATE;

        IF v_curr_qty < v_qty THEN
            RAISE EXCEPTION 'موجودی کالای % کافی نیست (موجود: %)', v_title, v_curr_qty;
        END IF;

        v_new_qty := v_curr_qty - v_qty;

        UPDATE stock_balances SET physical_qty = v_new_qty, updated_at = NOW()
        WHERE variant_id = v_var_id AND tenant_id = p_tenant_id;

        INSERT INTO inventory_cardex (tenant_id, variant_id, movement_type, qty_delta, unit_cost, balance_after, reference_type, reference_id, note)
        VALUES (p_tenant_id, v_var_id, v_movement_type, -v_qty, v_avg_cost, v_new_qty, 'ORDER', v_order_id, 'سفارش #' || v_next_order_num);

        INSERT INTO order_items (order_id, variant_id, title, qty, unit_price, unit_cost)
        VALUES (v_order_id, v_var_id, v_title, v_qty, v_unit_price, v_avg_cost);

        v_subtotal := v_subtotal + (v_qty * v_unit_price);
        v_total_cogs := v_total_cogs + (v_qty * v_avg_cost);
        v_total_weight := v_total_weight + (v_qty * v_weight);
    END LOOP;

    v_tax_amount := ROUND(v_subtotal * (v_tax_rate / 100.0))::BIGINT;
    v_total_amount := v_subtotal + v_tax_amount + COALESCE(p_shipping_cost, 0);

    UPDATE orders
    SET subtotal = v_subtotal, tax_amount = v_tax_amount, total_amount = v_total_amount,
        total_cogs = v_total_cogs, total_weight_grams = v_total_weight
    WHERE id = v_order_id;

    IF p_channel = 'ONLINE' AND COALESCE(p_shipping_cost, 0) > 0 THEN
        UPDATE tenants SET shipping_wallet_balance = GREATEST(0, shipping_wallet_balance - p_shipping_cost)
        WHERE id = p_tenant_id;
    END IF;

    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_next_entry FROM journal_entries WHERE tenant_id = p_tenant_id;
    INSERT INTO journal_entries (tenant_id, entry_number, description, source_type, source_id)
    VALUES (p_tenant_id, v_next_entry, 'سند فروش #' || v_next_order_num || ' (' || p_channel || ')', p_channel || '_ORDER', v_order_id)
    RETURNING id INTO v_journal_id;

    SELECT id INTO v_acc_cash FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = (CASE WHEN p_payment_method = 'CASH' THEN '1102' ELSE '1101' END);
    SELECT id INTO v_acc_rev  FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '4101';
    SELECT id INTO v_acc_tax  FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '2201';
    SELECT id INTO v_acc_ship FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '4102';
    SELECT id INTO v_acc_cogs FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '5101';
    SELECT id INTO v_acc_inv  FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '1201';

    IF v_total_amount > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES (v_journal_id, v_acc_cash, v_total_amount, 0);
    END IF;
    IF v_subtotal > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES (v_journal_id, v_acc_rev, 0, v_subtotal);
    END IF;
    IF v_tax_amount > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES (v_journal_id, v_acc_tax, 0, v_tax_amount);
    END IF;
    IF COALESCE(p_shipping_cost, 0) > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES (v_journal_id, v_acc_ship, 0, p_shipping_cost);
    END IF;
    IF v_total_cogs > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES
            (v_journal_id, v_acc_cogs, v_total_cogs, 0),
            (v_journal_id, v_acc_inv, 0, v_total_cogs);
    END IF;

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_next_order_num,
        'total_amount', v_total_amount,
        'tracking_barcode', p_tracking_barcode
    );
END;
$$;

-- Atomic RPC 4: Sales Return (برگشت از فروش + بازگشت به کاردکس + سند حسابداری معکوس)
CREATE OR REPLACE FUNCTION process_sales_return_atomic(
    p_tenant_id UUID,
    p_order_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_curr_qty INT;
    v_new_qty INT;
    v_next_entry BIGINT;
    v_journal_id UUID;
    v_acc_cash UUID;
    v_acc_ret UUID;
    v_acc_tax UUID;
    v_acc_inv UUID;
    v_acc_cogs UUID;
    v_refund_total BIGINT;
BEGIN
    PERFORM ensure_rasa_accounts(p_tenant_id);

    SELECT * INTO v_order FROM orders WHERE id = p_order_id AND tenant_id = p_tenant_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'سفارش یافت نشد';
    END IF;
    IF v_order.status = 'RETURNED' THEN
        RAISE EXCEPTION 'این سفارش قبلاً مرجوع شده است';
    END IF;

    FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id
    LOOP
        SELECT physical_qty INTO v_curr_qty FROM stock_balances
        WHERE variant_id = v_item.variant_id AND tenant_id = p_tenant_id FOR UPDATE;

        v_new_qty := COALESCE(v_curr_qty, 0) + v_item.qty;
        UPDATE stock_balances SET physical_qty = v_new_qty, updated_at = NOW()
        WHERE variant_id = v_item.variant_id AND tenant_id = p_tenant_id;

        INSERT INTO inventory_cardex (tenant_id, variant_id, movement_type, qty_delta, unit_cost, balance_after, reference_type, reference_id, note)
        VALUES (p_tenant_id, v_item.variant_id, 'RETURN_IN', v_item.qty, v_item.unit_cost, v_new_qty, 'SALES_RETURN', p_order_id, 'مرجوعی سفارش #' || v_order.order_number);
    END LOOP;

    v_refund_total := v_order.subtotal + v_order.tax_amount;
    UPDATE orders SET status = 'RETURNED', refunded_amount = v_refund_total WHERE id = p_order_id;

    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_next_entry FROM journal_entries WHERE tenant_id = p_tenant_id;
    INSERT INTO journal_entries (tenant_id, entry_number, description, source_type, source_id)
    VALUES (p_tenant_id, v_next_entry, 'سند برگشت از فروش سفارش #' || v_order.order_number, 'SALES_RETURN', p_order_id)
    RETURNING id INTO v_journal_id;

    SELECT id INTO v_acc_cash FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = (CASE WHEN v_order.payment_method = 'CASH' THEN '1102' ELSE '1101' END);
    SELECT id INTO v_acc_ret  FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '4103';
    SELECT id INTO v_acc_tax  FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '2201';
    SELECT id INTO v_acc_inv  FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '1201';
    SELECT id INTO v_acc_cogs FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '5101';

    IF v_order.subtotal > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES (v_journal_id, v_acc_ret, v_order.subtotal, 0);
    END IF;
    IF v_order.tax_amount > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES (v_journal_id, v_acc_tax, v_order.tax_amount, 0);
    END IF;
    IF v_refund_total > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES (v_journal_id, v_acc_cash, 0, v_refund_total);
    END IF;
    IF v_order.total_cogs > 0 THEN
        INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES
            (v_journal_id, v_acc_inv, v_order.total_cogs, 0),
            (v_journal_id, v_acc_cogs, 0, v_order.total_cogs);
    END IF;

    RETURN jsonb_build_object('ok', true, 'refunded_amount', v_refund_total, 'journal_id', v_journal_id);
END;
$$;

-- Atomic RPC 5: Record Store Expense
CREATE OR REPLACE FUNCTION record_expense_atomic(
    p_tenant_id UUID,
    p_category TEXT,
    p_title TEXT,
    p_amount BIGINT,
    p_payment_method TEXT DEFAULT 'CASH'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exp_id UUID;
    v_next_entry BIGINT;
    v_journal_id UUID;
    v_acc_exp UUID;
    v_acc_cash UUID;
BEGIN
    PERFORM ensure_rasa_accounts(p_tenant_id);

    INSERT INTO expenses (tenant_id, category, title, amount, payment_method)
    VALUES (p_tenant_id, p_category, p_title, p_amount, p_payment_method)
    RETURNING id INTO v_exp_id;

    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_next_entry FROM journal_entries WHERE tenant_id = p_tenant_id;
    INSERT INTO journal_entries (tenant_id, entry_number, description, source_type, source_id)
    VALUES (p_tenant_id, v_next_entry, 'ثبت هزینه: ' || p_title, 'EXPENSE', v_exp_id)
    RETURNING id INTO v_journal_id;

    SELECT id INTO v_acc_exp FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = '6101';
    SELECT id INTO v_acc_cash FROM chart_of_accounts WHERE tenant_id = p_tenant_id AND code = (CASE WHEN p_payment_method = 'CASH' THEN '1102' ELSE '1101' END);

    INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES
        (v_journal_id, v_acc_exp, p_amount, 0),
        (v_journal_id, v_acc_cash, 0, p_amount);

    RETURN jsonb_build_object('expense_id', v_exp_id, 'journal_id', v_journal_id);
END;
$$;
