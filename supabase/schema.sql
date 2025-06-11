-- Invoice Manager Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables with appropriate relationships
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    iban TEXT NOT NULL,
    bic TEXT NOT NULL,
    street TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'NL',
    vat_number TEXT,
    sepa_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    iban_name TEXT,
    iban_number TEXT,
    default_klantnummer TEXT,
    default_description TEXT,
    address TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factuur_number TEXT NOT NULL,
    iban_name TEXT NOT NULL,
    iban_number TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    klantnummer TEXT,
    due_date DATE,
    status TEXT NOT NULL,
    paying_company_id TEXT REFERENCES companies(company_id),
    description TEXT,
    notes TEXT,
    batch_id TEXT,
    urgency TEXT,
    exported_at TIMESTAMPTZ,
    export_format TEXT,
    payment_date TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT FALSE,
    issue_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batch_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id TEXT NOT NULL UNIQUE,
    format TEXT NOT NULL,
    file_name TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batch_export_invoices (
    batch_export_id UUID REFERENCES batch_exports(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    PRIMARY KEY (batch_export_id, invoice_id)
);

-- Create indexes for performance
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_paying_company ON invoices(paying_company_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_clients_name ON clients(name);

-- Insert default companies
INSERT INTO companies (company_id, name, full_name, iban, bic, street, postal_code, city, country, sepa_id)
VALUES 
    ('teddy-kids', 'Teddy Kids', 'Teddy Kids B.V.', 'NL21RABO0175461910', 'RABONL2U', 'Rijnsburgerweg', '2334BA', 'Leiden', 'NL', '028ecb7182cd42c88ef28ca422f70c10'),
    ('tisa', 'TISA', 'TISA - Teddy Kids B.V.', 'NL72RABO0377186945', 'RABONL2U', 'Lorentzkade', '2313GB', 'Leiden', 'NL', '2bcb032d54f74ecca8628347cd6b58a7'),
    ('teddy-daycare', 'Teddy Daycare', 'Teddy Kids Daycare', 'NL62RABO0383960053', 'RABONL2U', 'Rijnsburgerweg', '2334BE', 'Leiden', 'NL', 'b2328cd951c44f6aa82cad3ed1db05b6'),
    ('teddy-cafe', 'Teddy Cafe', 'Teddy''s Cafe B.V.', 'NL81RABO0340536691', 'RABONL2U', 'Lorentzkade', '2313GB', 'Leiden', 'NL', '7e3ff2448e6a4197a63c0ddfc8575a78');

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at
BEFORE UPDATE ON invoice_items
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_export_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies (will be refined when auth is implemented)
-- For now, allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON companies
    USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON clients
    USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON invoices
    USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON invoice_items
    USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON batch_exports
    USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON batch_export_invoices
    USING (true);
