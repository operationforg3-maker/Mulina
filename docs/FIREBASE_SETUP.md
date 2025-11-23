# Firebase Console Setup Guide

## Krok 1: Utwórz projekt Firebase

1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Kliknij **Add project** lub **Dodaj projekt**
3. Nazwa projektu: `mulina` (lub inna preferowana)
4. Włącz Google Analytics (opcjonalne, możesz to zrobić później)
5. Wybierz lub utwórz konto Analytics
6. Kliknij **Create project**

## Krok 2: Skonfiguruj Firebase Authentication

1. W lewym menu wybierz **Build** → **Authentication**
2. Kliknij **Get started**
3. Włącz następujące metody logowania:
   - **Email/Password** - podstawowa metoda
   - **Google** (opcjonalnie)
   - **Apple** (opcjonalnie, wymagane na iOS w niektórych przypadkach)
4. Zapisz zmiany

## Krok 3: Utwórz Firestore Database

1. W lewym menu wybierz **Build** → **Firestore Database**
2. Kliknij **Create database**
3. Wybierz **Start in production mode** (reguły są już przygotowane w `firebase/firestore.rules`)
4. Wybierz lokalizację: **europe-central2 (Warsaw)** - najbliżej Polski
5. Kliknij **Enable**
6. Przejdź do zakładki **Rules** i wklej zawartość z `firebase/firestore.rules`:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // ... (skopiuj pełne reguły z pliku)
     }
   }
   ```
7. Kliknij **Publish**

## Krok 4: Skonfiguruj Firebase Storage

1. W lewym menu wybierz **Build** → **Storage**
2. Kliknij **Get started**
3. Wybierz **Start in production mode**
4. Wybierz tę samą lokalizację: **europe-central2**
5. Kliknij **Done**
6. Przejdź do zakładki **Rules** i wklej zawartość z `firebase/storage.rules`:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // ... (skopiuj pełne reguły z pliku)
     }
   }
   ```
7. Kliknij **Publish**

## Krok 5: Pobierz Service Account Key (Backend)

1. Kliknij ikonę ⚙️ (Settings) obok **Project Overview**
2. Wybierz **Project settings**
3. Przejdź do zakładki **Service accounts**
4. Kliknij **Generate new private key**
5. Potwierdź i pobierz plik JSON
6. **WAŻNE**: Zachowaj ten plik w bezpiecznym miejscu i NIE commituj do repo
7. Otwórz pobrany JSON i skopiuj wartości do pliku `.env`:
   ```bash
   cp .env.example .env
   ```
   Następnie w `.env` uzupełnij:
   - `FIREBASE_PROJECT_ID` → `project_id` z JSON
   - `FIREBASE_PRIVATE_KEY_ID` → `private_key_id`
   - `FIREBASE_PRIVATE_KEY` → `private_key` (zostaw cudzysłowy i \n)
   - `FIREBASE_CLIENT_EMAIL` → `client_email`
   - `FIREBASE_CLIENT_ID` → `client_id`
   - pozostałe pola jeśli dostępne w JSON

## Krok 6: Dodaj aplikację Web (dla Mobile)

