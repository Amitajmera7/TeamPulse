# TeamPulse Engineering Scoring Engine

> Version: **1.0**
>
> Status: **Draft**
>
> Product: **TeamPulse**
>
> Owner: **Amit Ajmera**
>
> Last Updated: **July 2026**

---

# 1. Purpose

## Objective

The TeamPulse Engineering Scoring Engine defines how engineering performance is measured across developers, technologies and teams.

The purpose of this document is to become the **single source of truth** for every engineering KPI used within TeamPulse.

No engineering score, dashboard metric or AI insight should be implemented without following the business rules defined in this document.

This document is intended for:

- Product Managers
- Engineering Managers
- Developers
- Data Engineers
- AI Agents (Cursor / ChatGPT)
- Future TeamPulse contributors

---

# 2. Product Philosophy

TeamPulse is **not a Jira reporting dashboard.**

TeamPulse is an **Engineering Intelligence Platform**.

Jira stores engineering activity.

TeamPulse interprets engineering activity into business intelligence.

Instead of answering:

> "How many issues were completed?"

TeamPulse answers:

- Are we delivering predictably?
- Which engineering team needs attention?
- Which developers consistently execute well?
- How much engineering effort is spent fixing defects?
- Where should engineering managers take action?

Every metric shown in TeamPulse must answer a management question.

If a metric does not help someone make a decision, it should not exist.

---

# 3. Engineering Principles

The scoring engine follows these principles.

## Principle 1

### Business Rules over Jira Rules

TeamPulse never blindly trusts Jira.

TeamPulse interprets Jira data using business rules.

Example:

Development completion is determined by TeamPulse business configuration rather than Jira's default "Done" status.

---

## Principle 2

### One Source of Truth

Every engineering metric must be calculated from one centralized implementation.

Business rules must never be duplicated.

Configuration must never be hardcoded inside services.

---

## Principle 3

### Explainability

Every score displayed in TeamPulse must be explainable.

Engineering Managers should always understand:

- why a score increased
- why a score decreased
- which data contributed to the result

TeamPulse should never produce "black box" scores.

---

## Principle 4

### Fair Measurement

Developers should never be rewarded simply because they completed more Jira tickets.

Engineering performance is evaluated using engineering effort, execution quality and delivery outcomes.

Story count alone is not considered a productivity metric.

---

## Principle 5

### Configuration First

Organization-specific values should never be hardcoded.

Examples:

- Developer Technology Mapping
- Jira Status Mapping
- Estimate Fields
- Score Weights
- Quality Rules

must always be configurable.

---

## Principle 6

### Task-Level Evaluation

TeamPulse evaluates engineering performance at the completed task level.

Every completed engineering task is evaluated independently before being aggregated into:

- Developer Metrics
- Technology Metrics
- Engineering Score
- Executive Dashboard

This ensures engineering performance remains accurate even when work spans multiple reporting periods.

Incomplete work is intentionally excluded until the task reaches a Development Complete status.

This prevents long-running work from unfairly affecting developer performance.

---

# 4. Core Terminology

## Engineering Score

Overall health of engineering delivery.

Primary KPI shown on the executive dashboard.

---

## Productivity

Measures how efficiently planned engineering work was delivered.

Productivity is **not** based on number of stories.

---

## Execution Efficiency

Measures how closely developers execute against engineering estimates defined by Team Leads.

Estimates are considered organizational commitments rather than developer commitments.

---

## Delivery Quality

Measures engineering quality using QA/UAT outcomes.

Quality starts at 100 and penalties are applied for defects.

---

## Business Contribution

Measures engineering value delivered to the business.

Bug fixing work is excluded.

---

## Recovery Effort

Measures how much engineering capacity is consumed fixing defects instead of building new functionality.

---

## Technology Health

Composite health score for each engineering technology.

Example:

- Magento
- React JS
- HTML
- DT

---

## Executive Brief

Rule-based engineering insights generated from dashboard data.

Maximum of three actionable insights are shown.

The Executive Brief should explain **what management should do**, not simply describe dashboard numbers.

---

# 5. Guiding Principle

TeamPulse measures engineering outcomes.

It does **not** measure:

- employee popularity
- ticket count
- hours worked
- overtime
- attendance

The objective of TeamPulse is to measure engineering effectiveness rather than engineering activity.

# 6. Engineering Data Interpretation

