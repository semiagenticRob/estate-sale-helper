
2026-03-27

Status: #child

Tags: [[estate-sale-helper]] [[legal]] [[partnerships]] [[licensing]]

# EstateSales.net — Legal & Partnership Notes

**Source:** https://www.estatesales.net/terms-of-service  
**ToS Effective Date:** October 1, 2025 (existing users); upon acceptance for new users  
**Operator:** Vintage Software, LLC

---

## Current Status

Estate Sale Helper currently scrapes EstateSales.net via a Python scraper that runs daily and populates a Supabase backend. The app is **free and pre-launch** — no commercial transaction is occurring.

This likely falls in a gray zone: the ToS prohibits commercial exploitation without consent, but personal/non-commercial access is the base license granted to all users.

**We are not currently in conflict with their ToS.** ✅

---

## The Line We Cannot Cross Without Their Consent

From Section 4 (License):

> *"No part of the Service, including the Website, may be reproduced, duplicated, copied, modified, sold, resold, distributed, transmitted, or otherwise **exploited for any commercial purpose** without the prior express written consent of Company."*

**Translation:** The moment Estate Sale Helper becomes a paid product — or generates any revenue — we are commercially exploiting their data. We need Vintage Software's written consent before that happens.

---

## What We'll Need When We Go Paid

- **Formal relationship with Vintage Software, LLC** — either a licensing agreement, API partnership, or explicit written consent for commercial data use
- This could take the form of:
  - A **data licensing agreement** (we pay them, or rev-share, or co-market)
  - An **official API partnership** (if they have or build an API)
  - **Acquisition/white-label** discussion (unlikely, but on the table if we scale)
- The conversation should happen **before** we submit a paid app to the App Store — not after

---

## Other Relevant ToS Notes

- **Seller license requirements:** Sellers on EstateSales.net are responsible for their own auctioneer licenses. This is their business, not ours — but worth knowing as context for the industry.
- **No scraping prohibition explicitly stated** in the ToS (no robots.txt / API terms section visible), but the commercial use restriction is the operative constraint.
- **Privacy Policy** is incorporated by reference into the ToS. Worth reviewing before launch — link: https://www.estatesales.net/privacy-policy
- **Arbitration:** Disputes go to JAMS arbitration (not jury trial). Relevant if we ever need to negotiate and things go sideways.
- **Company's limited role:** EstateSales.net explicitly disclaims responsibility for listing accuracy, which is a gap our real-time community check-in feature directly exploits.

---

## Action Items

- [ ] Review EstateSales.net Privacy Policy before app launch
- [ ] Before going paid: identify and contact the right person at Vintage Software, LLC to open a partnership/licensing conversation
- [ ] Research whether EstateSales.net has a developer API or partner program
- [ ] Consider: could a revenue-sharing arrangement actually benefit both parties? (We drive engagement; they get distribution to a younger, app-native buyer audience)

---

## References

- [[Estate Sale Helper]] — main project note
- [[Estate Sale Helper - Monetization]]
- [[Estate Sale Helper - Business Model Analysis]]
- [[Estate Sale Helper - Go-To-Market Plan]]