1. W **Project settings** → **General**
2. Przewiń w dół do sekcji **Your apps**
3. Kliknij ikonę `</>` (Web)
4. App nickname: `Mulina Mobile` lub `Mulina Web`
5. **NIE** włączaj Firebase Hosting na razie
6. Kliknij **Register app**
7. Skopiuj `firebaseConfig` obiekt i przekonwertuj do `.env`:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "mulina-xxxx.firebaseapp.com",
     projectId: "mulina-xxxx",
     storageBucket: "mulina-xxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123",
     measurementId: "G-XXXXXXXXXX"
   };
   ```
   W `.env` dodaj z prefiksem `EXPO_PUBLIC_`:
   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=mulina-xxxx.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=mulina-xxxx
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=mulina-xxxx.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
8. Kliknij **Continue to console**

## Krok 7: Dodaj aplikację Android (opcjonalnie)

1. W **Your apps** kliknij ikonę Androida
2. Android package name: `com.mulina.app` (z `mobile/app.json`)
3. Kliknij **Register app**
4. Pobierz `google-services.json`
5. Umieść w `mobile/google-services.json`
6. Kliknij **Next** → **Next** → **Continue to console**

## Krok 8: Dodaj aplikację iOS (opcjonalnie)

1. W **Your apps** kliknij ikonę Apple
2. iOS bundle ID: `com.mulina.app` (z `mobile/app.json`)
3. Kliknij **Register app**
4. Pobierz `GoogleService-Info.plist`
5. Umieść w `mobile/GoogleService-Info.plist`
6. Kliknij **Next** → **Next** → **Continue to console**

## Krok 9: Deploy reguł Firestore i Storage (z CLI)

1. Zainstaluj Firebase CLI (jeśli jeszcze nie masz):
   ```bash
   npm install -g firebase-tools
   ```

2. Zaloguj się do Firebase:
   ```bash
   firebase login
   ```

3. Zainicjalizuj projekt (z katalogu repo):
   ```bash
   cd /Users/tomaszgorecki/Projekty/KITS
   firebase init
   ```
   - Wybierz: Firestore, Storage, (opcjonalnie Functions i Hosting)
   - Use existing project: wybierz utworzony projekt
   - Firestore rules: `firebase/firestore.rules`
   - Firestore indexes: `firebase/firestore.indexes.json`
   - Storage rules: `firebase/storage.rules`

4. Deploy reguł:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

5. (Opcjonalnie) Deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

## Krok 10: Weryfikacja środowiska

1. Sprawdź czy `.env` jest poprawnie skonfigurowany:
   ```bash
   cat .env | grep FIREBASE
   ```

2. Uruchom backend i sprawdź logi:
   ```bash
   cd backend
   source venv/bin/activate
   python -m uvicorn main:app --reload
   ```
   Logi powinny pokazać: "Firebase initialized successfully"

3. Uruchom mobile app:
   ```bash
   cd mobile
   npx expo start
   ```

4. Sprawdź konsolę Expo - nie powinno być błędów Firebase init

## Krok 11: Cloud Functions (opcjonalnie, później)

Firebase Functions wymagają planu Blaze (pay-as-you-go). Na razie możesz pominąć:

1. W Firebase Console przejdź do **Build** → **Functions**
2. Upgrade do Blaze plan (tylko gdy będziesz gotowy)
3. Deploy funkcji:
   ```bash
   cd firebase/functions
   npm install
   firebase deploy --only functions
   ```

## Struktura finalna plików

```
/Users/tomaszgorecki/Projekty/KITS/
├── .env                          # Twoje prywatne dane (NIE commituj!)
├── .env.example                  # Template do repo
├── mobile/
│   ├── google-services.json     # Android (NIE commituj!)
│   └── GoogleService-Info.plist # iOS (NIE commituj!)
└── firebase/
    ├── firestore.rules          # Reguły bezpieczeństwa
    ├── firestore.indexes.json   # Indexy Firestore
    ├── storage.rules            # Reguły Storage
    └── firebase.json            # Konfiguracja Firebase CLI
```

## Bezpieczeństwo

**Nigdy nie commituj do repo:**
- `.env`
- `google-services.json`
- `GoogleService-Info.plist`
- Service account JSON
- Żadne pliki z kluczami API

Sprawdź `.gitignore`:
```bash
cat .gitignore | grep -E '\.env|google-services|GoogleService'
```

Powinno zwrócić:
```
.env
google-services.json
GoogleService-Info.plist
firebase-service-account.json
```

## Troubleshooting

### Błąd: "Firebase not initialized"
- Sprawdź czy `.env` ma wszystkie wymagane zmienne
- Upewnij się że backend używa `python-dotenv` i ładuje `.env`
- Sprawdź logi: `uvicorn main:app --reload --log-level debug`

### Błąd: "Permission denied" w Firestore/Storage
- Sprawdź czy reguły są wdrożone: `firebase deploy --only firestore:rules,storage:rules`
- Zweryfikuj reguły w Firebase Console → Rules

### Expo nie widzi zmiennych EXPO_PUBLIC_*
- Restart Metro: Ctrl+C i `npx expo start --clear`
- Sprawdź czy `.env` jest w głównym katalogu repo (nie w `mobile/`)

### Backend nie łączy się z Firebase
- Sprawdź region Storage/Firestore (powinien być `europe-central2`)
- Sprawdź czy service account email ma uprawnienia w IAM & Admin

## Następne kroki

Po skonfigurowaniu Firebase:
1. Przetestuj upload pliku przez mobile app
2. Zaimplementuj Auth flow (rejestracja/logowanie)
3. Deploy backend na Cloud Run lub podobny serwis
4. Skonfiguruj CI/CD dla auto-deployment

---

**Pytania?** Sprawdź [Firebase Documentation](https://firebase.google.com/docs) lub dokumentację projektu w `docs/`.
