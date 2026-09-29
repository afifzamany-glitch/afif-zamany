-- ===================================================================
-- GRAND TJOKRO YOGYAKARTA - BREAKFAST QR MANAGEMENT SYSTEM
-- PostgreSQL / Supabase Database DDL Schema with Row Level Security
-- ===================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HOTELS TABLE
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Grand Tjokro Yogyakarta',
    logo_url TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
    breakfast_start VARCHAR(5) NOT NULL DEFAULT '06:00',
    breakfast_end VARCHAR(5) NOT NULL DEFAULT '10:00',
    allow_checkout_day BOOLEAN NOT NULL DEFAULT TRUE,
    allow_partial_redemption BOOLEAN NOT NULL DEFAULT FALSE,
    enforce_breakfast_time BOOLEAN NOT NULL DEFAULT TRUE,
    allow_manual_search BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER PROFILES TABLE (Linked with Supabase auth.users or internal auth)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'RECEPTION', 'RESTAURANT', 'SUPERVISOR')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DEVICES TABLE
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL UNIQUE,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL DEFAULT 'SCANNER_TABLET',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GUESTS TABLE
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    pax INTEGER NOT NULL CHECK (pax > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CHECKED_OUT', 'CANCELLED')),
    external_guest_id VARCHAR(100),
    external_reservation_id VARCHAR(100),
    source_system VARCHAR(100) DEFAULT 'FRONT_OFFICE',
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. QR CODES TABLE
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 6. BREAKFAST ENTITLEMENTS TABLE
CREATE TABLE IF NOT EXISTS breakfast_entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    breakfast_date DATE NOT NULL,
    pax_entitlement INTEGER NOT NULL CHECK (pax_entitlement > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce uniqueness per QR code and breakfast date
    CONSTRAINT uq_entitlement_qr_date UNIQUE (qr_code_id, breakfast_date)
);

-- 7. BREAKFAST USAGE TABLE
CREATE TABLE IF NOT EXISTS breakfast_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    breakfast_date DATE NOT NULL,
    pax INTEGER NOT NULL CHECK (pax > 0),
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    scanner_device_id VARCHAR(100),
    redemption_method VARCHAR(50) NOT NULL DEFAULT 'QR_SCAN' CHECK (redemption_method IN ('QR_SCAN', 'MANUAL')),
    status VARCHAR(50) NOT NULL DEFAULT 'USED' CHECK (status IN ('USED', 'VOIDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- CRITICAL BUSINESS RULE: ONE QR + ONE BREAKFAST DATE = MAXIMUM ONE REDEMPTION
    -- Database enforces this atomic uniqueness across concurrent scanners
    CONSTRAINT uq_breakfast_usage_qr_date UNIQUE (qr_code_id, breakfast_date)
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. REPORT EXPORTS TABLE
CREATE TABLE IF NOT EXISTS report_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL,
    period VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- INDEXES FOR HIGH-CONCURRENCY SCANNING & FAST REPORT QUERIES
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_guests_room_number ON guests(room_number);
CREATE INDEX IF NOT EXISTS idx_breakfast_usage_date ON breakfast_usage(breakfast_date);
CREATE INDEX IF NOT EXISTS idx_breakfast_usage_qr_date ON breakfast_usage(qr_code_id, breakfast_date);
CREATE INDEX IF NOT EXISTS idx_breakfast_entitlements_date ON breakfast_entitlements(breakfast_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Permissive authenticated read for hotel staff within their hotel
CREATE POLICY "Hotel staff can read guests" ON guests
    FOR SELECT TO authenticated
    USING (hotel_id IN (SELECT hotel_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Reception and Admin can insert guests" ON guests
    FOR INSERT TO authenticated
    WITH CHECK (get_current_user_role() IN ('ADMIN', 'RECEPTION'));

CREATE POLICY "Hotel staff can read qr_codes" ON qr_codes
    FOR SELECT TO authenticated
    USING (hotel_id IN (SELECT hotel_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Reception and Admin can generate qr_codes" ON qr_codes
    FOR INSERT TO authenticated
    WITH CHECK (get_current_user_role() IN ('ADMIN', 'RECEPTION'));

CREATE POLICY "Reception, Admin, Supervisor can update qr_codes" ON qr_codes
    FOR UPDATE TO authenticated
    USING (get_current_user_role() IN ('ADMIN', 'RECEPTION', 'SUPERVISOR'));

CREATE POLICY "Hotel staff can read breakfast_usage" ON breakfast_usage
    FOR SELECT TO authenticated
    USING (hotel_id IN (SELECT hotel_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Restaurant and Admin can insert breakfast_usage" ON breakfast_usage
    FOR INSERT TO authenticated
    WITH CHECK (get_current_user_role() IN ('ADMIN', 'RESTAURANT'));

CREATE POLICY "Admin and Supervisor can view audit logs" ON audit_logs
    FOR SELECT TO authenticated
    USING (get_current_user_role() IN ('ADMIN', 'SUPERVISOR'));
