---
description: How to audit and verify portfolio PnL and ROI math
---

1. Open `src/services/accountingService.ts` to review journal entry generation.
2. Locate the specific transaction symbol in the `TransactionTable`.
3. Verify if the transaction is marked as an internal swap or external capital (Check `notes`).
4. Read `src/domain/portfolioCalculator.ts` to confirm the calculation logic (Realized vs Paper).
5. Compare the UI output in `LPFeeTracker.tsx` against the the expected math:
   `Net PnL = (Current Value + Realized Exit) - Total Invested`.
6. Ensure `usePriceFeeds.ts` is using the same price source as the calculation.
