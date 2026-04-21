
2026-03-25

Status: #adult

Tags: [[estate-sale-helper]] [[app-development]] [[strategy]] [[go-to-market]]

# Estate Sale Helper — Go-To-Market Plan

*Source: Claude analysis, filed by Peter Rabbit — 2026-03-25.*
*Repo: https://github.com/semiagenticRob/estate-sale-helper*

---

## Context

Estate Sale Helper is an early-production MVP (Expo/React Native + Supabase + Python scraper) that lets buyers discover estate sales by location and date. V1 is functionally complete: search, results (list + map), sale detail with images, and local saved sales. The scraper runs daily via GitHub Actions, pulling from estatesales.net (currently Colorado only, national grid ready).

---

## Phase 0 — App Store Ready (weeks 1–3)

Ship the minimum needed to pass App Store review. Nothing else.

| # | Feature | Why | Complexity | Dependencies |
|---|---------|-----|------------|--------------|
| 0.1 | EAS build config + bundle ID — change from com.anonymous.estate-helper, set up eas.json with production profiles | Cannot submit without it | Low | Apple Dev Account ($99) |
| 0.2 | Privacy policy & ToS — static pages (in-app or hosted). Required for location-permission apps | Apple rejects without it | Low | None |
| 0.3 | App Store metadata & screenshots — description, keywords, category, device screenshots | Required for submission | Low | EAS build working |
| 0.4 | Error states & edge case polish — offline handling, empty results messaging, location permission denial, expired sales in saved list | Reviewers test edge cases; crash = rejection | Low-Med | None |
| 0.5 | Verify national scraper stability — test full national run, monitor Supabase row counts, confirm GitHub Actions timeout is sufficient | Launching Colorado-only leaves value on the table if national works | Low | None |

**Explicitly NOT in Phase 0:** Auth, notifications, reviews, route planning, AI features. The app works today as a read-only sale browser with local saves. That's enough for approval.

---

## Phase 1 — Retention (v1.1, weeks 3–6)

Turn "tried it once" into "use it every weekend." All low-cost, high-retention features.

| # | Feature | Why | Complexity |
|---|---------|-----|------------|
| 1.1 | Push notification reminders — prompt on save, schedule local notification before sale starts. `remind_at` column and `SavedSale` type already exist. No server needed (expo-notifications local scheduling) | Highest-retention feature at lowest cost. Estate sales are ephemeral — miss it, lose it | Low-Med |
| 1.2 | Advanced result filtering — filter by company name, payment method, exclude online auctions. Data and regex detection already built in `lib/paymentTypes.ts`. Surface as filter chips on results screen | Power users (resellers) need this to go from "neat" to "essential" | Low |
| 1.3 | Keyword search on results — `search_sales` RPC already supports full-text query but UI sends `query: ''`. Wire up a search bar so users can search "mid-century furniture" or "tools" across all descriptions | The app's secret weapon — searching across all sale descriptions at once. EstateSales.net buries this | Low |
| 1.4 | Share a sale — native share sheet from detail page with deep link (or web fallback) | Organic growth. Estate sale shoppers go in pairs/groups. Near-zero build cost | Low |

**Business action (parallel):** Send good-faith intro email to ATG. Frame as "we drive traffic to your listings, let's discuss data partnership." De-risks C&D scenario.

---

## Phase 2 — Monetization Foundation (v1.2–1.3, weeks 6–12)

Features that support the subscription model and begin real differentiation.

| # | Feature | Why | Complexity | Depends on |
|---|---------|-----|------------|------------|
| 2.1 | User authentication — Supabase Auth (email + Apple Sign-In + Google). Migrate saves from AsyncStorage to Supabase `saved_sales` table. Cross-device sync | Prerequisite for reviews, route planning, subscriptions, and cross-device saves | Med | None |
| 2.2 | Route planning — from saved sales, tap "Plan Route" to generate optimized multi-stop route. Hand off to Apple Maps / Google Maps with waypoints. Do NOT build custom nav | Vault's V2 core feature. Biggest differentiator for resellers doing multi-sale Saturday trips. Confirmed by market research (trip ROI is top pain point) | Med | 2.1 (or local saves as stopgap) |
| 2.3 | Subscription infrastructure (RevenueCat) — Basic $3.99/mo (route planning), Pro $9.99/mo (AI image search, Phase 3). Free tier: search + save + limited reminders | Cannot monetize without it. RevenueCat is the standard for solo founders | Med | 2.1 |
| 2.4 | Analytics (PostHog or Amplitude free tier) — track searches, saves, detail views, retention, feature usage | Flying blind without data. Must know what's working before building expensive features | Low | None |

