// Mulina Design System - Pastel, Cozy Embroidery Palette

export const colors = {
  // Brand / Mulina (Dusty Rose & Mulberry)
  primary: '#D9777F',
  primaryHover: '#C4636B',
  primaryDark: '#A84C54',
  primaryLight: '#FDF0F2',
  primaryMuted: '#F4D3D7',
  primaryBorder: '#ECC3C8',

  // Accent / Sage Green (Tamborek & Completed Stitches)
  sage: '#5E8C73',
  sageDark: '#4A725D',
  sageLight: '#EDF5F0',
  sageMuted: '#D3E6DC',
  sageBorder: '#BFD9CB',

  // Accent / Warm Caramel & Floss Gold
  caramel: '#C48356',
  caramelDark: '#A86C42',
  caramelLight: '#FAF2EA',
  caramelBorder: '#EED9C7',

  // Accent / Soft Lavender (Highlights & Selection)
  lavender: '#8E82B5',
  lavenderLight: '#F3F0F9',
  lavenderBorder: '#DDD7EB',

  // Backgrounds (Warm Linen & Natural Canvas)
  background: '#FAF7F2',       // Warm linen ecru base
  backgroundAlt: '#F4EFE6',    // Slightly deeper linen
  surface: '#FFFFFF',          // Card surface
  surfaceHover: '#FDFBF7',
  surfaceBorder: '#EFE7DC',    // Soft border for cards

  // Text Hierarchy (Warm Charcoal, not harsh black)
  textPrimary: '#2D282A',      // Soft dark charcoal
  textSecondary: '#6E6466',    // Warm muted gray-brown
  textMuted: '#9E9496',        // Subtle placeholder / inactive
  textInverted: '#FFFFFF',

  // System & Utilities
  success: '#5E8C73',
  warning: '#D68C45',
  danger: '#D9534F',
  info: '#628E9E',
  
  // Shadows (Warm & soft)
  shadowWarm: 'rgba(120, 90, 80, 0.07)',
  shadowMedium: 'rgba(120, 90, 80, 0.12)',
};

export const shadows = {
  card: {
    shadowColor: '#785A50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#785A50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  glowPrimary: {
    shadowColor: '#D9777F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};
