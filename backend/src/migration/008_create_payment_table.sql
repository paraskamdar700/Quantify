
CREATE TABLE IF NOT EXISTS payment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_method ENUM('CASH','CARD','UPI','BANK_TRANSFER') NOT NULL,
  reference_no VARCHAR(100),
  remarks TEXT,
  order_id INT NOT NULL,
  firm_id INT NOT NULL,
  customer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES ORDERS(id) ON DELETE RESTRICT,
  FOREIGN KEY (firm_id) REFERENCES firm(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE RESTRICT,
  INDEX idx_payment_date (payment_date),
  INDEX idx_firm_id (firm_id),
  INDEX idx_customer_id (customer_id),
  CHECK (amount_paid > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;