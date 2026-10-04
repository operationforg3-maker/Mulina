#!/bin/bash
set -e

echo "🚀 Rozpoczynam budowanie i deployment aplikacji Mu'Alina na Firebase..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🧹 Czyszczenie starego buildu..."
rm -rf mobile/dist

echo "📦 Budowanie wersji web w mobile/..."
cd mobile
npx expo export -p web

echo "📋 Kopiowanie plików PWA i ikon..."
cp -r public/* dist/
cp assets/mualina_logo.png dist/mualina_logo.png 2>/dev/null || true
cp assets/hero_banner.png dist/hero_banner.png 2>/dev/null || true
cp assets/icon.png dist/icon.png 2>/dev/null || true
cp assets/splash.png dist/splash.png 2>/dev/null || true
cp assets/favicon.png dist/favicon.png 2>/dev/null || true

echo "🔧 Wstrzykiwanie tagów PWA do dist/index.html..."
python3 -c "
with open('dist/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Zastąp theme-color pastelowym #D9777F
html = html.replace('content=\"#7C3AED\"', 'content=\"#D9777F\"')

# Wstrzyknij tagi PWA oraz emergency recovery script jeśli ich brakuje
pwa_tags = '''
    <!-- Mu\'Alina PWA Meta Tags -->
    <title>Mu\'Alina — Cyfrowy Tamborek i Wzory Haftu</title>
    <meta name=\"theme-color\" content=\"#D9777F\" />
    <meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />
    <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\" />
    <meta name=\"apple-mobile-web-app-title\" content=\"Mu\'Alina\" />
    <link rel=\"manifest\" href=\"/manifest.json\" />
    <link rel=\"apple-touch-icon\" href=\"/icon.png\" />
    <script>
      (function() {
        window.__clearCachesAndReload = function() {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              for (var i = 0; i < regs.length; i++) regs[i].unregister();
            });
          }
          if ('caches' in window) {
            caches.keys().then(function(keys) {
              for (var i = 0; i < keys.length; i++) caches.delete(keys[i]);
            });
          }
          setTimeout(function() { window.location.reload(true); }, 200);
        };

        window.addEventListener('error', function(e) {
          var msg = (e && e.message) ? e.message : '';
          if (msg.indexOf('<') !== -1 || msg.indexOf('MIME') !== -1 || msg.indexOf('Script') !== -1) {
            window.__clearCachesAndReload();
          }
        });
      })();
    </script>
    <script src=\"/sw-register.js\" defer></script>
'''

if 'rel=\"manifest\"' not in html:
    html = html.replace('</head>', pwa_tags + '\n</head>')

with open('dist/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
"

cd "$SCRIPT_DIR"

echo "🔥 Deployment na Firebase Hosting (projekt: mulina-c334d)..."
npx firebase-tools deploy --only hosting

echo ""
echo "✅ Deployment na Firebase zakończony sukcesem!"
echo "🌐 Aplikacja jest dostępna pod adresem:"
echo "   https://mulina-c334d.web.app"
echo "   https://mulina-c334d.firebaseapp.com"
