import { chromium } from "@playwright/test";
import { createHmac } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
if (
  !process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL
)
  throw new Error("Use isolated PostgreSQL runner");
const require = createRequire(import.meta.url),
  base = "http://localhost:3403",
  out = resolve("../.impeccable/review/workers");
mkdirSync(out, { recursive: true });
async function ready(url) {
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(url)).status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 700));
  }
  throw new Error("Server unavailable");
}
await ready("http://localhost:3404/health/live");
await ready(base + "/login");
const browser = await chromium.launch(),
  checks = [],
  pages = [];
const assert = (ok, name) => {
  if (!ok) throw new Error(name);
  checks.push(name);
};
async function context(role) {
  const ctx = await browser.newContext({ reducedMotion: "reduce" }),
    token = `test-session-${role}`,
    sig = createHmac("sha256", process.env.BETTER_AUTH_SECRET)
      .update(token)
      .digest("base64");
  await ctx.addCookies([
    {
      name: "better-auth.session_token",
      value: encodeURIComponent(`${token}.${sig}`),
      url: base,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  return ctx;
}
try {
  const ctx = await context("ADMIN"),
    page = await ctx.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/internal/workers");
  await page
    .getByRole("heading", { name: "Trabajadores", exact: true })
    .waitFor();
  await page
    .getByRole("textbox", { name: "Buscar trabajadores" })
    .fill("no-existe");
  await page.getByRole("heading", { name: "No hay coincidencias" }).waitFor();
  assert(
    await page
      .getByRole("heading", { name: "No hay coincidencias" })
      .isVisible(),
    "Search empty state",
  );
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await page.getByLabel("Filtrar por estado").selectOption("INACTIVE");
  await page.getByRole("heading", { name: "No hay coincidencias" }).waitFor();
  assert(
    await page
      .getByRole("heading", { name: "No hay coincidencias" })
      .isVisible(),
    "Status filter",
  );
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await page
    .getByRole("link", { name: "Crear trabajador", exact: true })
    .click();
  await page.getByLabel("Nombre completo").fill("Nueva persona de prueba");
  await page.getByLabel("Correo de acceso").fill("new-worker-ui@example.test");
  await page.getByLabel("Contraseña inicial").fill("New-ui-test-2026");
  await page
    .getByRole("button", { name: "Crear trabajador", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Nueva persona de prueba", exact: true })
    .waitFor();
  assert(page.url().includes("/internal/workers/"), "Create opens new profile");
  await page.reload();
  await page
    .getByRole("heading", { name: "Nueva persona de prueba", exact: true })
    .waitFor();
  assert(true, "Create worker persists");
  await page
    .getByRole("link", { name: "Todos los trabajadores", exact: true })
    .click();
  await page.getByRole("link").filter({ hasText: "Equipo Auditoría" }).click();
  await page
    .getByRole("heading", { name: "Equipo Auditoría", exact: true })
    .waitFor();
  const profile = page.url().split("?")[0];
  assert(
    await page
      .getByRole("link", { name: /Preparar entrega del portal/ })
      .isVisible(),
    "Assigned task shown",
  );
  assert(
    await page.getByRole("link", { name: /^Project A/ }).isVisible(),
    "Assigned project shown",
  );
  await page
    .getByRole("link", { name: "Datos personales", exact: true })
    .click();
  await page.getByLabel("Cargo o especialidad").fill("Calidad y operaciones");
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Cambios guardados" })
    .waitFor();
  await page.reload();
  assert(
    (await page.getByLabel("Cargo o especialidad").inputValue()) ===
      "Calidad y operaciones",
    "Edit persists",
  );
  await page.getByRole("link", { name: "Auditoría", exact: true }).click();
  await page.getByText("27 eventos registrados", { exact: true }).waitFor();
  assert(
    await page.getByText("27 eventos registrados", { exact: true }).isVisible(),
    "Performed audit excludes account mutations",
  );
  await page.getByRole("link", { name: "Siguiente", exact: true }).click();
  await page.getByText(/Página 2 de 2/).waitFor();
  assert(
    (await page.locator("li:has(> time)").count()) === 2,
    "Audit pagination",
  );
  await page
    .getByRole("link", { name: "Cambios sobre su cuenta", exact: true })
    .click();
  await page
    .getByRole("heading", {
      name: "Colaborador actualizado · cargo",
      exact: true,
    })
    .waitFor();
  assert(
    await page
      .getByRole("heading", {
        name: "Colaborador actualizado · cargo",
        exact: true,
      })
      .isVisible(),
    "Account audit reflects saved changes",
  );
  await page.getByLabel("Tipo de acción").selectOption("CREATED");
  await page
    .getByRole("button", { name: "Aplicar filtros", exact: true })
    .click();
  await page.getByText("1 evento registrado", { exact: true }).waitFor();
  assert(
    await page.getByText("1 evento registrado", { exact: true }).isVisible(),
    "Audit action filter",
  );
  await page.getByRole("link", { name: "Limpiar", exact: true }).click();
  await page.getByRole("link", { name: "Acceso", exact: true }).click();
  await page
    .getByLabel("Contraseña temporal", { exact: true })
    .fill("Updated-ui-test-2026");
  await page.getByRole("button", { name: "Mostrar", exact: true }).click();
  assert(
    (await page
      .getByLabel("Contraseña temporal", { exact: true })
      .getAttribute("type")) === "text",
    "Password visibility toggle",
  );
  await page.getByRole("button", { name: "Ocultar", exact: true }).click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Restablecer contraseña", exact: true })
    .click();
  assert(
    (await page
      .getByLabel("Contraseña temporal", { exact: true })
      .inputValue()) === "Updated-ui-test-2026",
    "Cancel reset preserves form",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Restablecer contraseña", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Cambios guardados" })
    .waitFor();
  assert(true, "Password reset via UI succeeds");
  for (const width of [1440, 390, 1910]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, url] of [
      ["directory", base + "/internal/workers"],
      ["create", base + "/internal/workers/new"],
      ["profile", profile],
      ["audit", profile + "?section=audit&scope=account"],
      ["data", profile + "?section=data"],
      ["access", profile + "?section=access"],
    ]) {
      await page.goto(url);
      await page.locator("h1").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content: "nextjs-portal { display: none !important; }",
      });
      await page.addScriptTag({
        content: readFileSync(require.resolve("axe-core/axe.min.js"), "utf8"),
      });
      const a11y = await page.evaluate(async () =>
        (
          await window.axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      pages.push({ width, name, a11y, overflow });
      assert(!overflow, `${name} fits ${width}`);
      assert(
        a11y.length === 0,
        `${name} accessibility ${width}: ${JSON.stringify(a11y)}`,
      );
      await page.screenshot({
        path: resolve(out, `${name}-${width}.png`),
        fullPage: true,
      });
    }
  }
  const worker = await context("WORKER"),
    wp = await worker.newPage();
  await wp.goto(profile);
  assert(
    !(await wp
      .getByRole("heading", { name: "Equipo Auditoría", exact: true })
      .count()),
    "Worker cannot view administrator profile",
  );
  assert(errors.length === 0, `No runtime errors: ${errors.join(", ")}`);
  console.log(
    JSON.stringify({
      checks: checks.length,
      viewports: pages.length,
      result: "passed",
    }),
  );
} finally {
  writeFileSync(
    resolve(out, "report.json"),
    JSON.stringify({ checks, pages }, null, 2),
  );
  await browser.close();
}
