## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.

## 2024-05-25 - Explicit Labeling via useId
**Learning:** React 18's `useId` hook is a very clean and accessible way to generate unique IDs for dynamically rendered form fields.
**Action:** When making forms, always generate a unique ID to couple labels to inputs explicitly unless the input is the only child of the label.

## 2026-09-01 - Missing ARIA Labels on Text-Character Icons
**Learning:** The codebase frequently uses text characters (e.g., '✕') for UI icons rather than standard SVGs. This poses an accessibility issue as screen readers may announce the literal character (e.g., "multiplication sign") instead of its function (e.g., "Close").
**Action:** When encountering icon-only buttons, especially those using text characters, always ensure an explicit `aria-label` (e.g., `aria-label="Close"`) is added so assistive technologies announce the intended action.
