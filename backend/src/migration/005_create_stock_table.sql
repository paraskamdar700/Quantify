
CREATE TABLE IF NOT EXISTS stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stock_name VARCHAR(255) NOT NULL,
  sku_code VARCHAR(50) UNIQUE NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quantity_available DECIMAL(10,2) NOT NULL DEFAULT 0,
  buy_price DECIMAL(10,2) NOT NULL,
  low_unit_threshold DECIMAL(10,2) NOT NULL DEFAULT 0,
  firm_id INT NOT NULL,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firm(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT,
  INDEX idx_stock_name (stock_name),
  INDEX idx_sku_code (sku_code),
  INDEX idx_firm_id (firm_id),
  INDEX idx_category_id (category_id),
  INDEX idx_quantity_available (quantity_available),
  CHECK (quantity_available >= 0),
  CHECK (buy_price >= 0),
  CHECK (low_unit_threshold >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;