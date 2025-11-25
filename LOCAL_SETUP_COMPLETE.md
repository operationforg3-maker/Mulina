# 🚀 Mulina - Uruchomienie Aplikacji Web (Frontend + Backend)

## ✅ Status: Aplikacja działa lokalnie!

### Uruchomione Serwisy

1. **Backend API (FastAPI)**: http://localhost:8000
   - Health check: http://localhost:8000/health
   - API docs: http://localhost:8000/docs
   - Threads: 1972 załadowane (DMC, Anchor, Ariadna, Madeira)

2. **Frontend Web (Expo)**: http://localhost:8081
   - PWA-ready (offline-first)
   - Firebase integration
   - Pattern conversion + editor

## 🔧 Uruchomienie Krok po Kroku

### Backend (Terminal 1)

```bash
cd /Users/tomaszgorecki/Projekty/KITS/backend

# Aktywuj venv (jeśli nie jest aktywny)
source venv/bin/activate  # lub: ./venv/bin/activate

# Uruchom serwer
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Output**: Backend powinien być dostępny na `http://localhost:8000`

### Frontend (Terminal 2)

```bash
cd /Users/tomaszgorecki/Projekty/KITS/mobile

# Uruchom Expo web
npx expo start --web
```

**Output**: 
- Web dev server: `http://localhost:8081`
- QR code dla mobile (iOS/Android via Expo Go)

## 🧪 Testowanie

### Test 1: Backend Health Check

```bash
curl http://localhost:8000/health
```

**Oczekiwany output**:
```json
{"status": "ok", "threads": 1972}
```

### Test 2: Threads API

```bash
curl http://localhost:8000/api/v1/threads?brand=DMC | python3 -m json.tool
```

### Test 3: Image Conversion (pełny test)

```bash
cd /Users/tomaszgorecki/Projekty/KITS
/Users/tomaszgorecki/Projekty/KITS/backend/venv/bin/python test_full_conversion.py
```

**Rezultat**: 
- Konwertuje obraz z Unsplash
- Wyświetla paletę kolorów DMC
- Zapisuje wynik do `conversion_result.json`

## 🎨 Jak Używać przez Web UI

1. Otwórz http://localhost:8081 w przeglądarce
2. Kliknij **"Image Picker"** lub nawiguj do ekranu wyboru obrazu
3. Wybierz zdjęcie z dysku lub zrób nowe
4. Wybierz parametry:
   - Pattern type: Cross Stitch / Outline
   - Max colors: 10-50 (zalecane: 20-30)
   - Aida count: 14, 16, 18, 20
   - Thread brand: DMC, Anchor, Ariadna, Madeira
5. Kliknij **"Convert"**
6. Poczekaj na konwersję (5-30 sekund w zależności od rozmiaru)
7. Zobacz wynik w Pattern Editor

## 📁 Struktura Plików

```
KITS/
├── backend/                    # FastAPI API
│   ├── venv/                  # Virtual environment (zainstalowany)
│   ├── main.py               # API endpoints
│   ├── color_engine/         # Delta E color matching
│   ├── image_processor/      # OpenCV pipeline
│   └── database/threads.py   # SQLite access (1972 threads)
│
├── mobile/                     # React Native + Expo
│   ├── src/
│   │   ├── screens/          # UI screens
│   │   └── services/         # API client + Firebase
│   └── .env                  # Config (API_URL=http://localhost:8000)
│
├── data/
│   └── threads.db            # SQLite database (DMC/Anchor/Ariadna/Madeira)
│
└── test_full_conversion.py   # E2E test script
```

## 🔥 Firebase Configuration

### Backend (.env)
```bash
FIREBASE_PROJECT_ID=mulina-c334d
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@mulina-c334d.iam.gserviceaccount.com
```

### Frontend (mobile/.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_FIREBASE_PROJECT_ID=mulina-c334d
EXPO_PUBLIC_FIREBASE_API_KEY_IOS=AIzaSyBoDH_h6Sb2How9dvGB6SPrzV53afP_nW0
# ... (pozostałe Firebase credentials)
```

## 🐛 Troubleshooting

### Problem: Backend nie startuje
**Rozwiązanie**: Sprawdź czy venv jest aktywny i pakiety zainstalowane
```bash
cd backend
source venv/bin/activate
pip list | grep fastapi
```

### Problem: Frontend nie widzi backendu (CORS error)
**Rozwiązanie**: Backend ma CORS ustawiony dla localhost:8081
```python
# backend/main.py (linia ~22)
allowed_origins = ["http://localhost:8081", "http://localhost:19006", ...]
```

### Problem: Threads not loaded (0 threads)
**Rozwiązanie**: Zainicjalizuj bazę danych
```bash
cd /Users/tomaszgorecki/Projekty/KITS
python scripts/init_thread_database.py --brands DMC,Anchor,Ariadna,Madeira
```

### Problem: Image upload fails (Firebase Storage)
**Rozwiązanie**: Firebase Storage nie jest wymagany dla lokalnego testu
- Frontend użyje lokalnego URI jako fallback
- Lub podaj public image URL bezpośrednio

## 📊 Performance Metrics

### Conversion Time
- 200x300px image: ~5-10 sekund
- 400x600px image: ~15-30 sekund
- Max colors 10: szybciej
- Max colors 50: wolniej (więcej K-means iterations)

### Color Accuracy (Delta E)
- Target: ΔE < 3.0 (zauważalna tylko przy porównaniu)
- Average: ΔE 2.5-8.0 w zależności od source image
- CIELAB color space używany (nie RGB - dokładniejszy percepcyjnie)

## 🚢 Deployment

### PWA (już wdrożone)
- Production: https://mulina-c334d.web.app
- Auto-deploy via GitHub Actions on push to `main`

### Backend (TODO)
- Google Cloud Run (nie wdrożony)
- Wymaga: Cloud Build + Cloud Run deployment

### Mobile Apps (TODO)
- iOS: wymaga Apple Developer Account
- Android: wymaga Google Play Console

## 📝 Notatki dla Deweloperów

1. **Thread Database**: SQLite local (`data/threads.db`) - 1972 nici, 4 marki
2. **Color Matching**: CIELAB Delta E (NIE RGB distance!)
3. **Grid Coordinates**: `(row, col)` tuples (NIE `(x, y)` piksele)
4. **Thread Codes**: Stringi ("310"), NIE integers (310)
5. **Offline-First**: AsyncStorage (local) + Firestore (cloud sync)

## ✅ Checklist Uruchomienia

- [x] Backend venv utworzony i pakiety zainstalowane
- [x] Thread database zainicjalizowana (1972 threads)
- [x] Backend działa na port 8000
- [x] Frontend działa na port 8081
- [x] CORS skonfigurowany poprawnie
- [x] Test konwersji przeszedł pomyślnie
- [x] Firebase credentials skonfigurowane
- [x] API client (mobile/src/services/api.ts) poprawiony (snake_case/camelCase)

## 🎉 Gotowe!

Aplikacja działa lokalnie. Możesz teraz:
- Konwertować obrazy na wzory hafciarskie
- Testować różne parametry (colors, aida count, brand)
- Eksportować wzory (JSON/PDF)
- Edytować wzory w Pattern Editor

---

**Ostatnia aktualizacja**: 25 listopada 2025
**Status**: ✅ Fully functional local development environment
