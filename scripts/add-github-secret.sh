#!/bin/bash

# Skrypt do dodania Firebase Service Account jako GitHub Secret
# Wymaga: GitHub Personal Access Token z uprawnieniami "repo"

set -e

REPO_OWNER="operationforg3-maker"
REPO_NAME="Mulina"
SECRET_NAME="FIREBASE_SERVICE_ACCOUNT_MULINA_C334D"
SERVICE_ACCOUNT_FILE="mulina-c334d-firebase-adminsdk-fbsvc-7be58d3372.json"

echo "🔐 Dodawanie Firebase Service Account do GitHub Secrets..."

# Sprawdź czy plik istnieje
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "❌ Błąd: Plik $SERVICE_ACCOUNT_FILE nie istnieje"
    exit 1
fi

# Odczytaj service account JSON
SERVICE_ACCOUNT_JSON=$(cat "$SERVICE_ACCOUNT_FILE" | jq -c .)

echo "📄 Service Account loaded from: $SERVICE_ACCOUNT_FILE"
echo ""
echo "⚠️  WAŻNE: Ten skrypt wymaga GitHub Personal Access Token"
echo ""
echo "Aby dodać secret ręcznie:"
echo "1. Przejdź do: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
echo "2. Kliknij 'New repository secret'"
echo "3. Name: $SECRET_NAME"
echo "4. Value: (wklej poniższą zawartość)"
echo ""
echo "════════════════════════════════════════════════════════════════"
cat "$SERVICE_ACCOUNT_FILE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Skopiuj powyższą zawartość i dodaj jako GitHub Secret"
echo ""
echo "LUB uruchom:"
echo "firebase init hosting:github"
echo "Podaj: $REPO_OWNER/$REPO_NAME"
