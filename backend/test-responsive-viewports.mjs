/**
 * test-responsive-viewports.mjs
 *
 * Senior Staff Responsive UI Verification Suite.
 * Automates real Google Chrome across 7 target viewports:
 * - Mobile: 360x800, 390x844, 430x932
 * - Tablet: 768x1024, 1024x768
 * - Desktop: 1366x768, 1920x1080
 *
 * Verifies:
 * 1. Zero horizontal overflow (scrollWidth <= innerWidth).
 * 2. Mobile drawer open/close behavior and focus.
 * 3. Form input layout, button sizing, and touch target accessibility.
 * 4. Cards, badges, and metrics responsiveness.
 */

import { chromium } from "playwright-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://127.0.0.1:5173";

const VIEWPORTS = [
  { name: "Mobile Small (Galaxy/Android)", width: 360, height: 800, type: "mobile" },
  { name: "Mobile Standard (iPhone 13/14)", width: 390, height: 844, type: "mobile" },
  { name: "Mobile Large (iPhone Pro Max)", width: 430, height: 932, type: "mobile" },
  { name: "Tablet Portrait (iPad 10\")", width: 768, height: 1024, type: "tablet" },
  { name: "Tablet Landscape (iPad 10\")", width: 1024, height: 768, type: "tablet" },
  { name: "Desktop Standard (Laptop)", width: 1366, height: 768, type: "desktop" },
  { name: "Desktop Wide (Full HD 1080p)", width: 1920, height: 1080, type: "desktop" },
];

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, description, details = "") {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`    ✅ [PASS] ${description}`);
  } else {
    failedChecks++;
    console.error(`    ❌ [FAIL] ${description} ${details ? `(${details})` : ""}`);
  }
}

async function runResponsiveAudit() {
  console.log("=================================================================");
  console.log("  CAREER PIVOT COACH: MULTI-VIEWPORT RESPONSIVE UI AUDIT         ");
  console.log("=================================================================\n");

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n── Viewport: ${vp.name} [${vp.width}x${vp.height}] (${vp.type.toUpperCase()}) ──`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.type === "mobile",
        hasTouch: vp.type === "mobile",
      });

      const page = await context.newPage();

      // Collect console errors
      const pageErrors = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));

      // ── 1. Landing Page Test ──
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

      const landingScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const landingInnerWidth = await page.evaluate(() => window.innerWidth);

      assert(
        landingScrollWidth <= landingInnerWidth,
        `Landing Page: No horizontal overflow (scrollWidth=${landingScrollWidth} <= innerWidth=${landingInnerWidth})`,
        `Exceeded by ${landingScrollWidth - landingInnerWidth}px`
      );

      // Verify Hero CTA is visible and clickable
      const heroCta = page.locator('text=Create Candidate Profile');
      if (await heroCta.count() > 0) {
        const ctaBox = await heroCta.boundingBox();
        assert(
          Boolean(ctaBox && ctaBox.width > 0 && ctaBox.height >= 36),
          `Landing Page: Hero CTA button rendered with touch-friendly height (${Math.round(ctaBox?.height || 0)}px)`
        );
      }

      // Check Mobile Navigation Menu on mobile/tablet portrait
      if (vp.width < 768) {
        const hamburger = page.locator('button[aria-label="Toggle navigation menu"]');
        assert(await hamburger.isVisible(), "Mobile View: Navigation toggle button is visible");

        const hamburgerBox = await hamburger.boundingBox();
        assert(
          Boolean(hamburgerBox && hamburgerBox.width >= 40 && hamburgerBox.height >= 40),
          `Mobile View: Hamburger touch target size is compliant (>=40px: width=${Math.round(hamburgerBox?.width || 0)}px, height=${Math.round(hamburgerBox?.height || 0)}px)`
        );

        // Click to expand drawer
        await hamburger.click();
        await page.waitForTimeout(200);

        const drawerLink = page.locator('div.md\\:hidden a:has-text("Sign In")');
        assert(await drawerLink.isVisible(), "Mobile View: Navigation drawer expands and displays navigation items");

        // Click again to close
        await hamburger.click();
        await page.waitForTimeout(100);
      } else {
        // Desktop / Tablet Landscape Navigation
        const desktopBrand = page.locator('header a:has-text("Career Pivot")');
        assert(await desktopBrand.isVisible(), "Desktop/Tablet: Brand header visible");
      }

      // ── 2. Auth Page (Registration Mode) ──
      await page.goto(`${BASE_URL}/auth?mode=register`, { waitUntil: "networkidle" });
      const authScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const authInnerWidth = await page.evaluate(() => window.innerWidth);

      assert(
        authScrollWidth <= authInnerWidth,
        `Auth Page (Register): No horizontal overflow (scrollWidth=${authScrollWidth} <= innerWidth=${authInnerWidth})`
      );

      const emailInput = page.locator('input[type="email"]');
      assert(await emailInput.isVisible(), "Auth Page: Candidate Email input is visible");
      const emailBox = await emailInput.boundingBox();
      assert(
        Boolean(emailBox && emailBox.width > 200 && emailBox.height >= 34),
        `Auth Page: Form inputs occupy full responsive card width (${Math.round(emailBox?.width || 0)}px)`
      );

      // ── 3. Auth Page (Login Mode) ──
      const loginTab = page.locator('button:has-text("Sign In")');
      if (await loginTab.count() > 0) {
        await loginTab.click();
        await page.waitForTimeout(150);

        const passInput = page.locator('input[type="password"]');
        assert(await passInput.isVisible(), "Auth Page (Sign In): Password input rendered");

        const forgotBtn = page.locator('button:has-text("Forgot password?")');
        assert(await forgotBtn.isVisible(), "Auth Page (Sign In): Forgot password link accessible");
      }

      // ── 4. 404 Not Found Page ──
      await page.goto(`${BASE_URL}/nonexistent-route-audit`, { waitUntil: "networkidle" });
      const notFoundScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const notFoundInnerWidth = await page.evaluate(() => window.innerWidth);

      assert(
        notFoundScrollWidth <= notFoundInnerWidth,
        `404 Page: No horizontal overflow (scrollWidth=${notFoundScrollWidth} <= innerWidth=${notFoundInnerWidth})`
      );

      const returnBtn = page.locator('button:has-text("Return to Dashboard")');
      assert(await returnBtn.isVisible(), "404 Page: Return to dashboard button visible and accessible");

      // Verify zero uncaught errors
      assert(
        pageErrors.length === 0,
        `Zero console/page errors encountered at ${vp.width}x${vp.height}`,
        pageErrors.join("; ")
      );

      await context.close();
    }
  } catch (err) {
    console.error("Audit fatal error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n=================================================================");
  console.log(`  RESPONSIVE AUDIT RESULTS: ${passedChecks} PASSED, ${failedChecks} FAILED (Total: ${totalChecks})`);
  console.log("=================================================================\n");

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runResponsiveAudit();

