# SmartStitch - Aplikacja do Konwersji Obrazów na Wzory Hafciarskie

Profesjonalna aplikacja mobilna do generowania wzorów haftu krzyżykowego i płaskiego z precyzyjnym dopasowaniem kolorów nici (DMC, Anchor, Ariadna).

## 🏗️ Architektura Produkcyjna

```
┌─────────────────┐
│  React Native   │ ← Aplikacja mobilna (iOS/Android)
│   + TypeScript  │
└────────┬────────┘
         │
         ↓ HTTPS/REST
┌─────────────────┐
│ FastAPI Backend │ ← API + Algorytmy przetwarzania
│  (Cloud Run)    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│          Firebase Stack             │
│  • Firestore (patterns, inventory)  │
│  • Storage (images, PDFs)           │
│  • Auth (users)                     │
│  • Functions (serverless triggers)  │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### Wymagania
- Python 3.11+
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Expo CLI: `npm install -g expo-cli`

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python scripts/init_thread_database.py
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd mobile
npm install
npx expo start
```

### PWA Setup (Progressive Web App)
```bash
cd mobile

# Build for web
npx expo export --platform web

# Serve locally for testing
npx serve dist -p 3000

# Open http://localhost:3000 in browser
# PWA features:
# - Offline-first caching (service worker)
# - Install to home screen (manifest.json)
# - Firebase Storage/Auth/Firestore fully supported
# - Pattern editing, export (PDF, XSD, PAT, JSON)
```

### Firebase Setup
```bash
firebase login
firebase init
firebase deploy
```

## 📁 Struktura Projektu

```
KITS/
├── backend/                    # Python FastAPI
│   ├── color_engine/          # Algorytmy dopasowania kolorów (Delta E)
│   ├── image_processor/       # OpenCV pipeline
│   ├── pattern_generator/     # Generowanie schematów
│   ├── export/               # PDF generation
│   ├── api/                  # Endpoints REST
│   ├── models/               # Pydantic models
│   ├── main.py               # FastAPI app
│   └── requirements.txt
│
├── mobile/                    # React Native + Expo
│   ├── src/
│   │   ├── screens/          # Ekrany aplikacji
│   │   ├── components/       # Komponenty UI
│   │   ├── services/         # Firebase SDK, API client
│   │   ├── store/            # Zustand state management
│   │   └── utils/            # Helpers
│   ├── App.tsx
│   └── package.json
│
├── firebase/                  # Firebase config
│   ├── firestore.rules
│   ├── storage.rules
│   └── functions/            # Cloud Functions (Node.js)
│
├── data/                      # Seed data
│   ├── threads/              # CSV z kolorami nici
│   │   ├── dmc_colors.csv
│   │   ├── anchor_colors.csv
│   │   └── ariadna_colors.csv
│   └── test_images/
│
├── scripts/                   # Utility scripts
│   └── init_thread_database.py
│
└── .github/
    ├── copilot-instructions.md
    └── workflows/            # CI/CD
        ├── backend-tests.yml
        ├── mobile-build.yml
        └── firebase-deploy.yml
```

## 🔑 Environment Variables

Skopiuj `.env.example` do `.env` i wypełnij:

```bash
# Backend (.env)
FIREBASE_PROJECT_ID=smartstitch-prod
FIREBASE_PRIVATE_KEY=...
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_CLOUD_STORAGE_BUCKET=smartstitch-patterns

# Mobile (.env)
EXPO_PUBLIC_API_URL=https://api.smartstitch.app
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=smartstitch-prod.firebaseapp.com
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ --cov=.

# Frontend tests
cd mobile
npm test
```

## 📦 Deployment

### Backend (Google Cloud Run)
```bash
cd backend
gcloud builds submit --tag gcr.io/smartstitch-prod/api
gcloud run deploy smartstitch-api --image gcr.io/smartstitch-prod/api
```

### Mobile (EAS Build)
```bash
cd mobile
eas build --platform all
eas submit --platform ios
eas submit --platform android
```

### Firebase
```bash
firebase deploy --only firestore:rules,storage:rules,functions
```

## 💰 Modele Monetyzacji

1. **Token System** - Eksport PDF, wysokiej jakości konwersje
2. **Affiliate Links** - Zakup nici (Amazon, sklepy pasmanterii)
3. **Marketplace** - Prowizja od sprzedaży wzorów użytkowników
4. **Kit Orders** - Pudełka z materiałami na zamówienie

## 📚 Dokumentacja

- [API Reference](./docs/API.md)
- [Color Matching Algorithm](./docs/COLOR_ALGORITHM.md)
- [Firebase Structure](./docs/FIREBASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🤝 Contributing

Zobacz [CONTRIBUTING.md](./CONTRIBUTING.md) dla guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE)
