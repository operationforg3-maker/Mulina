import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Mulina ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (window.navigator && navigator.serviceWorker) {
          navigator.serviceWorker.getRegistrations().then((regs) => {
            regs.forEach((r) => r.unregister());
          });
        }
        if (window.caches) {
          caches.keys().then((keys) => {
            keys.forEach((k) => caches.delete(k));
          });
        }
      } catch (e) {
        console.warn('Reset error:', e);
      }
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>🧵</Text>
          <Text style={styles.title}>Coś poszło nie tak</Text>
          <Text style={styles.subtitle}>
            Wystąpił nieoczekiwany błąd podczas wyświetlania ekranu.
          </Text>
          {this.state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={4}>
                {this.state.error.message || String(this.state.error)}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.btn} onPress={this.handleReset} activeOpacity={0.85}>
            <Text style={styles.btnText}>🔄 Odśwież i wyczyść pamięć</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D9777F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  btn: {
    backgroundColor: '#D9777F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#D9777F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
