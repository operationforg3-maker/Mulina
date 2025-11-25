# Mulina - AI Coding Agent Instructions

Mulina konwertuje obrazy na wzory hafciarskie (haft krzyżykowy/płaski) z profesjonalnym dopasowaniem kolorów nici DMC/Anchor/Ariadna/Madeira.

## System Architecture

```
React Native PWA (Expo) → FastAPI (local/Cloud Run) → Firebase (Auth/Firestore/Storage)
     ↓ offline-first          ↓ OpenCV + scikit-learn        ↓ cloud sync
  AsyncStorage cache        Color science (Delta E)       Pattern persistence
```

**Live URLs:** PWA at `https://mulina-c334d.web.app` | Backend local-only (Cloud Run pending) | Firebase project `mulina-c334d`

**Key Architectural Decisions:**
- **Color matching uses CIELAB Delta E** - NEVER Euclidean RGB distance (perceptually incorrect)
- **Thread database**: SQLite local (`data/threads.db`) + Firestore backup - must initialize before color matching
- **Offline-first**: App works without Firebase via lazy initialization pattern in `mobile/src/services/firebase.ts`
- **Coordinate systems**: Patterns use `(row, col)` grid indices, NOT `(x, y)` pixel coords

## Critical Data Flow: Image → Pattern

```python
# backend/main.py POST /api/v1/convert
ImageProcessor.preprocess(target_width, enhance_contrast=CLAHE)
  → pixelize_for_cross_stitch(aida_count: 14/16/18/20)  # Only valid sizes
  → reduce_colors(max_colors, kmeans clustering, optional Floyd-Steinberg dithering)
  → find_closest_thread(rgb → LAB → Delta E < 3.0 target)
  → PatternResponse(grid_data, color_palette[], dimensions)
```

**Implementation files:**
- `backend/image_processor/converter.py`: OpenCV pipeline (resize, CLAHE contrast, pixelization, K-means)
- `backend/color_engine/delta_e.py`: `rgb_to_lab()` (D65 illuminant), `delta_e()`, `find_closest_thread()`
- `backend/database/threads.py`: SQLite queries for 4 CSV brands (~2000 threads)
- `mobile/src/services/patternStorage.ts` ↔ `firestoreSync.ts`: AsyncStorage ↔ Firestore sync

## Developer Workflows

### First-Time Setup
```bash
# 1. Backend + thread database (REQUIRED before color matching)
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cd .. && python scripts/init_thread_database.py --brands DMC,Anchor,Ariadna,Madeira
# Creates data/threads.db from CSV files

# 2. Frontend
cd mobile && npm install --legacy-peer-deps

# 3. Quick start both servers
./start.sh  # Or manually:
# Terminal 1: cd backend && ./venv/bin/uvicorn main:app --reload --port 8000
# Terminal 2: cd mobile && npx expo start (press w=web, i=iOS, a=Android)
```

### Testing
```bash
# Backend color science (MUST pass when changing algorithms)
cd backend && pytest tests/test_color_engine.py -v

# Frontend services
cd mobile && npm test

# E2E PWA (requires build first)
cd mobile && npx expo export --platform web
cd ../tests && npm run test:e2e:web

# Quick API check
python scripts/test_api.py  # Validates /health + /convert
```

## Project-Specific Conventions

### 1. Color Matching (CRITICAL)
```python
# ✅ CORRECT - Perceptual CIELAB Delta E
from backend.color_engine.delta_e import rgb_to_lab, delta_e
lab1 = rgb_to_lab((255, 100, 50))
diff = delta_e(lab1, lab2)  # Thresholds: <1.0 invisible, <2.0 barely noticeable, <5.0 acceptable

# ❌ NEVER - Euclidean RGB distance
diff = sqrt((r2-r1)**2 + (g2-g1)**2 + (b2-b1)**2)  # PERCEPTUALLY WRONG
```

### 2. Thread Data Types
```python
# Thread codes are STRINGS (SQL queries fail with integers)
thread_code = "310"  # ✅ DMC Black
thread_code = 310    # ❌ Database lookup will fail

# Schema: threads(thread_id TEXT, brand TEXT, color_code TEXT, r/g/b INT, l_star/a_star/b_star REAL)
# Check schema: sqlite3 data/threads.db ".schema threads"
```

### 3. Firebase Lazy Init (Offline Support)
```typescript
// mobile/src/services/firebase.ts - graceful degradation pattern
if (!hasValidConfig(config)) {
  console.warn('Firebase missing - offline mode');
  return null;  // App continues without cloud features
}
// All services check: if (!firebaseDb()) { /* handle offline */ }
```

