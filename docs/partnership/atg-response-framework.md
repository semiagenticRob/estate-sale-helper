
2026-04-13

Status: #baby

Tags: [[estate-sale-helper]] [[partnerships]] [[b2b-outreach]] [[atg]]

# Estate Sale Helper — ATG Response Draft (CEO Agent)

See: [[Estate Sale Helper]], [[Estate Sale Helper - ATG Partnership Outreach]], [[Estate Sale Helper - ATG Acquisition Intel]]

---

## Purpose

Marika Clemow (GM Estate Sales & SVP, ATG) responded April 10 with six specific questions before she'll consider a partnership. This is the draft framework for Rob's response. Rob needs to fill in the `[PLACEHOLDER]` fields with real data from Supabase and App Store Connect.

---

## Marika's Six Questions — Answers Framework

### 1. User Base & Traction

> _How many active users do you currently have, and what does engagement look like?_

**Data Rob needs to pull:**
- App Store Connect → Downloads since April 7 launch
- Supabase → Distinct device IDs or user sessions in last 7 days
- App Store Connect → Sessions, active devices, retention

**Positioning:** Even if numbers are small (expected at <1 week post-launch), frame as: "We're in early traction, which is exactly why a pilot makes sense — you'd be shaping the product, not chasing it."

**Draft language:**
> Since launch on April 7, we've seen [X] downloads with [Y] weekly active users. Average session length is [Z] minutes. Engagement is concentrated around weekends, which aligns with the estate sale calendar — users search Thursday/Friday and attend Saturday/Sunday. We're early, and that's the point: a pilot now means ATG shapes the buyer experience before it scales.

### 2. Audience

> _Who are your core users today?_

**Draft language:**
> Our initial users fall into three buckets:
> • *Resellers/flippers* — do 3-5 sales per Saturday, care about route efficiency and payment methods
> • *Collectors* — search for specific categories (mid-century, tools, jewelry), want to evaluate before driving
> • *Casual shoppers* — browse for weekend plans, looking for interesting sales nearby
>
> The key difference from ESN's audience: our users are optimizing the *in-person shopping experience*, not browsing online listings. They've already decided to go — they need help deciding *where* and *whether it's worth the drive*. This is the gap ESN doesn't currently serve.

### 3. Geographic Coverage

> _Where are you seeing the most density? When I search Chicago there are no results._

**NOTE: Chicago grid point has been enabled in the scraper as of the latest commit. Illinois sales should now be populating.**

**Draft language:**
> When you checked, our scraper hadn't yet included the Chicago/Illinois grid point — that's now been added and Illinois sales are populating daily. Our scraper covers [X] states with ~40 anchor points on a 250-mile radius grid. Current density is highest in [Colorado/Denver metro — update with actual data]. We can expand coverage to any region on demand — the infrastructure is national, activation is just adding grid coordinates.

### 4. Traffic Flow

> _How users are interacting with listings and what proportion click through to source listings?_

**Data Rob needs to pull:**
- Any click-through tracking to estatesales.net URLs
- If not tracked yet, this is a gap to acknowledge honestly

**Draft language (if tracking exists):**
> [X]% of users who view a sale detail page tap through to the source listing on EstateSales.NET. Our app functions as a discovery layer — users find sales through our proximity search and map view, then follow through to ESN for the full listing. We're adding traffic, not redirecting it.

**Draft language (if no tracking yet):**
> We don't currently track click-through to ESN source listings — which is actually one reason a formal partnership appeals to us. With an approved integration, we could implement proper UTM attribution so you'd have verifiable traffic data from day one. In the pilot, we'd propose instrumenting this as a primary KPI.

### 5. Attribution

> _How would you propose tracking and reporting traffic back to ESN?_

**Draft language:**
> We'd propose a straightforward attribution model:
> • UTM-tagged links on all ESN-bound taps from our app (`utm_source=estatesalehelper&utm_medium=app&utm_campaign=pilot`)
> • Monthly report delivered to your team: impressions (sale views in our app), click-throughs (taps to ESN), and unique users driven
> • Optional: pixel or callback URL on ESN listing pages to confirm landed traffic
>
> We're open to whatever measurement framework ATG prefers. The goal is full transparency — if the traffic isn't incremental, we'd want to know that too.

### 6. Data Source

> _How listings are currently being sourced and maintained?_

**Be honest but strategic here. Rob already disclosed scraping in his first email.**

**Draft language:**
> Listings are currently sourced via daily automated collection from publicly available EstateSales.NET pages. Our scraper runs once daily, pulling active sales within our grid coverage area. This is precisely why we reached out — we'd prefer an approved data feed over scraping. An API or data partnership would give us fresher data, reduce load on your servers, and give ATG control over what's surfaced and how it's attributed.

---

## Proposed Pilot Structure

Include this to give Marika something concrete to react to:

> **Proposed pilot: One metro, one quarter, full attribution.**
>
> • *Region:* Denver metro (our strongest market) or Chicago (your home base — your call)
> • *Duration:* 90 days
> • *What we provide:* Buyer-side engagement data (searches, saves, ratings, route plans), full UTM attribution on traffic to ESN
> • *What ATG provides:* Approved data feed for the pilot region (replacing scraping), listing attribution guidelines
> • *Success metric:* Incremental traffic to ESN listings from ESH users, measured via UTM tracking
> • *Cost to ATG:* Near-zero. We maintain the app, you provide a data feed. If the numbers don't justify continuing, we part ways cleanly.

---

## Key Differentiator to Emphasize

The data ESH generates that ATG does NOT have:

1. **Geofenced ratings / heat map** — real-time buyer signals on sale quality (submitted only by verified attendees within 0.5mi). No estate sale platform has this.
2. **Route planning data** — which sales buyers group together, how they plan Saturday trips. This reveals demand patterns invisible to ESN.
3. **Buyer-side engagement** — how long users browse a listing, what they save vs. skip, what categories they search for. ESN has seller-side data; ESH has buyer intent data.

Frame: "We're not re-surfacing your inventory in a different interface. We're generating a new data layer — buyer behavior at the sale itself — that doesn't exist anywhere in your ecosystem."

---

## Tone Notes

- Professional but not corporate — Marika's email was direct and specific, match that energy
- Don't oversell early numbers — she'll respect honesty about being early-stage
- Emphasize alignment: ESN as source of truth, ESH as complementary buyer layer
- Make the pilot easy to say yes to — low commitment, measurable, time-bounded

---

## Action Required from Rob

1. Pull real numbers from App Store Connect and Supabase to fill `[PLACEHOLDER]` fields
2. Review tone and positioning — adjust anything that doesn't sound like Rob
3. Send to Marika — email is the right channel, she engaged there
4. Timeline: ideally within 48 hours of this draft (by April 15) to maintain momentum
