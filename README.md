# SkillSync — A Student Skill Exchange & Peer Learning Platform

**Learn together. Share your skills. Grow together.**

SkillSync is a student-focused skill exchange platform that allows students to learn from one another by sharing their knowledge and abilities. Instead of relying only on traditional learning methods, students can connect with peers who possess the skills they want to learn and exchange knowledge through a credit-based system.

The platform encourages collaborative learning, peer-to-peer teaching, and effective use of students' existing skills.

🌐 **Live Website:** https://skillsync-hb.vercel.app

---

## 🎯 Project Objectives

* Create a platform for students to share their skills and knowledge.
* Help students discover skills offered by other students.
* Allow students to request and manage skill exchanges.
* Implement a credit-based system to encourage participation.
* Maintain structured records of students, skills, exchange requests, and credit transactions.
* Apply DBMS concepts to a practical, real-world application.

## ✨ Key Features

### 👨‍🎓 Student Management

Students can register, log in, and use the platform to participate in skill exchanges.

### 💡 Skill Sharing

Students can list the skills they can teach and discover skills they want to learn.

### 🔄 Skill Exchange Requests

Students can request to learn a skill from another student and manage exchange requests through their statuses.

### 🪙 Skill Credit System

SkillSync uses a credit-based mechanism to encourage fair participation.

* New students receive starter credits.
* Completing an accepted exchange deducts one credit from the learner.
* The student teaching the skill receives one credit.
* Credit transactions are recorded in the database.

### 📊 Database-Driven Application

The application uses MySQL to store and manage student information, skills, exchange requests, and credit-related records.

### 🌐 Online Deployment

The application is deployed using Vercel, with Aiven providing the hosted MySQL database.

## 🛠️ Technology Stack

| Technology   | Purpose                                    |
| ------------ | ------------------------------------------ |
| HTML         | Webpage structure                          |
| CSS          | Styling and layout                         |
| JavaScript   | Application functionality                  |
| Node.js      | Server-side JavaScript runtime             |
| Express.js   | Backend routes and HTTP handling           |
| MySQL        | Relational database management             |
| MySQL2       | Node.js–MySQL connectivity                 |
| Aiven        | Hosted MySQL database                      |
| Vercel       | Application deployment                     |
| Git & GitHub | Version control and source code management |

## 🗄️ Database Design

SkillSync uses a relational database to organize and manage its data.

The database includes the following tables:

| Table                 | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `students`            | Stores student details and Skill Credit balances  |
| `skills`              | Stores available skills                           |
| `student_skills`      | Connects students with the skills they offer      |
| `wanted_skills`       | Records skills students want to learn             |
| `exchange_requests`   | Stores and manages skill exchange requests        |
| `credit_transactions` | Maintains the history of credits earned and spent |

The database design uses relationships between tables to maintain consistency and reduce unnecessary duplication of data.

## 🔐 Credit Transfer Workflow

When a student completes an accepted skill exchange, the application performs the following operations:

1. Verifies that the exchange request exists.
2. Checks that the student requesting completion is authorized.
3. Confirms that the request has an `Accepted` status.
4. Checks the learner's available Skill Credits.
5. Deducts one credit from the learner.
6. Awards one credit to the student teaching the skill.
7. Records both sides of the credit transfer in `credit_transactions`.
8. Updates the exchange request status to `Completed`.
9. Commits the database transaction so the changes are saved together.

The transaction uses a dedicated MySQL connection, row locking, and rollback handling to help prevent duplicate credit transfers and maintain database consistency.

## 🏗️ Application Architecture

SkillSync follows a simple client-server architecture:

**Frontend → Express.js Backend → MySQL Database**

* **Frontend:** Provides the interface students use to interact with the platform.
* **Backend:** Handles application routes, business logic, and database operations.
* **Database:** Stores student records, skills, exchange requests, and credit transactions.
* **Hosting:** Vercel hosts the application, while Aiven hosts the MySQL database.

## 🚀 Getting Started

### Prerequisites

Install the following software before running the project locally:

* [Node.js](https://nodejs.org/)
* [Git](https://git-scm.com/)
* MySQL access through a local or hosted database
* A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/himanshubadaya2025-byte/SkillSync.git
```

### 2. Open the Project Folder

```bash
cd SkillSync
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root directory and add the database connection settings:

```env
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_username
DB_NAME=your_database_name
DB_PASSWORD=your_database_password
```

Replace the example values with the credentials for your MySQL database.

**Security:** Never commit your `.env` file or expose your database credentials publicly. Keep environment variables configured securely in your deployment platform.

### 5. Start the Application

Use the start command configured in `package.json`. If your project uses `node server.js`, run:

```bash
node server.js
```

Open the local address displayed by the server in your browser.

## 📚 DBMS Concepts Applied

This project demonstrates practical applications of database management concepts, including:

* Relational database design
* Primary keys and foreign keys
* Relationships between database tables
* SQL queries and data manipulation
* Database connectivity using Node.js
* Transaction management
* Commit and rollback operations
* Row locking and consistency during credit transfers
* Environment-based database configuration

## 🔮 Future Enhancements

Potential improvements include:

* Student ratings and feedback after exchanges
* Notifications for exchange requests
* Search and filtering by skill category
* Improved student profiles
* Exchange history and detailed credit statements
* Additional security and validation features
* A more responsive interface for mobile devices

## 🎓 Academic Project

SkillSync is developed as a Database Management Systems (DBMS) project to demonstrate how relational database concepts can be applied to a student-centered, peer-learning platform.

## 👨‍💻 Developer

**Himanshu Badaya**

GitHub: [@himanshubadaya2025-byte](https://github.com/himanshubadaya2025-byte)

---

**SkillSync — Your skills. Their knowledge. One community.**
