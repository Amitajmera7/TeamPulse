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

Wraps Developer Evaluation with a profile status:

• Healthy

• Good

• Needs Attention

• Critical

• No Data

Developers with no completed work still appear with status "No Data".

Engineering Score is attached in a later milestone (Sprint 3B Milestone 8B).

---

# E

## Engineering Score

Overall engineering performance score.

Calculated from weighted engineering KPIs.

Current components

• Execution Efficiency

• Delivery Quality

• Business Contribution

Future components may include:

• Recovery

• Data Quality Confidence

---

## Execution Efficiency

Measures how closely engineering work was completed compared to planned estimates.

Uses:

Allocated Estimate

vs

Actual Worklog Hours

Does not measure Quality.

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