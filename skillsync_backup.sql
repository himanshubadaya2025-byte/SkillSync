-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: skillsync
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `credit_transactions`
--

DROP TABLE IF EXISTS `credit_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit_transactions` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `amount` int NOT NULL,
  `transaction_type` enum('Starter','Earned','Spent','Admin Adjustment') NOT NULL,
  `exchange_request_id` int DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `student_id` (`student_id`),
  KEY `exchange_request_id` (`exchange_request_id`),
  CONSTRAINT `credit_transactions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  CONSTRAINT `credit_transactions_ibfk_2` FOREIGN KEY (`exchange_request_id`) REFERENCES `exchange_requests` (`request_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credit_transactions`
--

LOCK TABLES `credit_transactions` WRITE;
/*!40000 ALTER TABLE `credit_transactions` DISABLE KEYS */;
INSERT INTO `credit_transactions` VALUES (1,5,2,'Starter',NULL,'2 starter Skill Credits awarded at registration','2026-10-12 06:46:40'),(2,1,-1,'Spent',2,'1 Skill Credit spent on a completed learning exchange','2026-10-12 07:22:17'),(3,4,1,'Earned',2,'1 Skill Credit earned by teaching a completed exchange','2026-10-12 07:22:17'),(4,6,2,'Starter',NULL,'2 starter Skill Credits awarded at registration','2026-10-16 21:06:34'),(5,7,2,'Starter',NULL,'2 starter Skill Credits awarded at registration','2026-10-17 12:42:13'),(6,7,-1,'Spent',4,'1 Skill Credit spent on a completed learning exchange','2026-10-17 13:33:00'),(7,1,1,'Earned',4,'1 Skill Credit earned by teaching a completed exchange','2026-10-17 13:33:00'),(8,7,-1,'Spent',10,'1 Skill Credit spent on a completed learning exchange','2026-10-17 15:32:14'),(9,1,1,'Earned',10,'1 Skill Credit earned by teaching a completed exchange','2026-10-17 15:32:14'),(10,1,-1,'Spent',8,'1 Skill Credit spent on a completed learning exchange','2026-10-17 15:33:21'),(11,7,1,'Earned',8,'1 Skill Credit earned by teaching a completed exchange','2026-10-17 15:33:21'),(12,7,-1,'Spent',9,'1 Skill Credit spent on a completed learning exchange','2026-10-17 15:33:29'),(13,1,1,'Earned',9,'1 Skill Credit earned by teaching a completed exchange','2026-10-17 15:33:29'),(14,1,-1,'Spent',11,'1 Skill Credit spent on a completed learning exchange','2026-10-17 17:16:37'),(15,7,1,'Earned',11,'1 Skill Credit earned by teaching a completed exchange','2026-10-17 17:16:37'),(16,7,-1,'Spent',13,'1 Skill Credit spent on a completed learning exchange','2026-10-17 17:19:23'),(17,1,1,'Earned',13,'1 Skill Credit earned by teaching a completed exchange','2026-10-17 17:19:23'),(18,1,-1,'Spent',14,'1 Skill Credit spent on a completed learning exchange','2026-10-17 17:47:56'),(19,7,1,'Earned',14,'1 Skill Credit earned by teaching a completed exchange','2026-10-17 17:47:56');
/*!40000 ALTER TABLE `credit_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exchange_requests`
--

DROP TABLE IF EXISTS `exchange_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exchange_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `requester_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `skill_id` int NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Accepted','Rejected','Completed') DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `requester_id` (`requester_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `skill_id` (`skill_id`),
  CONSTRAINT `exchange_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `exchange_requests_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `exchange_requests_ibfk_3` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchange_requests`
--

LOCK TABLES `exchange_requests` WRITE;
/*!40000 ALTER TABLE `exchange_requests` DISABLE KEYS */;
INSERT INTO `exchange_requests` VALUES (1,4,1,1,'heyy tanisha , i wanted to learn C programming, i would be grateful if you can teach me.','Accepted','2026-10-12 05:26:26',NULL),(2,1,4,2,'hey rahul , in exchange of c programming can u teach me python?','Completed','2026-10-12 06:00:37',NULL),(4,7,1,9,'hii, i\'d like to learn cooking from you, can you please teach me few basic basic things require to make chapati & Tea?','Completed','2026-10-17 13:24:31','2026-10-17 13:25:40'),(5,7,1,12,'hii','Rejected','2026-10-17 13:32:48',NULL),(6,1,7,14,'hi oj, i will glad if you can teach me fifa!!','Rejected','2026-10-17 14:44:51',NULL),(7,1,7,16,'hi','Rejected','2026-10-17 14:50:17',NULL),(8,1,7,17,'hi','Completed','2026-10-17 14:55:09','2026-10-17 14:55:29'),(9,7,1,8,'hlo','Completed','2026-10-17 14:59:25','2026-10-17 14:59:56'),(10,7,1,11,'can u teach me driving?','Completed','2026-10-17 15:30:24','2026-10-17 15:30:38'),(11,1,7,10,'heyy there, can you teach me biking?','Completed','2026-10-17 17:14:02','2026-10-17 17:15:54'),(12,1,3,10,'hii','Pending','2026-10-17 17:14:38',NULL),(13,7,1,18,'Khamma Ghani!!','Completed','2026-10-17 17:18:38','2026-10-17 17:19:06'),(14,1,7,19,'can u teach me dbms?','Completed','2026-10-17 17:46:46','2026-10-17 17:47:39'),(15,1,7,20,'heey can u teach me cn?','Accepted','2026-10-17 18:51:03','2026-10-17 18:51:44');
/*!40000 ALTER TABLE `exchange_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `skill_id` int NOT NULL AUTO_INCREMENT,
  `skill_name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`skill_id`),
  UNIQUE KEY `skill_name` (`skill_name`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skills`