Before calculating any KPI, TeamPulse first interprets Jira data using organization-specific business rules.

Jira is treated as the source of engineering activity.

TeamPulse transforms that activity into standardized engineering intelligence.

Every metric in TeamPulse depends on this interpretation layer.

---

# 6.1 Data Sources

The Engineering Scoring Engine currently consumes the following Jira data.

| Data | Source |
|-------|--------|
| Issue Type | Jira |
| Issue Status | Jira |
| Original Estimate | Jira Timetracking |
| Technology Estimate Fields | Jira Custom Fields |
| Worklogs | Jira |
| Assignee | Jira |
| Parent Story | Jira |
| Created Date | Jira |
| Updated Date | Jira |

Future versions may additionally consume:

- GitHub
- Bitbucket
- SonarQube
- Jenkins
- Slack
- Azure DevOps

---

# 6.2 Work Classification

Every Jira issue belongs to one of three engineering categories.

## Feature Work

Feature work represents planned engineering effort.

Included Issue Types:

- Magento
- React JS
- HTML
- DT
- CR
- RE

Feature Work contributes to:

- Engineering Productivity
- Execution Efficiency
- Business Contribution
- Engineering Score

---

## Recovery Work

Recovery Work represents engineering effort spent fixing previously delivered functionality.

Included Issue Types:

- QA Bug
- UAT Bug

Recovery Work contributes to:

- Delivery Quality
- Recovery Effort
- Technology Health
- Executive Brief

Recovery Work does NOT contribute to:

- Productivity
- Contribution
- Execution Efficiency

Reason:

Bug fixing restores value rather than creating new business value.

---

## QA Operational Work

Included Issue Types:

- QA Task

QA Tasks are informational only in Version 1.

They do not contribute to developer performance metrics.

Future releases may introduce a dedicated QA Performance Dashboard.

---

# 6.3 Development Complete Status

TeamPulse does not rely on Jira's default Done status.

Engineering work is considered completed once development has been handed over for QA or released.

Development Complete statuses:

- Merge in UAT
- Ready for UAT
- Ready for Live
- Live
- Done

Only issues reaching one of the above statuses are considered completed engineering work.

These issues are eligible for:

- Productivity
- Execution Efficiency
- Business Contribution
- Engineering Score

Open or partially completed work is excluded.

Reason:

Incomplete work does not yet represent delivered engineering value.

---

# 6.4 Developer Technology Mapping

Every developer belongs to exactly one primary technology.

Current technologies:

- Magento
- React JS
- HTML
- DT

Technology mapping is maintained within:

src/config/developers.ts

The mapping is used for:

- Estimate Resolution Engine
- Technology Health
- Team Dashboard
- Leaderboard
- Executive Brief

Future versions may support multi-technology developers.

---

# 6.5 Estimate Resolution Engine

The Estimate Resolution Engine determines which estimate should be used for every completed engineering task.

This process is executed before any productivity calculation.

---

## Standard Feature Work

Issue Types:

- Magento
- React JS
- HTML
- DT

Estimate Source:

Jira Original Estimate

Example

Issue Type:

Magento

Original Estimate:

12 Hours

Result:

Engineering Estimate = 12 Hours

---

## CR / RE Work

CR and RE issues may contain engineering estimates for multiple technologies.

Each developer is evaluated only against the estimate corresponding to their assigned technology.

Technology Mapping

Magento

↓

customfield_10326

React JS

↓

customfield_10327

HTML

↓

customfield_10328

DT

↓

customfield_10329

---

Example

Issue:

CR-245

Magento Estimate:

12 Hours

React Estimate:

8 Hours

HTML Estimate:

3 Hours

Developers

Pratik (Magento)

↓

12 Hours

Akanksha (React JS)

↓

8 Hours

Punit (HTML)

↓

3 Hours

Although all developers worked on the same Jira issue, TeamPulse evaluates each developer using the estimate assigned to their engineering discipline.

This ensures fair engineering evaluation across cross-functional work.

---

# 6.6 Worklog Interpretation

TeamPulse evaluates engineering effort using Jira Worklogs.

Only worklogs recorded on completed Feature Work contribute to:

- Productivity
- Execution Efficiency
- Business Contribution

Bug fixing worklogs contribute only to:

- Delivery Quality
- Recovery Effort
- Technology Health

QA Task worklogs are excluded from developer productivity metrics.

---

# 6.7 Organization Configuration

