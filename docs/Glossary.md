# TeamPulse Glossary

Version: 1.0

Status: Active

Owner: TeamPulse

---

# Purpose

This glossary defines the official terminology used throughout TeamPulse.

All documentation, code, dashboards, AI Insights, APIs, and reports should use these terms consistently.

---

# A

## Allocated Estimate

The portion of an engineering estimate assigned to an individual developer based on proportional worklog contribution.

Example

Original Estimate

40 Hours

Developer A Worklogs

30 Hours

Developer B Worklogs

10 Hours

Allocated Estimate

Developer A

30 Hours

Developer B

10 Hours

Allocated Estimate is the foundation for:

• Execution Efficiency

• Business Contribution

---

## Analytics Snapshot

Immutable record of one completed analytics calculation.

Contains version (`"1.0"`), developer profiles, technology profiles, dashboard data, reporting period, and sync metadata.

The dashboard always consumes the latest completed snapshot and never calculates analytics directly.

Every sync creates a brand-new snapshot. Existing snapshots are never mutated.

---

## Dashboard Aggregator V2

Transforms an Analytics Snapshot into DashboardData for React consumption.

Calculates presentation KPIs, contributor ranking, technology card mapping, and a four-item rule-based Executive Brief. Does not recalculate analytics engines.

---

## Dashboard Repository

Sole UI entry point for DashboardData.

Reads the latest completed Analytics Snapshot and returns its `dashboardData` projection. Returns an empty DashboardData when no snapshot exists. Never throws. Abstracts the data provider from React.

The Dashboard Repository currently uses Analytics Snapshot.
Mock data remains available for development, testing and demos.

---

## Analytics Orchestrator

Owns the end-to-end sync pipeline from Jira fetch through Analytics Snapshot publication.

API routes remain thin controllers. Failed syncs never replace the previous completed snapshot, so the dashboard never sees partial analytics.

---

# B

## Business Contribution

Measures planned engineering value delivered by an individual developer.

Business Contribution is calculated using:

Allocated Estimate

It does NOT use:

• Actual Worklog Hours

• QA Bugs

• UAT Bugs

---

# C

## Completed Work

Engineering work whose Jira workflow status is one of:

- Merge in UAT
- Ready for UAT
- Ready for Live
- Live
- Done

Only completed work contributes to:

• Execution Efficiency

• Business Contribution

---

# D

## Data Quality

Measures the reliability of engineering analytics.

Examples

• Missing Estimates

• Missing Worklogs

• Missing Technology Mapping

• Configuration Issues

Data Quality never reduces Engineering Score.

---

## Delivered Engineering Hours

The sum of allocated engineering estimates delivered by a developer during the reporting period.

Used by:

Business Contribution

---

## Developer Evaluation

Aggregation of all implemented task-evaluation engine results for one developer in one reporting period.

Contains intact results for:

• Execution Efficiency

• Delivery Quality

• Recovery

• Business Contribution

Engine outputs are never flattened. Recovery remains visible and does not affect Engineering Score.

---

## Developer Profile

Canonical developer object used throughout TeamPulse.

Wraps Developer Evaluation with:

• Engineering Score (full precision)

• Status (Healthy / Good / Needs Attention / Critical / No Data)

• Dense Rank (optional peer ranking)

Developers with no completed work still appear with status "No Data".

Recovery remains visible on the evaluation and does not affect Engineering Score.

---

## Dense Ranking

Ranking method where equal scores share the same rank and the next distinct score receives the next consecutive integer (no gaps).

Example

95, 95, 92 → ranks 1, 1, 2

---

# E

## Engineering Analytics Warehouse (EAW)

The long-term analytics system of record for TeamPulse. Stores engineering facts (sync batches, issues, allocations, worklogs) for one year of history. Never stores derived metrics such as Engineering Score or Technology Health. Jira remains the operational system of record.

See: `docs/Engineering-Analytics-Warehouse.md`

## Engineering Score

Overall engineering performance score for a developer in a reporting period.

Calculated from implemented KPIs only, with dynamically normalized weights.

Current implemented KPIs

• Execution Efficiency (raw weight 25)

• Delivery Quality (raw weight 25)

• Business Contribution (raw weight 20)

Missing KPIs are ignored — never treated as zero.

Contribution Score uses Delivered Engineering Hours normalized against Expected Engineering Capacity Hours (160).

Future KPIs (ignored until implemented)

• Compliance

• Utilization

• AI Insights

Recovery does not affect Engineering Score.

---

## Execution Efficiency

Measures how closely engineering work was completed compared to planned estimates.

Uses:

Allocated Estimate

vs

Actual Worklog Hours

Does not measure Quality.

---

## Technology Profile

Aggregated engineering profile for a technology discipline (Magento, React JS, HTML, DT).

Derived from Developer Profiles.

Technology Health, Execution, and Quality use weighted averages where weight is Engineering Value Delivered (Delivered Engineering Hours).

Developer count comes from Team Mapping (source of truth), not from the aggregated profile set.

Status bands: Healthy, Stable, Monitor, Critical, No Data (when engineering health is null).

Includes Recovery Hours and Recovery Percentage for visibility. Recovery does not affect Technology Health.

---

## Technology Health

Weighted Engineering Score across developers in a technology.

Weight = Delivered Engineering Hours.

Developers who deliver more engineering value influence technology health proportionally.

---

# O

## Original Estimate

The Jira engineering estimate assigned to standard engineering work.

Used by:

Magento

React JS

HTML

DT

---

# P

## Planned Engineering Value

Engineering value defined by resolved estimates before execution begins.

Measured using:

Allocated Estimate

Not actual effort.

---

# Q

## QA Bug

A defect identified during QA testing.

QA Bugs reduce Delivery Quality.

QA Bugs contribute to Recovery Hours.

---

## Quality Score

Measures engineering stability.

Quality starts at

100

QA Bug

↓

−5

UAT Bug

↓

−8

Minimum

20

---

# R

## Recovery

Engineering effort spent fixing QA and UAT defects.

Recovery is informational.

It does NOT reduce Engineering Score.

---

## Recovery Hours

Actual worklog hours spent resolving QA/UAT Bugs.

Measured individually.

---

## Recovery Percentage

Percentage of total recovery work performed by an individual developer.

Formula

Developer Recovery Hours

/

Total Recovery Hours

×

100

---

## Reporting Period

The time window used for TeamPulse calculations.

Current Version

Monthly

Future versions may support:

Weekly

Sprint

Quarterly

---

# T

## Technology Estimate

Technology-specific estimate used for CR and RE work.

Examples

Magento Estimate

React Estimate

HTML Estimate

DT Estimate

Only developers mapped to that technology participate in allocation.

---

# U

## UAT Bug

A defect identified during User Acceptance Testing.

UAT Bugs reduce Quality more than QA Bugs.

Penalty

8

---

# W

## Worklog

Engineering effort recorded in Jira.

Worklogs determine:

• Estimate Allocation

• Recovery Hours

• Recovery Percentage

Worklogs do NOT directly determine Business Contribution.

---

# Design Principles

Every TeamPulse term should be:

• Consistent

• Explainable

• Business-friendly

• Independent

• Versionable

---

# Versioning

When a definition changes:

1.

Update this glossary.

2.

Update Engineering-Metrics-Specification.md

3.

Update implementation.

Documentation is always the source of truth.