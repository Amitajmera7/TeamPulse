# TeamPulse Engineering Metrics Specification

Version: 1.0

Status: Draft

Owner: TeamPulse

Last Updated:

---

# Purpose

This document defines every engineering metric used by TeamPulse.

It is the single source of truth for:

• Dashboard
• AI Insights
• Executive Brief
• Leaderboards
• Engineering Score
• Future integrations

The implementation must always follow this document.

---

# Metric Lifecycle

Jira

↓

Engineering Interpretation Engine

↓

Work Item Evaluation

↓

Developer Metrics

↓

Technology Metrics

↓

Engineering Score

↓

Dashboard

↓

AI Insights

---

# Metric 1

## Execution Efficiency

### Purpose

Measure how closely a developer executes engineering work against planned estimates.

Execution Efficiency measures delivery predictability.

It does not measure quality.

It does not measure contribution.

It does not measure utilization.

---

### Inputs

ResolvedEstimate

ResolvedWorklogs

Technology

Issue Type

---

### Exclusions

Do not calculate when:

• estimate missing

• worklogs missing

These become Engineering Data Quality issues.

---

### Estimate Resolution

Standard Engineering Work

Magento

React

HTML

DT

↓

Original Estimate

CR / RE

↓

Technology Estimate Field

---

### Estimate Allocation

Standard Tasks

Allocated Estimate

=

Original Estimate

×

Developer Worklog Hours

÷

Total Worklog Hours

CR / RE

Allocated Estimate

=

Technology Estimate

×

Developer Technology Worklog Hours

÷

Total Technology Worklog Hours

---

### Variance

Variance %

=

((Actual Hours − Allocated Estimate)

÷

Allocated Estimate)

×

100

---

### Dynamic Tolerance

| Allocated Estimate | Tolerance |
|-------------------|-----------|
| 0–8h | ±5% |
| 8–40h | ±10% |
| 40–100h | ±12% |
| >100h | ±15% |

---

### Scoring

Within tolerance

↓

100

Outside tolerance

↓

Continuous linear reduction

Minimum Score

20

Maximum Score

100

---

### Output

ExecutionEfficiencyResult

Contains

• allocatedEstimate

• actualHours

• variancePercentage

• tolerancePercentage

• efficiencyScore

• rating

---

### Business Principles

Execution Efficiency measures estimate adherence only.

It never includes:

• QA Bugs

• UAT Bugs

• Recovery Effort

• Contribution

Those metrics are calculated independently.

---

# Metric 2

## Delivery Quality

### Purpose

Measure engineering stability.

---

### Inputs

QA Bugs

UAT Bugs

Developer Worklogs

Technology Mapping

---

### Rules

QA Bug penalty begins when QA Bug is created.

Bug closure does not affect Quality.

Recovery effort is measured separately.

---

### Allocation

Quality penalties are allocated proportionally using the original feature worklog distribution.

---

### Reopened Bugs

Count once.

---

### Bugs without Worklogs

Ignored.

---

### Severity

Ignored in Version 1.

---

### Output

QualityResult

Contains

• score

• qaBugCount

• uatBugCount

• recoveryHours

• proportionalPenalty

---

# Metric 3

## Business Contribution

Status: Draft

Purpose

Measure delivered engineering value.

(To be completed in Sprint 3B Milestone 7.)

---

# Metric 4

## Engineering Data Quality

Status: Draft

Purpose

Measure reliability of engineering analytics.

Tracks

• Missing Estimates

• Missing Worklogs

• Missing Technology Mapping

• Missing Configuration

These issues never reduce Engineering Performance.

---

# Engineering Principles

## Principle 1

Individual worklogs are the source of truth.

---

## Principle 2

Engineering performance and Engineering Data Quality are independent.

---

## Principle 3

Developers are never penalized for missing planning data.

---

## Principle 4

Every TeamPulse metric must be explainable.

Every score should be reproducible using stored inputs.

---

## Principle 5

Dashboard values are derived.

Raw Jira data is never displayed directly.

---

# Future Enhancements

• Production Bugs

• Bug Severity

• Story Complexity

• Story Risk

• Code Review Metrics

• GitHub Integration

• SonarQube Integration

• AI Prediction Models