The Engineering Scoring Engine never hardcodes organization-specific information.

Configuration is maintained centrally.

Configuration Layer

src/config/

Current configuration files:

- technologies.ts
- developers.ts
- estimate-fields.ts
- status-mapping.ts
- issue-types.ts
- score-weights.ts
- quality-rules.ts

Every business rule must reference these configuration files rather than hardcoded values.

---

# 6.8 Engineering Evaluation Pipeline

TeamPulse evaluates engineering performance using the following hierarchy.

Completed Feature Task

↓

Task Evaluation

↓

Developer Metrics

↓

Technology Metrics

↓

Engineering Score

↓

Executive Dashboard

Every completed engineering task becomes the atomic unit of evaluation.

Monthly reporting does not directly calculate engineering performance.

Instead, monthly dashboards aggregate completed task evaluations.

This design ensures long-running engineering work is evaluated fairly regardless of calendar boundaries.

---

# Summary

Before any KPI is calculated, TeamPulse performs the following interpretation pipeline:

Jira Issues

↓

Work Classification

↓

Status Validation

↓

Developer Technology Resolution

↓

Estimate Resolution

↓

Worklog Classification

↓

Engineering Metrics

↓

Executive Dashboard

No KPI should bypass this interpretation layer.

# 7. Engineering Score

## Purpose

Engineering Score is the primary KPI of TeamPulse.

It represents the overall health of engineering delivery for the selected reporting period.

Engineering Score is designed for Engineering Managers, Delivery Managers and Leadership to quickly understand whether engineering execution is improving or declining.

Engineering Score is always displayed on the Executive Dashboard.

---

## Engineering Score Components

Engineering Score is calculated using six independent KPIs.

| KPI | Weight |
|------|--------|
| Delivery Reliability | 25% |
| Engineering Productivity | 25% |
| Delivery Quality | 20% |
| Business Contribution | 15% |
| Resource Utilization | 10% |
| Delivery Risk | 5% |

Total Weight = 100%

The score is calculated using a weighted average.

---

## Score Classification

| Score | Status |
|---------|------------|
| 90 – 100 | Excellent |
| 80 – 89 | Healthy |
| 70 – 79 | Good |
| 60 – 69 | Needs Attention |
| Below 60 | Critical |

---

## Engineering Principles

Engineering Score should never reward:

- High worklog hours
- Large number of completed issues
- Long working hours
- Overtime

Engineering Score rewards:

- Predictable delivery
- Efficient execution
- High quality
- Business value
- Sustainable engineering practices

---

# 8. Delivery Reliability

## Purpose

Delivery Reliability measures how consistently engineering teams deliver planned work.

Unlike traditional Jira dashboards, TeamPulse does not measure only completed issues.

It evaluates how reliably engineering commitments were delivered.

---

## Components

Delivery Reliability evaluates how consistently completed engineering work was executed.

It is derived from:

- Execution Efficiency
- Delivery Quality

Delivery Reliability intentionally ignores unfinished work.

Long-running tasks that span multiple reporting periods are evaluated only after reaching a Development Complete status.

---
## Included Work

Only completed Feature Work contributes.

Included Issue Types:

- Magento
- React JS
- HTML
- DT
- CR
- RE

Bug fixing work is excluded.

---

## Example

Example

Task

Estimate

40 Hours

Actual

38 Hours

QA Bugs

0

↓

Execution Efficiency

Excellent

↓

Delivery Quality

100

↓

Task Evaluation

Excellent

Developer and monthly metrics are calculated by aggregating completed task evaluations rather than comparing monthly planned work against completed work.

---

# 9. Execution Efficiency

## Purpose

Execution Efficiency measures how effectively developers execute work against engineering estimates defined by Team Leads.

Execution Efficiency is NOT an estimate accuracy metric.

It is an execution performance metric.

---

## Engineering Principle

Engineering estimates are created by Team Leads.

Developers are evaluated on how efficiently they execute the assigned engineering work.

---

## Estimate Source

Feature Work

↓

Original Estimate

CR / RE

↓

Technology-specific Estimate Field

resolved using the Engineering Interpretation Engine.

---

## Included Work

Only completed Feature Work.

Open work is excluded.

Bug work is excluded.

QA Tasks are excluded.

---

## Reward Philosophy

Developers are rewarded for completing work slightly below planned effort.

However, rewards are intentionally capped.

