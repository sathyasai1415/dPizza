# 🚀 Quick Start: Deploy MiSlice in 4 Steps

## Step 1: Set Up Google Cloud (15 min)

### 1.1 Create Account
- Go to https://cloud.google.com/free
- Click "Get started for free"
- Sign in with Google account
- Create project named "mislice"

### 1.2 Enable Services
```bash
# Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Set project
gcloud config set project PROJECT_ID
```

---

## Step 2: Deploy Backend (30 min)

### 2.1 Create `.dockerignore`
Create file: `/Applications/MISLICE/dPizza/backend/.dockerignore`
```
target/
.git
.gitignore
.env
README.md
```

### 2.2 Create `Dockerfile`
Create file: `/Applications/MISLICE/dPizza/backend/Dockerfile`
```dockerfile
FROM openjdk:21-slim
WORKDIR /app
COPY target/dPizza-*.jar app.jar
ENV PORT=8080
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

### 2.3 Build & Deploy
```bash
cd backend

# Build
./mvnw clean package -DskipTests

# Build Docker image
docker build -t gcr.io/mislice/backend .

# Push to Google Cloud
docker push gcr.io/mislice/backend

# Deploy to Cloud Run
gcloud run deploy mislice-backend \
  --image gcr.io/mislice/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=YOUR_DB_URL
```

**Note**: Get your backend URL from Cloud Run console (looks like: `https://mislice-backend-xxx.a.run.app`)

---

## Step 3: Deploy Frontend (20 min)

### 3.1 Create `firebase.json`
Create file: `/Applications/MISLICE/dPizza/firebase.json`
```json
{
  "hosting": {
    "public": "frontend/dist/app",
    "ignore": ["firebase.json", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 3.2 Update API URL
Edit: `frontend/src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://mislice-backend-xxx.a.run.app' // Your backend URL
};
```

### 3.3 Build & Deploy
```bash
cd frontend

# Build production app
npm run build

# Install Firebase CLI (if not already)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy
firebase deploy
```

**Your app is now live!** 🎉
URL will be: `https://your-project.web.app`

---

## Step 4: Set Up Custom Domain (15 min)

### 4.1 Buy Domain
- Go to https://www.namecheap.com
- Search for domain (e.g., "mislice.io")
- Buy domain (~$10/year)

### 4.2 Connect to Firebase
- Go to Firebase Console
- Click "Hosting"
- Click "Connect domain"
- Follow instructions to add nameservers

---

## 🎯 Total Time: ~2 hours

That's it! Your app is live! 🚀

---

## ✅ Testing Checklist

After deployment, test:
- [ ] Can visit app in browser
- [ ] Can sign up
- [ ] Can browse restaurants
- [ ] Can add items to cart
- [ ] Can place order
- [ ] Mobile view works
- [ ] Theme toggle works
- [ ] No console errors

---

## 🚨 If Something Goes Wrong

### App won't load
- Check Cloud Run logs: `gcloud run logs --limit 50`
- Check Firebase logs: `firebase functions:log`

### API not connecting
- Verify backend URL in `environment.prod.ts`
- Check Cloud Run service is running
- Check CORS is enabled in backend

### Database connection error
- Verify DATABASE_URL env var is set
- Check database is running
- Run migrations: `./mvnw flyway:migrate`

---

## 💡 Pro Tips

1. **Keep costs low**: Use free tiers during development
2. **Monitor errors**: Set up Sentry for error tracking
3. **Test on mobile**: Use your phone to test before launching
4. **Get feedback**: Show friends and get early feedback

---

## 🎉 Congratulations!

Your app is live and deployed! Now:
- Share with friends
- Collect feedback
- Make improvements
- Iterate quickly

Welcome to the launch club! 🚀

