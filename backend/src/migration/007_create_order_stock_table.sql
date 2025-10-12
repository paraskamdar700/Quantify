
CREATE TABLE IF NOT EXISTS order_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  selling_price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  quantity_delivered DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  order_id INT NOT NULL,
  stock_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   FOREIGN KEY (order_id) REFERENCES ORDERS(id) ON DELETE RESTRICT,
  FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id),
  INDEX idx_stock_id (stock_id),
  UNIQUE KEY unique_order_stock (order_id, stock_id),
  CHECK (selling_price >= 0),
  CHECK (quantity > 0),
  CHECK (subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;