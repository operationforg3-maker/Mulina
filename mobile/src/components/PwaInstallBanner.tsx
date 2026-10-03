import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { colors, shadows } from '../theme/colors';

let deferredPrompt: any = null;

// Catch the install prompt event early on web
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

interface Props {
  onOpenAndroidModal?: () => void;
}

export default function PwaInstallBanner({ onOpenAndroidModal }: Props) {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Check if already running as standalone PWA
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);

    // Detect OS
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    }

    if (deferredPrompt) {
      setCanInstall(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setCanInstall(false);
        }
        deferredPrompt = null;
      } catch (err) {
        console.warn('Install error:', err);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // Do not show if already in standalone app or dismissed
  if (isStandalone || dismissed) return null;

  return (
    <>
      <View style={styles.bannerContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📲</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {deviceType === 'ios' ? 'Zainstaluj Mulina na iPadzie / iPhone' : 'Zainstaluj aplikację na tablecie lub telefonie'}
          </Text>
          <Text style={styles.subtitle}>
            Działa na pełnym ekranie, szybciej i bez paska przeglądarki — idealne do haftowania!
          </Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity 
            style={styles.installBtn}
            onPress={handleInstallClick}
            activeOpacity={0.85}
          >
            <Text style={styles.installBtnText}>
              {canInstall ? '⚡ Zainstaluj teraz' : '📲 Jak zainstalować?'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={() => setDismissed(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Installation Guide Modal for iOS Safari / Android */}
      <Modal
        visible={showGuideModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🧵 Jak zainstalować Mulina na urządzeniu</Text>
              <TouchableOpacity onPress={() => setShowGuideModal(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.deviceCard}>
              <Text style={styles.deviceHeader}>
                📱 iPad / iPhone (Safari)
              </Text>
              <Text style={styles.stepText}>
                1. Otwórz tę stronę w przeglądarce <Text style={styles.bold}>Safari</Text>.
              </Text>
              <Text style={styles.stepText}>
                2. Kliknij ikonę udostępniania <Text style={styles.bold}>[ 📤 Udostępnij ]</Text> u góry lub na dole paska.
              </Text>
              <Text style={styles.stepText}>
                3. Przewiń w dół i wybierz opcję <Text style={styles.bold}>„Do ekranu początkowego” (Add to Home Screen)</Text>.
              </Text>
              <Text style={styles.stepText}>
                4. Kliknij <Text style={styles.bold}>„Dodaj”</Text> — Mulina pojawi się jako natywna aplikacja na Twoim pulpicie!
              </Text>
            </View>

            <View style={[styles.deviceCard, { marginTop: 12 }]}>
              <Text style={styles.deviceHeader}>
                🤖 Android / Tablet (Chrome)
              </Text>
              <Text style={styles.stepText}>
                1. Kliknij menu z trzema kropkami <Text style={styles.bold}>[ ⋮ ]</Text> w prawym górnym rogu Chrome.
              </Text>
              <Text style={styles.stepText}>
                2. Wybierz <Text style={styles.bold}>„Zainstaluj aplikację”</Text> lub <Text style={styles.bold}>„Dodaj do ekranu głównego”</Text>.
              </Text>
              <Text style={styles.stepText}>
                3. Potwierdź instalację. Aplikacja pobierze się natychmiast i uruchamia się na pełnym ekranie z ikoną haftu!
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.modalConfirmBtn}
              onPress={() => setShowGuideModal(false)}
            >
              <Text style={styles.modalConfirmBtnText}>Rozumiem, zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    ...shadows.card,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  installBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    ...shadows.glowPrimary,
  },
  installBtnText: {
    color: colors.textInverted,
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 40, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.cardHover,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCloseIcon: {
    fontSize: 16,
    color: colors.textMuted,
    padding: 4,
  },
  deviceCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  deviceHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  modalConfirmBtnText: {
    color: colors.textInverted,
    fontSize: 14,
    fontWeight: '700',
  },
});
