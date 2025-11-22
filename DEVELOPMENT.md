# SmartStitch Development Guide

## Pierwsze Kroki

### 1. Klonowanie i Setup

```bash
git clone <repository-url>
cd KITS

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Frontend setup
cd mobile
npm install
cd ..

# Inicjalizacja bazy danych nici
python scripts/init_thread_database.py --brands DMC
```

### 2. Konfiguracja Firebase

1. Utwórz projekt Firebase na https://console.firebase.google.com
2. Pobierz `google-services.json` (Android) i `GoogleService-Info.plist` (iOS)
3. Skopiuj `.env.example` do `.env` i wypełnij dane:

```bash
cp .env.example .env
# Edytuj .env i dodaj swoje klucze Firebase
```

4. Inicjalizuj Firebase CLI:

```bash
firebase login
firebase init
# Wybierz: Firestore, Storage, Functions
```

### 3. Uruchomienie w trybie deweloperskim

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
# API dostępne na http://localhost:8000
```

**Terminal 2 - Mobile:**
```bash
cd mobile
npx expo start
# Wybierz platform: i (iOS), a (Android), w (Web)
```

**Terminal 3 - Firebase Emulators (opcjonalnie):**
```bash
firebase emulators:start
# Emulators dostępne na http://localhost:4000
```

## Struktura Projektu

### Backend Architecture

```
backend/
├── color_engine/         # 🎨 Algorytmy dopasowania kolorów
│   ├── delta_e.py       # CIELAB Delta E, konwersje RGB↔LAB
│   └── __init__.py
│
├── image_processor/      # 🖼️ Przetwarzanie obrazów
│   ├── converter.py     # Pixelizacja, K-means, dithering
│   └── __init__.py
│
├── pattern_generator/    # 📐 Generowanie wzorów (TODO)
├── export/              # 📄 Eksport PDF (TODO)
├── api/                 # 🔌 REST endpoints (TODO: przenieść z main.py)
├── models/              # 📦 Pydantic models (TODO)
├── tests/               # ✅ Unit tests
│   ├── test_color_engine.py
│   └── conftest.py
│
├── main.py              # FastAPI app entry point
├── config.py            # Firebase Admin SDK setup
├── requirements.txt     # Python dependencies
└── Dockerfile           # Container dla Cloud Run
```

### Frontend Architecture

```
mobile/
├── src/
│   ├── screens/         # 📱 Ekrany aplikacji (TODO)
│   │   ├── HomeScreen.tsx
│   │   ├── ImagePickerScreen.tsx
│   │   ├── PatternEditorScreen.tsx
│   │   └── ExportScreen.tsx
│   │
│   ├── components/      # 🧩 Komponenty UI (TODO)
│   │   ├── PatternGrid.tsx
│   │   ├── ColorPalette.tsx
│   │   └── ThreadInventory.tsx
│   │
│   ├── services/        # 🌐 API & Firebase
│   │   ├── api.ts
│   │   └── firebase.ts  (TODO)
│   │
│   ├── store/          # 💾 State management (TODO: Zustand)
│   └── utils/          # 🛠️ Helpers (TODO)
│
├── App.tsx             # Navigation setup
├── app.json            # Expo config
├── package.json
└── tsconfig.json
```

## Kluczowe Funkcjonalności (Development Roadmap)

### ✅ Zrobione

- [x] Podstawowa struktura projektu
- [x] Backend FastAPI z podstawowymi endpoints
- [x] Algorytm dopasowania kolorów (Delta E w CIELAB)
- [x] Konwersja RGB → LAB
- [x] Image processor (pixelizacja, K-means, dithering)
- [x] Baza danych nici DMC (CSV + SQLite)
- [x] Firebase Firestore rules
- [x] Firebase Storage rules
- [x] CI/CD workflows (GitHub Actions)
- [x] Unit tests dla color engine

### 🚧 W Trakcie / TODO

- [ ] **API Endpoints** - implementacja logiki biznesowej
- [ ] **Pattern Generator** - konwersja grid → exportable format
- [ ] **PDF Export** - ReportLab, multi-page layouts
- [ ] **Mobile Screens** - UI/UX dla wszystkich ekranów
- [ ] **Pattern Editor** - narzędzia edycji (pencil, eraser, fill)
- [ ] **Firebase Authentication** - login/logout flow
- [ ] **User Inventory** - zarządzanie posiadanymi nićmi
- [ ] **Token System** - monetyzacja (Stripe integration)
- [ ] **Marketplace** - sprzedaż wzorów między użytkownikami
- [ ] **Companion Mode** - interaktywny tryb haftowania

## Testowanie

### Backend Tests

```bash
cd backend
pytest tests/ -v                    # Wszystkie testy
pytest tests/test_color_engine.py  # Konkretny plik
pytest --cov=. --cov-report=html   # Z coverage
```

### Frontend Tests (TODO)

```bash
cd mobile
npm test                           # Jest tests
npm test -- --coverage            # Z coverage
```

## Deployment

### Backend → Google Cloud Run

```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT/smartstitch-api
gcloud run deploy smartstitch-api \
  --image gcr.io/YOUR_PROJECT/smartstitch-api \
  --platform managed \
  --region europe-central2 \
  --allow-unauthenticated
```

### Mobile → EAS Build

```bash
cd mobile
eas build --platform android  # lub ios
eas submit                     # Publikacja do sklepów
```

### Firebase

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only functions
```

## Konwencje Kodu

### Python (Backend)

- **Formatting:** Black + isort
- **Linting:** Flake8 + mypy
- **Style:** PEP 8
- **Docstrings:** Google style

```python
def find_closest_thread(target_rgb: Tuple[int, int, int]) -> Dict:
    """
    Znajduje najbliższą nić dla danego koloru.
    
    Args:
        target_rgb: Kolor docelowy (R, G, B)
    
    Returns:
        Dict z najlepszym dopasowaniem
    """
```

### TypeScript (Frontend)

- **Formatting:** Prettier
- **Linting:** ESLint
- **Style:** Airbnb + React Native

```typescript
interface Pattern {
  patternId: string;
  gridData?: any;
  colorPalette: Thread[];
}
```

## Troubleshooting

### Backend nie startuje

```bash
# Sprawdź czy venv jest aktywowany
which python  # Powinno wskazywać na venv/bin/python

# Reinstaluj zależności
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Mobile build fails

```bash
# Wyczyść cache
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### Firebase permission denied

- Sprawdź `firestore.rules` i `storage.rules`
- Uruchom emulatory lokalnie: `firebase emulators:start`
- Sprawdź czy użytkownik jest zalogowany w aplikacji

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [CIELAB Color Space](https://en.wikipedia.org/wiki/CIELAB_color_space)
- [Delta E Calculator](http://www.colormine.org/delta-e-calculator)

## Kontakt & Support

- GitHub Issues: [link]
- Discord: [link]
- Email: team@smartstitch.app
