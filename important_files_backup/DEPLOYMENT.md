# MiSlice Production Deployment Guide

This guide details how to configure, run, and deploy the decoupled **MiSlice** application in both local development and production environments.

---

## 🛠️ Local Development (Using Docker Compose)

The easiest way to run the entire stack (PostgreSQL, Redis, Spring Boot Backend) locally is by utilizing Docker Compose:

1. **Start the containers:**
   ```bash
   cd backend
   docker-compose up -d --build
   ```
   This will spin up:
   * **PostgreSQL** on port `5432`
   * **Redis** on port `6379`
   * **Spring Boot API** on port `8080`

2. **Run the Angular Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run start
   ```
   The application will be accessible at [http://localhost:4200](http://localhost:4200).

---

## 🔥 Firebase Authentication Setup

Since the application uses Firebase Authentication exclusively, you must configure the Firebase Auth Console:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and select your project `xx-1-2e007`.
2. Under **Build**, select **Authentication**.
3. Enable the following Sign-in Providers:
   * **Email/Password**
   * **Google**
4. Set up the demo accounts (if you wish to use the dashboard demo buttons):
   * Create `demo@mislice.com` with password `password`.
   * Create `owner@shamzpizza.com` with password `password`.

---

## ☕ Backend App Engine Deployment

To deploy the backend REST API directly to Google App Engine (Standard Environment):

1. **Log in to Google Cloud CLI:**
   ```bash
   gcloud auth login
   gcloud config set project xx-1-2e007
   ```

2. **Package and Deploy:**
   ```bash
   cd backend
   JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn clean package -DskipTests
   gcloud app deploy app.yaml --quiet
   ```

---

## 🅰️ Frontend Firebase Hosting Deployment

To deploy the Angular frontend to Firebase Hosting:

1. **Log in to Firebase CLI:**
   ```bash
   npx firebase login
   ```

2. **Build and Deploy:**
   ```bash
   cd frontend
   npm run build
   npx firebase deploy --only hosting
   ```
