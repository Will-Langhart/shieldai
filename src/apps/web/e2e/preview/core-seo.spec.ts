import { expect, test } from "@playwright/test";

// Key pages ship their title, description and canonical in the server HTML,
// before any JavaScript runs.

for (const path of ["/", "/bible", "/chat"]) {
  test(`${path} has title, description and canonical in the server HTML`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.ok()).toBe(true);
    const html = await res.text();
    expect(html).toMatch(/<title>[^<]*Shield AI[^<]*<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]{20,}"/);
    const canonical = `https://shieldai.cloud${path === "/" ? "" : path}`;
    expect(html).toMatch(new RegExp(`<link rel="canonical" href="${canonical}/?"`));
  });
}
