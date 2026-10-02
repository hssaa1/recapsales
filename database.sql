CREATE DATABASE recap_sales;

USE recap_sales;


CREATE TABLE stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    username VARCHAR(50) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role ENUM('Admin', 'Sales') NOT NULL,

    sales_type ENUM('Walk-in', 'Walk-out') NULL,

    default_store_id INT NULL,

    status ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (default_store_id)
        REFERENCES stores(id)
        ON DELETE SET NULL
);


CREATE TABLE user_stores (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    store_id INT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE,

    UNIQUE(user_id, store_id)
);


CREATE TABLE price_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,

    product VARCHAR(100) NOT NULL,

    price_plan VARCHAR(100) NOT NULL,

    price DECIMAL(15,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    store_id INT NOT NULL,

    transaction_date DATE NOT NULL,

    product VARCHAR(100) NOT NULL,

    price_plan VARCHAR(100) NOT NULL,

    price DECIMAL(15,2) NOT NULL DEFAULT 0,

    quantity INT NOT NULL DEFAULT 1,

    transaction_type VARCHAR(100),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE RESTRICT
);