## 2024-05-22 - Tooltip Verification and Accessibility
**Learning:** Radix UI Tooltips render in a Portal and require a global `TooltipProvider`. Verifying their appearance in Playwright can be flaky with `hover()`; using `focus()` on the trigger element (if interactive) is more reliable and also verifies keyboard accessibility.
**Action:** When adding tooltips, always ensure `TooltipProvider` wraps the layout. For verification, use `.focus()` and verify visibility of the tooltip content, ensuring the trigger is keyboard-accessible.

## 2024-05-23 - Interactive Text Elements
**Learning:** Using semantic `<Button variant="link">` instead of `<p onClick>` or `<span onClick>` provides immediate keyboard accessibility (Tab, Enter/Space) and focus states with minimal styling effort.
**Action:** Replace clickable text elements with `Button` components using the `link` variant, overriding styles with `className` if necessary to match the original design (e.g., removing underlines or adjusting colors).

## 2024-05-24 - Touch Device Accessibility
**Learning:** Elements hidden by default (`opacity-0`) and revealed on hover (`group-hover:opacity-100`) are inaccessible on touch devices because they lack a reliable hover state. This creates "mystery meat navigation".
**Action:** Use responsive utility classes (e.g., `opacity-100 lg:opacity-0 lg:group-hover:opacity-100`) to ensure interactive elements are always visible on touch devices (mobile/tablet) while maintaining the cleaner hover-reveal behavior on desktop. Also, ensure touch targets are at least 32px (preferably 44px).

## 2024-05-23 - [Clickable Cards in Drag-and-Drop Lists]
**Learning:** Users expect cards in a Kanban board to be clickable for details, not just draggable. Adding `onClick` to a `draggable` element works in most modern browsers because the drag operation suppresses the click event, but one must ensure inner interactive elements (buttons/links) stop propagation to avoid conflicts.
**Action:** When implementing card lists, always consider making the entire card the primary action trigger (view/edit), and carefully manage event propagation for secondary actions.
## 2024-05-25 - Mobile Drawer Navigation
**Learning:** In Single Page Applications (SPA) like Next.js, `Link` components inside a mobile navigation drawer (Sheet/Dialog) do not automatically close the drawer upon navigation because the page doesn't fully reload. This forces users to manually close the menu after clicking a link.
**Action:** Wrap navigation links inside the drawer with `<SheetClose asChild>` (or the equivalent Dialog Close primitive) to ensure the overlay is dismissed immediately upon user interaction.

## 2024-05-23 - [Abbreviated Visual Labels]
**Learning:** Using `aria-label` on non-interactive elements (like a `Badge`) is often ignored by screen readers, making abbreviations like "Org" confusing.
**Action:** Render the visible abbreviation with `aria-hidden="true"` and provide the full text in a sibling `span` with the `sr-only` class.

## 2024-05-23 - [Ref Forwarding in Shared Components]
**Learning:** When using components like `Badge` as children of Radix UI primitives (e.g., `TooltipTrigger asChild`), the component MUST use `React.forwardRef`. Otherwise, the trigger will fail to attach event listeners or positioning logic.
**Action:** Ensure all atomic UI components (Buttons, Badges, Cards) that might be used compositionally support ref forwarding.