Finishing dramatically below estimate is not automatically considered better engineering because it may indicate:

- over-estimation
- scope reduction
- incomplete worklog recording

---

## Suggested Execution Curve

| Estimate Variance | Interpretation |
|------------------|----------------|
| 0–10% below | Excellent |
| 10–20% below | Very Good |
| ±5% | Expected |
| 10–20% above | Needs Improvement |
| >20% above | Critical Overrun |

This curve may evolve in future versions.

---

# 10. Engineering Productivity

## Purpose

Engineering Productivity measures how efficiently engineering effort is converted into completed customer value.

Engineering Productivity is calculated by aggregating completed task evaluations.

Story count is intentionally excluded because engineering complexity varies significantly between tasks.

Productivity rewards efficient execution rather than issue volume.

Productivity is not based on:

- Number of Stories
- Number of Tickets
- Total Logged Hours

---

# Task Evaluation Model

Task Evaluation is the fundamental building block of TeamPulse.

Every completed engineering task is independently evaluated before contributing to higher-level metrics.

Task Evaluation considers:

- Work Classification
- Development Complete Status
- Estimate Resolution
- Actual Worklogs
- Execution Efficiency
- Delivery Quality

Example

Task

CR-245

Technology

Magento

Estimate

12 Hours

Actual

11 Hours

QA Bugs

0

UAT Bugs

0

↓

Execution Efficiency

Excellent

↓

Delivery Quality

100

↓

Task Evaluation Score

Excellent

Developer performance, Technology Health and Engineering Score are calculated by aggregating Task Evaluations rather than directly analysing monthly Jira activity.

---

## Productivity Philosophy

Completing five small stories does not necessarily represent more engineering value than completing one highly complex story.

Engineering effort is measured using engineering estimates rather than issue count.

---

## Productivity Inputs

Engineering Productivity considers:

- Completed Feature Work
- Execution Efficiency
- Delivered Engineering Effort

Story count is displayed for reporting only.

It does not influence Productivity Score.

---

## Example

Developer A

5 Stories

Estimated

100 Hours

Actual

98 Hours

↓

Excellent Productivity

Developer B

1 Story

Estimated

100 Hours

Actual

95 Hours

↓

Excellent Productivity

Although the number of stories differs, both developers executed approximately the same engineering commitment.

Therefore both developers receive similar Productivity scores.

TeamPulse rewards engineering outcomes rather than issue count.

# 11. Delivery Quality

## Purpose

Delivery Quality measures the stability of engineering output after development has been completed.

Unlike traditional engineering dashboards that only measure issue completion, TeamPulse also evaluates how much engineering effort is required after delivery to stabilize the product.

Delivery Quality represents engineering excellence rather than engineering speed.

---

## Engineering Principle

Every completed feature starts with a Quality Score of 100.

Quality penalties are applied only after engineering work has been delivered.

Production Bugs are currently excluded because TeamPulse Version 1.0 does not have a reliable Jira mapping for production incidents.

---

## Quality Inputs

Delivery Quality currently considers:

- QA Bugs
- UAT Bugs
- Reopened Issues

Future versions may include:

- Production Bugs
- Customer Escalations
- Rollbacks
- Critical Incidents

---

## Quality Penalties

| Event | Penalty |
|--------|---------|
| QA Bug | -5 |
| UAT Bug | -10 |
| Reopened Issue | -8 |

Example

Developer delivers

Feature A

↓

QA Bug

↓

Quality

100 → 95

Developer delivers

Feature B

↓

UAT Bug

↓

Quality

100 → 90

---

## Quality Philosophy

The objective is not to punish developers.

The objective is to measure engineering stability.

Higher Delivery Quality means engineering teams spend more time building new features and less time fixing previous work.

---

# 12. Business Contribution

## Purpose

Business Contribution measures how much planned engineering value was delivered to customers.

Unlike Productivity, Business Contribution focuses on delivered business value rather than engineering execution.

---

## Included Work

Included

- Magento
- React JS
- HTML
- DT
- CR
- RE

Excluded

- QA Bug
- UAT Bug
- QA Task

Reason

Bug fixing restores previously delivered functionality.

It does not create new customer value.

---

## Contribution Philosophy

Business Contribution rewards developers who consistently deliver planned engineering work.

It does not reward:

- Longer working hours
- Larger worklogs
- Higher bug fixing effort

