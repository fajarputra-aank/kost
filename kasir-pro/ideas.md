# KASIR PRO — Design Direction

## Three stylistic approaches

### Approach 1 — Paper Ledger Modernism
A warm, editorial business interface inspired by premium receipt paper, ledger lines, and independent shop counters. It should feel practical, calm, and crafted rather than corporate or generic.

**Probability:** 0.03

### Approach 2 — Quiet Utility
A restrained, monochrome operational dashboard with crisp tables, utilitarian typography, and almost no decoration. It prioritizes dense information and efficiency for experienced operators.

**Probability:** 0.07

### Approach 3 — Night Shift Terminal
A dark, high-contrast POS environment with electric accents, compact command surfaces, and subtle glow for late-night cafe and restaurant operations.

**Probability:** 0.02

## Selected approach: Paper Ledger Modernism

### Design Movement
Contemporary editorial brutalism softened by analog stationery: the visual language of a well-run neighborhood shop translated into a high-confidence digital tool.

### Core Principles
1. **Operational clarity:** every screen answers what is happening, what needs attention, and what action comes next.
2. **Tactile warmth:** cream paper surfaces, ink-like typography, quiet rules, and small material cues replace sterile SaaS gloss.
3. **Asymmetric rhythm:** use a persistent rail, offset panels, and intentional negative space rather than an endless centered card grid.
4. **Visible trust:** show statuses, totals, data provenance, and action feedback close to the interaction that caused them.

### Color Philosophy
The base is warm paper (#F7F2E9), chosen to make long sessions easier on the eyes and to echo receipts and ledgers. Ink navy (#15232B) carries primary text and navigation, creating authority without the harshness of pure black. A single ownable tangerine (#E46F47) marks action, movement, and money-in; sage and honey act as operational status colors rather than decorative accents. Color is semantic: tangerine means act, sage means safe, honey means watch, and red means stop.

### Layout Paradigm
A persistent left rail anchors the product identity. The main workspace uses editorial columns: a broad working canvas paired with a narrower context panel. Dashboard blocks use varied proportions, not repeated same-size cards. The POS page deliberately splits product discovery and basket settlement so the path from scan to payment remains visually obvious.

### Signature Elements
- Thin ledger rules and offset underlines beneath page titles.
- Small “paper tab” labels for live operational status.
- A warm tangerine action button paired with ink outlines and tactile press states.

### Interaction Philosophy
Interactions should feel like marking a ledger: quick, legible, and reversible where possible. Primary actions use a clear press response; destructive actions require an explicit confirmation; successful actions leave a small audit-like toast that explains what changed. Keyboard shortcuts are first-class for cashier speed.

### Animation
Use short 160–220ms ease-out transitions for hover, focus, drawers, and toast entry. Use a subtle 30–60ms stagger when lists appear. Avoid decorative motion on data-dense screens. For payment confirmation, use a brief receipt-like slide/fade rather than a celebratory animation. Respect reduced-motion preferences.

### Typography System
Use **DM Serif Display** for large page titles and the KASIR PRO wordmark treatment, paired with **Manrope** for body copy, labels, tables, and controls. Titles are compact and editorial; table text is 12–14px with strong numeric alignment. Use tabular numerals for currency and quantities.

### Brand Essence
KASIR PRO FNP is the offline-first daily operating desk for Indonesian small businesses that need speed at the counter and confidence after closing.

**Personality:** capable, warm, exact.

### Brand Voice
Headlines sound direct and grounded. CTAs describe the result, not vague progress. Microcopy is short, human, and reassuring.

Example lines:
- **Headline:** “Hari ini tercatat rapi.”
- **CTA:** “Selesaikan pembayaran”

### Wordmark & Logo
The mark is a folded receipt transformed into a forward check: a compact symbol that reads as transaction, accuracy, and momentum. The wordmark uses a custom all-caps lockup with a slightly widened tracking treatment; never render it as a default logo font.

### Signature Brand Color
**Receipt Tangerine — #E46F47.** It is warm enough to feel human, bright enough to guide action, and distinctive against the paper-and-ink system.

## Implementation guardrail
The first delivery is a working frontend foundation using browser-local persistence. It includes real CRUD for products/customers, a real cart-to-payment transaction flow with stock decrement and invoice generation, dashboard/report calculations from stored records, CSV/JSON backup and restore, print-friendly receipt/invoice views, role-aware navigation, and usable placeholders only where a browser-only limitation prevents hardware integration such as direct camera barcode scanning.

## Style Decisions

- Every major workspace includes at least one stationery cue: ruled dividers, paper-tab status, stamped labels, receipt groupings, or ledger-like row treatment.
- Product surfaces use receipt labels, stamped category marks, paper borders, and shop-counter cues rather than generic abstract placeholders.
- Receipt Tangerine `#E46F47` remains reserved for primary actions, money-in movement, and urgent action cues. Sage, honey, ink, and paper tones carry secondary emphasis and status.
- The wordmark lockup uses compact all-caps spacing and the folded receipt symbol as a unit; it is not treated as a default text label.
