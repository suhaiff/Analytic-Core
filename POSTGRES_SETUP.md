# 🐘 Local PostgreSQL Setup Guide for AnalyticCore

Follow these steps to set up a local PostgreSQL server and prepare multi-table test data for your dashboard.

## 1️⃣ Installation & Service Setup

Open your terminal and run the following commands:

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL Service
sudo systemctl start postgresql

# Ensure it starts on boot
sudo systemctl enable postgresql

# Verify it is running
sudo systemctl status postgresql
```

---

## 2️⃣ Database & Test Data Creation

We will create a database named `insightai_pg_test` with two tables: `inventory` and `orders`.

### Enter PostgreSQL Prompt
```bash
sudo -u postgres psql
```

### Run these SQL commands inside the psql prompt:

```sql
-- Create Database
CREATE DATABASE insightai_pg_test;

-- Connect to the new database
\c insightai_pg_test

-- Create Inventory Table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100),
    stock_quantity INT,
    unit_price DECIMAL(10, 2),
    warehouse_location VARCHAR(50)
);

-- Create Orders Table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    order_date DATE,
    total_amount DECIMAL(10, 2),
    status VARCHAR(20)
);

-- Insert 5 rows into Inventory
INSERT INTO inventory (item_name, stock_quantity, unit_price, warehouse_location) VALUES
('Wireless Mouse', 150, 25.99, 'Aisle 4'),
('Gaming Keyboard', 75, 89.50, 'Aisle 2'),
('USB-C Hub', 200, 45.00, 'Aisle 1'),
('4K Monitor', 30, 320.00, 'Aisle 7'),
('Laptop Stand', 120, 35.00, 'Aisle 5');

-- Insert 5 rows into Orders
INSERT INTO orders (customer_name, order_date, total_amount, status) VALUES
('Alice Smith', '2023-12-25', 125.40, 'Shipped'),
('Bob Johnson', '2023-12-26', 450.00, 'Processing'),
('Charlie Brown', '2023-12-27', 89.50, 'Delivered'),
('Diana Prince', '2023-12-28', 1200.00, 'Shipped'),
('Edward Norton', '2023-12-29', 35.00, 'Cancelled');

-- Verify Data
SELECT * FROM inventory;
SELECT * FROM orders;

-- Quit psql
\q
```

---

## 3️⃣ Application Connection Details

Use these values in the **Connect SQL Database** modal within AnalyticCore:

| Field | Value |
| :--- | :--- |
| **Engine** | `PostgreSQL` |
| **Host** | `localhost` or `127.0.0.1` |
| **Port** | `5432` |
| **Database Name** | `insightai_pg_test` |
| **Username** | `postgres` |
| **Password** | *(The password you set for the postgres user)* |

---

## 🛠️ Security & Connection Fixes

### Set a password for the 'postgres' user
AnalyticCore requires password authentication. Run this to set a password for your local DB:
```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_secure_password';"
```

### Authentication Configuration
If you get "Peer authentication failed", you may need to edit `/etc/postgresql/your_version/main/pg_hba.conf` and change `peer` to `md5` or `scram-sha-256` for local connections, then restart postgres:
```bash
sudo systemctl restart postgresql
```
