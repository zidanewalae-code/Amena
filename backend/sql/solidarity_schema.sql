-- Socio-Solidarity schema extension (MySQL 8+).
-- Existing users table is reused by foreign keys below.

CREATE TABLE IF NOT EXISTS social_products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  price DECIMAL(14,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_social_products_name (name),
  INDEX idx_social_products_stock (stock)
);

CREATE TABLE IF NOT EXISTS social_beneficiaries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  need VARCHAR(200) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_social_beneficiaries_name (name)
);

CREATE TABLE IF NOT EXISTS social_donations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(14,2) NOT NULL,
  date DATETIME NOT NULL,
  status ENUM('pending','validated','canceled') NOT NULL DEFAULT 'pending',
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_social_donations_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_social_donations_user_created (user_id, created_at),
  INDEX idx_social_donations_status_created (status, created_at)
);

CREATE TABLE IF NOT EXISTS social_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  status ENUM('pending','validated','canceled') NOT NULL DEFAULT 'pending',
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_social_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_social_orders_user_created (user_id, created_at),
  INDEX idx_social_orders_status_created (status, created_at)
);

CREATE TABLE IF NOT EXISTS social_order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quantity INT NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_social_order_items_order FOREIGN KEY (order_id) REFERENCES social_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_social_order_items_product FOREIGN KEY (product_id) REFERENCES social_products(id),
  UNIQUE KEY uk_social_order_items_order_product (order_id, product_id),
  INDEX idx_social_order_items_product (product_id)
);

CREATE TABLE IF NOT EXISTS social_assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('donation','order') NOT NULL,
  donation_id BIGINT UNSIGNED NULL,
  order_id BIGINT UNSIGNED NULL,
  beneficiary_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_social_assignments_donation FOREIGN KEY (donation_id) REFERENCES social_donations(id) ON DELETE SET NULL,
  CONSTRAINT fk_social_assignments_order FOREIGN KEY (order_id) REFERENCES social_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_social_assignments_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES social_beneficiaries(id),
  INDEX idx_social_assignments_beneficiary_created (beneficiary_id, created_at),
  INDEX idx_social_assignments_donation (donation_id),
  INDEX idx_social_assignments_order (order_id)
);
