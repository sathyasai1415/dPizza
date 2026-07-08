# MiSlice Pizza Marketplace

Welcome to the **MiSlice** application! The project is organized as a decoupled, full-stack application using modern web technologies:

* ☕ **Backend**: Java 21 / Spring Boot 3.3.5 / REST API (located in `/backend`)
* 🅰️ **Frontend**: Angular standalone components / Signals / Tailwind CSS (located in `/frontend`)
* 🐘 **Database**: PostgreSQL (managed locally via Postgres.app)
* 🔥 **Authentication**: Firebase Authentication (Email/Password, Google Sign-in)

---

## 🚀 How to Run the Application Locally

Follow these simple steps to run the application on your computer:

### Step 1: Start PostgreSQL
Ensure your Postgres app is running. Your local database configuration is:
- **DB Name**: `mislice`
- **Username**: `mislice`
- **Password**: `mislice`
- **Host**: `localhost`
- **Port**: `5432`

---

### Step 2: Start the Backend (Spring Boot API)
1. Open a new terminal tab and change directory to `backend`:
   ```bash
   cd backend
   ```
2. Start the application:
   ```bash
   JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./mvnw spring-boot:run
   ```
*The backend server will launch and listen on http://localhost:8080.*

---

### Step 3: Start the Frontend (Angular)
1. Open another terminal tab and change directory to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm package dependencies (if running for the first time):
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   npm start
   ```
*Open your browser and navigate to http://localhost:4200 to view the application!*

---

## 📂 Project Structure

- `backend/`: Java source code, domain models, controllers, and Flyway database migrations.
- `frontend/`: Angular single-page application features, services, and shared layout styles.

---

## 📘 Production Setup & DevOps

For Docker containerization, Redis caching, GCS storage, and deployment configurations to Google App Engine and Firebase Hosting, please refer directly to the [Deployment Guide](file:///Applications/MISLICE/dPizza/DEPLOYMENT.md).
