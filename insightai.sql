-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: insightai
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `dashboards`
--

DROP TABLE IF EXISTS `dashboards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `data_model` json NOT NULL,
  `chart_configs` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `dashboards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dashboards`
--

LOCK TABLES `dashboards` WRITE;
/*!40000 ALTER TABLE `dashboards` DISABLE KEYS */;
INSERT INTO `dashboards` VALUES (1,2,'Sales + Products','{\"data\": [{\"Sales.Month\": \"Jan\", \"Sales.Amount\": 12000, \"Sales.Region\": \"North\", \"Sales.SaleID\": 1, \"Sales.Quantity\": 12, \"Sales.ProductID\": \"P001\", \"Products.Product\": \"A\", \"Products.Category\": \"Electronics\", \"Products.ProductID\": \"P001\"}, {\"Sales.Month\": \"Jan\", \"Sales.Amount\": 8000, \"Sales.Region\": \"North\", \"Sales.SaleID\": 2, \"Sales.Quantity\": 8, \"Sales.ProductID\": \"P002\", \"Products.Product\": \"B\", \"Products.Category\": \"Furniture\", \"Products.ProductID\": \"P002\"}, {\"Sales.Month\": \"Jan\", \"Sales.Amount\": 15000, \"Sales.Region\": \"South\", \"Sales.SaleID\": 3, \"Sales.Quantity\": 15, \"Sales.ProductID\": \"P001\", \"Products.Product\": \"A\", \"Products.Category\": \"Electronics\", \"Products.ProductID\": \"P001\"}, {\"Sales.Month\": \"Jan\", \"Sales.Amount\": 10000, \"Sales.Region\": \"South\", \"Sales.SaleID\": 4, \"Sales.Quantity\": 10, \"Sales.ProductID\": \"P002\", \"Products.Product\": \"B\", \"Products.Category\": \"Furniture\", \"Products.ProductID\": \"P002\"}, {\"Sales.Month\": \"Feb\", \"Sales.Amount\": 20000, \"Sales.Region\": \"East\", \"Sales.SaleID\": 5, \"Sales.Quantity\": 20, \"Sales.ProductID\": \"P001\", \"Products.Product\": \"A\", \"Products.Category\": \"Electronics\", \"Products.ProductID\": \"P001\"}, {\"Sales.Month\": \"Feb\", \"Sales.Amount\": 5000, \"Sales.Region\": \"East\", \"Sales.SaleID\": 6, \"Sales.Quantity\": 5, \"Sales.ProductID\": \"P002\", \"Products.Product\": \"B\", \"Products.Category\": \"Furniture\", \"Products.ProductID\": \"P002\"}, {\"Sales.Month\": \"Mar\", \"Sales.Amount\": 18000, \"Sales.Region\": \"West\", \"Sales.SaleID\": 7, \"Sales.Quantity\": 18, \"Sales.ProductID\": \"P001\", \"Products.Product\": \"A\", \"Products.Category\": \"Electronics\", \"Products.ProductID\": \"P001\"}, {\"Sales.Month\": \"Mar\", \"Sales.Amount\": 9000, \"Sales.Region\": \"West\", \"Sales.SaleID\": 8, \"Sales.Quantity\": 9, \"Sales.ProductID\": \"P002\", \"Products.Product\": \"B\", \"Products.Category\": \"Furniture\", \"Products.ProductID\": \"P002\"}, {\"Sales.Month\": \"Feb\", \"Sales.Amount\": 6000, \"Sales.Region\": \"North\", \"Sales.SaleID\": 9, \"Sales.Quantity\": 10, \"Sales.ProductID\": \"P003\", \"Products.Product\": \"C\", \"Products.Category\": \"Clothing\", \"Products.ProductID\": \"P003\"}, {\"Sales.Month\": \"Mar\", \"Sales.Amount\": 7000, \"Sales.Region\": \"South\", \"Sales.SaleID\": 10, \"Sales.Quantity\": 12, \"Sales.ProductID\": \"P003\", \"Products.Product\": \"C\", \"Products.Category\": \"Clothing\", \"Products.ProductID\": \"P003\"}], \"name\": \"Sales + Products\", \"columns\": [\"Sales.SaleID\", \"Sales.Region\", \"Sales.ProductID\", \"Sales.Month\", \"Sales.Quantity\", \"Sales.Amount\", \"Products.ProductID\", \"Products.Product\", \"Products.Category\"], \"numericColumns\": [\"Sales.SaleID\", \"Sales.Quantity\", \"Sales.Amount\"], \"categoricalColumns\": [\"Sales.Region\", \"Sales.ProductID\", \"Sales.Month\", \"Products.ProductID\", \"Products.Product\", \"Products.Category\"]}','[{\"id\": \"suggested-0-1764073981840\", \"type\": \"KPI\", \"color\": \"#4f46e5\", \"title\": \"Total Sales Revenue\", \"dataKey\": \"Sales.Amount\", \"xAxisKey\": \"Sales.Amount\", \"aggregation\": \"SUM\", \"description\": \"Provides the overall total revenue generated across all sales, a key indicator of business financial health and performance.\"}, {\"id\": \"suggested-1-1764073981840\", \"type\": \"KPI\", \"color\": \"#4f46e5\", \"title\": \"Total Quantity Sold\", \"dataKey\": \"Sales.Quantity\", \"xAxisKey\": \"Sales.Quantity\", \"aggregation\": \"SUM\", \"description\": \"Indicates the total volume of products sold, useful for understanding operational scale and inventory management.\"}, {\"id\": \"suggested-2-1764073981840\", \"type\": \"BAR\", \"color\": \"#4f46e5\", \"title\": \"Sales by Region\", \"dataKey\": \"Sales.Amount\", \"xAxisKey\": \"Sales.Region\", \"aggregation\": \"SUM\", \"description\": \"Visualizes sales performance across different geographical regions, highlighting top-performing or underperforming areas for targeted strategies.\"}, {\"id\": \"suggested-3-1764073981840\", \"type\": \"BAR\", \"color\": \"#4f46e5\", \"title\": \"Sales by Product Category\", \"dataKey\": \"Sales.Amount\", \"xAxisKey\": \"Products.Category\", \"aggregation\": \"SUM\", \"description\": \"Shows which product categories contribute most to total sales, aiding in product portfolio management and resource allocation.\"}, {\"id\": \"suggested-4-1764073981840\", \"type\": \"LINE\", \"color\": \"#4f46e5\", \"title\": \"Monthly Sales Trend\", \"dataKey\": \"Sales.Amount\", \"xAxisKey\": \"Sales.Month\", \"aggregation\": \"SUM\", \"description\": \"Tracks the sales amount over time by month, revealing trends, seasonality, and overall business growth or decline patterns.\"}, {\"id\": \"suggested-5-1764073981840\", \"type\": \"BAR\", \"color\": \"#4f46e5\", \"title\": \"Quantity Sold by Product\", \"dataKey\": \"Sales.Quantity\", \"xAxisKey\": \"Products.Product\", \"aggregation\": \"SUM\", \"description\": \"Displays the total quantity sold for each individual product, identifying best-selling items in terms of volume.\"}]','2025-11-25 12:33:11');
/*!40000 ALTER TABLE `dashboards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uploads`
--

DROP TABLE IF EXISTS `uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uploads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `uploads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uploads`
--

LOCK TABLES `uploads` WRITE;
/*!40000 ALTER TABLE `uploads` DISABLE KEYS */;
INSERT INTO `uploads` VALUES (1,2,'1764073956044-426706938-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','C:\\Users\\jiyat\\Documents\\insightai\\server\\uploads\\1764073956044-426706938-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7835,'2025-11-25 12:32:36');
/*!40000 ALTER TABLE `uploads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','USER') DEFAULT 'USER',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@gmail.com','admin123','ADMIN','2025-11-25 10:59:17'),(2,'user','user@gmail.com','123456','USER','2025-11-25 10:59:53');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-25 18:13:35
