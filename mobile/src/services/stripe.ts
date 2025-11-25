/**
 * Stripe Payment Integration
 * Handles token purchases, pattern purchases, and subscription payments
 */

import { firebaseAuth } from './firebase';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface PaymentIntent {
  client_secret: string;
  amount: number;
  currency: string;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  bonus_tokens?: number;
  popular?: boolean;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 10,
    price: 4.99,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    tokens: 50,
    price: 19.99,
    bonus_tokens: 5,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    tokens: 150,
    price: 49.99,
    bonus_tokens: 30,
  },
  {
    id: 'unlimited',
    name: 'Unlimited Monthly',
    tokens: 999,
    price: 29.99,
  },
];

/**
 * Create payment intent for token purchase
 */
export async function createTokenPaymentIntent(packageId: string): Promise<PaymentIntent> {
  const auth = firebaseAuth();
  const user = auth?.currentUser;
  
  if (!user) {
    throw new Error('User must be logged in to purchase tokens');
  }

  const token = await user.getIdToken();
  const pkg = TOKEN_PACKAGES.find(p => p.id === packageId);
  
  if (!pkg) {
    throw new Error('Invalid package ID');
  }

  const response = await fetch(`${API_URL}/api/v1/payments/create-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'tokens',
      package_id: packageId,
      amount: pkg.price * 100, // Convert to cents
      currency: 'usd',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
}

/**
 * Create payment intent for pattern purchase
 */
export async function createPatternPaymentIntent(
  patternId: string,
  price: number
): Promise<PaymentIntent> {
  const auth = firebaseAuth();
  const user = auth?.currentUser;
  
  if (!user) {
    throw new Error('User must be logged in to purchase patterns');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}/api/v1/payments/create-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'pattern',
      pattern_id: patternId,
      amount: price * 100, // Convert to cents
      currency: 'usd',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
}

/**
 * Check if user has enough tokens for PDF export
 */
export async function checkTokenBalance(): Promise<{ balance: number }> {
  const auth = firebaseAuth();
  const user = auth?.currentUser;
  
  if (!user) {
    return { balance: 0 };
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}/api/v1/users/tokens`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch token balance');
  }

  return response.json();
}

/**
 * Deduct tokens for PDF export
 */
export async function deductTokens(amount: number, reason: string): Promise<{ success: boolean; new_balance: number }> {
  const auth = firebaseAuth();
  const user = auth?.currentUser;
  
  if (!user) {
    throw new Error('User must be logged in');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}/api/v1/users/tokens/deduct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to deduct tokens');
  }

  return response.json();
}

/**
 * Get affiliate link for thread purchase
 */
export function getThreadAffiliateLink(threadCode: string, brand: string): string {
  // Amazon affiliate links (replace with your affiliate ID)
  const affiliateId = 'your-affiliate-id';
  
  switch (brand.toLowerCase()) {
    case 'dmc':
      return `https://www.amazon.com/s?k=DMC+${threadCode}&tag=${affiliateId}`;
    case 'anchor':
      return `https://www.amazon.com/s?k=Anchor+${threadCode}&tag=${affiliateId}`;
    case 'ariadna':
      return `https://www.ariadna.pl/search?q=${threadCode}`;
    case 'madeira':
      return `https://www.amazon.com/s?k=Madeira+${threadCode}&tag=${affiliateId}`;
    default:
      return `https://www.amazon.com/s?k=embroidery+thread+${threadCode}&tag=${affiliateId}`;
  }
}
