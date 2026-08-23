ALTER TABLE donations
    RENAME COLUMN flat_details TO father_mother_name;

ALTER TABLE donations
    ALTER COLUMN father_mother_name TYPE VARCHAR(150);
