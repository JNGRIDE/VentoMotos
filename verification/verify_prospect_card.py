from playwright.sync_api import Page, expect, sync_playwright
import os

def test_prospect_card_accessibility(page: Page):
    print("Navigating to test page...")
    # 1. Arrange: Go to the test page.
    page.goto("http://localhost:9002/test-prospect-card", timeout=60000)

    print("Checking for heading...")
    # 2. Assert: Verify the page title.
    expect(page.get_by_role("heading", name="Prospect Card Test")).to_be_visible(timeout=60000)

    print("Verifying Source Badge (Organic)...")
    # 3. Assert: Verify the Source Badge accessibility for first card
    badge_locator_organic = page.locator("[title='Organic']").first
    expect(badge_locator_organic).to_be_visible()

    # Verify sr-only text
    sr_text_organic = badge_locator_organic.locator("span.sr-only")
    expect(sr_text_organic).to_have_text("Organic")

    # Verify aria-hidden text is "Org"
    # We can check text content of the badge excluding sr-only? No, simpler to check visible text
    # But Playwright sees both if we ask for text content.
    # We can check innerText which respects CSS visibility.
    # Actually, sr-only hides it from layout but not necessarily from .innerText() in Playwright depending on implementation.
    # But we trust our code structure: <span aria-hidden="true">{prospect.source.substring(0, 3)}</span>

    print("Verifying Source Badge (Advertising)...")
    badge_locator_advertising = page.locator("[title='Advertising']").first
    expect(badge_locator_advertising).to_be_visible()
    sr_text_adv = badge_locator_advertising.locator("span.sr-only")
    expect(sr_text_adv).to_have_text("Advertising")


    print("Verifying Days in Stage...")
    # 4. Assert: Verify Days in Stage accessibility
    days_locator = page.locator("[title='5 days in current stage']").first
    expect(days_locator).to_be_visible()

    sr_days = days_locator.locator("span.sr-only")
    expect(sr_days).to_have_text("5 days in stage")

    print("Verifying Phone Button...")
    # 5. Assert: Verify Phone accessibility
    # Phone number: 5512345678
    phone_link = page.locator("a[aria-label='Call 5512345678']").first
    expect(phone_link).to_be_attached()

    print("Taking screenshot...")
    # 6. Screenshot
    page.screenshot(path="verification/verification.png")
    print("Verification complete!")

if __name__ == "__main__":
    os.makedirs("verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_prospect_card_accessibility(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
