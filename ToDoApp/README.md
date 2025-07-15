# React Native To-Do App

A modern, full-featured To-Do application built with React Native, Expo, and Firebase. Includes authentication, real-time task management, profile editing, and a beautiful light/dark theme.

---

## 🚀 Setup Instructions

### 1. **Clone the Repository**
```sh
git clone <your-repo-url>
cd ToDoApp
```

### 2. **Install Dependencies**
```sh
npm install
```

### 3. **Firebase Setup**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (choose a region that supports free Storage, e.g., `us-central1`)
3. Enable:
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Storage**
4. Go to Project Settings > General > Your apps > Web app, and copy your Firebase config.
5. Replace the config in `src/config/firebase.ts`:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```
6. **Set Firestore Rules:**
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{todoId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
7. **Set Storage Rules:**
```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-images/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## ▶️ How to Run the Project Locally

### **Using Expo (Recommended)**
1. Start the development server:
   ```sh
   npm start
   ```
2. Scan the QR code with the Expo Go app (Android/iOS) or run on an emulator:
   - Press `a` for Android emulator
   - Press `w` for web

### **Using React Native CLI**
> This project is optimized for Expo. If you want to eject and use the React Native CLI, run:
> ```sh
> npx expo eject
> ```
> Then follow the [React Native CLI setup guide](https://reactnative.dev/docs/environment-setup).

---

## 🛠️ Tech Stack Overview
- **React Native** (with Expo) — Cross-platform mobile development
- **TypeScript** — Type-safe codebase
- **Firebase** — Auth, Firestore, Storage
- **React Navigation** — Navigation and tabs
- **Expo Image Picker** — Profile image upload
- **Custom Theme Context** — Light/Dark mode with toggle

---

## 📁 Project Structure
```
ToDoApp/
├── assets/                  # App logo and images
├── src/
│   ├── config/
│   │   └── firebase.ts      # Firebase config
│   ├── contexts/
│   │   ├── AuthContext.tsx  # Auth state
│   │   └── ThemeContext.tsx # Theme (light/dark)
│   ├── navigation/
│   │   └── AppNavigator.tsx # Navigation setup
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── RegisterScreen.tsx
│       ├── TodoScreen.tsx
│       └── ProfileScreen.tsx
├── App.tsx                  # App entry point
├── README.md                # This file
└── ...
```

---

## ✨ Features
- Firebase Auth (Email/Password)
- Real-time Firestore To-Do list (per user)
- Add, complete, delete tasks
- Profile: username, email, profile image (with upload)
- Dark mode toggle (Profile tab)
- Responsive, modern UI
- Error handling and validation

---

## 💡 Notes
- Make sure your Firebase config and rules are correct for full functionality.
- For any issues, check the Expo/Metro logs and your Firebase console.
- You can further customize the theme, logo, and UI as desired!

---

**Enjoy your beautiful, modern To-Do app!** 