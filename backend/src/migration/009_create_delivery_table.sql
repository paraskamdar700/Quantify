CREATE TABLE IF NOT EXISTS delivery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_date DATE NOT NULL,
  delivered_quantity DECIMAL(10,2) NOT NULL,
  delivery_notes TEXT,
  order_stock_id INT NOT NULL, 
  firm_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_stock_id) REFERENCES order_stock(id) ON DELETE RESTRICT,
  FOREIGN KEY (firm_id) REFERENCES firm(id) ON DELETE RESTRICT,
  INDEX idx_delivery_date (delivery_date),
  INDEX idx_order_stock_id (order_stock_id),
  CHECK (delivered_quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;