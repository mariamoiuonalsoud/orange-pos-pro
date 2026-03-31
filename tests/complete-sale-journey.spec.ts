import { test, expect, type Page, type Route } from "@playwright/test";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  barcode: string;
};

const products: ProductRow[] = [
  {
    id: "prod-1",
    name: "Orange Test Item",
    price: 100,
    category: "medical",
    image: "📦",
    stock: 10,
    barcode: "123456789012",
  },
];

async function jsonResponse(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
  });
}

function isSingleObjectRequest(route: Route) {
  const accept = route.request().headers()["accept"] || "";
  return accept.includes("application/vnd.pgrst.object+json");
}

async function mockSupabase(page: Page) {
  await page.route("**/rest/v1/*", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    const method = route.request().method();

    if (pathname.endsWith("/users") && method === "GET") {
      const isLoginQuery = url.searchParams
        .get("username")
        ?.includes("eq.cashier");
      if (isSingleObjectRequest(route) || isLoginQuery) {
        return jsonResponse(route, {
          id: "u-1",
          full_name: "Playwright Cashier",
          role: "cashier",
          username: "cashier",
          password: "1234",
        });
      }

      return jsonResponse(route, []);
    }

    if (pathname.endsWith("/products") && method === "GET") {
      return jsonResponse(route, products);
    }

    if (pathname.endsWith("/customers") && method === "GET") {
      return jsonResponse(route, []);
    }

    if (pathname.endsWith("/orders") && method === "GET") {
      return jsonResponse(route, []);
    }

    if (pathname.endsWith("/order_items") && method === "GET") {
      return jsonResponse(route, []);
    }

    if (pathname.endsWith("/customers") && method === "POST") {
      if (isSingleObjectRequest(route)) {
        return jsonResponse(route, { id: "cust-1" });
      }
      return jsonResponse(route, [{ id: "cust-1" }]);
    }

    if (pathname.endsWith("/orders") && method === "POST") {
      const now = new Date().toISOString();
      return jsonResponse(route, {
        id: "ord-1",
        receipt_number: "ORG-TEST-001",
        payment_method: "card",
        amount_paid: 230,
        change_due: 0,
        vat_amount: 30,
        discount_amount: 0,
        created_at: now,
      });
    }

    if (pathname.endsWith("/order_items") && method === "POST") {
      return jsonResponse(route, []);
    }

    if (pathname.endsWith("/products") && method === "PATCH") {
      return jsonResponse(route, []);
    }

    return route.continue();
  });
}

test("complete sale journey with barcode scanner simulation", async ({
  page,
}) => {
  await mockSupabase(page);

  await page.goto("http://localhost:8080/");
  await page.waitForSelector('[data-testid="login-username-input"]', { state: 'visible', timeout: 15000 });
  await page.getByTestId("login-username-input").fill("cashier");
  await page.getByTestId("login-password-input").fill("1234");
  await page.getByRole("button", { name: "دخول" }).click();

  await expect(page).toHaveURL(/\/pos$/);

  const scannerInput = page.getByPlaceholder("مرر جهاز الباركود الآن...");
  await scannerInput.fill("123456789012");
  await scannerInput.press("Enter");

  const searchInput = page.getByPlaceholder("ابحث يدوياً برقم الباركود...");
  await searchInput.fill("123456789012");

  const productCard = page
    .getByRole("button", { name: /Orange Test Item/ })
    .first();
  await productCard.click();

  const qtyCell = page.locator("span.w-6.text-center");
  await expect(qtyCell).toHaveText("2");

  const subtotalRow = page.locator("div.flex.justify-between", {
    hasText: "المجموع الفرعي",
  });
  await expect(subtotalRow).toContainText("200.00");

  const totalRow = page.locator("div.flex.justify-between.text-xl", {
    hasText: "الإجمالي النهائي",
  });
  await expect(totalRow).toContainText("230.00");

  await page.getByRole("button", { name: "إتمام العملية" }).click();
  await page.getByPlaceholder("رقم الموبايل").fill("01012345678");
  await page.getByPlaceholder("اسم العميل").fill("Test Customer");
  await page.getByRole("button", { name: /بطاقة/ }).click();

  await expect(page.getByText("تمت العملية بنجاح!")).toBeVisible();

  await page.getByRole("button", { name: "إغلاق" }).click();

  await expect(page.getByRole("button", { name: "إتمام العملية" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "مسح الكل" })).toHaveCount(0);
});
