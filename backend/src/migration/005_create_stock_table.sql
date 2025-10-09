
CREATE TABLE IF NOT EXISTS stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stock_name VARCHAR(255) NOT NULL,
  sku_code VARCHAR(50) UNIQUE NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quantity_available DECIMAL(10,2) NOT NULL DEFAULT 0,
  buy_price DECIMAL(10,2) NOT NULL,
  low_unit_threshold DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, 
   weight_per_unit DECIMAL(10,3) NOT NULL DEFAULT 0, 
  weight_unit VARCHAR(10) NOT NULL DEFAULT 'kg',
  firm_id INT NOT NULL,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firm(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT,
  CHECK (quantity_available >= 0),
  CHECK (buy_price >= 0),
  CHECK (low_unit_threshold >= 0),
  CHECK (weight_per_unit >= 0) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


 