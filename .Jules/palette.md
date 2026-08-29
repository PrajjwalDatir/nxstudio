## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.

## 2024-05-25 - Explicit Labeling via useId
**Learning:** React 18's `useId` hook is a very clean and accessible way to generate unique IDs for dynamically rendered form fields.
**Action:** When making forms, always generate a unique ID to couple labels to inputs explicitly unless the input is the only child of the label.

## 2024-05-26 - Missing Labels on Text-Character Icons
**Learning:** Found multiple instances where interactive buttons used plain text characters (like "✕") for icons without any `aria-label` or visually hidden text. This causes screen readers to read out arbitrary character names (e.g. "multiplication x" or just read nothing useful) instead of the button's action, making modal close buttons and input clear buttons inaccessible.
**Action:** Always verify that buttons containing only text-character icons (like ✕, +, etc.) or non-semantic SVGs have an explicit `aria-label` describing their function (e.g., "Close", "Clear search").