---

## Example

Developer A

Completed Feature Work

340 Hours

Recovery Work

60 Hours

↓

Business Contribution

340 Hours

Developer B

Completed Feature Work

210 Hours

Recovery Work

180 Hours

↓

Business Contribution

210 Hours

Although both developers logged similar total effort, TeamPulse recognizes Developer A as delivering greater business value.

---

# 13. Engineering Recovery Effort

## Purpose

Engineering Recovery Effort measures how much engineering capacity is consumed fixing defects instead of delivering new functionality.

This KPI helps Engineering Managers understand whether engineering capacity is being invested in innovation or maintenance.

---

## Formula

Recovery Effort %

=

QA Bug Hours + UAT Bug Hours

--------------------------------

Total Logged Engineering Hours

---

## Classification

| Recovery % | Status |
|------------|--------|
| Less than 10% | Excellent |
| 10% – 20% | Healthy |
| 20% – 30% | Needs Attention |
| Above 30% | Critical |

---

## Example

Total Logged Hours

200

QA Bug Hours

18

UAT Bug Hours

12

Recovery

30 Hours

Recovery Effort

15%

↓

Healthy

---

## Why this KPI exists

Engineering organizations with consistently high Recovery Effort often experience:

- Lower feature velocity
- Reduced engineering capacity
- Increased delivery risk
- Higher operational cost

Recovery Effort helps leadership identify these trends before they become delivery problems.

---

# 14. Technology Health

## Purpose

Technology Health measures the engineering health of an entire technology discipline.

Examples

- Magento
- React JS
- HTML
- DT

Technology Health is intended for Engineering Managers rather than individual contributors.

---

## Technology Health Components

Each technology is evaluated independently using:

- Delivery Reliability
- Engineering Productivity
- Delivery Quality
- Business Contribution
- Recovery Effort

These metrics are combined into a single Technology Health Score.

---

## Example

Magento

Delivery Reliability

94

Engineering Productivity

92

Quality

96

Contribution

90

Recovery Effort

8%

↓

Technology Health

93

Healthy

---

## Engineering Principle

Technology Health is **not** calculated by averaging developer scores.

Instead, TeamPulse evaluates engineering performance at the technology level using aggregated engineering data.

This prevents unusually high or low individual performance from distorting the overall technology score.

---

# 15. Executive Brief

## Purpose

Executive Brief converts engineering metrics into actionable management insights.

Instead of showing only numbers, TeamPulse explains what leadership should pay attention to.

Maximum Insights

3

Priority

Highest business impact first.

---

## Executive Brief Rules

Insights should:

✔ Explain significant engineering trends.

✔ Highlight delivery risks.

✔ Celebrate engineering improvements.

✔ Recommend where management attention is required.

Insights should NOT:

✘ Repeat dashboard numbers.

✘ State obvious information.

✘ Produce generic summaries.

---

## Example Insights

✅ React estimate execution improved by 9% compared to last month.

✅ Magento spent only 7% of engineering capacity fixing defects.

✅ HTML generated the highest number of QA defects this month.

✅ DT completed all planned engineering work within expected estimates.

---

## Future Direction

Version 1.0

Rule-based insights.

Version 2.0

AI-assisted insight generation using engineering trends, historical delivery data and predictive analytics.

---

# Decision Log

## Version 1.0

### Decision 001

Engineering performance is evaluated at the completed task level.

Reason:

Large engineering tasks may legitimately span multiple reporting periods.

---

### Decision 002

Story count is excluded from Productivity.

Reason:

Story complexity varies significantly.

Engineering effort is represented by planned engineering estimates rather than issue count.

---

### Decision 003

Engineering estimates are provided by Team Leads.

Reason:

Developers should be evaluated on execution rather than estimation ability.

---

### Decision 004

QA Bug and UAT Bug work contribute to Quality rather than Productivity.

Reason:

Bug fixing restores existing business value instead of creating new customer value.

---

### Decision 005

CR and RE issues resolve engineering estimates using developer technology mapping.

Reason:

Cross-functional engineering work should be evaluated fairly for every technology discipline.

---

# 16. Worked Examples

This section demonstrates how TeamPulse evaluates engineering work using real-world scenarios.

The purpose is to help Product Managers, Developers and AI Agents understand how the scoring engine behaves under different engineering conditions.

---

## Example 1 – Ideal Delivery

Issue Type

