# Review Checklist

- [ ] `/explorer` with Overview / Developers / Technologies / Projects / Search tabs
- [ ] Developer + Technology detail pages
- [ ] Projects table + detail (EAW facts)
- [ ] Search architecture (Developer / Technology / Project / Issue Key)
- [ ] Explorer APIs
- [ ] Uses Analytics Read layer — no formula recalculation
- [ ] No EAW schema / profile engine / Executive Dashboard redesign changes
- [ ] Build Passes

# 1 Objective

Sprint **7D – Engineering Explorer** (Milestone 20).

Create an Engineering Explorer to drill into Developers, Technologies, and Projects, plus global search — using **existing analytics outputs** via the Analytics Read layer. **No formula recalculation, no EAW schema changes, no profile engine changes, no Executive Dashboard redesign.**

# 2 Architecture

```
GET /api/explorer
  → getExplorerReadModel()
       → getLatestCompletedSnapshot()     // developers + technologies
       → loadExplorerProjects()           // EAW latest batch facts (optional)
       → searchIndex (client filter)

GET /api/explorer/developers/{id}
  → map DeveloperProfile (snapshot)

GET /api/explorer/technologies/{id}
  → map TechnologyProfile + filtered developers

GET /api/explorer/projects/{id}
  → EAW EngineeringIssue + allocation hours by projectKey
```

# 3 Explorer Flow

1. Sync publishes Analytics Snapshot (unchanged engines).
2. Explorer reads snapshot profiles for Developers / Technologies / Overview scores.
3. Projects tab rolls up latest warehouse batch by `projectKey` (facts only — score null).
4. Search tab filters `searchIndex` client-side (architecture for Developer / Technology / Project / Issue Key).
5. Row/card click → detail pages under `/explorer/...`.

# 4 API Contract

### `GET /api/explorer`

Returns `ExplorerReadModel`: `overview`, `developers`, `technologies`, `projects`, `searchIndex`, `meta`.

### `GET /api/explorer/developers/{id}`

**200** developer detail · **404** not found

### `GET /api/explorer/technologies/{id}`

**200** technology detail + developers · **404** not found

### `GET /api/explorer/projects/{id}`

**200** project facts + issue rows · **404** not found

# 5 Components

| Component | Role |
|-----------|------|
| `ExplorerCenter` | Tabs shell |
| `ExplorerOverviewCards` | MetricCards summary |
| `ExplorerDevelopersTable` | Developers table → detail |
| `ExplorerTechnologyCards` | Technology cards → detail |
| `ExplorerProjectsTable` | Projects table → detail |
| `ExplorerSearchPanel` | Global search UI |
| `DeveloperDetailView` / `TechnologyDetailView` / `ProjectDetailView` | Detail pages |

# 6 Files Created

| Area | Paths |
|------|-------|
| Read layer | `src/services/analytics-read/explorer/*` |
| APIs | `src/app/api/explorer/**` |
| Pages | `src/app/(dashboard)/explorer/**` |
| UI | `src/components/explorer/*` |
| Review | `docs/reviews/milestone-20-review.md` |

# 7 Files Modified

| File | Change |
|------|--------|
| `src/services/analytics-read/index.ts` | Export explorer APIs |
| `src/config/navigation.ts` | Explorer nav item + labels |
| `docs/reviews/README.md` | Link milestone-20 |
| `docs/Glossary.md` | Engineering Explorer term |

# 8 Backward Compatibility

| Concern | Status |
|---------|--------|
| Analytics formulas | Unchanged |
| EAW schema | Unchanged |
| Developer / Technology Profile Engines | Unchanged |
| Executive Dashboard | Unchanged |
| Existing `/developers` / `/teams` stubs | Unchanged |

# 9 Screenshots

Screenshots not captured in this agent session. Manual capture after sync:

1. `/explorer` Overview cards
2. Developers table + detail
3. Technology cards + detail
4. Projects table (warehouse) + Search results

# 10 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 8.3s
  Running TypeScript ...
  Finished TypeScript in 9.9s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/19) ...
  Generating static pages using 7 workers (4/19) 
  Generating static pages using 7 workers (9/19) 
  Generating static pages using 7 workers (14/19) 
✓ Generating static pages using 7 workers (19/19) in 383ms
  Finalizing page optimization ...

Route (app)
…
├ ƒ /api/explorer
├ ƒ /api/explorer/developers/[id]
├ ƒ /api/explorer/projects/[id]
├ ƒ /api/explorer/technologies/[id]
├ ƒ /explorer
├ ƒ /explorer/developers/[id]
├ ƒ /explorer/projects/[id]
├ ƒ /explorer/technologies/[id]
…

Exit code: 0
```

# 11 Self Review

**Rating: 9 / 10**

## Strengths

- Snapshot-backed developer/technology drill-down without formula recalculation  
- Reuses MetricCard, Table, Sparkline, StatusBadge patterns  
- Search index supports Developer / Technology / Project / Issue Key  
- Honest project score null + limitations  

## Known limitations

- Project Engineering Score / Trend not available (no Project Profile engine)  
- Projects require warehouse; otherwise empty  
- Search is client-side over API index (architecture only — not full-text server search)  

## Next

Optional Project Profile projection at publish time; wire global navbar SearchBar to explorer index.

---

Waiting for architecture review.
