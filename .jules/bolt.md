## 2026-02-07 - [Unnecessary Re-renders on Sprint Switch]
**Learning:** React components re-render aggressively when parent fetches new data, even if child item content is identical. Splitting static data (User Profiles) from dynamic data (Prospects) prevents the static data from causing cascading re-renders and re-fetches.
**Action:** Always fetch global/static data separately (on mount) and pass as stable props. Use `React.memo` with custom comparison for list items if the parent re-fetches the entire list frequently.

## 2026-02-17 - [Lifted Dialog State in Kanban]
**Learning:** Rendering Dialog components inside list items (even if hidden) creates significant memory overhead and DOM node count. Lifting them to the parent component and controlling them via state drastically reduces the footprint.
**Action:** When designing lists with actions that open dialogs, always place the Dialog component in the parent and pass handlers to the children.
