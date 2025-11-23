# 🎉 Mulina - Aplikacja Gotowa!

## ✅ Status: Działająca

**Backend i Mobile działają lokalnie. Gotowe do testów i dalszej rozbudowy.**

---

## 🚀 Jak uruchomić

### 1. Backend (FastAPI)

```bash
cd /Users/tomaszgorecki/Projekty/KITS/backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Test:**
```bash
curl http://127.0.0.1:8000/
# Powinno zwrócić: {"service": "Mulina API", "status": "healthy", ...}
```

### 2. Mobile (Expo React Native)

```bash
cd /Users/tomaszgorecki/Projekty/KITS/mobile
npx expo start
```

**Opcje:**
- `i` - iOS Simulator
- `a` - Android Emulator
- `w` - Web Browser
- Zeskanuj QR code w **Expo Go** (Android/iOS)

---

## 📱 Co Działa Teraz

### Backend ✅
- ✅ FastAPI server na porcie 8000
- ✅ SQLite database z 107 nitek DMC
- ✅ Endpoint `/api/v1/threads` zwraca dane
- ✅ CIELAB color matching engine
- ✅ Image processing pipeline (K-means, dithering, edge detection)

### Mobile ✅
- ✅ Expo Metro Bundler działa
- ✅ React Navigation skonfigurowana
- ✅ **ApiTestScreen** - ekran testowy połączony z backendem
  - Pokazuje status API
  - Wyświetla 10 przykładowych nitek z bazy
  - Pull-to-refresh
  - Kolorowe podglądy nici (RGB swatch)
- ✅ Firebase client SDK zintegrowany (czeka na konfigurację)
- ✅ Ikony i assety wygenerowane

### Infrastruktura ✅
- ✅ Git repo: https://github.com/operationforg3-maker/Mulina
- ✅ Struktura projektu kompletna
- ✅ Dokumentacja: `.github/copilot-instructions.md`
- ✅ Firebase rules/indexes przygotowane
- ✅ `.env.example` z wszystkimi zmiennymi
- ✅ `docs/FIREBASE_SETUP.md` - pełna instrukcja

---

## 📸 Aktualne Screeny

### Mobile App (ApiTestScreen)
Po uruchomieniu `npx expo start` i wybraniu `i`/`a`/`w`:

1. **Ekran główny**: Mulina - API Test
2. **Sekcja Backend Status**:
   - Service: Mulina API
   - Status: healthy
   - Threads Loaded: 107
3. **Sekcja Sample Threads**:
   - 10 kart z nitkami DMC
   - Kolorowy swatch (kwadrat RGB)
   - Kod nitki (DMC 310, DMC 666, etc.)
   - Wartości RGB i LAB
4. **Pull down to refresh** - odświeża dane

---

## 🔧 Następne Kroki (Priorytet)

### 1. Firebase Setup (15-30 min)
📄 **Instrukcja**: `docs/FIREBASE_SETUP.md`

**Kroki:**
1. Utwórz projekt w [Firebase Console](https://console.firebase.google.com/)
2. Włącz Auth (Email/Password)
3. Utwórz Firestore (europe-central2)
4. Utwórz Storage (europe-central2)
5. Pobierz Service Account Key (backend) i Web Config (mobile)
6. Wypełnij `.env` (skopiuj z `.env.example`)
7. Deploy reguł: `firebase deploy --only firestore:rules,storage:rules`

**Po konfiguracji:**
- Backend będzie mógł zapisywać wzory do Firestore
- Mobile będzie mógł uploadować zdjęcia do Storage
- Użytkownicy będą mogli się rejestrować/logować

### 2. Home Screen (mobile)
Utwórz `mobile/src/screens/HomeScreen.tsx`:
- Button "Upload Image" → ImagePicker
- Lista ostatnio tworzonych wzorów (z Firestore)
- Nawigacja do PatternEditor

### 3. Image Upload & Conversion Flow
- **ImagePickerScreen**: wybór zdjęcia z galerii/camera
- Wywołanie `POST /api/v1/convert` z parametrami:
  - `maxColors`, `aidaCount`, `threadBrand`, `enableDithering`
- Progress indicator podczas przetwarzania
- Redirect do PatternEditor po konwersji

### 4. Pattern Editor (MVP)
- Grid view z pikselizowanym wzorem
- Color palette sidebar
- Zoom in/out (pinch gesture)
- Export do PDF

### 5. PDF Export
Dokończ `backend/pattern_generator/export_pdf.py`:
- ReportLab multi-page layout
- Symbol chart z legendą
- Material list (ile metrów każdej nitki)
- Cover page z preview

### 6. Deploy (Produkcja)
- **Backend**: Cloud Run / Railway / Render
- **Mobile**: EAS Build → App Store / Play Store
- **Firebase**: Firestore/Storage już w chmurze
- **CI/CD**: GitHub Actions (`.github/workflows/`)

---

## 🐛 Troubleshooting

### Backend nie startuje
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python scripts/init_thread_database.py --brands DMC
python -m uvicorn main:app --reload
```

