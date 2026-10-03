import React, { useState, useEffect } from 'react';
import GlobalLoader from '../components/GlobalLoader';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { getFirebaseApp, firebaseAuth, firebaseDb } from '../services/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

interface Thread {
  thread_id: number;
  brand: string;
  color_code: string;
  color_name?: string;
  rgb_values: [number, number, number];
  lab_values: [number, number, number];
}

interface ApiStatus {
  service: string;
  status: string;
  version: string;
  threads_loaded: number;
}

const DEFAULT_SAMPLE_THREADS: Thread[] = [
  { thread_id: 1, brand: 'DMC', color_code: '310', color_name: 'Black', rgb_values: [0, 0, 0], lab_values: [0, 0, 0] },
  { thread_id: 2, brand: 'DMC', color_code: 'Blanc', color_name: 'White', rgb_values: [255, 255, 255], lab_values: [100, 0, 0] },
  { thread_id: 3, brand: 'DMC', color_code: '666', color_name: 'Bright Red', rgb_values: [227, 29, 54], lab_values: [48.7, 72.8, 43.5] },
  { thread_id: 4, brand: 'DMC', color_code: '796', color_name: 'Dark Royal Blue', rgb_values: [17, 65, 126], lab_values: [28.3, 8.4, -42.1] },
  { thread_id: 5, brand: 'DMC', color_code: '702', color_name: 'Kelly Green', rgb_values: [71, 163, 62], lab_values: [60.8, -48.2, 42.1] },
];

export default function ApiTestScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [threads, setThreads] = useState<Thread[]>(DEFAULT_SAMPLE_THREADS);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Firebase state
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check Firebase
    try {
      const app = getFirebaseApp();
      setFirebaseInitialized(Boolean(app));
      const auth = firebaseAuth();
      if (auth) {
        const unsub = onAuthStateChanged(auth, (user) => {
          setFirebaseUser(user);
        });
        return unsub;
      }
    } catch (err: any) {
      console.warn('Firebase init check:', err);
    }
  }, []);

  const handleAnonymousSignIn = async () => {
    try {
      setAuthMessage('Logowanie anonimowe...');
      const auth = firebaseAuth();
      if (!auth) throw new Error('Firebase Auth niedostępny');
      const cred = await signInAnonymously(auth);
      setFirebaseUser(cred.user);
      setAuthMessage(`✅ Zalogowano pomyślnie! UID: ${cred.user.uid.slice(0, 8)}...`);
    } catch (err: any) {
      setAuthMessage(`❌ Błąd logowania: ${err.message}`);
    }
  };

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setBackendError(null);

      // Fetch API status
      const statusResponse = await fetch('http://127.0.0.1:8000/', { signal: AbortSignal.timeout(3000) });
      const statusData = await statusResponse.json();
      setStatus(statusData);

      // Fetch sample threads
      const threadsResponse = await fetch('http://127.0.0.1:8000/api/v1/threads?limit=10', { signal: AbortSignal.timeout(3000) });
      const threadsData = await threadsResponse.json();
      if (threadsData.threads && threadsData.threads.length > 0) {
        setThreads(threadsData.threads);
      }
    } catch (err: any) {
      setBackendError(err.message || 'Brak aktywnego lokalnego backendu FastAPI (127.0.0.1:8000)');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
      }
    >
      {/* Firebase Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Firebase & Chmura (mulina-c334d)</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            Status SDK: {firebaseInitialized ? '🟢 Połączono z Firebase' : '🔴 Brak konfiguracji'}
          </Text>
          <Text style={styles.cardText}>Projekt GCP: mulina-c334d</Text>
          <Text style={styles.cardText}>Region Firestore: eur3 (Natywny)</Text>
          <Text style={styles.cardText}>Storage Bucket: mulina-c334d.firebasestorage.app</Text>
          <Text style={styles.cardText}>
            Użytkownik Auth: {firebaseUser ? `✅ Zalogowany (${firebaseUser.isAnonymous ? 'Anonim' : firebaseUser.email})` : '⚪ Niezalogowany'}
          </Text>

          {authMessage && (
            <Text style={[styles.cardText, { marginTop: 6, color: '#4f46e5', fontWeight: '500' }]}>
              {authMessage}
            </Text>
          )}

          {!firebaseUser && (
            <TouchableOpacity style={styles.testButton} onPress={handleAnonymousSignIn}>
              <Text style={styles.testButtonText}>🧪 Przetestuj Firebase Auth (Anonim)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Backend Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Backend API (FastAPI)</Text>
        <View style={styles.card}>
          {status ? (
            <>
              <Text style={styles.cardText}>🟢 Serwis: {status.service}</Text>
              <Text style={styles.cardText}>Status: {status.status}</Text>
              <Text style={styles.cardText}>Wersja: {status.version}</Text>
              <Text style={styles.cardText}>Załadowanych nici: {status.threads_loaded}</Text>
            </>
          ) : (
            <>
              <Text style={styles.cardText}>
                {backendError ? `🟡 Status: ${backendError}` : '⚪ Sprawdzanie...'}
              </Text>
              <Text style={[styles.cardText, { fontSize: 13, color: '#6b7280' }]}>
                Dla pełnej konwersji uruchom backend: python -m uvicorn main:app na porcie 8000.
              </Text>
              <TouchableOpacity style={styles.testButton} onPress={() => fetchData()}>
                <Text style={styles.testButtonText}>Odśwież status backendu</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Threads Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧵 Baza Nici (DMC Paleta)</Text>
        {threads.map((thread, index) => (
          <View key={thread.thread_id || index} style={styles.threadCard}>
            <View style={styles.threadHeader}>
              <View
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: `rgb(${thread.rgb_values[0]}, ${thread.rgb_values[1]}, ${thread.rgb_values[2]})`,
                  },
                ]}
              />
              <View style={styles.threadInfo}>
                <Text style={styles.threadCode}>
                  {thread.brand} {thread.color_code}
                </Text>
                {thread.color_name && (
                  <Text style={styles.threadName}>{thread.color_name}</Text>
                )}
              </View>
            </View>
            <Text style={styles.threadDetails}>
              RGB: {thread.rgb_values.join(', ')} | LAB: {thread.lab_values.map((v) => v.toFixed(1)).join(', ')}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Przeciągnij w dół, aby odświeżyć dane</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  testButton: {
    marginTop: 10,
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  threadCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  threadInfo: {
    flex: 1,
  },
  threadCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  threadName: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  threadDetails: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
