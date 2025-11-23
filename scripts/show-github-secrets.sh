#!/bin/bash

# 🚀 AUTOMATYCZNE DODANIE WSZYSTKICH GITHUB SECRETS
# Ten skrypt pomoże Ci dodać wszystkie wymagane secrets do GitHub

echo "════════════════════════════════════════════════════════════════"
echo "🔐 KONFIGURACJA GITHUB SECRETS DLA MULINA"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Przejdź do:"
echo "https://github.com/operationforg3-maker/Mulina/settings/secrets/actions/new"
echo ""
echo "Dodaj następujące secrets (skopiuj Name i Value):"
echo ""

# 1. Firebase Service Account
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SECRET 1/10"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Name: FIREBASE_SERVICE_ACCOUNT_MULINA_C334D"
echo ""
echo "Value:"
cat mulina-c334d-firebase-adminsdk-fbsvc-7be58d3372.json
echo ""
echo ""

# 2-10. Environment variables z .env
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SECRETS 2-10 (z mobile/.env)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "mobile/.env" ]; then
    echo "Name: EXPO_PUBLIC_API_URL"
    grep "EXPO_PUBLIC_API_URL=" mobile/.env | cut -d'=' -f2
    echo ""
    
    echo "Name: EXPO_PUBLIC_FIREBASE_API_KEY_IOS"
    grep "EXPO_PUBLIC_FIREBASE_API_KEY_IOS=" mobile/.env | cut -d'=' -f2
    echo ""
    
    echo "Name: EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID"
    grep "EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID=" mobile/.env | cut -d'=' -f2
    echo ""
    
    echo "Name: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
    grep "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=" mobile/.env | cut -d'=' -f2
    echo ""
    
    echo "Name: EXPO_PUBLIC_FIREBASE_PROJECT_ID"
    grep "EXPO_PUBLIC_FIREBASE_PROJECT_ID=" mobile/.env | cut -d'=' -f2
    echo ""
    
    echo "Name: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
    grep "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=" mobile/.env | cut -d'=' -f2
    echo ""
    
    echo "Name: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    grep "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=" mobile/.env | cut -d'=' -f2
    echo ""
    
    echo "Name: EXPO_PUBLIC_FIREBASE_APP_ID_IOS"
    grep "EXPO_PUBLIC_FIREBASE_APP_ID_IOS=" mobile/.env | cut -d'=' -f2
    echo ""
    
    echo "Name: EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID"
    grep "EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID=" mobile/.env | cut -d'=' -f2
    echo ""
else
    echo "❌ Błąd: Nie znaleziono pliku mobile/.env"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Po dodaniu wszystkich 10 secrets:"
echo "   1. Git push uruchomi automatycznie deployment"
echo "   2. Sprawdź status: https://github.com/operationforg3-maker/Mulina/actions"
echo "════════════════════════════════════════════════════════════════"
