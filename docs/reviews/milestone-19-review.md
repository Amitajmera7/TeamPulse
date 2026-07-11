# Review Checklist

- [ ] `/analytics/history` page
- [ ] `GET /api/analytics/history`
- [ ] Charts reuse existing TrendChart components
- [ ] Filters: Time Range / Technology / Developer (extensible)
- [ ] Uses Analytics Read layer — no formula recalculation
- [ ] No EAW schema / Developer Profile Engine / Executive Dashboard redesign changes
- [ ] Build Passes

# 1 Objective

Sprint **7C – Historical Engineering Analytics** (Milestone 19).

Create a Historical Engineering Analytics experience that projects **already-computed** snapshot metrics into chart-ready trends — **without modifying analytics formulas, EAW schema, Developer Profile Engine, or redesigning the Executive Dashboard**.

# 2 Architecture

```
publishAnalyticsSnapshot(snapshot)
  → setLatestCompletedSnapshot
  → pushSnapshotHistoryEntry(buildSnapshotHistoryEntry(snapshot))
       // copies precomputed profile/dashboard values only

GET /api/analytics/history?months=&technology=&developer=
  → getAnalyticsHistoryReadModel(filters)
       → seed from latest snapshot if archive empty
       → buildAnalyticsHistoryReadModel()
            → TrendChartData series (no engines)

/analytics/history
  → AnalyticsHistoryView
       → DeliveryTrendCard / ProductivityTrendCard (existing)
```

# 3 History Flow

1. Successful sync publishes Analytics Snapshot (unchanged engines).
2. Publish step archives a **slim projection** (score, hours, recovery, capacity component, efficiency, per-tech / per-dev slices).
3. History API reads the archive, applies filters, maps to `TrendChartData`.
4. Until multiple reporting periods accumulate, series are sparse (`completeness: empty | single-point | partial`).

# 4 API Contract

### `GET /api/analytics/history`

| Query | Values | Default |
|-------|--------|---------|
| `months` | `3` \| `6` \| `12` | `6` |
| `technology` | technology name | all |
| `developer` | developer name | all |
| *(any other)* | stored in `filters.extras` | — |

**200**

```json
{
  "success": true,
  "filters": { "months": 6, "technology": null, "developer": null },
  "engineeringScoreTrend": { "title": "…", "description": "…", "dropdown": "…", "data": [{ "month": "Jul", "value": 82 }] },
  "technologyHealthTrends": [{ "title": "Magento Health", "data": [] }],
  "engineeringValueDeliveredTrend": { "/* TrendChartData */": true },
  "recoveryHoursTrend": { "/* TrendChartData */": true },
  "capacityUtilizationTrend": { "/* TrendChartData */": true },
  "deliveryEfficiencyTrend": { "/* TrendChartData */": true },
  "meta": {
    "archiveCount": 1,
    "completeness": "single-point",
    "limitations": ["…"],
    "filterOptions": { "technologies": ["Magento"], "developers": ["…"] }
  }
}
```

# 5 Series Mapping

| Chart | Source (archived, not recalculated) |
|-------|-------------------------------------|
| Engineering Score Trend | Team / filtered Engineering Score |
| Technology Health Trends | `TechnologyProfile.engineeringHealth` per tech |
| Engineering Value Delivered Trend | Delivered Engineering Hours |
| Recovery Hours Trend | Recovery Hours |
| Capacity Utilization Trend | Stored contribution/capacity score component |
| Delivery Efficiency Trend | Stored execution efficiency |

# 6 Components

| Component | Role |
|-----------|------|
| `AnalyticsHistoryView` | Filters + chart layout |
| `DeliveryTrendCard` / `ProductivityTrendCard` | Existing TeamPulse charts |
| Analytics hub (`/analytics`) | Link into Historical Analytics |

# 7 Files Created

| File | Purpose |
|------|---------|
| `src/services/analytics-read/history/types.ts` | Archive entry types |
| `src/services/analytics-read/history/snapshot-history-store.ts` | In-memory archive |
| `src/services/analytics-read/history/build-snapshot-history-entry.ts` | Slim projection at publish |
| `src/services/analytics-read/history/history-read-model.ts` | Read model types |
| `src/services/analytics-read/history/build-history-read-model.ts` | Filter + TrendChartData assembly |
| `src/services/analytics-read/history/history-read-service.ts` | `getAnalyticsHistoryReadModel` |
| `src/services/analytics-read/history/index.ts` | Sub-module exports |
| `src/app/api/analytics/history/route.ts` | History API |
| `src/app/(dashboard)/analytics/history/page.tsx` | History page |
| `src/components/analytics/analytics-history-view.tsx` | Client UI |
| `docs/reviews/milestone-19-review.md` | This review package |

# 8 Files Modified

| File | Change |
|------|--------|
| `src/services/orchestrator/publish-snapshot.ts` | Archive slim history on publish |
| `src/services/analytics-read/index.ts` | Export history read APIs |
| `src/app/(dashboard)/analytics/page.tsx` | Link to Historical Analytics |
| `src/components/common/layout/breadcrumb.tsx` | Path-aware `history` label |
| `docs/reviews/README.md` | Link milestone-19 |
| `docs/Glossary.md` | Historical Engineering Analytics term |

# 9 Backward Compatibility

| Concern | Status |
|---------|--------|
| Analytics formulas | Unchanged |
| EAW schema | Unchanged |
| Developer Profile Engine | Unchanged |
| Executive Dashboard UI | Unchanged |
| `GET /api/dashboard` | Unchanged |
| Snapshot publish contract | Extended (archive side-effect only) |

# 10 Screenshots

Screenshots not captured in this agent session. Manual capture after `npm run dev` + at least one sync:

1. `/analytics/history` — filters + empty/sparse charts
2. After sync — single-point trends
3. Technology / Developer filter applied
4. 3 / 6 / 12 month range toggle

# 11 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 5.7s
  Running TypeScript ...
  Finished TypeScript in 5.5s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/18) ...
  Generating static pages using 7 workers (4/18) 
  Generating static pages using 7 workers (8/18) 
  Generating static pages using 7 workers (13/18) 
✓ Generating static pages using 7 workers (18/18) in 480ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /ai
├ ○ /analytics
├ ƒ /analytics/history
├ ƒ /api/analytics/history
├ ƒ /api/contribution
├ ƒ /api/dashboard
├ ƒ /api/leaderboard
├ ƒ /api/metrics
├ ƒ /api/operations
├ ƒ /api/operations/history
├ ƒ /api/operations/history/[batchId]
├ ƒ /api/sync
├ ƒ /dashboard
├ ○ /developers
├ ○ /leaderboard
├ ƒ /operations
├ ƒ /operations/history
├ ƒ /operations/history/[batchId]
├ ○ /settings
└ ○ /teams


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

Exit code: 0
```

# 12 Self Review

**Rating: 9 / 10**

## Strengths

- Analytics Read layer extended cleanly; charts reuse existing TeamPulse components  
- No formula/engine/schema/dashboard redesign changes  
- Filters extensible via `extras` + known query keys  
- Honest completeness / limitations metadata  

## Known limitations

- Archive is process-local (lost on restart; seeded from latest snapshot when empty)  
- True multi-month trends require syncs across reporting periods (forward accumulation)  
- Capacity Utilization series uses stored contribution/capacity score components (utilization engine not implemented)  

## Next

Durable snapshot-history persistence (outside EAW facts); optional month-keyed warehouse fact overlays labeled separately from scored metrics.

---

Waiting for architecture review.
