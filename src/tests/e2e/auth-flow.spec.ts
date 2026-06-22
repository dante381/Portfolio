// src/tests/e2e/auth-flow.spec.ts
// Playwright E2E spec for the authentication flow and security header checks.
//
// Run with: npx playwright test src/tests/e2e/auth-flow.spec.ts
// Requires the dev server at http://localhost:3000 and valid ADMIN_* env vars.
// Install browsers first: npx playwright install
//
// Phase 4 coverage:
//   • Auth middleware redirects (unauth /dashboard → /login, /api/stats → 401)
//   • Login page a11y (labels, aria-live, button)
//   • Cookie flags (HttpOnly + SameSite=Strict — requires ADMIN_PASSWORD_PLAINTEXT)
//   • Security response headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
//
// Note: Cookie flag assertions require ADMIN_PASSWORD_PLAINTEXT in test env.
//       Skip gracefully when not set.
// Note: HSTS header only appears over HTTPS (Strict-Transport-Security is
//       stripped on http by design). Verify HSTS on prod via securityheaders.com.

import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Auth flow — unauthenticated", () => {
  test("visiting /dashboard without auth redirects to /login", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirect preserves ?next=/dashboard query param", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/next=%2Fdashboard/);
  });

  test("/login page renders username and password fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("submitting wrong credentials shows generic error (not specific)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel("Username").fill("wronguser");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for error message
    const errorAlert = page.getByRole("alert");
    await expect(errorAlert).toBeVisible();

    // Must not reveal whether username or password was wrong
    const errorText = await errorAlert.textContent();
    expect(errorText).not.toMatch(/user not found/i);
    expect(errorText).not.toMatch(/wrong password/i);
    expect(errorText).not.toMatch(/no such user/i);
  });

  test("/api/stats returns 401 without session cookie", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/stats`);
    expect(res.status()).toBe(401);
  });
});

test.describe("Auth flow — login page accessibility", () => {
  test("login form has proper labels and aria attributes", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Labels are associated with inputs
    const usernameInput = page.getByLabel("Username");
    const passwordInput = page.getByLabel("Password");

    await expect(usernameInput).toHaveAttribute("type", "text");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Submit button is accessible
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();
  });

  test("error message is announced via aria-live", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // The error container has role=alert + aria-live=assertive
    // (it appears conditionally — we check its attributes once visible)
    await page.getByLabel("Username").fill("x");
    await page.getByLabel("Password").fill("y");
    await page.getByRole("button", { name: /sign in/i }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toHaveAttribute("aria-live", "assertive");
  });
});

test.describe("Cookie flags", () => {
  // NOTE: These tests require valid ADMIN credentials in env vars.
  // Skip gracefully if env vars are not set.
  test("session cookie has HttpOnly and SameSite=Strict after login", async ({
    request,
  }) => {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD_PLAINTEXT; // set in test env only

    test.skip(!adminUsername || !adminPassword, "Admin creds not set in test env");

    const res = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: adminUsername, password: adminPassword },
      headers: {
        "content-type": "application/json",
        origin: BASE_URL,
      },
    });

    expect(res.status()).toBe(200);

    const setCookie = res.headers()["set-cookie"] ?? "";
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=strict");
  });
});

test.describe("Security response headers", () => {
  test("portfolio page returns X-Frame-Options: DENY", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/`);
    const xfo = res.headers()["x-frame-options"];
    expect(xfo).toBe("DENY");
  });

  test("portfolio page returns X-Content-Type-Options: nosniff", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/`);
    const xcto = res.headers()["x-content-type-options"];
    expect(xcto).toBe("nosniff");
  });

  test("portfolio page returns Content-Security-Policy with frame-ancestors none", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/`);
    const csp = res.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test("portfolio page returns Referrer-Policy", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/`);
    expect(res.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  test("portfolio page does NOT return x-powered-by header", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/`);
    expect(res.headers()["x-powered-by"]).toBeUndefined();
  });
});
