# Review Checklist

- [ ] Verification philosophy
- [ ] Verification rules (Jira / EAW / Analytics / Dashboard)
- [ ] Report format
- [ ] No runtime / formula / UI / schema changes
- [ ] Build Passes

# 1 Objective

Sprint **6A – Runtime Verification & Data Reconciliation** (Milestone 15).

Verify TeamPulse produces consistent engineering counts across Jira → EAW → Analytics → Dashboard using the real BannerBuzz dataset path.

**Verification and reporting only** — no analytics formula, dashboard UI, PostgreSQL schema, repository interface, or runtime behavior changes.

# 2 Verification Rules

| Layer | Rules |
|-------|--------|
| **Jira** | Count issues, all worklogs, eligible worklogs (eligible authors, hours &gt; 0), developers, technologies, engineering hours |
| **EAW** | Same counts on `EngineeringWarehouseModel`; issues vs Jira issues; worklogs/hours vs **eligible** Jira; batch `issuesProcessed` / `worklogsProcessed` match entity lengths |
| **Analytics** | Developer totals vs EAW developers; technology totals vs `TECHNOLOGY_NAMES.length`; Engineering Score input coverage |
| **Dashboard** | Rebuild via `buildDashboardData`; Engineering Score, Top Contributors, Technologies, reporting period must match |

Entry: `runRuntimeVerification(input)` → `VerificationReport`.

# 3 Sample Verification Report

```text
Verification Report

PASS

Jira

2478 Issues

7454 Worklogs

EAW

2478 Issues ✓

7454 Worklogs ✓

Analytics

Developer Totals ✓

Technology Totals ✓

Dashboard

Engineering Score ✓

Top Contributors ✓

Overall

PASS
```

(Illustrative numbers; live BannerBuzz runs fill actual counts. EAW worklog line compares to **eligible** Jira worklogs when totals differ from raw Jira worklogs.)

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/runtime-verification/types.ts` | Report / check types |
| `src/services/runtime-verification/verify-jira-counts.ts` | Jira layer |
| `src/services/runtime-verification/verify-eaw-counts.ts` | EAW layer |
| `src/services/runtime-verification/verify-analytics-counts.ts` | Analytics layer |
| `src/services/runtime-verification/verify-dashboard-counts.ts` | Dashboard layer |
| `src/services/runtime-verification/build-verification-report.ts` | Summary formatter |
| `src/services/runtime-verification/run-runtime-verification.ts` | Orchestrates layers |
| `src/services/runtime-verification/index.ts` | Public exports |
| `docs/Runtime-Verification.md` | Documentation |
| `docs/reviews/milestone-15-review.md` | This review package |

# 5 Files Modified

| File | Change |
|------|--------|
| `docs/reviews/README.md` | Link Runtime-Verification + milestone-15 |
| `docs/Glossary.md` | Runtime Verification term |

# 6 Files Explicitly Not Modified

- Analytics formulas / engines  
- Dashboard UI  
- PostgreSQL schema  
- Repository interfaces  
- Orchestrator runtime path (`runAnalyticsSync` not wired to verification)

# 7 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 5.6s
  Running TypeScript ...
  Finished TypeScript in 6.6s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/15) ...
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
  Generating static pages using 7 workers (3/15) 
  Generating static pages using 7 workers (7/15) 
  Generating static pages using 7 workers (11/15) 
✓ Generating static pages using 7 workers (15/15) in 499ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /ai
├ ○ /analytics
├ ƒ /api/contribution
├ ƒ /api/leaderboard
├ ƒ /api/metrics
├ ƒ /api/sync
├ ○ /dashboard
├ ○ /developers
├ ○ /leaderboard
├ ○ /settings
└ ○ /teams


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

Exit code: 0
```

# 8 Self Review

**Rating: 8.5 / 10**

## Strengths

- Clear four-layer reconciliation without touching runtime  
- Eligible vs raw Jira worklog distinction documented  
- Dashboard checked via existing aggregator rebuild  

## Known limitations

- Not auto-invoked after sync (intentional — no runtime change)  
- Nested Jira subtask worklogs may be under-counted in the Jira baseline if only parent `fields.worklog` is present (same constraint as fetch payload)  
- Engineering Score “inputs” check is coverage, not formula recompute  
- Sample report numbers are illustrative until run against a live sync fixture  

## Next

Optional ops hook / script to call `runRuntimeVerification` after sync and archive reports.

---

Waiting for architecture review.
