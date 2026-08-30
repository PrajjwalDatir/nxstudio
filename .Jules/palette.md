## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.

## 2024-05-25 - Explicit Labeling via useId
**Learning:** React 18's `useId` hook is a very clean and accessible way to generate unique IDs for dynamically rendered form fields.
**Action:** When making forms, always generate a unique ID to couple labels to inputs explicitly unless the input is the only child of the label.

## 2024-05-26 - Missing Aria Labels on Text-Icon Buttons
**Learning:** Found multiple instances where interactive buttons used text characters like '✕' instead of standard SVGs or text, but lacked descriptive `aria-label`s. Screen readers would read these out as non-descriptive characters (e.g., "multiplication x" or just "button"), creating a confusing experience for non-visual users.
**Action:** Always add an explicit `aria-label` (e.g., `aria-label="Close"`, `aria-label="Clear search"`) to buttons where the visual content is solely represented by non-alphanumeric text characters acting as icons.
