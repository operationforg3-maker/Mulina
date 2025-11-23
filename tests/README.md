# Mulina Tests

Test suite for Mulina embroidery app (mobile, web, backend)

## Setup

```bash
cd tests
npm install
```

## Running Tests

### Unit Tests (Jest)
```bash
npm run test:unit
```

### E2E Tests - Web (Playwright)
```bash
# Build mobile app first
cd ../mobile
npx expo export --platform web

# Run tests
cd ../tests
npm run test:e2e:web
```

### E2E Tests - Mobile (Detox)
```bash
# iOS
npm run test:e2e:ios

# Android
npm run test:e2e:android
```

### All Tests
```bash
npm run test:all
```

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── pwa.spec.ts        # Web app tests
│   ├── ios.spec.ts        # iOS tests
│   └── android.spec.ts    # Android tests
│
├── unit/                   # Unit tests
│   ├── colorMatching.test.ts   # Color algorithm tests
│   ├── patternGeneration.test.ts
│   └── firebase.test.ts
│
├── test-assets/           # Test images and patterns
│   ├── sample-image.jpg
│   └── sample-pattern.json
│
├── playwright.config.ts   # Playwright configuration
├── jest.config.js         # Jest configuration
└── package.json
```

## Test Coverage

Run tests with coverage:
```bash
npm run test:unit -- --coverage
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Before deployment

See `.github/workflows/test.yml` for CI configuration.

## Writing Tests

### Unit Tests Example
```typescript
describe('Color Matching', () => {
  test('calculates Delta E correctly', () => {
    const deltaE = calculateDeltaE(lab1, lab2);
    expect(deltaE).toBeCloseTo(2.5, 1);
  });
});
```

### E2E Tests Example
```typescript
test('exports pattern to PDF', async ({ page }) => {
  await page.goto('/PatternEditor?patternId=test-123');
  await page.click('text=📄 PDF');
  
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});
```

## Notes

- Unit tests focus on color algorithms, data transformations, business logic
- E2E tests verify user flows: upload, edit, export, sync
- Run web build before E2E tests: `npx expo export --platform web`
- Mobile E2E tests require simulators/emulators running
