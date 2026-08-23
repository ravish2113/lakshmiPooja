ALTER TABLE donations
    ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID';

ALTER TABLE donations DROP CONSTRAINT IF EXISTS chk_payment_mode;
ALTER TABLE donations
    ADD CONSTRAINT chk_payment_mode CHECK (payment_mode IN ('UPI', 'CASH', 'PENDING'));
ALTER TABLE donations
    ADD CONSTRAINT chk_donation_payment_status CHECK (payment_status IN ('PAID', 'UNPAID'));

ALTER TABLE expenditures RENAME COLUMN amount TO total_cost;
ALTER TABLE expenditures
    ADD COLUMN paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Existing historical expenditure rows were previously stored as fully paid.
UPDATE expenditures SET paid_amount = total_cost;

ALTER TABLE expenditures DROP CONSTRAINT IF EXISTS chk_expenditure_amount;
ALTER TABLE expenditures
    ADD CONSTRAINT chk_expenditure_total_cost CHECK (total_cost > 0);
ALTER TABLE expenditures
    ADD CONSTRAINT chk_expenditure_paid_amount CHECK (paid_amount >= 0 AND paid_amount <= total_cost);

CREATE INDEX idx_donations_payment_status ON donations(payment_status);
