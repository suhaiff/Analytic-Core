#!/bin/bash

# Function to wait for apt lock
wait_for_apt() {
    while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 ; do
        echo "Waiting for other apt processes to finish..."
        sleep 5
    done
}

echo "Starting PostgreSQL installation and setup..."

wait_for_apt

# 1. Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# 2. Ensure PostgreSQL is started
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Create Database
echo "Creating database 'insightai_pg_test'..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS insightai_pg_test;"
sudo -u postgres psql -c "CREATE DATABASE insightai_pg_test;"

# 4. Create Tables and Insert Data
echo "Configuring tables and sample data..."
sudo -u postgres psql -d insightai_pg_test <<EOF
-- Inventory Table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100),
    stock_quantity INT,
    unit_price DECIMAL(10, 2),
    warehouse_location VARCHAR(50)
);

-- Orders Table
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
EOF

# 5. Set password for postgres user so the app can connect
echo "Setting password for user 'postgres' to 'insightai'..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'insightai';"

echo "PostgreSQL setup complete!"
echo "Database: insightai_pg_test"
echo "Username: postgres"
echo "Password: insightai"
