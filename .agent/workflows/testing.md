# 🧪 Unit Testing Guide

## Quick Commands

```bash
# Run all tests once
npm run test -- --run

# Run tests in watch mode (re-runs on file change)
npm run test

# Run specific test file
npm run test -- --run src/services/AccountingService.test.ts

# Run tests with coverage report
npm run test -- --coverage
```

---

## When to Run Tests

| Scenario | Command | Why |
|----------|---------|-----|
| Before committing code | `npm run test -- --run` | Catch bugs before push |
| After AI agent changes code | `npm run test -- --run` | Verify nothing broke |
| During development | `npm run test` | Watch mode auto-reruns |
| Before deploying | `npm run test -- --run && npm run build` | Full verification |

---

## Test File Structure

Tests live next to their source files:
```
src/services/
├── AccountingService.ts      ← The actual code
├── AccountingService.test.ts ← Tests for that code
```

---

## Writing a New Test

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './MyService';

describe('myFunction', () => {
  it('should do something correctly', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

---

## Current Test Status

| Service | Tests | Status |
|---------|-------|--------|
| `AccountingService.ts` | 15 | ✅ All pass |
| `TransactionProcessingService.ts` | 4 | ✅ All pass |
| `PriceService.ts` | 15 | ✅ All pass |
| `WatchlistServiceLogic.ts` | 9 | ✅ All pass |
| `portfolioCalculator.ts` | 17 | ✅ All pass |

---

## Tips

1. **Run tests before every commit**
2. **If a test fails**, the code change probably broke something
3. **Tests are faster than manual debugging**
4. **AI agents should run tests** after making changes

---

*Created: January 17, 2026*
