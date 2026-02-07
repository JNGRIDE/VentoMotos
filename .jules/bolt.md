## 2026-02-07 - [Unnecessary Re-renders on Sprint Switch]
**Learning:** React components re-render aggressively when parent fetches new data, even if child item content is identical. Splitting static data (User Profiles) from dynamic data (Prospects) prevents the static data from causing cascading re-renders and re-fetches.
**Action:** Always fetch global/static data separately (on mount) and pass as stable props. Use `React.memo` with custom comparison for list items if the parent re-fetches the entire list frequently.