--

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` VALUES (1,'C Programming','Programming','Learn C programming fundamentals'),(2,'Python','Programming','Learn Python programming'),(3,'Web Development','Technology','Learn HTML, CSS and JavaScript'),(4,'Java','Programming','Learn Java programming'),(5,'MySQL','Database','Learn SQL and database management'),(6,'Graphic Design','Design','Learn graphic design fundamentals'),(7,'Video Editing','Creative','Learn video editing techniques'),(8,'Public Speaking','Communication','Improve presentation and speaking skills'),(9,'Cooking',NULL,NULL),(10,'biking',NULL,NULL),(11,'Driving',NULL,NULL),(12,'Dancing',NULL,NULL),(13,'Da Vinci',NULL,NULL),(14,'FIFA',NULL,NULL),(15,'Singing',NULL,NULL),(16,'India Studies',NULL,NULL),(17,'Graphic Designing',NULL,NULL),(18,'photography',NULL,NULL),(19,'DBMS',NULL,NULL),(20,'CN',NULL,NULL);
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_skills`
--

DROP TABLE IF EXISTS `student_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_skills` (
  `student_id` int NOT NULL,
  `skill_id` int NOT NULL,
  `proficiency_level` enum('Beginner','Intermediate','Advanced') DEFAULT 'Beginner',
  PRIMARY KEY (`student_id`,`skill_id`),
  KEY `skill_id` (`skill_id`),
  CONSTRAINT `student_skills_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `student_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_skills`
--

LOCK TABLES `student_skills` WRITE;
/*!40000 ALTER TABLE `student_skills` DISABLE KEYS */;
INSERT INTO `student_skills` VALUES (1,1,'Beginner'),(1,4,'Intermediate'),(1,8,'Advanced'),(1,9,'Intermediate'),(1,11,'Beginner'),(1,12,'Intermediate'),(1,18,'Advanced'),(3,6,'Beginner'),(3,10,'Advanced'),(4,2,'Intermediate'),(4,7,'Beginner'),(7,10,'Advanced'),(7,14,'Advanced'),(7,15,'Intermediate'),(7,16,'Beginner'),(7,17,'Beginner'),(7,19,'Intermediate'),(7,20,'Intermediate');
/*!40000 ALTER TABLE `student_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `skill_credits` int NOT NULL DEFAULT '2',
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'Tanisha Garg','tanisha05@gmail.com','$2b$10$B12nZoAmbwVTLyptlnzE0udUtZr6TMn/AJkAQi.yMF6vgKFEjORNK','ECE','2026-10-11 17:53:04',2),(3,'Himahhh','hb@123gmail.com','$2b$10$SYkqqSb5vFJbcipaKljYm.yM91Kaqj2HIZTUpNx8ei4/DfsWUbU0K','CSE','2026-10-12 03:27:10',2),(4,'Rahul Sharma','rahul.test@example.com','$2b$10$ZsbemT6uTPVKFBN4QQ28FO5oWw30hLDtfPKN0P4B3h1.P88JIimki','CSE','2026-10-12 05:24:34',3),(5,'raj','raj1234@ymail.com','$2b$10$3jKr8xc73yXmBVcAuX2bluqQJv9xefVYVQUIgGzl.VokQVRF.tq4S','Civil','2026-10-12 06:46:40',2),(6,'dhoni','dh110@amail.com','$2b$10$CjUgiyax1au7EkZ1EX3x8ejIOa1Vgv/l/VKoJk0282gzNCC46g57y','Other','2026-10-16 21:06:34',2),(7,'oj','oj@123gmail.com','$2b$10$20YZrC/QTaLN7El.FVBJLOS8oIotcb2elx3FQ6ATeJ6D60Xog1Bwq','CSE','2026-10-17 12:42:13',1);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wanted_skills`
--

DROP TABLE IF EXISTS `wanted_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wanted_skills` (
  `student_id` int NOT NULL,
  `skill_id` int NOT NULL,
  PRIMARY KEY (`student_id`,`skill_id`),
  KEY `skill_id` (`skill_id`),
  CONSTRAINT `wanted_skills_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `wanted_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wanted_skills`
--

LOCK TABLES `wanted_skills` WRITE;
/*!40000 ALTER TABLE `wanted_skills` DISABLE KEYS */;
INSERT INTO `wanted_skills` VALUES (4,1),(1,2),(7,2),(1,5),(1,6),(1,7),(7,7),(1,8),(7,8),(7,9),(1,10),(1,11),(7,11),(1,12),(7,12),(1,13),(1,14),(1,16),(1,17),(7,17),(7,18),(1,19),(1,20);
/*!40000 ALTER TABLE `wanted_skills` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-18  1:12:15
