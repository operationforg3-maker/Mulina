#!/bin/bash
set -e

echo "🚀 Rozpoczynam budowanie i deployment aplikacji Mulina..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📦 Budowanie wersji web w mobile/..."
cd mobile
npx expo export -p web

echo "📋 Kopiowanie plików PWA i ikon..."
cp -r public/* dist/
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
    <!-- Mulina PWA Meta Tags -->
    <meta name=\"theme-color\" content=\"#D9777F\" />
    <meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />
    <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\" />
    <meta name=\"apple-mobile-web-app-title\" content=\"Mulina\" />
    <link rel=\"manifest\" href=\"/mulina/manifest.json\" />
    <link rel=\"apple-touch-icon\" href=\"/mulina/icon.png\" />
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
    <script src=\"/mulina/sw-register.js\" defer></script>
'''

if 'rel=\"manifest\"' not in html:
    html = html.replace('</head>', pwa_tags + '\n</head>')

with open('dist/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
"

# Upewnij się, że .htaccess istnieje z poprawną polityką cache i brakiem redirectu dla .js
cat << 'HTACCESS' > dist/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /mulina/
  RewriteRule ^index\.html$ - [L]
  # Nie przekierowuj brakujacych plikow statycznych JS/CSS do index.html
  RewriteCond %{REQUEST_URI} !\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|json|map)$ [NC]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /mulina/index.html [L]
</IfModule>

<IfModule mod_headers.c>
  # HTML i Service Worker nigdy nie powinny byc cache'owane w pamieci przegladarki
  <FilesMatch "\.(html|htm)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
  <FilesMatch "(service-worker\.js|sw-register\.js)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
</IfModule>
HTACCESS

cd "$SCRIPT_DIR"

FTP_HOST="serwer386514.lh.pl"
FTP_USER="serwer386514_tomasz"
FTP_PASS="Noga123@"
FTP_DIR="mulina"

echo "📤 Wgrywanie plików na serwer $FTP_HOST do katalogu $FTP_DIR..."

lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" <<EOF
set ssl:verify-certificate no
mkdir -p $FTP_DIR
cd $FTP_DIR
mirror --reverse --delete --verbose --parallel=3 mobile/dist/ .
chmod 755 .
chmod 644 index.html
bye
EOF

echo ""
echo "✅ Deployment zakończony sukcesem!"
echo "🌐 Aplikacja testowa jest dostępna pod adresem:"
echo "   http://serwer386514.lh.pl/mulina/"
