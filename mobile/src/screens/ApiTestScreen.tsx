import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

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

export default function ApiTestScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Fetch API status
      const statusResponse = await fetch('http://127.0.0.1:8000/');
      const statusData = await statusResponse.json();
      setStatus(statusData);

      // Fetch sample threads
      const threadsResponse = await fetch('http://127.0.0.1:8000/api/v1/threads?limit=10');
      const threadsData = await threadsResponse.json();
      setThreads(threadsData.threads || []);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Connecting to backend...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Text style={styles.hintText}>
          Make sure backend is running on http://127.0.0.1:8000
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🟢 Backend Status</Text>
        {status && (
          <View style={styles.card}>
            <Text style={styles.cardText}>Service: {status.service}</Text>
            <Text style={styles.cardText}>Status: {status.status}</Text>
            <Text style={styles.cardText}>Version: {status.version}</Text>
            <Text style={styles.cardText}>Threads Loaded: {status.threads_loaded}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧵 Sample Threads (DMC)</Text>
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
              RGB: {thread.rgb_values.join(', ')}
            </Text>
            <Text style={styles.threadDetails}>
              LAB: {thread.lab_values.map((v) => v.toFixed(2)).join(', ')}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pull down to refresh</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
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
    fontSize: 15,
    color: '#374151',
    marginBottom: 6,
  },
  threadCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  threadInfo: {
    flex: 1,
  },
  threadCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  threadName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  threadDetails: {
    fontSize: 13,
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
