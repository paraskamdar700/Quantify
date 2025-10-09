CREATE TABLE IF NOT EXISTS customer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(255) NOT NULL,
  firm_name VARCHAR(255) NOT NULL,
  contact_no VARCHAR(15),
  gst_no VARCHAR(15),
  city VARCHAR(100),
  street VARCHAR(255),
  firm_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firm(id) ON DELETE RESTRICT,
  INDEX idx_fullname (fullname),
  INDEX idx_firm_name (firm_name),
  INDEX idx_contact_no (contact_no),
  CHECK (LENGTH(fullname) >= 4), 
  CHECK (LENGTH(firm_name) >= 2) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;