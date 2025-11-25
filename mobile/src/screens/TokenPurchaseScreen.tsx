import React, { useState, useEffect } from 'react';
import useNavigation from '../hooks/useNavigation';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TOKEN_PACKAGES, TokenPackage, createTokenPaymentIntent, checkTokenBalance } from '../services/stripe';
import { useAuth } from '../services/authContext';

export default function TokenPurchaseScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    loadTokenBalance();
  }, []);

  const loadTokenBalance = async () => {
    try {
      const { balance } = await checkTokenBalance();
      setTokenBalance(balance);
    } catch (error) {
      console.error('Failed to load token balance:', error);
    }
  };

  const handlePurchase = async (pkg: TokenPackage) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to purchase tokens');
      return;
    }

    try {
      setLoading(true);
      setSelectedPackage(pkg);

      // Create payment intent
      const paymentIntent = await createTokenPaymentIntent(pkg.id);

      // In production, integrate with Stripe Payment Sheet here
      // For now, show alert
      Alert.alert(
        'Payment Processing',
        `This would charge $${pkg.price.toFixed(2)} for ${pkg.tokens} tokens.\n\nStripe integration pending.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm (Demo)',
            onPress: () => {
              // Simulate successful payment
              Alert.alert('Success!', `You received ${pkg.tokens} tokens!`);
              setTokenBalance(tokenBalance + pkg.tokens + (pkg.bonus_tokens || 0));
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };


  return (
    <ScrollView style={styles.container}>
      {/* Banner Stripe */}
      <View style={styles.bannerStripe}>
        <Text style={styles.bannerStripeText}>Płatności obsługuje Stripe. Twoje dane są bezpieczne.</Text>
      </View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💎 Kup Tokeny</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Twój stan konta</Text>
          <Text style={styles.balanceAmount}>{tokenBalance} tokenów</Text>
        </View>
        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home' as never)}>
          <Text style={styles.homeButtonText}>← Strona główna</Text>
        </TouchableOpacity>
      </View>


      {/* Dlaczego warto? */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Dlaczego warto mieć tokeny?</Text>
        <Text style={styles.infoText}>
          • 1 token = 1 eksport PDF
          • Tokeny nigdy nie wygasają
          • Dostęp do premium wzorów
          • Synchronizacja na wszystkich urządzeniach
        </Text>
      </View>

      {/* Packages */}
      <View style={styles.packages}>
        {TOKEN_PACKAGES.map(pkg => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.packageCard,
              pkg.popular && styles.packageCardPopular,
              loading && selectedPackage?.id === pkg.id && styles.packageCardLoading,
            ]}
            onPress={() => handlePurchase(pkg)}
            disabled={loading}
          >
            {pkg.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}

            <Text style={styles.packageName}>{pkg.name}</Text>
            
            <View style={styles.packageTokens}>
              <Text style={styles.packageTokensAmount}>{pkg.tokens}</Text>
              <Text style={styles.packageTokensLabel}>tokens</Text>
            </View>

            {pkg.bonus_tokens && (
              <Text style={styles.packageBonus}>+{pkg.bonus_tokens} bonus tokens!</Text>
            )}

            <View style={styles.packagePrice}>
              <Text style={styles.packagePriceAmount}>${pkg.price.toFixed(2)}</Text>
              <Text style={styles.packagePricePerToken}>
                ${(pkg.price / (pkg.tokens + (pkg.bonus_tokens || 0))).toFixed(2)}/token
              </Text>
            </View>

            {loading && selectedPackage?.id === pkg.id ? (
              <ActivityIndicator color="#fff" style={styles.loader} />
            ) : (
              <View style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Buy Now</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* FAQ */}
      <View style={styles.faq}>
        <Text style={styles.faqTitle}>Najczęstsze pytania</Text>
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Czy mogę otrzymać zwrot?</Text>
          <Text style={styles.faqAnswer}>
            Tokeny nie podlegają zwrotowi, ale nigdy nie wygasają. W wyjątkowych sytuacjach napisz do supportu.
          </Text>
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Jak używać tokenów?</Text>
          <Text style={styles.faqAnswer}>
            Tokeny są automatycznie pobierane przy eksporcie PDF. Zawsze widzisz swój stan konta przed potwierdzeniem.
          </Text>
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Czy są darmowe wzory?</Text>
          <Text style={styles.faqAnswer}>
            Tak! Możesz tworzyć i edytować własne wzory za darmo. Tokeny są potrzebne tylko do eksportu PDF i premium.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bannerStripe: {
    backgroundColor: '#0ea5e9',
    padding: 10,
    alignItems: 'center',
  },
  bannerStripeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  homeButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  homeButtonText: {
    color: '#3730a3',
    fontWeight: '600',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#7C3AED',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  packages: {
    padding: 16,
    paddingTop: 8,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  packageCardPopular: {
    borderColor: '#7C3AED',
    borderWidth: 3,
  },
  packageCardLoading: {
    opacity: 0.6,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  packageTokens: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  packageTokensAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginRight: 8,
  },
  packageTokensLabel: {
    fontSize: 18,
    color: '#6B7280',
  },
  packageBonus: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 16,
  },
  packagePrice: {
    marginBottom: 16,
  },
  packagePriceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  packagePricePerToken: {
    fontSize: 14,
    color: '#6B7280',
  },
  buyButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    padding: 16,
  },
  faq: {
    padding: 16,
    paddingTop: 8,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 20,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
