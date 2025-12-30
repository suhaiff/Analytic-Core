-- Sample SQL dump for testing
-- This file contains sample data for users and orders tables

CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  created_at DATE
);

INSERT INTO users (id, name, email, created_at) VALUES
  (1, 'Alice Smith', 'alice@example.com', '2024-01-15'),
  (2, 'Bob Jones', 'bob@example.com', '2024-02-20'),
  (3, 'Carol White', 'carol@example.com', '2024-03-10'),
  (4, 'David Brown', 'david@example.com', '2024-04-05'),
  (5, 'Eve Davis', 'eve@example.com', '2024-05-12');

CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  user_id INT,
  product VARCHAR(100),
  amount DECIMAL(10,2),
  order_date DATE
);

INSERT INTO orders (order_id, user_id, product, amount, order_date) VALUES
  (101, 1, 'Laptop', 999.99, '2024-06-01'),
  (102, 2, 'Mouse', 29.99, '2024-06-02'),
  (103, 1, 'Keyboard', 79.99, '2024-06-03'),
  (104, 3, 'Monitor', 299.99, '2024-06-04'),
  (105, 2, 'Headphones', 149.99, '2024-06-05'),
  (106, 4, 'Webcam', 89.99, '2024-06-06'),
  (107, 5, 'Microphone', 129.99, '2024-06-07');
