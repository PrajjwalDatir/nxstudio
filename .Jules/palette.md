## 2024-05-24 - Missing Explicit Label Associations
**Learning:** Found multiple instances where labels were not explicitly associated with their inputs using `htmlFor` and `id` across different forms in the app, which is a key accessibility standard. While sometimes inputs nested in labels work implicitly, sibling inputs need explicit linking. This is a common pattern in forms and dialogs in this app.
**Action:** Use React's `useId` hook to generate unique IDs for dynamically rendered form fields to explicitly link `<\label>` and `<input>`/`<textarea>` elements, rather than relying exclusively on implicit nesting.

## 2024-05-25 - Explicit Labeling via useId
**Learning:** React 18's `useId` hook is a very clean and accessible way to generate unique IDs for dynamically rendered form fields.
**Action:** When making forms, always generate a unique ID to couple labels to inputs explicitly unless the input is the only child of the label.

## 2024-05-26 - Semantic Section Headings
**Learning:** Found instances where `<label>` was incorrectly used as a visual section heading for a group of inputs (like the "Brand DNA" section in IdeaPhase). This breaks screen reader expectations, as labels should only be associated with form controls.
**Action:** Convert faux-labels acting as section headers into proper semantic headings (like `<h3>`) to preserve document outline and accessibility semantics, then add explicit, invisible or visible labels for the individual inputs.
