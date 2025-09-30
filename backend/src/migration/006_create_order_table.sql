
CREATE TABLE IF NOT EXISTS  (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  firm_id INT NOT NULL,
  customer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firm(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE RESTRICT,
  INDEX idx_order_date (order_date),
  INDEX idx_invoice_no (invoice_no),
  INDEX idx_status (status),
  INDEX idx_firm_id (firm_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_created_at (created_at),
  CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;