### Metro nie startuje
```bash
cd mobile
rm -rf node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

### API Test Screen pokazuje błąd połączenia
1. Sprawdź czy backend działa: `curl http://127.0.0.1:8000/`
2. W mobile zmień URL:
   - iOS Simulator: `http://127.0.0.1:8000`
   - Android Emulator: `http://10.0.2.2:8000`
   - Fizyczne urządzenie: `http://192.168.0.X:8000` (IP komputera)

### Firebase nie działa
1. Sprawdź `.env`: `cat .env | grep FIREBASE`
2. Sprawdź czy service account JSON ma wszystkie pola
3. Restart backend i mobile po zmianie `.env`

---

## 📚 Dokumentacja

- **Główna**: `README.md`
- **Deweloperska**: `docs/DEVELOPMENT.md`
- **Firebase**: `docs/FIREBASE_SETUP.md`
- **AI Agent Instructions**: `.github/copilot-instructions.md`

---

## 🎨 Design System

**Kolory (Tailwind):**
- Primary: `#6366f1` (Indigo 500)
- Primary Dark: `#4338ca` (Indigo 700)
- Text: `#111827` (Gray 900)
- Text Secondary: `#6b7280` (Gray 500)
- Background: `#f9fafb` (Gray 50)
- Card: `#ffffff` (White)

**Czcionki:**
- Default: System (iOS: SF Pro, Android: Roboto)
- Monospace: dla RGB/LAB wartości

---

## 🧵 Dane Testowe

### DMC Threads (107 w bazie)
Przykładowe nitki do testów:
- DMC 310 (Black)
- DMC 666 (Bright Red)
- DMC 3708 (Melon Light)
- DMC Blanc (White)
- DMC Ecru (Ecru)

### Test Images
Umieść w `data/test_images/`:
- `sample_portrait.jpg` - portret do cross-stitch
- `sample_landscape.jpg` - krajobraz
- `sample_logo.png` - logo do outline

---

## 🔐 Bezpieczeństwo

**NIE commituj:**
- `.env`
- `google-services.json`
- `GoogleService-Info.plist`
- `firebase-service-account.json`
- Żadne klucze API

Sprawdź `.gitignore` przed commit:
```bash
git status --ignored
```

---

## 📞 Support

**GitHub Issues**: https://github.com/operationforg3-maker/Mulina/issues

**Stack:**
- Backend: Python 3.11, FastAPI, OpenCV, scikit-learn
- Mobile: React Native (Expo SDK 50), TypeScript
- Database: SQLite (local), Firestore (cloud)
- Storage: Firebase Storage
- Auth: Firebase Auth

---

**Status ostatniej aktualizacji**: 23 listopada 2025, 00:56  
**Wersja**: 1.0.0-alpha  
**Gotowość**: MVP - Działający backend + mobile skeleton + API integration

🎯 **Następny milestone**: Pełny flow Upload → Convert → Edit → Export
