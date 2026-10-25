---
name: SAVMNY data scope
description: Product boundary for finance records, integrations, and money movement.
---

SAVMNY's current interaction model uses user-entered transactions, monthly budget limits, and manually maintained investment holdings stored in the current browser. Sample holdings are not live market data.

**Why:** The first usable version should support real record management without handling bank credentials, giving financial advice, or moving money.

**How to apply:** Preserve this boundary while extending the app. Server sync, bank or broker connections, and money movement require an explicit user request plus appropriate authentication, integrations, and security work.
