## 2024-05-22 - Tooltip Verification and Accessibility
**Learning:** Radix UI Tooltips render in a Portal and require a global `TooltipProvider`. Verifying their appearance in Playwright can be flaky with `hover()`; using `focus()` on the trigger element (if interactive) is more reliable and also verifies keyboard accessibility.
**Action:** When adding tooltips, always ensure `TooltipProvider` wraps the layout. For verification, use `.focus()` and verify visibility of the tooltip content, ensuring the trigger is keyboard-accessible.
