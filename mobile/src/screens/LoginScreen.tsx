import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../services/authContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../theme/useResponsive';
import { shadows } from '../theme/colors';
import {
  NeedleIcon,
  HoopIcon,
  FlowerIcon,
  BirdIcon,
  RusticDivider,
} from '../components/RusticIcons';

export default function LoginScreen() {
  const { signIn, signUp, resetPassword, signInAsGuest, user } = useAuth();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { isTabletOrLarger } = useResponsive();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const translateFirebaseError = (err: any): string => {
    const code = err?.code || '';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Nieprawidłowy adres e-mail lub hasło.';
    }
    if (code.includes('email-already-in-use')) {
      return 'Konto o tym adresie e-mail już istnieje.';
    }
    if (code.includes('weak-password')) {
      return 'Hasło jest zbyt krótkie (wymagane min. 6 znaków).';
    }
    if (code.includes('invalid-email')) {
      return 'Podaj poprawny adres e-mail.';
    }
    if (code.includes('too-many-requests')) {
      return 'Zbyt wiele nieudanych prób logowania. Odczekaj chwilę.';
    }
    return err?.message || 'Wystąpił błąd autoryzacji.';
  };

  const handleAction = async () => {
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Wprowadź adres e-mail.');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      try {
        await resetPassword(email);
        Alert.alert('Wysłano link', 'Instrukcja resetowania hasła została przesłana na Twój e-mail.', [
          { text: 'OK', onPress: () => setMode('login') },
        ]);
      } catch (err: any) {
        setErrorMsg(translateFirebaseError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Wprowadź hasło.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password, displayName);
        Alert.alert('Witaj w Mu\'Alina!', 'Twoje konto zostało pomyślnie utworzone.');
        navigation.goBack();
      } else {
        await signIn(email, password);
        navigation.goBack();
      }
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInAsGuest();
      navigation.goBack();
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTabletOrLarger && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top brand header */}
        <View style={styles.brandSection}>
          <Image
            source={require('../../assets/mualina_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>Mu'Alina</Text>
          <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
            Cyfrowy Tamborek & Bezpieczna Chmura Firebase
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.authCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          {/* Mode Switcher */}
          <View style={[styles.modeTabs, { backgroundColor: theme.backgroundAlt }]}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'login' && [styles.activeTab, { backgroundColor: theme.surface }],
              ]}
              onPress={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'login' ? theme.primary : theme.textSecondary },
                  mode === 'login' && styles.activeTabText,
                ]}
              >
                Logowanie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'signup' && [styles.activeTab, { backgroundColor: theme.surface }],
              ]}
              onPress={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'signup' ? theme.primary : theme.textSecondary },
                  mode === 'signup' && styles.activeTabText,
                ]}
              >
                Rejestracja
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form fields */}
          <View style={styles.formContent}>
            {errorMsg && (
              <View style={[styles.errorBox, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Imię lub pseudonim hafciarki</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder, color: theme.textPrimary },
                  ]}
                  placeholder="np. Kasia"
                  placeholderTextColor={theme.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Adres e-mail</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder, color: theme.textPrimary },
                ]}
                placeholder="twoj@email.pl"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {mode !== 'reset' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Hasło</Text>
                  {mode === 'login' && (
                    <TouchableOpacity onPress={() => setMode('reset')}>
                      <Text style={[styles.forgotLink, { color: theme.primary }]}>Nie pamiętasz?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder, color: theme.textPrimary },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            )}

            {mode === 'reset' && (
              <Text style={[styles.resetInfo, { color: theme.textSecondary }]}>
                Podaj adres e-mail przypisany do Twojego konta. Prześlemy Ci link do zresetowania hasła.
              </Text>
            )}

            {/* Main Action Button */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              onPress={handleAction}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>
                  {mode === 'login' && 'Zaloguj się do tamborka'}
                  {mode === 'signup' && 'Załóż darmowe konto'}
                  {mode === 'reset' && 'Wyślij link do resetu'}
                </Text>
              )}
            </TouchableOpacity>

            {mode === 'reset' && (
              <TouchableOpacity
                style={styles.cancelResetBtn}
                onPress={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
              >
                <Text style={[styles.cancelResetText, { color: theme.primary }]}>Wróć do logowania</Text>
              </TouchableOpacity>
            )}

            <RusticDivider color={theme.primary} secondaryColor={theme.sage} style={{ marginVertical: 14 }} />

            {/* Guest Login Option */}
            <TouchableOpacity
              style={[styles.guestBtn, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
              onPress={handleGuestLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <BirdIcon size={18} color={theme.primary} />
              <Text style={[styles.guestBtnText, { color: theme.textPrimary, marginLeft: 8 }]}>
                Kontynuuj jako gość (anonimowo)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Benefits list */}
        <View style={styles.benefitsSection}>
          <Text style={[styles.benefitsTitle, { color: theme.textPrimary }]}>Co zyskujesz z kontem Mu'Alina:</Text>
          <View style={styles.benefitItem}>
            <HoopIcon size={16} color={theme.primary} />
            <Text style={[styles.benefitText, { color: theme.textSecondary }]}>
              Automatyczna synchronizacja wzorów i postępu krzyżyków w chmurze
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <NeedleIcon size={16} color={theme.primary} />
            <Text style={[styles.benefitText, { color: theme.textSecondary }]}>
              Dostęp do swoich tamborków na telefonie, tablecie i komputerze
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <FlowerIcon size={16} color={theme.primary} />
            <Text style={[styles.benefitText, { color: theme.textSecondary }]}>
              Bezpieczna kopia zapasowa Twojej kolekcji nici DMC i Anchor
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  tabletContent: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  brandSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  authCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  modeTabs: {
    flexDirection: 'row',
    padding: 4,
    margin: 12,
    borderRadius: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    ...shadows.card,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '800',
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  errorBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  resetInfo: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  actionBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...shadows.glowPrimary,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelResetBtn: {
    alignItems: 'center',
    marginTop: 12,
  },
  cancelResetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  guestBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  benefitsSection: {
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 6,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
