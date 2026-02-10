## 2024-05-22 - Tooltip Verification and Accessibility
**Learning:** Radix UI Tooltips render in a Portal and require a global `TooltipProvider`. Verifying their appearance in Playwright can be flaky with `hover()`; using `focus()` on the trigger element (if interactive) is more reliable and also verifies keyboard accessibility.
**Action:** When adding tooltips, always ensure `TooltipProvider` wraps the layout. For verification, use `.focus()` and verify visibility of the tooltip content, ensuring the trigger is keyboard-accessible.

## 2024-05-23 - Interactive Text Elements
**Learning:** Using semantic `<Button variant="link">` instead of `<p onClick>` or `<span onClick>` provides immediate keyboard accessibility (Tab, Enter/Space) and focus states with minimal styling effort.
**Action:** Replace clickable text elements with `Button` components using the `link` variant, overriding styles with `className` if necessary to match the original design (e.g., removing underlines or adjusting colors).
