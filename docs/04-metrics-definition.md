# 📊 TeamPulse Metrics Definition

> Version 1.0

---

# Purpose

This document defines every metric used within TeamPulse.

Each metric includes:

- Definition
- Business Purpose
- Formula
- Data Source
- Visualization
- Interpretation
- Future Improvements

This ensures every dashboard, API and AI insight uses the same calculation logic.

---

# Metric Categories

Engineering metrics are divided into:

1. Executive KPIs
2. Delivery Metrics
3. Productivity Metrics
4. Workload Metrics
5. Estimation Metrics
6. Quality Metrics
7. Trend Metrics
8. Team Metrics
9. AI Metrics

---

# Executive KPIs

These appear at the top of the dashboard.

## 1. Delivery Health

Purpose

Shows overall delivery performance for the selected period.

Business Value

Allows management to quickly assess whether engineering delivery is healthy.

Formula

Weighted Score based on:

- Stories Delivered
- Subtasks Delivered
- Completed Estimates
- Delivery Trend
- Reopened Issues

Range

0–100

Visualization

Large KPI Card

Color

Green

Future

AI explanation of why the score changed.

---

## 2. Engineering Productivity

Purpose

Measures engineering output while balancing effort and delivery.

Important

This is NOT based only on hours worked.

Formula

Weighted combination of:

- Delivered Work
- Throughput
- Estimate Accuracy
- Delivery Consistency
- Cycle Time

Visualization

KPI Card

---

## 3. Resource Utilization

Purpose

Shows how effectively engineering capacity is used.

Formula

Actual Logged Hours

÷

Available Capacity

Visualization

Gauge

---

## 4. Delivery Risk

Purpose

Highlights engineering risk.

Factors

Blocked Work

Long Cycle Time

High WIP

Delayed Delivery

Reopened Issues

Visualization

Risk Card

---

# Delivery Metrics

---

## Stories Delivered

Definition

Parent Stories completed during selected period.

Data Source

Jira Parent Issues

Visualization

Trend Chart

---

## Subtasks Delivered

Definition

Completed Subtasks.

Visualization

Trend

---

## Delivered Hours

Definition

Actual logged hours contributing to completed work.

Data Source

Worklogs

Visualization

Area Chart

---

## Throughput

Definition

Completed work items per month.

Formula

Completed Stories

+

Completed Subtasks

---

# Productivity Metrics

---

## Overall Productivity Score

Purpose

Balanced engineering productivity.

Weights

Delivery

30%

Estimate Accuracy

20%

Consistency

15%

Cycle Time

15%

Quality

10%

Workload Balance

10%

Range

0–100

---

## Contribution Score

Purpose

Recognizes engineering contribution.

Uses

Delivered Hours

Delivered Tickets

Code Ownership (future)

Peer Recognition (future)

---

## Delivery Consistency

Purpose

Measures stable delivery over time.

Future

Standard deviation of weekly throughput.

---

# Workload Metrics

---

## Active Hours

Definition

Hours logged during selected period.

---

## Capacity

Definition

Available engineering hours.

Future

Based on:

Working Days

Holidays

Leaves

---

## Utilization

Formula

Active Hours

÷

Capacity

Healthy

70–90%

---

## Work Distribution

Purpose

Identify overloaded developers.

Visualization

Heatmap

---

# Estimation Metrics

---

## Original Estimate

Definition

Original estimate from Jira.

---

## Actual Time

Definition

Actual logged work.

---

## Estimate Accuracy

Formula

Original Estimate

÷

Actual Time

Important

Low estimate accuracy does NOT necessarily indicate poor performance.

Management should interpret alongside delivery metrics.

---

# Quality Metrics

---

## Reopened Issues

Definition

Issues reopened after completion.

Purpose

Quality signal.

---

## Technical Review Time

Future

Measure time spent in technical review.

---

## QA Rejections

Future

Number of QA failures.

---

## Defect Density

Future

Bugs per completed story.

---

# Trend Metrics

---

## Monthly Delivery Trend

Purpose

Track engineering improvement.

Visualization

Line Chart

---

## Monthly Productivity Trend

Purpose

Track productivity changes.

---

## Team Trend

Compare:

Magento

React

HTML

DT

QA

---

# Team Metrics

---

## Team Health Score

Combination of

Delivery

Capacity

Consistency

Risk

Visualization

Technology Cards

---

## Team Capacity

Developers

Hours

Delivery

---

## Team Productivity

Average productivity score.

---

# Developer Metrics

Each developer profile includes

Stories Delivered

Subtasks Delivered

Hours Logged

Delivered Hours

Estimate Accuracy

Productivity Score

Monthly Trend

Consistency

Workload

Achievements

---

# AI Metrics

Future AI features use:

Delivery Trend

Productivity

Capacity

Risk

Estimate Accuracy

Worklogs

AI should never invent metrics.

Only explain existing ones.

---

# Data Sources

Metric | Source
------ | ------
Hours | Worklogs
Estimate | Timetracking
Stories | Jira Issues
Technology | Custom Field
Developer | Worklog Author
Status | Jira Status
Parent | Parent Issue

---

# Metrics Principles

Every metric must satisfy:

✓ Explainable

✓ Repeatable

✓ Transparent

✓ Actionable

✓ Fair

---

# Metrics We Will NOT Use

❌ Logged Hours Ranking

❌ Ticket Count Ranking

❌ Most Active Developer

❌ Longest Working Hours

These encourage unhealthy engineering behavior.

---

# Future Metrics

Deployment Frequency

Lead Time

Cycle Time

Change Failure Rate

MTTR

Code Review Time

PR Throughput

GitHub Integration

SonarQube Quality

CI/CD Health

Customer Satisfaction

Engineering Happiness

---

# Related Documents

- 01 Project Charter
- 02 Engineering Architecture
- 03 Dashboard UX Specification
- 05 Implementation Roadmap