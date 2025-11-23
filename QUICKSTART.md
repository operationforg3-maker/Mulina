# 🚀 Mulina - Szybki Start

## ✅ Status: Aplikacja działa!

- ✅ Backend FastAPI
- ✅ Web (przeglądarka)
- ✅ iOS (simulator/device)
- ✅ Android (emulator/device)

---

## 📦 Pierwsza instalacja

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scripts/init_thread_database.py --brands DMC

# Mobile
cd ../mobile
npm install --legacy-peer-deps
```

---

## ▶️ Uruchomienie

### Terminal 1: Backend

```bash
cd /Users/tomaszgorecki/Projekty/KITS/backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Test backendu:**
```bash
curl http://127.0.0.1:8000/
# → {"service":"Mulina API","status":"healthy","threads_loaded":107}
```

---

### Terminal 2: Mobile (Expo)

```bash
cd /Users/tomaszgorecki/Projekty/KITS/mobile
npx expo start
```

**Dostępne platformy:**

#### 🌐 Web
- Automatycznie: http://localhost:8081
- Lub naciśnij `w` w terminalu Expo

#### 📱 iOS
**Opcja 1: iOS Simulator** (wymaga Xcode)
- Naciśnij `i` w terminalu Expo
- Simulator otworzy się automatycznie

**Opcja 2: Fizyczne urządzenie iPhone**
1. Zainstaluj **Expo Go** z App Store
2. Zeskanuj QR code z terminala aparatem
3. Otwórz w Expo Go

#### 🤖 Android
**Opcja 1: Android Emulator** (wymaga Android Studio)
- Naciśnij `a` w terminalu Expo
- Emulator otworzy się automatycznie

**Opcja 2: Fizyczne urządzenie Android**
1. Zainstaluj **Expo Go** z Google Play
2. Zeskanuj QR code w aplikacji Expo Go
3. App otworzy się automatycznie

---

## 🧪 Co zobaczysz

### ApiTestScreen (ekran główny)
1. **Backend Status** - zielona sekcja ze statusem API
2. **Sample Threads** - 10 nitek DMC z kolorowymi swatchami
3. **Pull to refresh** - pociągnij w dół aby odświeżyć dane

### Dane wyświetlane
- Kod nitki (np. DMC 310)
- Wartości RGB (0-255)
- Wartości LAB (CIE color space)
- Kolorowy kwadrat z prawdziwym kolorem nitki

---

## 🛠 Troubleshooting

### Backend nie łączy się
```bash
# Sprawdź czy działa
curl http://127.0.0.1:8000/health

# Jeśli nie działa, restart
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Metro nie startuje (port zajęty)
```bash
# Wyczyść port
lsof -ti:8081 | xargs kill -9

# Restart Metro z czystym cache
cd mobile
npx expo start --clear
```

### Web nie ładuje się
- Sprawdź czy Metro działa: `lsof -i :8081`
- Otwórz ręcznie: http://localhost:8081
- Sprawdź logi: `tail -f /tmp/expo.log` (jeśli uruchomione w tle)

### iOS Simulator nie otwiera się
```bash
# Zainstaluj Xcode Command Line Tools
xcode-select --install

# Sprawdź dostępne simulatory
xcrun simctl list devices
```

### Android Emulator nie otwiera się
1. Zainstaluj Android Studio
2. Otwórz AVD Manager: Tools → Device Manager
3. Utwórz nowy emulator (Pixel 5, API 33+)
4. Uruchom emulator przed `npx expo start`

### API Test Screen pokazuje błąd
**Web/iOS Simulator:**
```typescript
// mobile/src/screens/ApiTestScreen.tsx (linia 44)
const statusResponse = await fetch('http://127.0.0.1:8000/');
```

**Android Emulator:**
```typescript
// Zmień na:
const statusResponse = await fetch('http://10.0.2.2:8000/');
```

**Fizyczne urządzenie (iPhone/Android):**
```typescript
// Zmień na IP komputera w sieci lokalnej:
const statusResponse = await fetch('http://192.168.0.57:8000/');
// (sprawdź IP: ifconfig | grep "inet 192")
```

---

## 📱 Zbudowanie aplikacji natywnej (produkcja)

### iOS (wymaga konta Apple Developer)
```bash
cd mobile
npx eas build --platform ios
```

### Android (APK)
```bash
cd mobile
npx eas build --platform android --profile preview
```

### Oba naraz
```bash
npx eas build --platform all
```

---

## 🔥 Firebase Setup (opcjonalnie, 30 min)

**Pełna instrukcja:** `docs/FIREBASE_SETUP.md`

**Szybkie kroki:**
1. https://console.firebase.google.com → Create project
2. Enable Authentication (Email/Password)
3. Create Firestore Database (europe-central2)
4. Create Storage (europe-central2)
5. Download Service Account JSON (backend)
6. Copy Web Config do `.env` (mobile)
7. `cp .env.example .env` i wypełnij dane
8. `firebase deploy --only firestore:rules,storage:rules`

---

## 📊 Struktura projektu

```
Mulina/
├── backend/          # FastAPI + Python
│   ├── main.py       # API endpoints
│   ├── color_engine/ # CIELAB matching
│   ├── database/     # SQLite threads
│   └── data/         # threads.db (107 DMC)
├── mobile/           # React Native (Expo)
│   ├── App.tsx       # Navigation
│   ├── src/
│   │   ├── screens/  # ApiTestScreen
│   │   └── services/ # API + Firebase
│   └── assets/       # Icons (auto-generated)
└── docs/             # Documentation
```

---

## 🎯 Następne kroki

1. ✅ **Działa**: Backend + Web + iOS + Android
2. 🔄 **Setup Firebase** (30 min) - `docs/FIREBASE_SETUP.md`
3. 🎨 **HomeScreen** - główny ekran z listą wzorów
4. 📸 **ImagePicker** - wybór zdjęcia z galerii
5. 🎨 **PatternEditor** - edycja wzoru pixel-by-pixel
6. 📄 **PDF Export** - generowanie materiałów do druku

---

## 💡 Przydatne komendy

```bash
# Backend
curl http://127.0.0.1:8000/api/v1/threads?limit=5 | python3 -m json.tool

# Expo shortcuts (w terminalu Metro)
r    # Reload app
m    # Toggle menu
j    # Open debugger
shift+d  # Toggle performance monitor

# Git
git status
git add -A
git commit -m "feat: opis zmian"
git push origin main

# Logi
tail -f backend/logs/app.log  # Backend logs
tail -f /tmp/expo.log         # Expo logs (jeśli w tle)
```

---

## 📞 Support

- **GitHub**: https://github.com/operationforg3-maker/Mulina
- **Dokumentacja**: `README.md`, `STATUS.md`, `FIREBASE_SETUP.md`
- **Issues**: https://github.com/operationforg3-maker/Mulina/issues

---

**Ostatnia aktualizacja**: 23 listopada 2025  
**Wersja**: 1.0.0-alpha  
**Status**: MVP - Działająca aplikacja na wszystkich platformach ✅
