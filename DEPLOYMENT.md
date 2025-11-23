# 🚀 Wdrożenie aplikacji Mulina - Instrukcja

## ✅ Status wdrożenia (23 listopada 2025)

### 🌐 Web (PWA) - **WDROŻONE**
- **URL produkcyjny:** https://mulina-c334d.web.app
- **URL preview:** https://mulina-c334d--preview-h50te45j.web.app
- **Status:** ✅ LIVE, offline-first, installable PWA
- **Firestore Rules:** ✅ Deployed
- **Storage Rules:** ✅ Deployed

### 📱 Mobile Apps - **DO WDROŻENIA**
- **iOS:** ❌ Nie wdrożone (wymaga Apple Developer Account)
- **Android:** ❌ Nie wdrożone (wymaga Google Play Console)

### 🔧 Backend API - **DO WDROŻENIA**
- **FastAPI:** ❌ Nie wdrożone (wymaga Google Cloud Run)

---

## 🔐 Konfiguracja GitHub Actions (Wymagane!)

GitHub Actions wymaga Firebase Service Account secret:

### Krok 1: Wygeneruj Service Account Key
```bash
# W Google Cloud Console dla projektu mulina-c334d:
# 1. Przejdź do: IAM & Admin > Service Accounts
# 2. Utwórz nowy Service Account lub wybierz istniejący
# 3. Nadaj rolę: "Firebase Admin"
# 4. Utwórz klucz JSON i pobierz

# LUB użyj Firebase CLI:
firebase init hosting:github
# Podaj: operationforg3-maker/Mulina
# Firebase automatycznie doda secret do GitHub
```

### Krok 2: Dodaj Secrets do GitHub (jeśli nie automatyczne)
Przejdź do: https://github.com/operationforg3-maker/Mulina/settings/secrets/actions

Dodaj następujące secrets:

1. **FIREBASE_SERVICE_ACCOUNT_MULINA_C334D**
   - Wartość: Cała zawartość pliku JSON z service account

2. **EXPO_PUBLIC_API_URL**
   - Wartość: `https://api.mulina.app` (lub localhost dla dev)

3. **EXPO_PUBLIC_FIREBASE_API_KEY_IOS**
   - Z pliku: `mobile/.env`

4. **EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID**
   - Z pliku: `mobile/.env`

5. **EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN**
   - Wartość: `mulina-c334d.firebaseapp.com`

6. **EXPO_PUBLIC_FIREBASE_PROJECT_ID**
   - Wartość: `mulina-c334d`

7. **EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET**
   - Wartość: `mulina-c334d.appspot.com`

8. **EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
   - Z pliku: `mobile/.env`

9. **EXPO_PUBLIC_FIREBASE_APP_ID_IOS**
   - Z pliku: `mobile/.env`

10. **EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID**
    - Z pliku: `mobile/.env`

### Krok 3: Test GitHub Actions
```bash
# Push do main branch uruchomi auto-deploy
git push origin main

# Sprawdź status:
# https://github.com/operationforg3-maker/Mulina/actions
```

---

## 📱 Wdrożenie Mobile Apps (iOS/Android)

### Wymagania:
- **iOS:** Apple Developer Account ($99/rok)
- **Android:** Google Play Developer Account ($25 jednorazowo)
- **EAS Build:** Expo Application Services (free tier dostępny)

### Setup EAS:
```bash
cd mobile

# Instalacja EAS CLI
npm install -g eas-cli

# Login
eas login

# Konfiguracja
eas build:configure

# Build dla iOS
eas build --platform ios --profile production

# Build dla Android  
eas build --platform android --profile production

# Submit do stores (po otrzymaniu approvals)
eas submit --platform ios
eas submit --platform android
```

---

## 🔧 Wdrożenie Backend (FastAPI)

### Google Cloud Run:
```bash
cd backend

# Login do Google Cloud
gcloud auth login
gcloud config set project mulina-c334d

# Build i push Docker image
gcloud builds submit --tag gcr.io/mulina-c334d/api

# Deploy na Cloud Run
gcloud run deploy mulina-api \
  --image gcr.io/mulina-c334d/api \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=mulina-c334d"

# URL będzie dostępny po deploymencie, np:
# https://mulina-api-xxx-ew.a.run.app
```

### Aktualizacja API URL w aplikacji:
Po wdrożeniu backend, zaktualizuj `EXPO_PUBLIC_API_URL` w:
- `mobile/.env`
- GitHub Secrets
- Przebuduj web: `npx expo export --platform web`
- Redeploy: `firebase deploy --only hosting`

---

## ✅ Checklist wdrożenia

### Web PWA (UKOŃCZONE ✅)
- [x] Firebase Hosting configured
- [x] Expo Web build exported
- [x] Firestore rules deployed
- [x] Storage rules deployed
- [x] GitHub Actions workflow created
- [ ] Firebase Service Account secret dodany do GitHub (WYMAGANE!)
- [x] PWA manifest i service worker
- [x] App LIVE na https://mulina-c334d.web.app

### Mobile Apps (TODO)
- [ ] Apple Developer Account setup
- [ ] Google Play Console setup
- [ ] EAS Build configured
- [ ] iOS build created
- [ ] Android build created
- [ ] App Store submission
- [ ] Google Play submission

### Backend (TODO)
- [ ] Google Cloud Run setup
- [ ] Docker image build
- [ ] API deployed
- [ ] Environment variables configured
- [ ] API URL updated in mobile app

---

## 🎯 Następne kroki

1. **PILNE:** Dodaj Firebase Service Account secret do GitHub
   - Inaczej GitHub Actions nie będzie działać

2. **Mobile:** Jeśli chcesz wdrożyć iOS/Android:
   - Załóż Apple Developer Account
   - Załóż Google Play Console
   - Uruchom `eas build:configure`

3. **Backend:** Jeśli chcesz backend w chmurze:
   - Wdróż FastAPI na Cloud Run
   - Zaktualizuj API URL w aplikacji

---

## 📞 Support

- **Firebase Console:** https://console.firebase.google.com/project/mulina-c334d
- **GitHub Actions:** https://github.com/operationforg3-maker/Mulina/actions
- **Expo Dashboard:** https://expo.dev/@operationforg3-maker

---

**Status ostatniej aktualizacji:** 23 listopada 2025, 22:50
**Commit:** 92fada3
