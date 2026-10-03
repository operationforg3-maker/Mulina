import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { colors, shadows } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AndroidDownloadModal({ visible, onClose }: Props) {
  const pwaUrl = 'http://serwer386514.lh.pl/mulina/';

  const handleCopyLink = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(pwaUrl);
      alert('Skopiowano link do aplikacji: ' + pwaUrl);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>🤖</Text>
              <Text style={styles.title}>Aplikacja Mulina na Android & Tablet</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.desc}>
            Mulina została zbudowana jako nowoczesna aplikacja <Text style={styles.bold}>PWA (Progressive Web App)</Text> kompatybilna ze wszystkimi urządzeniami Android (telefony, tablety Samsung Galaxy Tab, Xiaomi Pad, Lenovo i inne).
          </Text>

          <View style={styles.featureBox}>
            <Text style={styles.featureTitle}>✨ Korzyści instalacji PWA na Androidzie:</Text>
            <Text style={styles.featureItem}>• Działa bez instalowania ze sklepu Google Play (oszczędza pamięć)</Text>
            <Text style={styles.featureItem}>• Dedykowana ikona na pulpicie i uruchamianie na pełnym ekranie</Text>
            <Text style={styles.featureItem}>• Zoptymalizowana pod obsługę rysikiem (S-Pen) i palcem na tablecie</Text>
            <Text style={styles.featureItem}>• Działa w trybie offline po załadowaniu wzoru</Text>
          </View>

          <View style={styles.instructionsBox}>
            <Text style={styles.instTitle}>Jak zainstalować w 10 sekund:</Text>
            <Text style={styles.step}>
              <Text style={styles.stepNum}>1. </Text>
              Otwórz link <Text style={styles.linkText}>{pwaUrl}</Text> w Chrome na telefonie lub tablecie.
            </Text>
            <Text style={styles.step}>
              <Text style={styles.stepNum}>2. </Text>
              Kliknij menu z 3 kropkami <Text style={styles.bold}>[ ⋮ ]</Text> w prawym górnym rogu.
            </Text>
            <Text style={styles.step}>
              <Text style={styles.stepNum}>3. </Text>
              Wybierz opcję <Text style={styles.bold}>„Zainstaluj aplikację”</Text> (lub „Dodaj do ekranu głównego”).
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.copyBtn}
              onPress={handleCopyLink}
            >
              <Text style={styles.copyBtnText}>📋 Kopiuj link dla telefonu</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.primaryBtn}
              onPress={onClose}
            >
              <Text style={styles.primaryBtnText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 40, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.cardHover,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  featureBox: {
    backgroundColor: colors.sageLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.sageDark,
    marginBottom: 6,
  },
  featureItem: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  instructionsBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 18,
  },
  instTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.caramelDark,
    marginBottom: 6,
  },
  step: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  stepNum: {
    fontWeight: '700',
    color: colors.primary,
  },
  linkText: {
    fontWeight: '600',
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  copyBtn: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    ...shadows.glowPrimary,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverted,
  },
});
