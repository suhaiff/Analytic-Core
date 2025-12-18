-- MariaDB dump 10.19  Distrib 10.11.6-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: insightai
-- ------------------------------------------------------
-- Server version	10.11.6-MariaDB-1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dashboards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `data_model` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data_model`)),
  `chart_configs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`chart_configs`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `dashboards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dashboards`
--

LOCK TABLES `dashboards` WRITE;
/*!40000 ALTER TABLE `dashboards` DISABLE KEYS */;
INSERT INTO `dashboards` VALUES
(4,2,'Dashboard 1','{\"name\":\"Dashboard 1\",\"data\":[{\"Sales.Sale_ID\":1,\"Sales.Customer_ID\":39,\"Sales.Product_ID\":9,\"Sales.Sale_Date\":45292,\"Sales.Total_Amount\":1406,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":2,\"Sales.Customer_ID\":29,\"Sales.Product_ID\":24,\"Sales.Sale_Date\":45293,\"Sales.Total_Amount\":4129,\"Transactions.Transaction_ID\":\"87\",\"Transactions.Sale_ID\":\"2\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45382\",\"Transactions.Transaction_Amount\":\"4896\"},{\"Sales.Sale_ID\":3,\"Sales.Customer_ID\":15,\"Sales.Product_ID\":1,\"Sales.Sale_Date\":45294,\"Sales.Total_Amount\":2775,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":4,\"Sales.Customer_ID\":43,\"Sales.Product_ID\":12,\"Sales.Sale_Date\":45295,\"Sales.Total_Amount\":1382,\"Transactions.Transaction_ID\":\"46\",\"Transactions.Sale_ID\":\"4\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45341\",\"Transactions.Transaction_Amount\":\"4129\"},{\"Sales.Sale_ID\":5,\"Sales.Customer_ID\":8,\"Sales.Product_ID\":8,\"Sales.Sale_Date\":45296,\"Sales.Total_Amount\":809,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":6,\"Sales.Customer_ID\":21,\"Sales.Product_ID\":24,\"Sales.Sale_Date\":45297,\"Sales.Total_Amount\":4844,\"Transactions.Transaction_ID\":\"56\",\"Transactions.Sale_ID\":\"6\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45351\",\"Transactions.Transaction_Amount\":\"4002\"},{\"Sales.Sale_ID\":7,\"Sales.Customer_ID\":39,\"Sales.Product_ID\":11,\"Sales.Sale_Date\":45298,\"Sales.Total_Amount\":4513,\"Transactions.Transaction_ID\":\"19\",\"Transactions.Sale_ID\":\"7\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45314\",\"Transactions.Transaction_Amount\":\"2596\"},{\"Sales.Sale_ID\":8,\"Sales.Customer_ID\":19,\"Sales.Product_ID\":19,\"Sales.Sale_Date\":45299,\"Sales.Total_Amount\":3848,\"Transactions.Transaction_ID\":\"18\",\"Transactions.Sale_ID\":\"8\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45313\",\"Transactions.Transaction_Amount\":\"4019\"},{\"Sales.Sale_ID\":8,\"Sales.Customer_ID\":19,\"Sales.Product_ID\":19,\"Sales.Sale_Date\":45299,\"Sales.Total_Amount\":3848,\"Transactions.Transaction_ID\":\"32\",\"Transactions.Sale_ID\":\"8\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45327\",\"Transactions.Transaction_Amount\":\"3317\"},{\"Sales.Sale_ID\":9,\"Sales.Customer_ID\":23,\"Sales.Product_ID\":17,\"Sales.Sale_Date\":45300,\"Sales.Total_Amount\":4879,\"Transactions.Transaction_ID\":\"91\",\"Transactions.Sale_ID\":\"9\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45386\",\"Transactions.Transaction_Amount\":\"3351\"},{\"Sales.Sale_ID\":10,\"Sales.Customer_ID\":11,\"Sales.Product_ID\":8,\"Sales.Sale_Date\":45301,\"Sales.Total_Amount\":763,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":11,\"Sales.Customer_ID\":11,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45302,\"Sales.Total_Amount\":2098,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":12,\"Sales.Customer_ID\":24,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45303,\"Sales.Total_Amount\":3545,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":13,\"Sales.Customer_ID\":36,\"Sales.Product_ID\":1,\"Sales.Sale_Date\":45304,\"Sales.Total_Amount\":3843,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":14,\"Sales.Customer_ID\":40,\"Sales.Product_ID\":27,\"Sales.Sale_Date\":45305,\"Sales.Total_Amount\":1595,\"Transactions.Transaction_ID\":\"14\",\"Transactions.Sale_ID\":\"14\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45309\",\"Transactions.Transaction_Amount\":\"4430\"},{\"Sales.Sale_ID\":15,\"Sales.Customer_ID\":24,\"Sales.Product_ID\":5,\"Sales.Sale_Date\":45306,\"Sales.Total_Amount\":3404,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":16,\"Sales.Customer_ID\":3,\"Sales.Product_ID\":10,\"Sales.Sale_Date\":45307,\"Sales.Total_Amount\":3863,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":17,\"Sales.Customer_ID\":22,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45308,\"Sales.Total_Amount\":1953,\"Transactions.Transaction_ID\":\"21\",\"Transactions.Sale_ID\":\"17\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45316\",\"Transactions.Transaction_Amount\":\"2132\"},{\"Sales.Sale_ID\":17,\"Sales.Customer_ID\":22,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45308,\"Sales.Total_Amount\":1953,\"Transactions.Transaction_ID\":\"50\",\"Transactions.Sale_ID\":\"17\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45345\",\"Transactions.Transaction_Amount\":\"4182\"},{\"Sales.Sale_ID\":17,\"Sales.Customer_ID\":22,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45308,\"Sales.Total_Amount\":1953,\"Transactions.Transaction_ID\":\"89\",\"Transactions.Sale_ID\":\"17\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45384\",\"Transactions.Transaction_Amount\":\"2589\"},{\"Sales.Sale_ID\":18,\"Sales.Customer_ID\":2,\"Sales.Product_ID\":26,\"Sales.Sale_Date\":45309,\"Sales.Total_Amount\":4759,\"Transactions.Transaction_ID\":\"2\",\"Transactions.Sale_ID\":\"18\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45297\",\"Transactions.Transaction_Amount\":\"3596\"},{\"Sales.Sale_ID\":18,\"Sales.Customer_ID\":2,\"Sales.Product_ID\":26,\"Sales.Sale_Date\":45309,\"Sales.Total_Amount\":4759,\"Transactions.Transaction_ID\":\"73\",\"Transactions.Sale_ID\":\"18\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45368\",\"Transactions.Transaction_Amount\":\"4541\"},{\"Sales.Sale_ID\":19,\"Sales.Customer_ID\":24,\"Sales.Product_ID\":9,\"Sales.Sale_Date\":45310,\"Sales.Total_Amount\":1391,\"Transactions.Transaction_ID\":\"45\",\"Transactions.Sale_ID\":\"19\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45340\",\"Transactions.Transaction_Amount\":\"1172\"},{\"Sales.Sale_ID\":20,\"Sales.Customer_ID\":44,\"Sales.Product_ID\":28,\"Sales.Sale_Date\":45311,\"Sales.Total_Amount\":3681,\"Transactions.Transaction_ID\":\"17\",\"Transactions.Sale_ID\":\"20\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45312\",\"Transactions.Transaction_Amount\":\"3423\"},{\"Sales.Sale_ID\":21,\"Sales.Customer_ID\":30,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45312,\"Sales.Total_Amount\":3557,\"Transactions.Transaction_ID\":\"15\",\"Transactions.Sale_ID\":\"21\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45310\",\"Transactions.Transaction_Amount\":\"2494\"},{\"Sales.Sale_ID\":21,\"Sales.Customer_ID\":30,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45312,\"Sales.Total_Amount\":3557,\"Transactions.Transaction_ID\":\"36\",\"Transactions.Sale_ID\":\"21\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45331\",\"Transactions.Transaction_Amount\":\"462\"},{\"Sales.Sale_ID\":21,\"Sales.Customer_ID\":38,\"Sales.Product_ID\":9,\"Sales.Sale_Date\":45313,\"Sales.Total_Amount\":1736,\"Transactions.Transaction_ID\":\"15\",\"Transactions.Sale_ID\":\"21\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45310\",\"Transactions.Transaction_Amount\":\"2494\"},{\"Sales.Sale_ID\":21,\"Sales.Customer_ID\":38,\"Sales.Product_ID\":9,\"Sales.Sale_Date\":45313,\"Sales.Total_Amount\":1736,\"Transactions.Transaction_ID\":\"36\",\"Transactions.Sale_ID\":\"21\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45331\",\"Transactions.Transaction_Amount\":\"462\"},{\"Sales.Sale_ID\":21,\"Sales.Customer_ID\":2,\"Sales.Product_ID\":8,\"Sales.Sale_Date\":45314,\"Sales.Total_Amount\":3796,\"Transactions.Transaction_ID\":\"15\",\"Transactions.Sale_ID\":\"21\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45310\",\"Transactions.Transaction_Amount\":\"2494\"},{\"Sales.Sale_ID\":21,\"Sales.Customer_ID\":2,\"Sales.Product_ID\":8,\"Sales.Sale_Date\":45314,\"Sales.Total_Amount\":3796,\"Transactions.Transaction_ID\":\"36\",\"Transactions.Sale_ID\":\"21\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45331\",\"Transactions.Transaction_Amount\":\"462\"},{\"Sales.Sale_ID\":21,\"Sales.Customer_ID\":21,\"Sales.Product_ID\":12,\"Sales.Sale_Date\":45315,\"Sales.Total_Amount\":3099,\"Transactions.Transaction_ID\":\"15\",\"Transactions.Sale_ID\":\"21\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45310\",\"Transactions.Transaction_Amount\":\"2494\"},{\"Sales.Sale_ID\":21,\"Sales.Customer_ID\":21,\"Sales.Product_ID\":12,\"Sales.Sale_Date\":45315,\"Sales.Total_Amount\":3099,\"Transactions.Transaction_ID\":\"36\",\"Transactions.Sale_ID\":\"21\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45331\",\"Transactions.Transaction_Amount\":\"462\"},{\"Sales.Sale_ID\":25,\"Sales.Customer_ID\":33,\"Sales.Product_ID\":2,\"Sales.Sale_Date\":45316,\"Sales.Total_Amount\":3252,\"Transactions.Transaction_ID\":\"74\",\"Transactions.Sale_ID\":\"25\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45369\",\"Transactions.Transaction_Amount\":\"2988\"},{\"Sales.Sale_ID\":25,\"Sales.Customer_ID\":33,\"Sales.Product_ID\":2,\"Sales.Sale_Date\":45316,\"Sales.Total_Amount\":3252,\"Transactions.Transaction_ID\":\"97\",\"Transactions.Sale_ID\":\"25\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45392\",\"Transactions.Transaction_Amount\":\"1590\"},{\"Sales.Sale_ID\":25,\"Sales.Customer_ID\":33,\"Sales.Product_ID\":2,\"Sales.Sale_Date\":45316,\"Sales.Total_Amount\":3252,\"Transactions.Transaction_ID\":\"98\",\"Transactions.Sale_ID\":\"25\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45393\",\"Transactions.Transaction_Amount\":\"3286\"},{\"Sales.Sale_ID\":25,\"Sales.Customer_ID\":33,\"Sales.Product_ID\":2,\"Sales.Sale_Date\":45316,\"Sales.Total_Amount\":3252,\"Transactions.Transaction_ID\":\"99\",\"Transactions.Sale_ID\":\"25\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45394\",\"Transactions.Transaction_Amount\":\"2436\"},{\"Sales.Sale_ID\":25,\"Sales.Customer_ID\":33,\"Sales.Product_ID\":2,\"Sales.Sale_Date\":45316,\"Sales.Total_Amount\":3252,\"Transactions.Transaction_ID\":\"100\",\"Transactions.Sale_ID\":\"25\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45395\",\"Transactions.Transaction_Amount\":\"3769\"},{\"Sales.Sale_ID\":26,\"Sales.Customer_ID\":12,\"Sales.Product_ID\":1,\"Sales.Sale_Date\":45317,\"Sales.Total_Amount\":798,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":27,\"Sales.Customer_ID\":22,\"Sales.Product_ID\":16,\"Sales.Sale_Date\":45318,\"Sales.Total_Amount\":2260,\"Transactions.Transaction_ID\":\"33\",\"Transactions.Sale_ID\":\"27\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45328\",\"Transactions.Transaction_Amount\":\"875\"},{\"Sales.Sale_ID\":27,\"Sales.Customer_ID\":22,\"Sales.Product_ID\":16,\"Sales.Sale_Date\":45318,\"Sales.Total_Amount\":2260,\"Transactions.Transaction_ID\":\"34\",\"Transactions.Sale_ID\":\"27\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45329\",\"Transactions.Transaction_Amount\":\"1566\"},{\"Sales.Sale_ID\":27,\"Sales.Customer_ID\":22,\"Sales.Product_ID\":16,\"Sales.Sale_Date\":45318,\"Sales.Total_Amount\":2260,\"Transactions.Transaction_ID\":\"86\",\"Transactions.Sale_ID\":\"27\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45381\",\"Transactions.Transaction_Amount\":\"4380\"},{\"Sales.Sale_ID\":28,\"Sales.Customer_ID\":44,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45319,\"Sales.Total_Amount\":4197,\"Transactions.Transaction_ID\":\"39\",\"Transactions.Sale_ID\":\"28\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45334\",\"Transactions.Transaction_Amount\":\"2858\"},{\"Sales.Sale_ID\":29,\"Sales.Customer_ID\":25,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45320,\"Sales.Total_Amount\":4837,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":30,\"Sales.Customer_ID\":49,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45321,\"Sales.Total_Amount\":954,\"Transactions.Transaction_ID\":\"28\",\"Transactions.Sale_ID\":\"30\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45323\",\"Transactions.Transaction_Amount\":\"467\"},{\"Sales.Sale_ID\":30,\"Sales.Customer_ID\":49,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45321,\"Sales.Total_Amount\":954,\"Transactions.Transaction_ID\":\"37\",\"Transactions.Sale_ID\":\"30\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45332\",\"Transactions.Transaction_Amount\":\"778\"},{\"Sales.Sale_ID\":30,\"Sales.Customer_ID\":49,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45321,\"Sales.Total_Amount\":954,\"Transactions.Transaction_ID\":\"53\",\"Transactions.Sale_ID\":\"30\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45348\",\"Transactions.Transaction_Amount\":\"3816\"},{\"Sales.Sale_ID\":31,\"Sales.Customer_ID\":27,\"Sales.Product_ID\":24,\"Sales.Sale_Date\":45322,\"Sales.Total_Amount\":3574,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":32,\"Sales.Customer_ID\":42,\"Sales.Product_ID\":5,\"Sales.Sale_Date\":45323,\"Sales.Total_Amount\":1807,\"Transactions.Transaction_ID\":\"69\",\"Transactions.Sale_ID\":\"32\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45364\",\"Transactions.Transaction_Amount\":\"4996\"},{\"Sales.Sale_ID\":32,\"Sales.Customer_ID\":42,\"Sales.Product_ID\":5,\"Sales.Sale_Date\":45323,\"Sales.Total_Amount\":1807,\"Transactions.Transaction_ID\":\"81\",\"Transactions.Sale_ID\":\"32\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45376\",\"Transactions.Transaction_Amount\":\"3032\"},{\"Sales.Sale_ID\":33,\"Sales.Customer_ID\":28,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45324,\"Sales.Total_Amount\":2877,\"Transactions.Transaction_ID\":\"11\",\"Transactions.Sale_ID\":\"33\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45306\",\"Transactions.Transaction_Amount\":\"3548\"},{\"Sales.Sale_ID\":33,\"Sales.Customer_ID\":28,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45324,\"Sales.Total_Amount\":2877,\"Transactions.Transaction_ID\":\"13\",\"Transactions.Sale_ID\":\"33\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45308\",\"Transactions.Transaction_Amount\":\"1116\"},{\"Sales.Sale_ID\":33,\"Sales.Customer_ID\":28,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45324,\"Sales.Total_Amount\":2877,\"Transactions.Transaction_ID\":\"22\",\"Transactions.Sale_ID\":\"33\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45317\",\"Transactions.Transaction_Amount\":\"2824\"},{\"Sales.Sale_ID\":33,\"Sales.Customer_ID\":28,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45324,\"Sales.Total_Amount\":2877,\"Transactions.Transaction_ID\":\"71\",\"Transactions.Sale_ID\":\"33\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45366\",\"Transactions.Transaction_Amount\":\"193\"},{\"Sales.Sale_ID\":33,\"Sales.Customer_ID\":28,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45324,\"Sales.Total_Amount\":2877,\"Transactions.Transaction_ID\":\"90\",\"Transactions.Sale_ID\":\"33\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45385\",\"Transactions.Transaction_Amount\":\"3374\"},{\"Sales.Sale_ID\":34,\"Sales.Customer_ID\":16,\"Sales.Product_ID\":12,\"Sales.Sale_Date\":45325,\"Sales.Total_Amount\":1833,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":35,\"Sales.Customer_ID\":15,\"Sales.Product_ID\":8,\"Sales.Sale_Date\":45326,\"Sales.Total_Amount\":3610,\"Transactions.Transaction_ID\":\"6\",\"Transactions.Sale_ID\":\"35\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45301\",\"Transactions.Transaction_Amount\":\"3796\"},{\"Sales.Sale_ID\":35,\"Sales.Customer_ID\":15,\"Sales.Product_ID\":8,\"Sales.Sale_Date\":45326,\"Sales.Total_Amount\":3610,\"Transactions.Transaction_ID\":\"47\",\"Transactions.Sale_ID\":\"35\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45342\",\"Transactions.Transaction_Amount\":\"1621\"},{\"Sales.Sale_ID\":36,\"Sales.Customer_ID\":47,\"Sales.Product_ID\":22,\"Sales.Sale_Date\":45327,\"Sales.Total_Amount\":302,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":37,\"Sales.Customer_ID\":44,\"Sales.Product_ID\":27,\"Sales.Sale_Date\":45328,\"Sales.Total_Amount\":3355,\"Transactions.Transaction_ID\":\"58\",\"Transactions.Sale_ID\":\"37\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45353\",\"Transactions.Transaction_Amount\":\"778\"},{\"Sales.Sale_ID\":37,\"Sales.Customer_ID\":44,\"Sales.Product_ID\":27,\"Sales.Sale_Date\":45328,\"Sales.Total_Amount\":3355,\"Transactions.Transaction_ID\":\"59\",\"Transactions.Sale_ID\":\"37\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45354\",\"Transactions.Transaction_Amount\":\"1415\"},{\"Sales.Sale_ID\":37,\"Sales.Customer_ID\":44,\"Sales.Product_ID\":27,\"Sales.Sale_Date\":45328,\"Sales.Total_Amount\":3355,\"Transactions.Transaction_ID\":\"60\",\"Transactions.Sale_ID\":\"37\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45355\",\"Transactions.Transaction_Amount\":\"4542\"},{\"Sales.Sale_ID\":38,\"Sales.Customer_ID\":3,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45329,\"Sales.Total_Amount\":4318,\"Transactions.Transaction_ID\":\"29\",\"Transactions.Sale_ID\":\"38\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45324\",\"Transactions.Transaction_Amount\":\"164\"},{\"Sales.Sale_ID\":39,\"Sales.Customer_ID\":37,\"Sales.Product_ID\":1,\"Sales.Sale_Date\":45330,\"Sales.Total_Amount\":4596,\"Transactions.Transaction_ID\":\"94\",\"Transactions.Sale_ID\":\"39\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45389\",\"Transactions.Transaction_Amount\":\"3043\"},{\"Sales.Sale_ID\":40,\"Sales.Customer_ID\":7,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45331,\"Sales.Total_Amount\":866,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":41,\"Sales.Customer_ID\":21,\"Sales.Product_ID\":5,\"Sales.Sale_Date\":45332,\"Sales.Total_Amount\":4489,\"Transactions.Transaction_ID\":\"9\",\"Transactions.Sale_ID\":\"41\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45304\",\"Transactions.Transaction_Amount\":\"4050\"},{\"Sales.Sale_ID\":42,\"Sales.Customer_ID\":9,\"Sales.Product_ID\":15,\"Sales.Sale_Date\":45333,\"Sales.Total_Amount\":2427,\"Transactions.Transaction_ID\":\"96\",\"Transactions.Sale_ID\":\"42\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45391\",\"Transactions.Transaction_Amount\":\"1267\"},{\"Sales.Sale_ID\":43,\"Sales.Customer_ID\":39,\"Sales.Product_ID\":14,\"Sales.Sale_Date\":45334,\"Sales.Total_Amount\":3031,\"Transactions.Transaction_ID\":\"92\",\"Transactions.Sale_ID\":\"43\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45387\",\"Transactions.Transaction_Amount\":\"1592\"},{\"Sales.Sale_ID\":44,\"Sales.Customer_ID\":18,\"Sales.Product_ID\":3,\"Sales.Sale_Date\":45335,\"Sales.Total_Amount\":297,\"Transactions.Transaction_ID\":\"51\",\"Transactions.Sale_ID\":\"44\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45346\",\"Transactions.Transaction_Amount\":\"3901\"},{\"Sales.Sale_ID\":45,\"Sales.Customer_ID\":4,\"Sales.Product_ID\":1,\"Sales.Sale_Date\":45336,\"Sales.Total_Amount\":2030,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":46,\"Sales.Customer_ID\":25,\"Sales.Product_ID\":5,\"Sales.Sale_Date\":45337,\"Sales.Total_Amount\":3682,\"Transactions.Transaction_ID\":\"55\",\"Transactions.Sale_ID\":\"46\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45350\",\"Transactions.Transaction_Amount\":\"2964\"},{\"Sales.Sale_ID\":46,\"Sales.Customer_ID\":25,\"Sales.Product_ID\":5,\"Sales.Sale_Date\":45337,\"Sales.Total_Amount\":3682,\"Transactions.Transaction_ID\":\"61\",\"Transactions.Sale_ID\":\"46\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45356\",\"Transactions.Transaction_Amount\":\"748\"},{\"Sales.Sale_ID\":46,\"Sales.Customer_ID\":25,\"Sales.Product_ID\":5,\"Sales.Sale_Date\":45337,\"Sales.Total_Amount\":3682,\"Transactions.Transaction_ID\":\"79\",\"Transactions.Sale_ID\":\"46\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45374\",\"Transactions.Transaction_Amount\":\"1112\"},{\"Sales.Sale_ID\":47,\"Sales.Customer_ID\":14,\"Sales.Product_ID\":26,\"Sales.Sale_Date\":45338,\"Sales.Total_Amount\":708,\"Transactions.Transaction_ID\":\"82\",\"Transactions.Sale_ID\":\"47\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45377\",\"Transactions.Transaction_Amount\":\"3344\"},{\"Sales.Sale_ID\":48,\"Sales.Customer_ID\":50,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45339,\"Sales.Total_Amount\":3372,\"Transactions.Transaction_ID\":\"16\",\"Transactions.Sale_ID\":\"48\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45311\",\"Transactions.Transaction_Amount\":\"4157\"},{\"Sales.Sale_ID\":48,\"Sales.Customer_ID\":50,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45339,\"Sales.Total_Amount\":3372,\"Transactions.Transaction_ID\":\"23\",\"Transactions.Sale_ID\":\"48\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45318\",\"Transactions.Transaction_Amount\":\"2946\"},{\"Sales.Sale_ID\":48,\"Sales.Customer_ID\":50,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45339,\"Sales.Total_Amount\":3372,\"Transactions.Transaction_ID\":\"44\",\"Transactions.Sale_ID\":\"48\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45339\",\"Transactions.Transaction_Amount\":\"2836\"},{\"Sales.Sale_ID\":48,\"Sales.Customer_ID\":50,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45339,\"Sales.Total_Amount\":3372,\"Transactions.Transaction_ID\":\"93\",\"Transactions.Sale_ID\":\"48\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45388\",\"Transactions.Transaction_Amount\":\"1241\"},{\"Sales.Sale_ID\":49,\"Sales.Customer_ID\":9,\"Sales.Product_ID\":14,\"Sales.Sale_Date\":45340,\"Sales.Total_Amount\":1247,\"Transactions.Transaction_ID\":\"49\",\"Transactions.Sale_ID\":\"49\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45344\",\"Transactions.Transaction_Amount\":\"1737\"},{\"Sales.Sale_ID\":50,\"Sales.Customer_ID\":26,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45341,\"Sales.Total_Amount\":4382,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":51,\"Sales.Customer_ID\":2,\"Sales.Product_ID\":27,\"Sales.Sale_Date\":45342,\"Sales.Total_Amount\":3497,\"Transactions.Transaction_ID\":\"30\",\"Transactions.Sale_ID\":\"51\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45325\",\"Transactions.Transaction_Amount\":\"666\"},{\"Sales.Sale_ID\":52,\"Sales.Customer_ID\":20,\"Sales.Product_ID\":9,\"Sales.Sale_Date\":45343,\"Sales.Total_Amount\":2611,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":53,\"Sales.Customer_ID\":28,\"Sales.Product_ID\":15,\"Sales.Sale_Date\":45344,\"Sales.Total_Amount\":1894,\"Transactions.Transaction_ID\":\"62\",\"Transactions.Sale_ID\":\"53\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45357\",\"Transactions.Transaction_Amount\":\"445\"},{\"Sales.Sale_ID\":54,\"Sales.Customer_ID\":47,\"Sales.Product_ID\":15,\"Sales.Sale_Date\":45345,\"Sales.Total_Amount\":759,\"Transactions.Transaction_ID\":\"5\",\"Transactions.Sale_ID\":\"54\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45300\",\"Transactions.Transaction_Amount\":\"1981\"},{\"Sales.Sale_ID\":54,\"Sales.Customer_ID\":47,\"Sales.Product_ID\":15,\"Sales.Sale_Date\":45345,\"Sales.Total_Amount\":759,\"Transactions.Transaction_ID\":\"31\",\"Transactions.Sale_ID\":\"54\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45326\",\"Transactions.Transaction_Amount\":\"4024\"},{\"Sales.Sale_ID\":54,\"Sales.Customer_ID\":47,\"Sales.Product_ID\":15,\"Sales.Sale_Date\":45345,\"Sales.Total_Amount\":759,\"Transactions.Transaction_ID\":\"76\",\"Transactions.Sale_ID\":\"54\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45371\",\"Transactions.Transaction_Amount\":\"3272\"},{\"Sales.Sale_ID\":55,\"Sales.Customer_ID\":7,\"Sales.Product_ID\":26,\"Sales.Sale_Date\":45346,\"Sales.Total_Amount\":2911,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":56,\"Sales.Customer_ID\":44,\"Sales.Product_ID\":10,\"Sales.Sale_Date\":45347,\"Sales.Total_Amount\":1469,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":57,\"Sales.Customer_ID\":8,\"Sales.Product_ID\":28,\"Sales.Sale_Date\":45348,\"Sales.Total_Amount\":2086,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":58,\"Sales.Customer_ID\":47,\"Sales.Product_ID\":13,\"Sales.Sale_Date\":45349,\"Sales.Total_Amount\":246,\"Transactions.Transaction_ID\":\"77\",\"Transactions.Sale_ID\":\"58\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45372\",\"Transactions.Transaction_Amount\":\"1217\"},{\"Sales.Sale_ID\":59,\"Sales.Customer_ID\":35,\"Sales.Product_ID\":19,\"Sales.Sale_Date\":45350,\"Sales.Total_Amount\":3319,\"Transactions.Transaction_ID\":\"25\",\"Transactions.Sale_ID\":\"59\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45320\",\"Transactions.Transaction_Amount\":\"825\"},{\"Sales.Sale_ID\":60,\"Sales.Customer_ID\":14,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45351,\"Sales.Total_Amount\":3011,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":61,\"Sales.Customer_ID\":17,\"Sales.Product_ID\":17,\"Sales.Sale_Date\":45352,\"Sales.Total_Amount\":1834,\"Transactions.Transaction_ID\":\"8\",\"Transactions.Sale_ID\":\"61\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45303\",\"Transactions.Transaction_Amount\":\"1618\"},{\"Sales.Sale_ID\":61,\"Sales.Customer_ID\":17,\"Sales.Product_ID\":17,\"Sales.Sale_Date\":45352,\"Sales.Total_Amount\":1834,\"Transactions.Transaction_ID\":\"43\",\"Transactions.Sale_ID\":\"61\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45338\",\"Transactions.Transaction_Amount\":\"3017\"},{\"Sales.Sale_ID\":62,\"Sales.Customer_ID\":36,\"Sales.Product_ID\":20,\"Sales.Sale_Date\":45353,\"Sales.Total_Amount\":1943,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":63,\"Sales.Customer_ID\":50,\"Sales.Product_ID\":29,\"Sales.Sale_Date\":45354,\"Sales.Total_Amount\":588,\"Transactions.Transaction_ID\":\"67\",\"Transactions.Sale_ID\":\"63\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45362\",\"Transactions.Transaction_Amount\":\"767\"},{\"Sales.Sale_ID\":64,\"Sales.Customer_ID\":40,\"Sales.Product_ID\":4,\"Sales.Sale_Date\":45355,\"Sales.Total_Amount\":3076,\"Transactions.Transaction_ID\":\"40\",\"Transactions.Sale_ID\":\"64\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45335\",\"Transactions.Transaction_Amount\":\"725\"},{\"Sales.Sale_ID\":64,\"Sales.Customer_ID\":40,\"Sales.Product_ID\":4,\"Sales.Sale_Date\":45355,\"Sales.Total_Amount\":3076,\"Transactions.Transaction_ID\":\"48\",\"Transactions.Sale_ID\":\"64\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45343\",\"Transactions.Transaction_Amount\":\"2193\"},{\"Sales.Sale_ID\":65,\"Sales.Customer_ID\":4,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45356,\"Sales.Total_Amount\":2059,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":66,\"Sales.Customer_ID\":2,\"Sales.Product_ID\":5,\"Sales.Sale_Date\":45357,\"Sales.Total_Amount\":2485,\"Transactions.Transaction_ID\":\"4\",\"Transactions.Sale_ID\":\"66\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45299\",\"Transactions.Transaction_Amount\":\"1737\"},{\"Sales.Sale_ID\":66,\"Sales.Customer_ID\":2,\"Sales.Product_ID\":5,\"Sales.Sale_Date\":45357,\"Sales.Total_Amount\":2485,\"Transactions.Transaction_ID\":\"85\",\"Transactions.Sale_ID\":\"66\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45380\",\"Transactions.Transaction_Amount\":\"782\"},{\"Sales.Sale_ID\":67,\"Sales.Customer_ID\":6,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45358,\"Sales.Total_Amount\":3019,\"Transactions.Transaction_ID\":\"20\",\"Transactions.Sale_ID\":\"67\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45315\",\"Transactions.Transaction_Amount\":\"803\"},{\"Sales.Sale_ID\":67,\"Sales.Customer_ID\":6,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45358,\"Sales.Total_Amount\":3019,\"Transactions.Transaction_ID\":\"72\",\"Transactions.Sale_ID\":\"67\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45367\",\"Transactions.Transaction_Amount\":\"3190\"},{\"Sales.Sale_ID\":67,\"Sales.Customer_ID\":6,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45358,\"Sales.Total_Amount\":3019,\"Transactions.Transaction_ID\":\"78\",\"Transactions.Sale_ID\":\"67\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45373\",\"Transactions.Transaction_Amount\":\"2666\"},{\"Sales.Sale_ID\":68,\"Sales.Customer_ID\":42,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45359,\"Sales.Total_Amount\":4836,\"Transactions.Transaction_ID\":\"12\",\"Transactions.Sale_ID\":\"68\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45307\",\"Transactions.Transaction_Amount\":\"3963\"},{\"Sales.Sale_ID\":69,\"Sales.Customer_ID\":4,\"Sales.Product_ID\":13,\"Sales.Sale_Date\":45360,\"Sales.Total_Amount\":1902,\"Transactions.Transaction_ID\":\"42\",\"Transactions.Sale_ID\":\"69\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45337\",\"Transactions.Transaction_Amount\":\"2554\"},{\"Sales.Sale_ID\":70,\"Sales.Customer_ID\":29,\"Sales.Product_ID\":15,\"Sales.Sale_Date\":45361,\"Sales.Total_Amount\":4161,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":71,\"Sales.Customer_ID\":18,\"Sales.Product_ID\":11,\"Sales.Sale_Date\":45362,\"Sales.Total_Amount\":3469,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":72,\"Sales.Customer_ID\":26,\"Sales.Product_ID\":29,\"Sales.Sale_Date\":45363,\"Sales.Total_Amount\":362,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":73,\"Sales.Customer_ID\":44,\"Sales.Product_ID\":4,\"Sales.Sale_Date\":45364,\"Sales.Total_Amount\":723,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":74,\"Sales.Customer_ID\":34,\"Sales.Product_ID\":13,\"Sales.Sale_Date\":45365,\"Sales.Total_Amount\":1116,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":75,\"Sales.Customer_ID\":10,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45366,\"Sales.Total_Amount\":3743,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":76,\"Sales.Customer_ID\":36,\"Sales.Product_ID\":27,\"Sales.Sale_Date\":45367,\"Sales.Total_Amount\":2149,\"Transactions.Transaction_ID\":\"24\",\"Transactions.Sale_ID\":\"76\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45319\",\"Transactions.Transaction_Amount\":\"4235\"},{\"Sales.Sale_ID\":76,\"Sales.Customer_ID\":36,\"Sales.Product_ID\":27,\"Sales.Sale_Date\":45367,\"Sales.Total_Amount\":2149,\"Transactions.Transaction_ID\":\"83\",\"Transactions.Sale_ID\":\"76\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45378\",\"Transactions.Transaction_Amount\":\"4779\"},{\"Sales.Sale_ID\":76,\"Sales.Customer_ID\":36,\"Sales.Product_ID\":27,\"Sales.Sale_Date\":45367,\"Sales.Total_Amount\":2149,\"Transactions.Transaction_ID\":\"84\",\"Transactions.Sale_ID\":\"76\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45379\",\"Transactions.Transaction_Amount\":\"1206\"},{\"Sales.Sale_ID\":77,\"Sales.Customer_ID\":14,\"Sales.Product_ID\":19,\"Sales.Sale_Date\":45368,\"Sales.Total_Amount\":3823,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":78,\"Sales.Customer_ID\":31,\"Sales.Product_ID\":22,\"Sales.Sale_Date\":45369,\"Sales.Total_Amount\":4648,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":79,\"Sales.Customer_ID\":48,\"Sales.Product_ID\":28,\"Sales.Sale_Date\":45370,\"Sales.Total_Amount\":3208,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":80,\"Sales.Customer_ID\":15,\"Sales.Product_ID\":2,\"Sales.Sale_Date\":45371,\"Sales.Total_Amount\":4190,\"Transactions.Transaction_ID\":\"7\",\"Transactions.Sale_ID\":\"80\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45302\",\"Transactions.Transaction_Amount\":\"2477\"},{\"Sales.Sale_ID\":81,\"Sales.Customer_ID\":8,\"Sales.Product_ID\":10,\"Sales.Sale_Date\":45372,\"Sales.Total_Amount\":2156,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":82,\"Sales.Customer_ID\":14,\"Sales.Product_ID\":13,\"Sales.Sale_Date\":45373,\"Sales.Total_Amount\":3270,\"Transactions.Transaction_ID\":\"3\",\"Transactions.Sale_ID\":\"82\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45298\",\"Transactions.Transaction_Amount\":\"901\"},{\"Sales.Sale_ID\":82,\"Sales.Customer_ID\":23,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45374,\"Sales.Total_Amount\":1782,\"Transactions.Transaction_ID\":\"3\",\"Transactions.Sale_ID\":\"82\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45298\",\"Transactions.Transaction_Amount\":\"901\"},{\"Sales.Sale_ID\":84,\"Sales.Customer_ID\":40,\"Sales.Product_ID\":25,\"Sales.Sale_Date\":45375,\"Sales.Total_Amount\":2355,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":85,\"Sales.Customer_ID\":21,\"Sales.Product_ID\":21,\"Sales.Sale_Date\":45376,\"Sales.Total_Amount\":1254,\"Transactions.Transaction_ID\":\"68\",\"Transactions.Sale_ID\":\"85\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45363\",\"Transactions.Transaction_Amount\":\"2832\"},{\"Sales.Sale_ID\":86,\"Sales.Customer_ID\":16,\"Sales.Product_ID\":6,\"Sales.Sale_Date\":45377,\"Sales.Total_Amount\":4599,\"Transactions.Transaction_ID\":\"26\",\"Transactions.Sale_ID\":\"86\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45321\",\"Transactions.Transaction_Amount\":\"1675\"},{\"Sales.Sale_ID\":87,\"Sales.Customer_ID\":45,\"Sales.Product_ID\":28,\"Sales.Sale_Date\":45378,\"Sales.Total_Amount\":3291,\"Transactions.Transaction_ID\":\"70\",\"Transactions.Sale_ID\":\"87\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45365\",\"Transactions.Transaction_Amount\":\"3627\"},{\"Sales.Sale_ID\":87,\"Sales.Customer_ID\":18,\"Sales.Product_ID\":28,\"Sales.Sale_Date\":45379,\"Sales.Total_Amount\":1796,\"Transactions.Transaction_ID\":\"70\",\"Transactions.Sale_ID\":\"87\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45365\",\"Transactions.Transaction_Amount\":\"3627\"},{\"Sales.Sale_ID\":87,\"Sales.Customer_ID\":47,\"Sales.Product_ID\":12,\"Sales.Sale_Date\":45380,\"Sales.Total_Amount\":4091,\"Transactions.Transaction_ID\":\"70\",\"Transactions.Sale_ID\":\"87\",\"Transactions.Payment_Mode\":\"Credit Card\",\"Transactions.Transaction_Date\":\"45365\",\"Transactions.Transaction_Amount\":\"3627\"},{\"Sales.Sale_ID\":90,\"Sales.Customer_ID\":24,\"Sales.Product_ID\":12,\"Sales.Sale_Date\":45381,\"Sales.Total_Amount\":4823,\"Transactions.Transaction_ID\":\"88\",\"Transactions.Sale_ID\":\"90\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45383\",\"Transactions.Transaction_Amount\":\"1003\"},{\"Sales.Sale_ID\":91,\"Sales.Customer_ID\":26,\"Sales.Product_ID\":20,\"Sales.Sale_Date\":45382,\"Sales.Total_Amount\":4782,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":92,\"Sales.Customer_ID\":25,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45383,\"Sales.Total_Amount\":1748,\"Transactions.Transaction_ID\":\"52\",\"Transactions.Sale_ID\":\"92\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45347\",\"Transactions.Transaction_Amount\":\"3490\"},{\"Sales.Sale_ID\":93,\"Sales.Customer_ID\":45,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45384,\"Sales.Total_Amount\":1545,\"Transactions.Transaction_ID\":\"1\",\"Transactions.Sale_ID\":\"93\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45296\",\"Transactions.Transaction_Amount\":\"945\"},{\"Sales.Sale_ID\":93,\"Sales.Customer_ID\":45,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45384,\"Sales.Total_Amount\":1545,\"Transactions.Transaction_ID\":\"54\",\"Transactions.Sale_ID\":\"93\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45349\",\"Transactions.Transaction_Amount\":\"2376\"},{\"Sales.Sale_ID\":93,\"Sales.Customer_ID\":45,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45384,\"Sales.Total_Amount\":1545,\"Transactions.Transaction_ID\":\"95\",\"Transactions.Sale_ID\":\"93\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45390\",\"Transactions.Transaction_Amount\":\"2731\"},{\"Sales.Sale_ID\":94,\"Sales.Customer_ID\":41,\"Sales.Product_ID\":11,\"Sales.Sale_Date\":45385,\"Sales.Total_Amount\":4299,\"Transactions.Transaction_ID\":\"\",\"Transactions.Sale_ID\":\"\",\"Transactions.Payment_Mode\":\"\",\"Transactions.Transaction_Date\":\"\",\"Transactions.Transaction_Amount\":\"\"},{\"Sales.Sale_ID\":95,\"Sales.Customer_ID\":29,\"Sales.Product_ID\":26,\"Sales.Sale_Date\":45386,\"Sales.Total_Amount\":4023,\"Transactions.Transaction_ID\":\"63\",\"Transactions.Sale_ID\":\"95\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45358\",\"Transactions.Transaction_Amount\":\"4221\"},{\"Sales.Sale_ID\":95,\"Sales.Customer_ID\":29,\"Sales.Product_ID\":26,\"Sales.Sale_Date\":45386,\"Sales.Total_Amount\":4023,\"Transactions.Transaction_ID\":\"75\",\"Transactions.Sale_ID\":\"95\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45370\",\"Transactions.Transaction_Amount\":\"3686\"},{\"Sales.Sale_ID\":98,\"Sales.Customer_ID\":15,\"Sales.Product_ID\":23,\"Sales.Sale_Date\":45387,\"Sales.Total_Amount\":353,\"Transactions.Transaction_ID\":\"35\",\"Transactions.Sale_ID\":\"98\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45330\",\"Transactions.Transaction_Amount\":\"3196\"},{\"Sales.Sale_ID\":98,\"Sales.Customer_ID\":45,\"Sales.Product_ID\":28,\"Sales.Sale_Date\":45388,\"Sales.Total_Amount\":3283,\"Transactions.Transaction_ID\":\"35\",\"Transactions.Sale_ID\":\"98\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45330\",\"Transactions.Transaction_Amount\":\"3196\"},{\"Sales.Sale_ID\":98,\"Sales.Customer_ID\":1,\"Sales.Product_ID\":25,\"Sales.Sale_Date\":45389,\"Sales.Total_Amount\":2657,\"Transactions.Transaction_ID\":\"35\",\"Transactions.Sale_ID\":\"98\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45330\",\"Transactions.Transaction_Amount\":\"3196\"},{\"Sales.Sale_ID\":99,\"Sales.Customer_ID\":25,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45390,\"Sales.Total_Amount\":198,\"Transactions.Transaction_ID\":\"57\",\"Transactions.Sale_ID\":\"99\",\"Transactions.Payment_Mode\":\"Debit Card\",\"Transactions.Transaction_Date\":\"45352\",\"Transactions.Transaction_Amount\":\"645\"},{\"Sales.Sale_ID\":99,\"Sales.Customer_ID\":25,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45390,\"Sales.Total_Amount\":198,\"Transactions.Transaction_ID\":\"64\",\"Transactions.Sale_ID\":\"99\",\"Transactions.Payment_Mode\":\"Cash\",\"Transactions.Transaction_Date\":\"45359\",\"Transactions.Transaction_Amount\":\"4410\"},{\"Sales.Sale_ID\":99,\"Sales.Customer_ID\":25,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45390,\"Sales.Total_Amount\":198,\"Transactions.Transaction_ID\":\"65\",\"Transactions.Sale_ID\":\"99\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45360\",\"Transactions.Transaction_Amount\":\"2552\"},{\"Sales.Sale_ID\":99,\"Sales.Customer_ID\":25,\"Sales.Product_ID\":7,\"Sales.Sale_Date\":45390,\"Sales.Total_Amount\":198,\"Transactions.Transaction_ID\":\"66\",\"Transactions.Sale_ID\":\"99\",\"Transactions.Payment_Mode\":\"Net Banking\",\"Transactions.Transaction_Date\":\"45361\",\"Transactions.Transaction_Amount\":\"1869\"},{\"Sales.Sale_ID\":100,\"Sales.Customer_ID\":7,\"Sales.Product_ID\":30,\"Sales.Sale_Date\":45391,\"Sales.Total_Amount\":2300,\"Transactions.Transaction_ID\":\"10\",\"Transactions.Sale_ID\":\"100\",\"Transactions.Payment_Mode\":\"UPI\",\"Transactions.Transaction_Date\":\"45305\",\"Transactions.Transaction_Amount\":\"2788\"}],\"columns\":[\"Sales.Sale_ID\",\"Sales.Customer_ID\",\"Sales.Product_ID\",\"Sales.Sale_Date\",\"Sales.Total_Amount\",\"Transactions.Transaction_ID\",\"Transactions.Sale_ID\",\"Transactions.Payment_Mode\",\"Transactions.Transaction_Date\",\"Transactions.Transaction_Amount\"],\"numericColumns\":[\"Sales.Sale_ID\",\"Sales.Customer_ID\",\"Sales.Product_ID\",\"Sales.Sale_Date\",\"Sales.Total_Amount\"],\"categoricalColumns\":[\"Transactions.Transaction_ID\",\"Transactions.Sale_ID\",\"Transactions.Payment_Mode\",\"Transactions.Transaction_Date\",\"Transactions.Transaction_Amount\"]}','[{\"title\":\"Total Sales Revenue\",\"type\":\"KPI\",\"xAxisKey\":\"Transactions.Transaction_Date\",\"dataKey\":\"Sales.Total_Amount\",\"aggregation\":\"SUM\",\"description\":\"Shows the sum of all sales recorded in the dataset, representing overall business performance.\",\"id\":\"suggested-0-1764763784300\",\"color\":\"#4f46e5\"},{\"title\":\"Number of Sales\",\"type\":\"KPI\",\"xAxisKey\":\"Transactions.Transaction_Date\",\"dataKey\":\"Sales.Sale_ID\",\"aggregation\":\"COUNT\",\"description\":\"Displays the total count of individual sales transactions, indicating sales volume.\",\"id\":\"suggested-1-1764763784300\",\"color\":\"#4f46e5\"},{\"title\":\"Sales Revenue by Payment Mode\",\"type\":\"BAR\",\"xAxisKey\":\"Transactions.Payment_Mode\",\"dataKey\":\"Sales.Total_Amount\",\"aggregation\":\"SUM\",\"description\":\"Analyzes the total sales revenue generated through different payment methods, indicating preferred payment options and their financial contribution. Sales without an associated payment mode will not be included.\",\"id\":\"suggested-3-1764763792181\",\"color\":\"#4f46e5\"},{\"title\":\"Transaction Count by Payment Mode\",\"type\":\"BAR\",\"xAxisKey\":\"Transactions.Payment_Mode\",\"dataKey\":\"Transactions.Transaction_ID\",\"aggregation\":\"COUNT\",\"description\":\"Displays the number of transactions processed through each payment mode, showing volume per method and customer preferences.\",\"id\":\"suggested-4-1764763792181\",\"color\":\"#4f46e5\"},{\"title\":\"Sales Count by Transaction Date\",\"type\":\"BAR\",\"xAxisKey\":\"Transactions.Transaction_Date\",\"dataKey\":\"Transactions.Sale_ID\",\"aggregation\":\"COUNT\",\"description\":\"Shows the number of sales linked to a transaction on specific transaction dates, useful for understanding daily transaction volume and activity spikes. This chart treats Transaction_Date as a discrete categorical value.\",\"id\":\"suggested-5-1764763792181\",\"color\":\"#4f46e5\"},{\"title\":\"Total Sales Revenue\",\"type\":\"KPI\",\"xAxisKey\":\"Transactions.Payment_Mode\",\"dataKey\":\"Sales.Total_Amount\",\"aggregation\":\"SUM\",\"description\":\"The overall total sales amount generated, providing a high-level view of revenue performance. The X-axis key is provided to satisfy schema requirements for KPIs.\",\"id\":\"suggested-0-1764763792181\",\"color\":\"#4f46e5\"},{\"title\":\"Total Sales Count\",\"type\":\"KPI\",\"xAxisKey\":\"Transactions.Payment_Mode\",\"dataKey\":\"Sales.Sale_ID\",\"aggregation\":\"COUNT\",\"description\":\"The total number of individual sales transactions recorded, indicating business volume. The X-axis key is provided to satisfy schema requirements for KPIs.\",\"id\":\"suggested-1-1764763792181\",\"color\":\"#4f46e5\"},{\"title\":\"Average Sale Value\",\"type\":\"KPI\",\"xAxisKey\":\"Transactions.Payment_Mode\",\"dataKey\":\"Sales.Total_Amount\",\"aggregation\":\"AVERAGE\",\"description\":\"The average amount for each sale, helping to understand the typical value of a customer purchase. The X-axis key is provided to satisfy schema requirements for KPIs.\",\"id\":\"suggested-2-1764763792181\",\"color\":\"#4f46e5\"}]','2025-12-03 12:10:52');
/*!40000 ALTER TABLE `dashboards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_configuration_log`
--

DROP TABLE IF EXISTS `data_configuration_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `data_configuration_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `config_date` date NOT NULL,
  `config_time` time NOT NULL,
  `columns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`columns`)),
  `join_configs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`join_configs`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_config_date` (`config_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_configuration_log`
--

LOCK TABLES `data_configuration_log` WRITE;
/*!40000 ALTER TABLE `data_configuration_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `data_configuration_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `excel_data`
--

DROP TABLE IF EXISTS `excel_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `excel_data` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `sheet_id` int(11) NOT NULL,
  `row_index` int(11) NOT NULL,
  `row_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`row_data`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sheet_id` (`sheet_id`),
  KEY `idx_sheet_row` (`sheet_id`,`row_index`),
  KEY `idx_data_sheet_row` (`sheet_id`,`row_index`),
  CONSTRAINT `excel_data_ibfk_1` FOREIGN KEY (`sheet_id`) REFERENCES `excel_sheets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `excel_data`
--

LOCK TABLES `excel_data` WRITE;
/*!40000 ALTER TABLE `excel_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `excel_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `excel_sheets`
--

DROP TABLE IF EXISTS `excel_sheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `excel_sheets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_id` int(11) NOT NULL,
  `sheet_name` varchar(255) NOT NULL,
  `sheet_index` int(11) NOT NULL,
  `row_count` int(11) DEFAULT 0,
  `column_count` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  KEY `idx_file_sheet` (`file_id`,`sheet_index`),
  CONSTRAINT `excel_sheets_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `uploaded_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `excel_sheets`
--

LOCK TABLES `excel_sheets` WRITE;
/*!40000 ALTER TABLE `excel_sheets` DISABLE KEYS */;
/*!40000 ALTER TABLE `excel_sheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file_upload_log`
--

DROP TABLE IF EXISTS `file_upload_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `file_upload_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_id` int(11) NOT NULL,
  `upload_date` date NOT NULL,
  `upload_time` time NOT NULL,
  `file_path` varchar(500) DEFAULT NULL COMMENT 'Legacy field for reference',
  `status` enum('SUCCESS','FAILED','PROCESSING') DEFAULT 'SUCCESS',
  `error_message` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  KEY `idx_upload_date` (`upload_date`),
  CONSTRAINT `file_upload_log_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `uploaded_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_upload_log`
--

LOCK TABLES `file_upload_log` WRITE;
/*!40000 ALTER TABLE `file_upload_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `file_upload_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uploaded_files`
--

DROP TABLE IF EXISTS `uploaded_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `uploaded_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `sheet_count` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_files_user_created` (`user_id`,`created_at` DESC),
  CONSTRAINT `uploaded_files_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uploaded_files`
--

LOCK TABLES `uploaded_files` WRITE;
/*!40000 ALTER TABLE `uploaded_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `uploaded_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uploads_backup_old`
--

DROP TABLE IF EXISTS `uploads_backup_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `uploads_backup_old` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `uploads_backup_old_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uploads_backup_old`
--

LOCK TABLES `uploads_backup_old` WRITE;
/*!40000 ALTER TABLE `uploads_backup_old` DISABLE KEYS */;
INSERT INTO `uploads_backup_old` VALUES
(1,2,'1764082607930-533774460-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764082607930-533774460-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-11-25 14:56:47'),
(2,2,'1764316106025-994697172-Sales_Transactions_ManyToMany.xlsx','Sales_Transactions_ManyToMany.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764316106025-994697172-Sales_Transactions_ManyToMany.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',13466,'2025-11-28 07:48:26'),
(3,2,'1764317137095-713606795-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764317137095-713606795-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-11-28 08:05:37'),
(4,2,'1764320072170-289288641-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764320072170-289288641-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-11-28 08:54:32'),
(5,2,'1764320913764-826296232-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764320913764-826296232-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-11-28 09:08:33'),
(6,2,'1764321623735-640660434-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764321623735-640660434-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-11-28 09:20:23'),
(7,2,'1764321646231-340133205-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764321646231-340133205-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-11-28 09:20:46'),
(8,2,'1764321843050-973201280-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764321843050-973201280-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-11-28 09:24:03'),
(9,2,'1764321998629-976545375-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764321998629-976545375-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-11-28 09:26:38'),
(10,3,'1764331079956-176077030-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764331079956-176077030-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-11-28 11:57:59'),
(11,3,'1764331269734-55482043-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764331269734-55482043-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-11-28 12:01:10'),
(12,3,'1764331402951-411085809-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764331402951-411085809-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-11-28 12:03:23'),
(13,3,'1764331437855-507856476-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764331437855-507856476-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-11-28 12:03:57'),
(14,3,'1764331875264-479656863-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764331875264-479656863-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-11-28 12:11:15'),
(15,3,'1764335502027-281815422-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764335502027-281815422-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-11-28 13:11:42'),
(16,3,'1764336214064-633568643-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764336214064-633568643-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-11-28 13:23:34'),
(17,3,'1764568431228-404746863-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764568431228-404746863-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-12-01 05:53:51'),
(18,3,'1764569013018-561833018-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764569013018-561833018-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-12-01 06:03:33'),
(19,3,'1764569176187-221559622-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764569176187-221559622-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-12-01 06:06:16'),
(20,2,'1764573895547-128320452-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764573895547-128320452-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-12-01 07:24:55'),
(21,2,'1764574007947-773567989-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764574007947-773567989-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-12-01 07:26:48'),
(22,2,'1764574194788-801014205-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764574194788-801014205-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-12-01 07:29:54'),
(23,2,'1764574232724-278769409-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764574232724-278769409-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-01 07:30:32'),
(24,2,'1764574508004-644771360-sales_multi_sheet.xlsx','sales_multi_sheet.xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764574508004-644771360-sales_multi_sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',7798,'2025-12-01 07:35:08'),
(25,2,'1764574747422-952893504-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764574747422-952893504-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-01 07:39:07'),
(26,2,'1764574849374-475634716-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764574849374-475634716-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-01 07:40:49'),
(27,2,'1764575527724-15443628-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764575527724-15443628-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-01 07:52:07'),
(28,2,'1764575573542-831486426-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764575573542-831486426-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-01 07:52:53'),
(29,2,'1764576057740-790705218-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764576057740-790705218-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-01 08:00:57'),
(30,2,'1764578031594-199197194-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764578031594-199197194-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-01 08:33:51'),
(31,2,'1764593794212-811900522-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764593794212-811900522-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-01 12:56:34'),
(32,2,'1764757056121-326442682-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764757056121-326442682-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 10:17:36'),
(33,2,'1764759502951-980177417-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764759502951-980177417-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 10:58:23'),
(34,2,'1764759946721-941103858-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764759946721-941103858-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 11:05:46'),
(35,2,'1764760598581-237583901-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764760598581-237583901-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 11:16:38'),
(36,2,'1764760775785-879716656-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764760775785-879716656-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 11:19:35'),
(37,2,'1764760800492-308562586-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764760800492-308562586-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 11:20:00'),
(38,2,'1764762369232-403327082-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764762369232-403327082-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 11:46:09'),
(39,2,'1764763109458-435367975-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764763109458-435367975-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 11:58:29'),
(40,2,'1764763334520-707598059-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764763334520-707598059-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 12:02:14'),
(41,2,'1764763590743-962392231-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764763590743-962392231-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-03 12:06:30'),
(42,3,'1764838402503-95377341-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764838402503-95377341-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-04 08:53:23'),
(43,3,'1764839487894-440953736-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764839487894-440953736-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-04 09:11:28'),
(44,3,'1764843085232-743062954-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764843085232-743062954-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-04 10:11:25'),
(45,3,'1764844143870-964435842-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764844143870-964435842-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-04 10:29:04'),
(46,3,'1764844749137-710335134-Sales_Transactions_ManyToMany (1).xlsx','Sales_Transactions_ManyToMany (1).xlsx','/home/Suhaif/Downloads/insightai/server/uploads/1764844749137-710335134-Sales_Transactions_ManyToMany (1).xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',15303,'2025-12-04 10:39:09');
/*!40000 ALTER TABLE `uploads_backup_old` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','USER') DEFAULT 'USER',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Admin','admin@gmail.com','admin123','ADMIN','2025-11-25 14:53:45'),
(2,'User','user@gmail.com','123456','USER','2025-11-25 14:55:39'),
(3,'Suhaif','Suhaif_check@gmail.com','123456','USER','2025-11-28 11:54:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `v_file_details`
--

DROP TABLE IF EXISTS `v_file_details`;
/*!50001 DROP VIEW IF EXISTS `v_file_details`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_file_details` AS SELECT
 1 AS `file_id`,
  1 AS `original_name`,
  1 AS `mime_type`,
  1 AS `file_size`,
  1 AS `sheet_count`,
  1 AS `created_at`,
  1 AS `user_id`,
  1 AS `user_name`,
  1 AS `user_email`,
  1 AS `actual_sheet_count`,
  1 AS `total_rows` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_sheet_details`
--

DROP TABLE IF EXISTS `v_sheet_details`;
/*!50001 DROP VIEW IF EXISTS `v_sheet_details`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_sheet_details` AS SELECT
 1 AS `sheet_id`,
  1 AS `sheet_name`,
  1 AS `sheet_index`,
  1 AS `row_count`,
  1 AS `column_count`,
  1 AS `file_id`,
  1 AS `file_name`,
  1 AS `user_id`,
  1 AS `user_name` */;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_file_details`
--

/*!50001 DROP VIEW IF EXISTS `v_file_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_file_details` AS select `uf`.`id` AS `file_id`,`uf`.`original_name` AS `original_name`,`uf`.`mime_type` AS `mime_type`,`uf`.`file_size` AS `file_size`,`uf`.`sheet_count` AS `sheet_count`,`uf`.`created_at` AS `created_at`,`u`.`id` AS `user_id`,`u`.`name` AS `user_name`,`u`.`email` AS `user_email`,(select count(0) from `excel_sheets` where `excel_sheets`.`file_id` = `uf`.`id`) AS `actual_sheet_count`,(select sum(`excel_sheets`.`row_count`) from `excel_sheets` where `excel_sheets`.`file_id` = `uf`.`id`) AS `total_rows` from (`uploaded_files` `uf` join `users` `u` on(`uf`.`user_id` = `u`.`id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_sheet_details`
--

/*!50001 DROP VIEW IF EXISTS `v_sheet_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_sheet_details` AS select `es`.`id` AS `sheet_id`,`es`.`sheet_name` AS `sheet_name`,`es`.`sheet_index` AS `sheet_index`,`es`.`row_count` AS `row_count`,`es`.`column_count` AS `column_count`,`uf`.`id` AS `file_id`,`uf`.`original_name` AS `file_name`,`uf`.`user_id` AS `user_id`,`u`.`name` AS `user_name` from ((`excel_sheets` `es` join `uploaded_files` `uf` on(`es`.`file_id` = `uf`.`id`)) join `users` `u` on(`uf`.`user_id` = `u`.`id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-04 18:41:58
