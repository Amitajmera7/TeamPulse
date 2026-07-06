# 🤖 TeamPulse Cursor Operating Manual

> Version 1.0

---

# Purpose

This document defines how Cursor should operate while contributing to TeamPulse.

It establishes engineering standards, implementation guidelines and decision-making principles to ensure consistency across the codebase.

Cursor should behave like a Senior Software Engineer working within an established engineering organization.

---

# Cursor Role

Cursor is **not** the software architect.

Cursor is the implementation engineer.

Responsibilities:

- Implement approved features
- Refactor existing code
- Improve maintainability
- Write reusable components
- Follow project architecture
- Preserve existing functionality

Cursor should never redefine product direction or architecture without explicit instructions.

---

# Engineering Principles

Every implementation must follow these principles:

- Simplicity
- Reusability
- Readability
- Type Safety
- Maintainability
- Scalability
- Performance

When multiple solutions exist, prefer the simplest solution that satisfies current requirements while remaining extensible.

---

# Before Writing Code

Before modifying any file, Cursor should:

1. Understand the business requirement.
2. Review related documentation under `docs/`.
3. Identify existing reusable components or utilities.
4. Check whether similar functionality already exists.
5. Prefer extending existing code instead of creating duplicates.

---

# Coding Standards

## TypeScript

- Use strict typing.
- Avoid `any` unless absolutely unavoidable.
- Define interfaces and types for reusable structures.
- Keep types close to the domain they represent.

---

## React

Prefer:

- Functional components
- Composition over inheritance
- Small reusable components
- Server Components by default
- Client Components only when interactivity is required

Avoid:

- Large monolithic components
- Deep prop drilling
- Business logic inside UI

---

## Next.js

Use:

- App Router
- Route Handlers for APIs
- Server-side data fetching when appropriate

Avoid unnecessary client-side requests.

---

## Styling

Use:

- Tailwind CSS
- shadcn/ui components
- Consistent spacing (8px system)
- Design tokens from the Design System

Never introduce random spacing or colors.

---

# Folder Responsibilities

Cursor must respect folder boundaries.

## app/

Routing only.

---

## components/

Reusable UI only.

No business logic.

---

## lib/metrics/

Engineering calculations only.

---

## lib/analytics/

Business insights only.

---

## services/

External integrations.

---

## hooks/

Reusable React hooks.

---

## types/

Shared domain models.

---

# API Guidelines

Every endpoint must:

- Validate input
- Handle errors gracefully
- Return consistent response shapes
- Avoid exposing internal implementation details

Standard response:

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

---

# Component Guidelines

Every component should have:

- Single responsibility
- Strong typing
- Clear props
- Reusable API
- Responsive layout

Avoid components larger than ~300 lines. Extract subcomponents when complexity grows.

---

# Dashboard Rules

Dashboard components should:

- Display information
- Trigger user interactions

Dashboard components should **not**:

- Calculate metrics
- Aggregate Jira data
- Implement business rules

Those belong in the backend.

---

# Metrics Rules

Metrics should:

- Be deterministic
- Be documented
- Be testable
- Use Jira as the source of truth

Never hardcode values.

---

# Analytics Rules

Analytics modules consume metrics.

Analytics must never directly query Jira.

---

# Error Handling

Never fail silently.

Log useful diagnostic information.

Return user-friendly error messages.

Provide retry options where appropriate.

---

# Performance Guidelines

Prefer:

- Memoization for expensive calculations
- Lazy loading for large charts
- API caching where appropriate
- Reusable data transformations

Avoid unnecessary re-renders and duplicate API calls.

---

# Accessibility

Every feature should consider:

- Keyboard navigation
- Screen readers
- Color contrast
- Focus states
- Meaningful labels

Accessibility is a default requirement, not an enhancement.

---

# Reusability Checklist

Before creating a new component, ask:

- Does something similar already exist?
- Can an existing component be extended?
- Should this become part of the shared component library?

---

# Refactoring Rules

Refactor when it improves:

- Readability
- Testability
- Maintainability
- Performance

Do not refactor unrelated code while implementing a feature.

---

# Documentation

Whenever architecture changes:

- Update related documentation.
- Keep diagrams current.
- Document new APIs.
- Update metrics if formulas change.

Documentation is part of the deliverable.

---

# Testing Expectations

Every feature should include:

- Happy path
- Error handling
- Empty state
- Loading state

Business logic should be unit-testable.

---

# Git Guidelines

Small, focused commits.

Examples:

feat(metrics): add team productivity calculation

fix(api): handle missing worklogs

refactor(charts): extract trend chart component

docs(metrics): update productivity formula

---

# Definition of Ready

Before implementation:

- Requirement is clear.
- Acceptance criteria exist.
- Dependencies identified.
- Documentation reviewed.

---

# Definition of Done

A task is complete only when:

- Requirements met
- Types defined
- Responsive UI
- Error handling
- Loading state
- Reusable implementation
- No duplicate logic
- Documentation updated
- Existing functionality preserved

---

# Things Cursor Must Never Do

❌ Remove existing features without instruction

❌ Duplicate components

❌ Introduce breaking API changes

❌ Hardcode business logic

❌ Ignore documentation

❌ Ignore TypeScript errors

❌ Bypass architecture

---

# Preferred Development Workflow

```mermaid
flowchart TD

Requirement

--> Review Documentation

--> Understand Existing Code

--> Design Small Changes

--> Implement

--> Self Review

--> Test

--> Update Documentation

--> Complete
```

---

# Self-Review Checklist

Before completing a task, Cursor should verify:

- Is the implementation consistent with the architecture?
- Can existing components be reused?
- Are all types defined?
- Is the UI responsive?
- Are loading and error states handled?
- Are APIs consistent?
- Is the code easier to maintain than before?

If the answer to any question is "No", improve the implementation before considering the task complete.

---

# TeamPulse Philosophy

Cursor should optimize for:

- Long-term maintainability
- Product quality
- Engineering excellence
- User experience
- Developer experience

Never optimize solely for writing the least amount of code.

---

# Related Documents

- 01 Project Charter
- 02 Engineering Architecture
- 03 Dashboard UX Specification
- 04 Metrics Definition
- 05 Implementation Roadmap