### 4. Environment Config
```bash
# Frontend: EXPO_PUBLIC_* (in app.json extra or GitHub Secrets)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=mulina-c334d
EXPO_PUBLIC_API_URL=http://localhost:8000  # or production URL

# Backend: Firebase Admin SDK JSON (mulina-c334d-firebase-adminsdk-*.json)
# CORS: hardcoded in backend/main.py allowed_origins - edit for custom domains
```

## Deployment & CI/CD

**GitHub Actions:**
- `.github/workflows/firebase-hosting.yml`: Auto-deploy PWA on push to `main` (✅ active)
- Requires 11 secrets (see `github-secrets-to-add.txt`): `FIREBASE_SERVICE_ACCOUNT_*` + 10 `EXPO_PUBLIC_*`
- Add at: `https://github.com/operationforg3-maker/Mulina/settings/secrets/actions`

**Deployment Status (25 Nov 2025):**
- ⚠️ PWA deployed but BROKEN - missing GitHub Secrets causes module "467" error + Firebase config missing
- ❌ Backend API NOT deployed - only runs locally on port 8000
- ❌ Mobile apps (needs Apple Developer + Google Play accounts)
- **FIX REQUIRED:** Add 10 GitHub Secrets from `github-secrets-to-add.txt` then deploy backend to Cloud Run
- See `PRODUCTION_STATUS.md` for detailed fix instructions

## Common Pitfalls

1. **Thread DB not initialized**: `pytest` fails with "no threads found" → Run `scripts/init_thread_database.py` first
2. **Aida count validation**: Only `14, 16, 18, 20` allowed (standard cross-stitch fabrics)
3. **CORS in development**: Backend serves `localhost:19006` (Expo web), `8081` (Metro), `3000` (serve)
4. **Pattern export incomplete**: `pattern_generator.py` generates PDF cover+legend only - symbol chart grid TODO
5. **Firebase rules**: `firebase/firestore.rules` requires auth - E2E tests need test user credentials

## Key File Map

**Backend (Python):**
- `main.py`: FastAPI app, `/api/v1/convert` endpoint, CORS config
- `color_engine/delta_e.py`: Core color science (178 lines - rgb_to_lab with D65, Delta E CIE76, find_closest_thread)
- `image_processor/converter.py`: ImageProcessor class (preprocess, pixelize_for_cross_stitch, reduce_colors via K-means)
- `database/threads.py`: SQLite wrapper (get_all_threads, get_thread_by_id, thread_count)
- `pattern_generator.py`: ReportLab PDF generation (partial implementation)

**Frontend (TypeScript/React Native):**
- `App.tsx`: React Navigation stack (8 screens including lazy-loaded routes)
- `src/services/firebase.ts`: Lazy Firebase init (getFirebaseApp returns null if unconfigured)
- `src/services/patternStorage.ts`: AsyncStorage patterns (StoredPattern interface, CRUD operations)
- `src/services/firestoreSync.ts`: Cloud backup via Firestore `users/{userId}/patterns/{patternId}`
- `src/screens/ImagePickerScreen.tsx`: expo-image-picker → upload to backend → pattern creation
- `src/screens/PatternEditorScreen.tsx`: Grid editor (partial - symbol placement TODO)

**Data & Scripts:**
- `data/threads/*.csv`: DMC (500+), Anchor, Ariadna (Polish), Madeira - RGB + LAB pre-computed
- `scripts/init_thread_database.py`: CSV → SQLite converter (creates `data/threads.db` with CIELAB values)
- `start.sh`/`stop.sh`: Development server management (backend + frontend concurrently)

## Incomplete Features (Context for Development)

- **Token system**: `TokenPurchaseScreen.tsx` + `stripe.ts` skeleton exists, backend billing logic missing
- **Marketplace**: `MarketplaceScreen.tsx` UI only, no backend CRUD for pattern sharing
- **Inventory optimization**: `find_closest_thread()` accepts `user_inventory: Set[str]` param but weighted scoring not implemented
- **Symbol chart export**: PDF generation creates cover + color legend, grid with symbols TODO

## When Fixing Bugs/Adding Features

1. **Color matching changes**: Always run `pytest backend/tests/test_color_engine.py` - tests verify Delta E thresholds
2. **Offline functionality**: Check `getFirebaseApp()` returns null gracefully, no crashes on missing Firebase
3. **Pattern coordinates**: Use `(row, col)` for grid data, only convert to `(x, y)` pixels for canvas rendering
4. **Database queries**: Thread codes are strings - use parameterized queries in `threads.py` to avoid type errors