Magento

Estimate

40 Hours

Actual

39 Hours

QA Bugs

0

UAT Bugs

0

Status

Ready for UAT

Evaluation

✓ Feature Work

✓ Development Complete

✓ Execution Efficiency = Excellent

✓ Delivery Quality = 100

✓ Business Contribution Included

✓ Productivity Included

Result

Excellent Task Evaluation

---

## Example 2 – Slight Overrun

Issue Type

React JS

Estimate

24 Hours

Actual

27 Hours

QA Bugs

0

UAT Bugs

0

Status

Merge in UAT

Evaluation

Execution Efficiency

↓

Good

Delivery Quality

↓

100

Result

Healthy Task Evaluation

---

## Example 3 – QA Defect

Issue Type

Magento

Estimate

18 Hours

Actual

17 Hours

QA Bugs

1

Status

Ready for UAT

Evaluation

Execution Efficiency

↓

Excellent

Delivery Quality

↓

95

Recovery Effort

↓

Increased

Result

Excellent execution with reduced quality.

---

## Example 4 – UAT Defect

Issue Type

CR

Technology

React JS

Estimate Field

customfield_10327

Estimate

10 Hours

Actual

11 Hours

UAT Bug

1

Evaluation

Execution Efficiency

↓

Good

Quality

↓

90

Contribution

↓

Included

Recovery Effort

↓

Included

---

## Example 5 – Cross Technology CR

Issue

CR-245

Magento Estimate

12 Hours

React Estimate

8 Hours

HTML Estimate

3 Hours

Developer

Pratik

Technology

Magento

Engineering Estimate Used

12 Hours

Developer

Akanksha

Technology

React JS

Engineering Estimate Used

8 Hours

Developer

Punit

Technology

HTML

Engineering Estimate Used

3 Hours

TeamPulse evaluates every developer using the estimate corresponding to their engineering discipline.

---

## Example 6 – Long Running Work

Estimate

160 Hours

June

Logged

90 Hours

Status

In Progress

Evaluation

Not yet eligible.

No KPI calculation.

July

Remaining

70 Hours

Status

Ready for UAT

Evaluation

Estimate

160 Hours

Actual

160 Hours

↓

Execution Efficiency

100%

The task is evaluated only after completion.

Calendar boundaries never affect engineering performance.

---

# 17. Edge Cases

The following situations require special handling.

---

## Missing Estimate

Issue is excluded from estimate-based KPIs.

Engineering managers should be informed through dashboard validation.

---

## Missing Worklogs

Execution Efficiency cannot be calculated.

Task should be excluded until sufficient engineering effort is available.

---

## Missing Developer Mapping

Issue should appear under:

Unknown Technology

and be highlighted for administrator review.

---

## Multiple Developers

Each developer is evaluated only using their own worklogs.

Engineering estimates are resolved using the developer's assigned technology.

---

## Cancelled Work

Cancelled engineering work should not contribute to productivity.

Future versions may report cancelled engineering effort separately.

---

## Reopened Issue

Quality penalty applies.

Recovery work contributes to Recovery Effort.

---

# 18. Future Roadmap

The following capabilities are intentionally excluded from Version 1.

Planned Future Features

• AI Executive Brief

• Engineering Forecasting

• Delivery Confidence

• Capacity Planning

• Burnout Detection

• GitHub Integration

• Bitbucket Integration

• SonarQube Integration

• Jenkins Integration

• Historical Trend Analysis

• Team Benchmarking

• Multi-Project Analytics

---

# 19. Version History

| Version | Status | Summary |
|----------|--------|---------|
| 1.0 | Draft | Initial Engineering Scoring Engine specification |

---

# 20. Document Ownership

Product

TeamPulse

Owner

Amit Ajmera

Purpose

Engineering Intelligence Platform

This document defines the official Engineering Scoring Engine used by TeamPulse.

Every engineering KPI, dashboard component and AI insight must conform to the business rules documented here.

Business rules should be updated here before implementation changes are made in the application.

----

## Principle 7

### Fair Engineering Evaluation

TeamPulse evaluates engineering performance independently from data quality.

Developers should never be penalized for missing planning data that is outside their control.

Examples:

- Missing estimates
- Missing technology mappings
- Missing Jira configuration

These situations are treated as Engineering Data Quality issues rather than engineering performance issues.

Data Quality issues are reported separately from Engineering Score.

---