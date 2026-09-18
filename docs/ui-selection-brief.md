# UI Selection Brief

## Purpose

This document preserves the current Delivery Fixes interface as the functional baseline and defines the visual directions to compare later. It is a selection brief, not a redesign specification: no direction is selected here, and no UI variants need to be generated yet.

## Target merchant

The primary user is an owner-operator or small ecommerce operations team running a Shopify store. They handle fulfilment alongside other responsibilities and need to clear delivery exceptions quickly without learning a complex support platform.

They should be able to install the product from the Shopify App Store, understand it without a sales call, and reach a useful first result through self-serve onboarding.

## Product promise

Find and resolve address and delivery issues before fulfilment so merchants can reduce avoidable support work, replacement shipments, refunds, and lost order value.

## Core screens and states

### Issue dashboard

- Summary metrics: total issues, needs attention, resolved today, protected value, and response time
- Filterable queue for all, needs-attention, in-progress, and resolved issues
- Clear urgency, order/customer context, issue type, addresses, value, and age
- Actions to begin work, resolve an issue, or reopen it
- A simulation/create path for validating the MVP before Shopify synchronization exists

### Settings

- Master automation state
- Address auto-resolution preference
- Photo-request preference
- Editable customer message
- Clear save feedback and safe failure states

### Shared states

- Loading and skeleton states
- Empty queue, empty filter, and first-run states
- API failure and retry states
- Success feedback after issue or settings updates
- Unknown-route state

## Non-negotiable product constraints

1. **Self-serve first.** The interface must work without demos, onboarding calls, or direct-sales support.
2. **Fast queue scanning.** Status, urgency, customer, order, and required action must be recognizable at a glance.
3. **Action safety.** Resolving, reopening, and changing automation must provide clear outcomes and avoid accidental changes.
4. **Shopify-compatible expectations.** Future embedding should feel familiar to Shopify merchants without copying Shopify branding or implying an integration that is not yet present.
5. **Operational credibility.** The product should feel dependable and calm when a merchant is handling a time-sensitive fulfilment problem.
6. **Accessible by default.** Maintain readable contrast, keyboard access, visible focus, semantic labels, and non-color status indicators.
7. **Responsive operations.** Essential triage and issue actions must remain usable on smaller screens.
8. **No direct-sales workflow.** Do not add lead forms, demo booking, account-manager prompts, or sales-assisted setup.

## Current interface baseline

The current interface is the working reference, not a discarded prototype. It uses:

- A merchant dashboard and settings route inside a shared application shell
- A dark navy sidebar, pale neutral workspace, white cards, and orange primary actions
- Plus Jakarta Sans with compact radii and a modern SaaS visual language
- Summary cards above an issue queue
- Status filters and contextual issue actions
- Generated API hooks with loading, success, and failure feedback

Preserve the information architecture and working flows when exploring visual variants. A later visual direction may change density, hierarchy, navigation treatment, typography, color, and component styling, but it must not conceal or remove core actions.

## Three visual hypotheses to compare later

### 1. Embedded Operations

**Hypothesis:** A restrained, Shopify-adjacent admin style will reduce learning time and make the future embedded app feel immediately credible.

- Neutral palette with one controlled action color
- Compact tables or rows, modest radius, limited decoration
- Familiar admin hierarchy and plain language
- High information density with progressive disclosure for issue details
- Best if merchant familiarity and efficient adoption outweigh brand distinctiveness

**Question to test:** Can a first-time merchant identify the highest-priority issue and resolve it with almost no orientation?

### 2. Exception Command Center

**Hypothesis:** A denser operations-console treatment will help teams process a larger queue faster and make urgency more legible.

- Strong status bands, sharper hierarchy, and persistent queue controls
- Split-pane or master-detail behavior on wide screens
- Keyboard-friendly actions and compact metrics
- Timeline or activity context presented close to the selected issue
- Best if throughput and operational depth outweigh simplicity

**Question to test:** Does added density increase resolution speed without making a small merchant feel overwhelmed?

### 3. Guided Resolution

**Hypothesis:** A warmer, more spacious and step-oriented interface will give owner-operators greater confidence when they handle exceptions infrequently.

- Clear next-best action, explanatory microcopy, and fewer simultaneous choices
- Larger cards and touch targets with a friendlier typographic scale
- Strong empty states and self-serve setup guidance
- Progressive steps for reviewing and confirming a resolution
- Best if confidence and low-frequency usability outweigh maximum queue density

**Question to test:** Can an infrequent user complete the right action without needing documentation or support?

## Evaluation criteria

Score each direction from 1–5 against the same criteria:

| Criterion | What to evaluate |
| --- | --- |
| Time to first correct action | How quickly a new merchant finds and handles the most urgent issue |
| Queue scan efficiency | How easily users compare status, age, value, and required action |
| Action confidence | Whether consequences of resolve, reopen, and automation changes are clear |
| Self-serve clarity | Whether setup and daily use work without sales or support |
| Responsive usability | Whether triage and essential actions remain practical on small screens |
| Accessibility | Contrast, focus, keyboard flow, labels, target sizes, and non-color cues |
| Shopify context fit | Whether the UI will feel natural as a future embedded app |
| Brand distinctiveness | Whether Delivery Fixes is recognizable without distracting from operations |
| Implementation fit | Whether the direction can reuse the current architecture and components |

Do not select a winner by appearance alone. Use the core dashboard and settings tasks to compare comprehension, speed, confidence, and responsive behavior.

## Required responsive states

Each future direction must show:

- **Desktop, 1440 px:** full shell, summary, filters, queue, and selected/expanded issue
- **Laptop, 1024 px:** practical daily workspace without horizontal page scrolling
- **Tablet, 768 px:** adapted navigation, readable queue, and safe issue actions
- **Mobile, 390 px:** priority queue, issue details, resolve/reopen flow, and settings save

For every size, include loading, empty, error, long-content, and confirmation states. Test long customer names, order numbers, addresses, and customer messages rather than designing only for ideal content.

## Later variant-generation checklist

When credits are available:

1. Use this brief and the current running interface as the shared input.
2. Generate one coherent variant for each hypothesis; do not mix directions initially.
3. Keep screen content, example data, and core tasks consistent across variants.
4. Produce dashboard, issue detail/action, settings, and required responsive states.
5. Check keyboard flow, focus visibility, contrast, overflow, and touch targets.
6. Score each direction with the evaluation table and record evidence for each score.
7. Gather feedback from at least one Shopify merchant or realistic proxy user if available.
8. Select one direction, document why it won, and list any elements to borrow from the others.
9. Only then create an implementation plan; do not redesign the working MVP during comparison.

## Decision status

No visual hypothesis is selected. The existing interface remains the implementation baseline until a later comparison is completed.