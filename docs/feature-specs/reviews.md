2026-04-09

Status: #child

Tags: [[estate-sale-helper]] [[app-development]] [[feature-spec]]

# Estate Sale Helper — Live Feedback & Reviews Feature Spec

See: [[Estate Sale Helper]]

---

## Feature 1: Live Sale Feedback ("Worth the Drive" Signal)

### Overview
A single-tap community signal — Worth It or Skip It — that aggregates into a heat score shown on the map and sale detail page. Helps buyers decide before driving. No text input required.

---

### User Flow
1. User opens a sale detail page
2. If within 0.5mi of the sale (or checked in within 3hrs), a bottom banner appears: "Are you here? Tell others if it's worth the drive."
3. Two large tap targets: **Worth It** / **Skip It**
4. User taps — brief confirmation animation, banner dismisses
5. Map pins update color: gray (neutral/few signals) → orange (warm) → red/fire (hot) → blue (mostly skip it)
6. Signal can be changed once within 30 min, then locked for the day

---

### UI Components
- **Signal Banner** — Sticky bottom sheet on sale detail page, conditional on geofence. Two large tap targets (min 44x44pt). Dismisses on tap or swipe down.
- **Confirmation Micro-animation** — Brief icon pulse/color flash. No modal interrupt.
- **Map Pin Heat Indicator** — Color-coded badge overlaid on existing pin. Flame or snowflake icon at high signal counts.
- **Sale Detail Signal Summary** — Below sale header: "[N] people say it's worth the drive" or "[N] say skip it." Tap to see raw counts (no user identity exposed).
- **Signal Lock State** — If user already signaled, banner shows current signal with muted "Change" link (available 30 min).

---

### Data / Backend Requirements
- **signals table**: signal_id, sale_id, user_id (hashed), signal_type (enum: worth_it | skip_it), submitted_at, device_lat, device_lng
- **sale_scores table**: sale_id, worth_it_count, skip_it_count, heat_score, last_updated
- **Heat score formula**: worth_it / (worth_it + skip_it), weighted by recency (signals decay after ~4hrs)
- **Geofence validation**: Server-side. Reject if coordinates outside radius.
- **Rate limiting**: One signal per user per sale per day. 30-minute edit window.
- **Sale time bounding**: Signals accepted during operating hours + 1hr after close.
- **Real-time updates**: Map polls every 3–5 min; detail page refreshes on focus.
- **Minimum threshold**: No heat coloring shown until 3+ signals.

---

### Edge Cases
- Hide banner entirely if user is not nearby — no disabled state
- Hide banner if sale hasn't started yet
- Lock signals 1hr after close; aggregate still displays
- Fewer than 3 signals: neutral pin, no count shown
- GPS inaccuracy: 0.5mi radius to account for urban drift
- Offline: queue signal locally, submit when connection restores

---

### Open Questions
1. What geofence radius is right for rural sales where parking is distant?
2. Logged-in required, or anonymous device IDs?
3. Do organizers see signal data for their own sales?
4. Minimum signal count before heat indicator appears — 3?
5. How long to retain historical signal data post-sale?

---

## Feature 2: Real-Time Tap Reviews (No Text Input)

### Overview
A dead-simple check-in review system. Four dimensions, each rated thumbs up or down — no text boxes, no star ratings. Completable in under 10 seconds. Aggregated results display on the sale detail page so buyers can evaluate before driving.

---

### The Four Dimensions

| Dimension | Thumbs Up | Thumbs Down |
|---|---|---|
| Pricing | Fair prices | Overpriced |
| Item Quality | As described | Condition issues |
| Listing Accuracy | Photos match | Doesn't match |
| Availability | Plenty left | Picked over |

---

### User Flow
1. User visits a sale detail page
2. If within geofence (0.5mi) or checked in within 3hrs, a "Leave a Quick Review" button appears
3. User taps — bottom sheet slides up with 4 rows
4. User taps thumbs up or down per row — selected state highlights green (up) / red (down)
5. Submit button activates only when all 4 dimensions are answered
6. User taps Submit — sheet dismisses, toast confirms: "Review submitted — thanks!"
7. "What buyers are saying" section on detail page shows aggregated results
8. Returning user: sheet pre-fills with previous answers, header reads "Update your review"

---

### UI Components
- **Entry Point** — Conditional button/card on detail page, only visible to geofence-eligible users
- **Review Bottom Sheet** — Full-width, ~60–70% screen height. Four rows: dimension label + thumbs up (left) + thumbs down (right). Selected: filled icon + color; Unselected: outline icon, gray.
- **Submit Button** — Disabled until all 4 rows answered. Activates with subtle animation on last tap.
- **Confirmation Toast** — Non-blocking, auto-dismisses after 2 seconds
- **Live Review Summary Section** (detail page): Header "What buyers are saying" + timestamp. Four rows: icon, label, percentage bar, count. Min 5 reviews before showing percentages — otherwise "Not enough reviews yet."
- **Returning User State** — Pre-filled sheet, "Update your review" header

---

### Data / Backend Requirements
- **reviews table**: review_id, sale_id, user_id (hashed), submitted_at, updated_at, device_lat, device_lng, pricing_positive (bool), quality_positive (bool), accuracy_positive (bool), availability_positive (bool)
- **review_aggregates table**: sale_id, per-dimension positive_count and total_count, last_calculated_at
- **Aggregation**: Recalculate on each new/updated submission via background trigger
- **Upsert on submit**: Insert on first submission, update on subsequent — one record per user/sale pair
- **Display threshold**: Hide percentages until 5+ reviews per dimension
- **Real-time updates**: Detail page refreshes aggregate on focus or within 60 seconds
- **Sale time bounding**: Submissions accepted during operating hours + 1hr after close

---

### Edge Cases
- Hide entry point if user is not geofence-eligible — aggregate still publicly visible
- Hide entry point if sale hasn't started
- Lock submissions 1hr after sale ends; aggregate still displays
- Swiping away the sheet discards all selections — no draft saving
- One review per user per sale; one update allowed per day after initial submission
- Accessibility: thumb icons must have accessibilityLabel — color alone is not sufficient for selected state
- Organizer gaming: flag if submitter device matches organizer account

---

### Open Questions
1. Are the four dimensions fixed, or configurable per sale type?
2. Should "Availability" auto-deprecate late in a sale's run?
3. Do organizers get access to their sale's review data?
4. Should Features 1 and 2 be linked in the UI (e.g., after tap review, prompt for heat signal)?
5. Logged-in required, or anonymous device IDs?
