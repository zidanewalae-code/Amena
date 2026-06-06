CREATE DATABASE IF NOT EXISTS AmenaDB;
USE AmenaDB;

CREATE TABLE `User` (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20)
);

CREATE TABLE `Donator` (
    donor_id INT PRIMARY KEY,
    donor_level VARCHAR(50),
    FOREIGN KEY (donor_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

CREATE TABLE `Organization` (
    organization_id INT PRIMARY KEY,
    organization_name VARCHAR(100),
    type VARCHAR(50),
    FOREIGN KEY (organization_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

CREATE TABLE `DeliveryPerson` (
    delivery_person_id INT PRIMARY KEY,
    vehicle_type VARCHAR(50),
    availability BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (delivery_person_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

CREATE TABLE `Admin` (
    admin_id INT PRIMARY KEY,
    role VARCHAR(50),
    FOREIGN KEY (admin_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

CREATE TABLE `Category` (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE `Product` (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    expiration_date DATE,
    image VARCHAR(255),
    category_id INT,
    FOREIGN KEY (category_id) REFERENCES `Category`(category_id) ON DELETE SET NULL
);

CREATE TABLE `Don` (
    don_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    status VARCHAR(50),
    donor_id INT NOT NULL,
    FOREIGN KEY (donor_id) REFERENCES `Donator`(donor_id) ON DELETE CASCADE
);

CREATE TABLE `Don_Product` (
    don_id INT,
    product_id INT,
    PRIMARY KEY (don_id, product_id),
    FOREIGN KEY (don_id) REFERENCES `Don`(don_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES `Product`(product_id) ON DELETE CASCADE
);

CREATE TABLE `Purchase` (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    total_price FLOAT,
    donor_id INT NOT NULL,
    FOREIGN KEY (donor_id) REFERENCES `Donator`(donor_id) ON DELETE CASCADE
);

CREATE TABLE `Orders` (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    status VARCHAR(50),
    delivery_address VARCHAR(255),
    order_date DATE,
    purchase_id INT UNIQUE,
    delivery_person_id INT,
    FOREIGN KEY (purchase_id) REFERENCES `Purchase`(purchase_id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_person_id) REFERENCES `DeliveryPerson`(delivery_person_id) ON DELETE SET NULL
);

CREATE TABLE `Payment` (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    amount FLOAT NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    order_id INT UNIQUE,
    FOREIGN KEY (order_id) REFERENCES `Orders`(order_id) ON DELETE CASCADE
);

CREATE TABLE `Notification` (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    message TEXT,
    date DATE,
    is_read BOOLEAN DEFAULT FALSE,
    order_id INT,
    FOREIGN KEY (order_id) REFERENCES `Orders`(order_id) ON DELETE CASCADE
);

CREATE TABLE `Alert` (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100),
    description TEXT,
    priority VARCHAR(50),
    organization_id INT NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES `Organization`(organization_id) ON DELETE CASCADE
);

CREATE TABLE `History` (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(255),
    action_date DATE,
    order_id INT NULL,
    don_id INT NULL,
    delivery_person_id INT NULL,
    FOREIGN KEY (order_id) REFERENCES `Orders`(order_id) ON DELETE SET NULL,
    FOREIGN KEY (don_id) REFERENCES `Don`(don_id) ON DELETE SET NULL,
    FOREIGN KEY (delivery_person_id) REFERENCES `DeliveryPerson`(delivery_person_id) ON DELETE SET NULL
);

INSERT INTO `User` (name, email, password, phone)
VALUES
('Mariem', 'mariem@gmail.com', '123456', '12345678'),
('Amena Org', 'org@gmail.com', '123456', '22222222');

INSERT INTO `Donator` (donor_id, donor_level)
VALUES (1, 'Gold');

INSERT INTO `Organization` (organization_id, organization_name, type)
VALUES (2, 'Amena Association', 'NGO');

INSERT INTO `Category` (name)
VALUES ('Food'), ('Clothes'), ('Medicine');

INSERT INTO `Product` (name, quantity, expiration_date, category_id)
VALUES
('Rice', 10, '2026-12-31', 1),
('Jacket', 5, NULL, 2);

INSERT INTO `Don` (date, status, donor_id)
VALUES ('2026-05-16', 'Pending', 1);

INSERT INTO `Don_Product` (don_id, product_id)
VALUES (1, 1), (1, 2);

INSERT INTO `Purchase` (date, total_price, donor_id)
VALUES ('2026-05-16', 120.5, 1);

INSERT INTO `Orders` (status, delivery_address, order_date, purchase_id)
VALUES ('Processing', 'Tunis, Tunisia', '2026-05-16', 1);

INSERT INTO `Payment` (amount, payment_method, payment_status, order_id)
VALUES (120.5, 'Credit Card', 'Paid', 1);

INSERT INTO `Notification` (message, date, is_read, order_id)
VALUES ('Your order is confirmed', '2026-05-16', FALSE, 1);

INSERT INTO `Alert` (title, description, priority, organization_id)
VALUES
('Urgent Food Help', 'Families need food supplies', 'High', 2);