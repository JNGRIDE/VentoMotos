from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_login_page(page: Page):
    print("Navigating to login page...")
    page.goto("http://localhost:3000")

    # Wait for the page to load
    time.sleep(2)

    # Check if we are on the login page or the config error page
    # Since we didn't provide env vars, it should be the config error page

    # Look for "Action Required: Configure Your Keys"
    try:
        expect(page.get_by_text("Action Required: Configure Your Keys")).to_be_visible(timeout=5000)
        print("Saw 'Action Required' message.")
    except Exception as e:
        print("Did not see 'Action Required'. Checking for Login form...")
        expect(page.get_by_text("MotoSales CRM")).to_be_visible()
        print("Saw 'MotoSales CRM' title.")

    # Screenshot
    print("Taking screenshot...")
    page.screenshot(path="/home/jules/verification/login_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_login_page(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