---

## Phase 3 — Differentiation (v2.0, months 3–6)

Features that make Estate Sale Helper genuinely better than browsing estatesales.net directly. This is where you earn the subscription.

**3.1 — Community check-in / sale reviews**
After visiting (proximity + time detection), prompt for 3-tap review: pricing (1–5), accuracy (thumbs up/down), "worth the trip" (yes/no). Show aggregate on sale cards.
- *Why:* Vault rates this HIGH and market research backs it up (#1 and #2 pain points: pricing transparency, listing accuracy). But reviews require user density — launching with 50 users means empty counts everywhere, which hurts trust. Needs 500+ users in at least one metro.
- *Complexity:* Med-High
- *Depends on:* 2.1, meaningful user base

**3.2 — AI image search (Pro tier)**
CLIP or similar vision model tags images during scraping. Pro users search "brass lamp" and get matching images across all active sales. `ai_tags` column already exists in `sale_images`.
- *Why:* Killer Pro feature. Validate indexing cost in one metro before national rollout.
- *Complexity:* High
- *Depends on:* 2.3, scraper modifications

**3.3 — "Submit a sale" (community-sourced)**
Users submit sales not on estatesales.net (yard sales, church sales). Simple form: address, dates, optional photos.
- *Why:* Begins transition from "estatesales.net wrapper" to independent aggregator. Reduces ATG dependency.
- *Complexity:* Med
- *Depends on:* 2.1

---

## Phase 4 — Platform (v3.0, months 6–12+)

Only pursue if Phase 2–3 metrics justify continued investment.

| # | Feature | Notes |
|---|---------|-------|
| 4.1 | Multi-source aggregation (Craigslist) | Reduces single-source dependency. Facebook is off the table — ToS enforcement too aggressive for solo founder |
| 4.2 | Pricing transparency / eBay comps | #1 reseller pain point but nearly a standalone product in complexity. Defer until AI image search is proven |
| 4.3 | Line tracking / in-sale tools | Requires dozens of simultaneous users at individual sales. Not viable until market dominance in at least one metro |

---

## What Gets Deprioritized and Why

| Idea | Vault Priority | Recommendation | Reason |
|------|---------------|----------------|--------|
| Facebook scraping | Part of Multi-Source (Medium) | Cut entirely | Facebook actively sues scrapers. Legal risk not worth it for solo founder |
| Community check-ins | High | Defer to Phase 3 | Vault is right on value but wrong on timing. Empty review counts hurt trust. Need 500+ metro users first |
| Gamification / reputation | Mentioned as adoption driver | Defer until reviews proven | Adding gamification to a feature nobody uses yet is wasted effort |
| Line tracking | Future | Defer indefinitely | Requires user density that only comes after PMF is proven |
| eBay price comps | From research | Defer to Phase 4 | Nearly a standalone product. AI image search gives Pro subs a reason to pay without this |

---

## Business Model Sequencing

| Phase | Business State | Revenue |
|-------|---------------|---------|
| 0 | Free app on App Store, ATG intro email sent | $0 |
| 1 | Free app, organic growth via share + word of mouth | $0 |
| 2 | Subscription gates route planning (Basic) and sets up Pro | First revenue |
| 3 | Pro tier gates AI search, community reviews drive retention | Growing MRR |
| 4 | Independent aggregator, ATG partnership or independence | Sustainable |

**Key insight:** Do not monetize before retention. Phase 1 is entirely about making the free experience sticky enough that people come back every weekend. Phase 2 introduces payment only after users depend on the app.

---

## Verification Plan

For each phase, before moving to the next:
- **Phase 0:** Successful App Store submission accepted for review; scraper national run completes without errors
- **Phase 1:** Test notifications fire correctly on iOS; filter chips correctly narrow results; share links open app or fallback
- **Phase 2:** Auth flow works end-to-end (sign up, save sale, see it on another device); route opens in native maps with correct waypoints; RevenueCat paywall gates correctly
- **Phase 3:** Review prompt triggers at correct proximity/time; AI tags populate during scraper run; community submissions appear after moderation

---

---

## Launch Strategy (Added 2026-03-30 — apply on App Store approval)

*Built using launch-strategy skill + ESH context. Use this the day Apple approves.*

### Where ESH is in the five-phase launch model

Phases 1–3 (internal, alpha, beta) are complete. On approval day we move directly from Phase 4 → Phase 5 (Full Launch). No waitlist, no drip — hit the ground running.

---

### ORB Channel Map

**Owned — gap to fill before approval**
ESH has no owned channel yet. Add a simple email capture (Carrd or equivalent) so Reddit traffic that doesn't convert to a download becomes a subscriber. 2-hour build max. "Get notified when new features ship."

**Rented — Reddit is the primary launch surface**
- `r/estatesales` — most targeted. Buyers and sellers. Post first.
- `r/flipping` — resellers doing multi-sale Saturday trips. Core power users.
- `r/ThriftStoreHauls` — adjacent deal-hunters.

**Post framing:** Lead with the frustration, not the app. *"I got tired of losing estate sales because I couldn't figure out which ones were cash-only until I was standing there. So I built a thing."* Show 2–3 screenshots of what's different: payment methods visible, clean map view, saved sales. Ask for feedback, not installs.

**Borrowed — two opportunities**
1. ATG (EstateSales.net) — if partnership goes well, they have the audience. Frame the intro email as a mutual win, not just legal clearance.
2. Estate sale company owners in Facebook seller groups ("Estate Sale Professionals") — supply-side word-of-mouth that nobody else is working.

---

### Approval Day Checklist

**First 30 minutes:**
- [ ] Fire all three Reddit posts (pre-written, ready in todo list)
- [ ] Text 10–15 personal contacts who thrift/flip — personal notes, not a blast
- [ ] Send ATG intro email (pre-drafted)
- [ ] Post one X thread — personal voice, link to App Store

**First 24 hours:**
- [ ] Reply to every Reddit comment
- [ ] Monitor App Store page for review issues
- [ ] Check PostHog — are `sale_searched` and `sale_saved` events firing?

**First 48 hours:**
- [ ] ATG follow-up if no response (give them 48h first)
- [ ] Crosspost top-performing Reddit variant to the other two subreddits

---

### What NOT to do at launch

- ❌ **Product Hunt** — wait for 10+ App Store reviews, positive Day 7 retention, 50+ active users. It's a one-shot event.
- ❌ **Paid ads** — audience is niche. Organic Reddit is more valuable than any ad spend at this stage.
- ❌ **Press outreach** — not yet. Nothing to show the press until there are users and a story.
- ❌ **New features** — no building until initial traction, user validation, and ATG outreach are complete.

---

### 30-Day Post-Launch Plan

| Week | Focus | Action |
|------|-------|--------|
| 1 | Seed users | Reddit, personal network, ATG email |
| 2 | Learn | PostHog — Day 7 retention, saves/session, search→save conversion |
| 2–3 | Listen | Reply to every App Store review. DM power users for feedback calls |
| 3–4 | Decide | If retention is good → plan Product Hunt. If not → understand why first |
| 4 | Product Hunt | Only if: 10+ reviews, positive Day 7 retention, 50+ active users |

---

### The One Metric That Matters in Week 1

**Day 7 retention.** Estate sales happen weekends. If someone downloads on Saturday — do they come back the following Saturday? That single number tells you whether the core loop (search → save → attend) is working. Everything else is noise until you have that answer.

---

See: [[Estate Sale Helper]], [[Estate Sale Helper - Monetization]], [[Estate Sale Helper - Business Model Analysis]], [[Estate Sale Helper - Route Planning]], [[Estate Sale Helper - The Buyer-Side Gap]]
