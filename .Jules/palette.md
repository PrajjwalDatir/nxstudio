## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.

## 2024-05-25 - Explicit Labeling via useId
**Learning:** React 18's `useId` hook is a very clean and accessible way to generate unique IDs for dynamically rendered form fields.
**Action:** When making forms, always generate a unique ID to couple labels to inputs explicitly unless the input is the only child of the label.
## 2026-08-31 - Text Nodes as Icons Need ARIA Labels
**Learning:** The codebase frequently uses text characters like '✕' for UI icons instead of standard SVGs. These text nodes are often ignored or misread by screen readers (e.g., 'multiplication x').
**Action:** Always ensure that icon-only buttons using text characters have explicit `aria-label` attributes to provide context to assistive technologies.
