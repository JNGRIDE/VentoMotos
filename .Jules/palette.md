## 2024-05-22 - Tooltip Verification and Accessibility
**Learning:** Radix UI Tooltips render in a Portal and require a global `TooltipProvider`. Verifying their appearance in Playwright can be flaky with `hover()`; using `focus()` on the trigger element (if interactive) is more reliable and also verifies keyboard accessibility.
**Action:** When adding tooltips, always ensure `TooltipProvider` wraps the layout. For verification, use `.focus()` and verify visibility of the tooltip content, ensuring the trigger is keyboard-accessible.

## 2024-05-23 - Interactive Text Elements
**Learning:** Using semantic `<Button variant="link">` instead of `<p onClick>` or `<span onClick>` provides immediate keyboard accessibility (Tab, Enter/Space) and focus states with minimal styling effort.
**Action:** Replace clickable text elements with `Button` components using the `link` variant, overriding styles with `className` if necessary to match the original design (e.g., removing underlines or adjusting colors).

## 2024-05-24 - Touch Device Accessibility
**Learning:** Elements hidden by default (`opacity-0`) and revealed on hover (`group-hover:opacity-100`) are inaccessible on touch devices because they lack a reliable hover state. This creates "mystery meat navigation".
**Action:** Use responsive utility classes (e.g., `opacity-100 lg:opacity-0 lg:group-hover:opacity-100`) to ensure interactive elements are always visible on touch devices (mobile/tablet) while maintaining the cleaner hover-reveal behavior on desktop. Also, ensure touch targets are at least 32px (preferably 44px).
