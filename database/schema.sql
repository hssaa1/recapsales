CREATE DATABASE IF NOT EXISTS recap_sales
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE recap_sales;


-- =====================================================
-- STORE
-- =====================================================

CREATE TABLE stores (

    id INT AUTO_INCREMENT PRIMARY KEY,

    store_name VARCHAR(150)
    NOT NULL UNIQUE,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP

);


-- =====================================================
-- USERS
-- Admin dan seluruh Sales
-- =====================================================

CREATE TABLE users (

    id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(150)
    NOT NULL,

    username VARCHAR(100)
    NOT NULL UNIQUE,

    password VARCHAR(255)
    NOT NULL,

    role ENUM(
        'Admin',
        'Sales'
    )
    NOT NULL,

    channel ENUM(
        'Instore',
        'Outstore'
    )
    NULL,

    sales_type ENUM(
        'Walk-in',
        'Walk-out'
    )
    NULL,

    default_store_id INT NULL,

    status ENUM(
        'Aktif',
        'Nonaktif'
    )
    NOT NULL DEFAULT 'Aktif',

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_store

        FOREIGN KEY (
            default_store_id
        )

        REFERENCES stores(id)

        ON DELETE SET NULL

);


-- =====================================================
-- PRICE PLAN
-- =====================================================

CREATE TABLE price_plans (

    id INT AUTO_INCREMENT PRIMARY KEY,

    product ENUM(
        'XL Prioritas',
        'XLHome'
    )
    NOT NULL,

    price_plan VARCHAR(150)
    NOT NULL,

    price DECIMAL(15,2)
    NOT NULL DEFAULT 0,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP

);


-- =====================================================
-- TRANSACTIONS
-- =====================================================

CREATE TABLE transactions (

    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    store_id INT NOT NULL,

    price_plan_id INT NULL,

    transaction_date DATE
    NOT NULL,

    product ENUM(
        'XL Prioritas',
        'XLHome'
    )
    NOT NULL,

    price_plan VARCHAR(150)
    NOT NULL,

    price DECIMAL(15,2)
    NOT NULL DEFAULT 0,

    quantity INT
    NOT NULL DEFAULT 1,

    transaction_type VARCHAR(100),

    notes TEXT,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (
        user_id
    )
    REFERENCES users(id),

    FOREIGN KEY (
        store_id
    )
    REFERENCES stores(id),

    FOREIGN KEY (
        price_plan_id
    )
    REFERENCES price_plans(id)
    ON DELETE SET NULL

);


-- =====================================================
-- VISITOR
-- =====================================================

CREATE TABLE visitors (

    id INT AUTO_INCREMENT PRIMARY KEY,

    visitor_date DATE
    NOT NULL,

    store_id INT
    NOT NULL,

    visitor_count INT
    NOT NULL DEFAULT 0,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (
        store_id
    )
    REFERENCES stores(id)

);


-- =====================================================
-- TARGET
-- =====================================================

CREATE TABLE targets (

    id INT AUTO_INCREMENT PRIMARY KEY,

    period CHAR(7)
    NOT NULL,

    sales_id INT
    NOT NULL,

    product ENUM(
        'XL Prioritas',
        'XLHome'
    )
    NOT NULL,

    target_qty INT
    NOT NULL DEFAULT 0,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_target (
        period,
        sales_id,
        product
    ),

    FOREIGN KEY (
        sales_id
    )
    REFERENCES users(id)

);