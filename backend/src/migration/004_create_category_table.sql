-- Create Category table
CREATE TABLE IF NOT EXISTS category (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL,
  description TEXT,
  firm_id INT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firm(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE RESTRICT,
  INDEX idx_category_name (category_name),
  INDEX idx_firm_id (firm_id),
  INDEX idx_created_by (created_by),
  UNIQUE KEY unique_category_firm (category_name, firm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
