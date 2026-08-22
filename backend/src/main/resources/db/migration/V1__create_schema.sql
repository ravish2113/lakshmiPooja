CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'USER'))
);

CREATE TABLE pooja_year_ledger (
    id BIGSERIAL PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    closed BOOLEAN NOT NULL DEFAULT FALSE,
    closed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donations (
    id BIGSERIAL PRIMARY KEY,
    year_id BIGINT NOT NULL REFERENCES pooja_year_ledger(id),
    donor_name VARCHAR(150) NOT NULL,
    flat_details VARCHAR(100),
    amount NUMERIC(14,2) NOT NULL,
    donation_date DATE NOT NULL,
    payment_mode VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_donation_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_mode CHECK (payment_mode IN ('UPI', 'CASH'))
);

CREATE TABLE expenditures (
    id BIGSERIAL PRIMARY KEY,
    year_id BIGINT NOT NULL REFERENCES pooja_year_ledger(id),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(80) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    expense_date DATE NOT NULL,
    vendor VARCHAR(150),
    receipt_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_expenditure_amount CHECK (amount > 0)
);

CREATE INDEX idx_donations_year ON donations(year_id);
CREATE INDEX idx_expenditures_year ON expenditures(year_id);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_expenditures_date ON expenditures(expense_date);
