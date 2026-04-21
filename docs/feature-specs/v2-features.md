
2026-04-21

Status: #baby

Tags: [[estate-sale-helper]] [[app-development]] [[product-spec]]

# Estate Sale Helper — Next Version Feature Spec

Written by CEO Agent, 2026-04-21. This spec defines the three features that must ship before Reddit outreach (Variants B & C) resumes. All three are referenced in the current blocker in reps.yaml.

See: [[Estate Sale Helper]], [[Estate Sale Helper - Route Planning]]

---

## Why This Matters

Reddit outreach (Variants B and C targeting r/flipping and r/ThriftStoreHauls) is on hold until the next app version ships. These three features are the gate. Once they land, the marketing push is ready — all posts are written and waiting.

---

## Feature 1: Route Builder (from Saved screen)

### User story

"I've saved 5 sales for Saturday. I want to build an optimized route so I hit them in the right order and don't waste drive time."

### Current state

`saved.tsx` renders a `FlatList` of saved sales with full address and timing data already loaded from Supabase. There is no route action available.

### Implementation

**Option A — Native Maps launch (simplest, ship fastest)**

Add a "Build Route" button to the Saved screen header. When tapped, collect all active/upcoming saved sales with coordinates, sort them by proximity to the user's current location (already available via `useLocation`), then construct an Apple Maps URL and open it:

```typescript
// Construct multi-stop Apple Maps URL
const stops = sortedSales.map(s => `${s.latitude},${s.longitude}`).join('/');
const url = `maps://?daddr=${stops}`;
Linking.openURL(url);
```

Android equivalent: `geo:0,0?q=...` or Google Maps `https://www.google.com/maps/dir/?api=1&...`

This requires zero new dependencies and ships in a single session of work.

**Option B — In-app route map (more polished, more effort)**

Render a `react-native-maps` view with polyline drawing + numbered markers showing the planned route order. Requires a routing API (Google Directions or OSRM). Significantly more effort than Option A.

**Recommendation:** Ship Option A first. It solves the user problem immediately, requires no new APIs or dependencies, and can be replaced with Option B in a later release.

### Files to modify

- `app/(tabs)/saved.tsx` — add "Build Route" header button
- `hooks/useLocation.ts` — already exists, use current position as start point

### Edge cases

- No saved sales → hide button
- All saved sales are ended → warn user but still allow route
- User hasn't granted location → fall back to sorting by first saved

---

## Feature 2: Priority Access / Early Notifications

### User story

"Sales usually start Thursday 8AM. Dealers get there first and take everything good. I want to know the moment a new sale drops in my area so I can get there before the resellers."

This was the #1 pain point from the r/estatesales community research (April 2026).

### Current state

No push notification system exists. The scraper runs daily and populates Supabase. The app has no mechanism to alert users when new sales appear in their saved search areas.

### Implementation

**Required infrastructure:**

1. **Push notification token registration** — on app launch, request notification permission and register Expo push token with Supabase (store in a `user_tokens` table keyed by device ID).

2. **Scraper webhook / notification trigger** — after each scraper run, compare new sales against user search preferences. For any user with a saved search area that overlaps a new sale, send an Expo push notification.

**Scraper side (Python):**
```python
# After inserting new sales, call notification endpoint
new_sale_ids = [s['id'] for s in newly_inserted]
requests.post(NOTIFICATION_ENDPOINT, json={'new_sale_ids': new_sale_ids})
```

**App side — token registration:**
```typescript
// On app load
const { status } = await Notifications.requestPermissionsAsync();
if (status === 'granted') {
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await supabase.from('user_tokens').upsert({ device_id: deviceId, token });
}
```

**Notification trigger (Edge Function or serverless):**
- Query `user_tokens` table for devices with saved search areas near new sales
- Use Expo Push API to send notifications

### Scope consideration

This is the most complex feature of the three. If shipping speed matters, consider a lighter v1: a "New Sales Alert" email digest (daily or twice-daily) built entirely in the scraper, using a simple email list signup on the website. No app changes required. Upgrade to push notifications in v1.1.

---

## Feature 3: Updated Rating System

### Current state

The app already has a rating/review infrastructure (`ReviewBottomSheet.tsx`, `ReviewAggregateCard.tsx`, `communityApi.ts`, `geofenceTracker.ts`). The geofence triggers a rating prompt when the user is within 0.5 miles of a sale they attended.

### What "updated" means (from the April 13 vault entry)

Three specific UX changes were called out:

**3a. Larger at-sale notification**
The geofence proximity notification is too small / easy to miss. Increase the notification size, add a persistent banner or badge on the app icon when at a sale, and make the "You're at a sale!" prompt more prominent (modal vs. banner).

**3b. Post-visit rating prompt persistence**
Currently, if you close the app after attending a sale, you lose the rating prompt. Fix: store attended-but-not-yet-rated sales in local AsyncStorage. On next app open, check for unreviewed attended sales and surface the rating prompt again. Remove from list once rated.

```typescript
// In geofenceTracker.ts — add pending review queue
await AsyncStorage.setItem('pendingReviews', JSON.stringify([...pending, saleId]));

// In _layout.tsx — on app focus
const pending = await AsyncStorage.getItem('pendingReviews');
if (pending) { /* surface rating modal */ }
```

**3c. Already-rated visual indicator**
After rating a sale, mark it visually in the Saved list and on the map (gray card, checkmark badge). This prevents the "should I rate this again?" confusion and provides a sense of completion.

Implementation: `hasReviewed()` already exists in `geofenceTracker.ts`. Apply it in `saved.tsx` and `SaleCard.tsx` to conditionally render a "Rated ✓" badge.

---

## Recommended Ship Order

1. **Route Builder (Option A)** — 1-2 hours, zero dependencies, immediately unblocks the marketing push
2. **Updated Rating System (3b + 3c)** — 2-3 hours, already has the infrastructure, just AsyncStorage + UI changes
3. **At-sale notification size (3a)** — 1 hour, UI-only change
4. **Priority Notifications** — ship as email digest v1 first (scraper change only), upgrade to push in v1.1

Once 1 is shipped and 2/3 are in progress: resume Reddit outreach (Variants B and C are ready to post). Don't wait for all three to be perfect — Route Builder alone is enough to unlock the marketing.
