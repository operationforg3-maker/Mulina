/**
 * Thread Database for Mu'alina
 * Supported brands: DMC, Anchor, Ariadna, Madeira, CXC, Dimensions
 */

export interface ThreadDef {
  brand: 'DMC' | 'Anchor' | 'Ariadna' | 'Madeira' | 'CXC' | 'Dimensions';
  code: string;
  name: string;
  r: number;
  g: number;
  b: number;
  hex: string;
}

export const THREAD_CATALOG: ThreadDef[] = [
  // DMC Classics
  { brand: 'DMC', code: 'Blanc', name: 'White', r: 255, g: 255, b: 255, hex: '#FFFFFF' },
  { brand: 'DMC', code: 'Ecru', name: 'Ecru', r: 240, g: 234, b: 218, hex: '#F0EADA' },
  { brand: 'DMC', code: '310', name: 'Black', r: 10, g: 10, b: 10, hex: '#0A0A0A' },
  { brand: 'DMC', code: '666', name: 'Bright Red', r: 227, g: 28, b: 61, hex: '#E31C3D' },
  { brand: 'DMC', code: '321', name: 'Red', r: 199, g: 44, b: 72, hex: '#C72C48' },
  { brand: 'DMC', code: '814', name: 'Dark Garnet', r: 123, g: 17, b: 39, hex: '#7B1127' },
  { brand: 'DMC', code: '498', name: 'Dark Red', r: 167, g: 19, b: 41, hex: '#A71329' },
  { brand: 'DMC', code: '304', name: 'Medium Red', r: 180, g: 35, b: 50, hex: '#B42332' },
  { brand: 'DMC', code: '350', name: 'Medium Coral', r: 224, g: 68, b: 68, hex: '#E04444' },
  { brand: 'DMC', code: '351', name: 'Coral', r: 233, g: 106, b: 96, hex: '#E96A60' },
  { brand: 'DMC', code: '352', name: 'Light Coral', r: 245, g: 155, b: 140, hex: '#F59B8C' },
  { brand: 'DMC', code: '742', name: 'Light Tangerine', r: 255, g: 191, b: 55, hex: '#FFBF37' },
  { brand: 'DMC', code: '743', name: 'Medium Yellow', r: 253, g: 226, b: 78, hex: '#FDE24E' },
  { brand: 'DMC', code: '444', name: 'Dark Lemon', r: 255, g: 215, b: 0, hex: '#FFD700' },
  { brand: 'DMC', code: '307', name: 'Lemon', r: 253, g: 237, b: 84, hex: '#FDED54' },
  { brand: 'DMC', code: '700', name: 'Bright Green', r: 7, g: 115, b: 47, hex: '#07732F' },
  { brand: 'DMC', code: '702', name: 'Kelly Green', r: 71, g: 167, b: 59, hex: '#47A73B' },
  { brand: 'DMC', code: '704', name: 'Chartreuse', r: 159, g: 212, b: 60, hex: '#9FD43C' },
  { brand: 'DMC', code: '907', name: 'Light Parrot Green', r: 199, g: 234, b: 70, hex: '#C7EA46' },
  { brand: 'DMC', code: '905', name: 'Dark Parrot Green', r: 84, g: 130, b: 53, hex: '#548235' },
  { brand: 'DMC', code: '319', name: 'Very Dark Pistachio', r: 32, g: 95, b: 46, hex: '#205F2E' },
  { brand: 'DMC', code: '320', name: 'Medium Pistachio', r: 105, g: 136, b: 90, hex: '#69885A' },
  { brand: 'DMC', code: '367', name: 'Dark Pistachio Green', r: 68, g: 107, b: 69, hex: '#446B45' },
  { brand: 'DMC', code: '796', name: 'Dark Royal Blue', r: 17, g: 65, b: 126, hex: '#11417E' },
  { brand: 'DMC', code: '798', name: 'Dark Delft Blue', r: 70, g: 106, b: 154, hex: '#466A9A' },
  { brand: 'DMC', code: '800', name: 'Pale Delft Blue', r: 192, g: 212, b: 234, hex: '#C0D4EA' },
  { brand: 'DMC', code: '311', name: 'Medium Navy Blue', r: 50, g: 91, b: 131, hex: '#325B83' },
  { brand: 'DMC', code: '312', name: 'Very Dark Baby Blue', r: 53, g: 106, b: 142, hex: '#356A8E' },
  { brand: 'DMC', code: '322', name: 'Dark Baby Blue', r: 90, g: 143, b: 184, hex: '#5A8FB8' },
  { brand: 'DMC', code: '334', name: 'Medium Baby Blue', r: 116, g: 168, b: 200, hex: '#74A8C8' },
  { brand: 'DMC', code: '820', name: 'Very Dark Royal Blue', r: 16, g: 44, b: 87, hex: '#102C57' },
  { brand: 'DMC', code: '208', name: 'Very Dark Lavender', r: 131, g: 85, b: 138, hex: '#83558A' },
  { brand: 'DMC', code: '209', name: 'Dark Lavender', r: 163, g: 123, b: 167, hex: '#A37BA7' },
  { brand: 'DMC', code: '210', name: 'Medium Lavender', r: 195, g: 159, b: 195, hex: '#C39FC3' },
  { brand: 'DMC', code: '211', name: 'Light Lavender', r: 227, g: 203, b: 227, hex: '#E3CBE3' },
  { brand: 'DMC', code: '550', name: 'Very Dark Violet', r: 92, g: 24, b: 90, hex: '#5C185A' },
  { brand: 'DMC', code: '300', name: 'Very Dark Mahogany', r: 111, g: 47, b: 0, hex: '#6F2F00' },
  { brand: 'DMC', code: '301', name: 'Medium Mahogany', r: 184, g: 99, b: 43, hex: '#B8632B' },
  { brand: 'DMC', code: '433', name: 'Medium Brown', r: 122, g: 69, b: 38, hex: '#7A4526' },
  { brand: 'DMC', code: '435', name: 'Very Light Brown', r: 184, g: 119, b: 72, hex: '#B87748' },
  { brand: 'DMC', code: '437', name: 'Light Tan', r: 228, g: 186, b: 140, hex: '#E4BA8C' },
  { brand: 'DMC', code: '738', name: 'Very Light Tan', r: 236, g: 206, b: 166, hex: '#ECCEA6' },
  { brand: 'DMC', code: '414', name: 'Dark Steel Gray', r: 140, g: 137, b: 137, hex: '#8C8989' },
  { brand: 'DMC', code: '415', name: 'Pearl Gray', r: 211, g: 211, b: 214, hex: '#D3D3D6' },
  { brand: 'DMC', code: '762', name: 'Very Light Pearl Gray', r: 236, g: 236, b: 236, hex: '#ECECEC' },
  { brand: 'DMC', code: '317', name: 'Pewter Gray', r: 108, g: 108, b: 108, hex: '#6C6C6C' },
  { brand: 'DMC', code: '3799', name: 'Very Dark Pewter Gray', r: 52, g: 52, b: 52, hex: '#343434' },

  // Anchor Equivalents & Classics
  { brand: 'Anchor', code: '1', name: 'Snow White', r: 255, g: 255, b: 255, hex: '#FFFFFF' },
  { brand: 'Anchor', code: '403', name: 'Black', r: 10, g: 10, b: 10, hex: '#0A0A0A' },
  { brand: 'Anchor', code: '47', name: 'Carmine Red', r: 227, g: 28, b: 61, hex: '#E31C3D' },
  { brand: 'Anchor', code: '19', name: 'Dark Burgundy', r: 123, g: 17, b: 39, hex: '#7B1127' },
  { brand: 'Anchor', code: '298', name: 'Lemon Yellow', r: 253, g: 237, b: 84, hex: '#FDED54' },
  { brand: 'Anchor', code: '228', name: 'Emerald Green', r: 7, g: 115, b: 47, hex: '#07732F' },
  { brand: 'Anchor', code: '255', name: 'Parrot Green', r: 159, g: 212, b: 60, hex: '#9FD43C' },
  { brand: 'Anchor', code: '133', name: 'Royal Blue', r: 17, g: 65, b: 126, hex: '#11417E' },
  { brand: 'Anchor', code: '128', name: 'Sky Blue', r: 192, g: 212, b: 234, hex: '#C0D4EA' },
  { brand: 'Anchor', code: '110', name: 'Lavender', r: 163, g: 123, b: 167, hex: '#A37BA7' },
  { brand: 'Anchor', code: '360', name: 'Bark Brown', r: 111, g: 47, b: 0, hex: '#6F2F00' },
  { brand: 'Anchor', code: '399', name: 'Medium Gray', r: 140, g: 137, b: 137, hex: '#8C8989' },

  // Ariadna Classics
  { brand: 'Ariadna', code: 'Biały', name: 'Biel', r: 255, g: 255, b: 255, hex: '#FFFFFF' },
  { brand: 'Ariadna', code: 'Czarny', name: 'Czerń', r: 10, g: 10, b: 10, hex: '#0A0A0A' },
  { brand: 'Ariadna', code: '1501', name: 'Jasna Czerwień', r: 227, g: 28, b: 61, hex: '#E31C3D' },
  { brand: 'Ariadna', code: '1504', name: 'Bordo', r: 123, g: 17, b: 39, hex: '#7B1127' },
  { brand: 'Ariadna', code: '1602', name: 'Żółty Słoneczny', r: 253, g: 226, b: 78, hex: '#FDE24E' },
  { brand: 'Ariadna', code: '1730', name: 'Zieleń Butelkowa', r: 7, g: 115, b: 47, hex: '#07732F' },
  { brand: 'Ariadna', code: '1734', name: 'Zieleń Groszkowa', r: 159, g: 212, b: 60, hex: '#9FD43C' },
  { brand: 'Ariadna', code: '1810', name: 'Błękit Królewski', r: 17, g: 65, b: 126, hex: '#11417E' },
  { brand: 'Ariadna', code: '1814', name: 'Błękit Pastelowy', r: 192, g: 212, b: 234, hex: '#C0D4EA' },
  { brand: 'Ariadna', code: '1902', name: 'Fiolet Lawendowy', r: 163, g: 123, b: 167, hex: '#A37BA7' },
  { brand: 'Ariadna', code: '1950', name: 'Brąz Kasztanowy', r: 111, g: 47, b: 0, hex: '#6F2F00' },
  { brand: 'Ariadna', code: '1990', name: 'Szary Stalowy', r: 140, g: 137, b: 137, hex: '#8C8989' },

  // Madeira Classics
  { brand: 'Madeira', code: '2400', name: 'White', r: 255, g: 255, b: 255, hex: '#FFFFFF' },
  { brand: 'Madeira', code: '2401', name: 'Black', r: 10, g: 10, b: 10, hex: '#0A0A0A' },
  { brand: 'Madeira', code: '0209', name: 'Christmas Red', r: 227, g: 28, b: 61, hex: '#E31C3D' },
  { brand: 'Madeira', code: '0103', name: 'Lemon', r: 253, g: 237, b: 84, hex: '#FDED54' },
  { brand: 'Madeira', code: '1410', name: 'Meadow Green', r: 7, g: 115, b: 47, hex: '#07732F' },
  { brand: 'Madeira', code: '1005', name: 'Ultra Blue', r: 17, g: 65, b: 126, hex: '#11417E' },
  { brand: 'Madeira', code: '0802', name: 'Orchid', r: 163, g: 123, b: 167, hex: '#A37BA7' },
  { brand: 'Madeira', code: '2005', name: 'Hazelnut', r: 111, g: 47, b: 0, hex: '#6F2F00' },
  { brand: 'Madeira', code: '1802', name: 'Granite', r: 140, g: 137, b: 137, hex: '#8C8989' },

  // CXC & Dimensions
  { brand: 'CXC', code: 'B5200', name: 'Bright Snow White', r: 255, g: 255, b: 255, hex: '#FFFFFF' },
  { brand: 'CXC', code: '310', name: 'CXC Black', r: 10, g: 10, b: 10, hex: '#0A0A0A' },
  { brand: 'CXC', code: '666', name: 'CXC Red', r: 227, g: 28, b: 61, hex: '#E31C3D' },
  { brand: 'Dimensions', code: '11001', name: 'Snow White', r: 255, g: 255, b: 255, hex: '#FFFFFF' },
  { brand: 'Dimensions', code: '11005', name: 'Jet Black', r: 10, g: 10, b: 10, hex: '#0A0A0A' },
  { brand: 'Dimensions', code: '13008', name: 'Poppy Red', r: 227, g: 28, b: 61, hex: '#E31C3D' },
];

/**
 * Find closest thread in catalog using weighted perceptual Euclidean RGB distance
 */
export function findClosestThread(
  r: number,
  g: number,
  b: number,
  preferredBrand?: 'DMC' | 'Anchor' | 'Ariadna' | 'Madeira' | 'CXC' | 'Dimensions'
): ThreadDef {
  const brandFiltered = preferredBrand
    ? THREAD_CATALOG.filter((t) => t.brand === preferredBrand)
    : THREAD_CATALOG;

  const list = brandFiltered.length > 0 ? brandFiltered : THREAD_CATALOG;

  let bestThread = list[0];
  let minDistance = Infinity;

  for (const t of list) {
    // Redmean color difference (fast, highly accurate perceptual approximation of Delta E)
    const rMean = (r + t.r) / 2;
    const deltaR = r - t.r;
    const deltaG = g - t.g;
    const deltaB = b - t.b;

    const dist = Math.sqrt(
      (2 + rMean / 256) * deltaR * deltaR +
      4 * deltaG * deltaG +
      (2 + (255 - rMean) / 256) * deltaB * deltaB
    );

    if (dist < minDistance) {
      minDistance = dist;
      bestThread = t;
    }
  }

  return bestThread;
}
