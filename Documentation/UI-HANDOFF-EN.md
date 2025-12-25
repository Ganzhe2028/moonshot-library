# UI Handoff and Alignment Process

## 1. Goal
- Standardize design-to-frontend handoff and avoid scattered alignment rules.
- Clarify scope, states, and acceptance criteria to reduce rework.

## 2. Scope
- New pages/modules or major redesigns.
- Any area where layout/alignment drifts across pages.

## 3. Process
1. Scope confirmation: define boundaries, user goals, key paths, constraints.
2. Design delivery: provide specs, component states, interactions, and data mapping.
3. Frontend implementation: use global tokens and layout utilities.
4. Joint acceptance: verify against the checklist and minimum acceptance items.

## 4. Delivery Checklist (Required)
- Scope: page/module boundaries, in-scope features, exclusions.
- Design assets: Figma link, annotations, exports/icons, prototype.
- Component states: default/hover/disabled/error/loading/empty.
- Responsive: breakpoints and layout rules.
- Data field mapping: sources, formats, empty/error handling.
- Interaction/motion: triggers, duration, easing, feedback.
- Acceptance criteria: visual parity, functional usability, data correctness.

## 5. States and Exceptions
- Required states: loading, empty, error, disabled, no-permission.
- Exception notes: triggers, copy, fallback styling, screenshot if available.

## 6. Responsive Breakpoints (Default)
- >=1200px: Desktop
- 900–1199px: Tablet
- <900px: Mobile
- <600px: Small mobile

> If breakpoints change, document them in the handoff spec.

## 7. Data Field Mapping (Template)
| Field | Source | Format/Unit | Empty/Error Handling | Notes |
| --- | --- | --- | --- | --- |
| title | API.book.title | string | Show “--” | i18n aligned |

## 8. Interaction/Motion (Template)
- Trigger: click/scroll/load-complete
- Motion: fade/translate/skeleton
- Duration/Easing: 200–350ms, ease-out
- Feedback: success/error messages and styles

## 9. Alignment/Layout Rules (Required)
- Global tokens and utilities live in `frontend/src/assets/main.css`.
- Use these utilities for alignment/layout:
  - `u-stack` / `u-stack-sm` / `u-stack-lg`
  - `u-inline` / `u-inline-sm` / `u-inline-md` / `u-inline-lg` / `u-inline-xl`
  - `u-center` / `u-center-x` / `u-center-y`
  - `u-split` / `u-wrap` / `u-grid`
- Avoid redefining per-page flex/grid alignment when a utility can be reused.

Example:
```html
<div class="u-stack u-stack-lg">
  <section class="u-stack-sm">
    <h1>Title</h1>
    <p>Subtitle</p>
  </section>
  <div class="u-inline u-inline-lg u-wrap">
    <button>Primary</button>
    <button>Secondary</button>
  </div>
</div>
```

## 10. Minimum Acceptance Criteria
- Alignment: key layouts use global utilities; no private alignment drift.
- Responsive: no overflow or misalignment across breakpoints.
- States: loading/empty/error/disabled are verifiable.
- Data: mapping, formatting, and empty handling are correct.
- i18n: no hard-coded copy; EN/ZH are covered.

## 11. Spec Template (Fill During Handoff)
- Scope:
- Design deliverables:
- State/exception notes:
- Responsive breakpoints:
- Data field mapping:
- Interaction/motion:
- Acceptance criteria:
