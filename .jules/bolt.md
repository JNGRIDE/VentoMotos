## 2026-02-07 - [Unnecessary Re-renders on Sprint Switch]
**Learning:** React components re-render aggressively when parent fetches new data, even if child item content is identical. Splitting static data (User Profiles) from dynamic data (Prospects) prevents the static data from causing cascading re-renders and re-fetches.
**Action:** Always fetch global/static data separately (on mount) and pass as stable props. Use `React.memo` with custom comparison for list items if the parent re-fetches the entire list frequently.

## 2026-02-17 - [Lifted Dialog State in Kanban]
**Learning:** Rendering Dialog components inside list items (even if hidden) creates significant memory overhead and DOM node count. Lifting them to the parent component and controlling them via state drastically reduces the footprint.
**Action:** When designing lists with actions that open dialogs, always place the Dialog component in the parent and pass handlers to the children.

## 2025-06-03 - [Code Splitting for Document Generation]
**Learning:** Large libraries like `docxtemplater` and `pizzip` can significantly increase bundle size. If they are only needed for a specific user action (like clicking a button), dynamic imports (`await import()`) should be used to load them on demand.
**Action:** Move heavy, event-specific logic to separate utility files and import them dynamically inside event handlers.

## 2026-06-04 - [Stabilizing Derived State Arrays]
**Learning:** When derived state (like grouped lists) is recalculated in `useMemo`, new array references are created even if content is identical, breaking `React.memo` optimization in child components.
**Action:** Use `useRef` within `useMemo` to compare new results with previous ones (e.g. via `areArraysOfFlatObjectsEqual`) and return the stable previous reference if content is unchanged.
