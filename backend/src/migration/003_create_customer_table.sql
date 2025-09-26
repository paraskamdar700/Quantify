CREATE TABLE IF NOT EXISTS customer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  firm_name VARCHAR(255),
  contact_no VARCHAR(15),
  gst_no VARCHAR(15),
  city VARCHAR(100),
  street VARCHAR(255),
  firm_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firm(id) ON DELETE RESTRICT,
  INDEX idx_name (name),
  INDEX idx_firm_name (firm_name),
  INDEX idx_contact_no (contact_no),
  INDEX idx_gst_no (gst_no),
  INDEX idx_firm_id (firm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;