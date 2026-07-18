import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "../server.js";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const siteRoot = path.join(projectRoot, "site");

async function startTestServer(t) {
  const server = createStaticServer({ siteRoot });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

test("the source is a complete, framework-free Persian document", async () => {
  const [html, robots, sitemap] = await Promise.all([
    readFile(path.join(siteRoot, "index.html"), "utf8"),
    readFile(path.join(siteRoot, "robots.txt"), "utf8"),
    readFile(path.join(siteRoot, "sitemap.xml"), "utf8"),
  ]);
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;

  assert.match(html, /<html lang="fa-IR" dir="rtl">/i);
  assert.equal(h1Count, 1);
  assert.match(html, /<title>تعمیر چرخ خیاطی در تهران \| چرخ کوک<\/title>/i);
  assert.match(html, /property="og:site_name" content="چرخ کوک"/i);
  assert.match(html, /"name": "چرخ کوک"/i);
  assert.doesNotMatch(html, /چرخ‌یار|چرخ یار/i);
  assert.match(html, /name="description"/i);
  assert.match(html, /name="robots" content="index,follow,max-image-preview:large"/i);
  assert.doesNotMatch(html, /name="robots" content="noindex/i);
  assert.match(html, /rel="canonical" href="https:\/\/www\.charkhkook\.com\/"/i);
  assert.match(html, /property="og:image" content="https:\/\/www\.charkhkook\.com\/assets\/images\/og\.png"/i);
  assert.doesNotMatch(html, /charkhyar-repair\.bardiaa-alaeddini\.chatgpt\.site/i);
  assert.match(html, /type="application\/ld\+json"/i);
  assert.match(html, /"@type": "LocalBusiness"/i);
  assert.match(html, /"@type": "PostalAddress"/i);
  assert.match(html, /"@type": "GeoCoordinates"/i);
  assert.match(html, /"latitude": 35\.676181791404275/i);
  assert.match(html, /"longitude": 51\.41692507968156/i);
  assert.match(html, /<link rel="stylesheet" href="\/styles\.css\?v=20260718-5">/i);
  assert.match(
    html,
    /rel="preload"[\s\S]*?href="\/assets\/fonts\/Yekan\.ttf"[\s\S]*?as="font"/i,
  );
  assert.match(
    html,
    /href="\/assets\/images\/repair-hero-corrected\.jpg"[\s\S]*?as="image"[\s\S]*?type="image\/jpeg"/i,
  );
  assert.match(html, /rel="icon" href="\/assets\/images\/favicon\.png" type="image\/png"/i);
  assert.match(html, /rel="apple-touch-icon" href="\/assets\/images\/favicon\.png"/i);
  assert.match(html, /"logo": "https:\/\/www\.charkhkook\.com\/assets\/images\/logo\.jpg"/i);
  assert.match(html, /"sameAs": \[[\s\S]*?https:\/\/www\.instagram\.com\/charkh_khayati_vaziri\//i);
  assert.equal((html.match(/src="\/assets\/images\/logo\.jpg"/gi) ?? []).length, 2);
  assert.match(
    html,
    /class="brand-logo"[\s\S]*?alt="لوگوی چرخ کوک، تعمیر تخصصی چرخ خیاطی"[\s\S]*?width="1040"[\s\S]*?height="840"/i,
  );
  assert.match(html, /class="brand brand-footer"[\s\S]*?loading="lazy"/i);
  assert.match(html, /<script src="\/script\.js\?v=20260717" defer><\/script>/i);
  assert.match(html, /width="1536"\s+height="983"/i);
  assert.match(html, /width="1536"\s+height="959"/i);
  assert.match(html, /src="\/assets\/images\/repair-hero-corrected\.jpg"/i);
  assert.doesNotMatch(html, /repair-hero\.webp/i);
  assert.match(
    html,
    /src="\/assets\/images\/repair-domestic\.webp"[\s\S]*?loading="eager"/i,
  );
  assert.match(
    html,
    /src="\/assets\/images\/repair-industrial\.webp"[\s\S]*?loading="eager"/i,
  );
  assert.match(html, /class="section-note section-note-stages"/i);
  assert.match(
    html,
    /src="\/assets\/images\/charkh-kook-banner\.jpg"[\s\S]*?width="1440"[\s\S]*?height="756"[\s\S]*?loading="lazy"/i,
  );
  assert.doesNotMatch(html, /__NEXT_DATA__|_next\/|react|hydration/i);
  assert.doesNotMatch(html, /tel:\+989121234567|wa\.me\/989121234567/i);
  assert.match(html, /href="tel:\+989124091885"/i);
  assert.match(html, /href="https:\/\/wa\.me\/989124091885"/i);
  assert.match(
    html,
    /href="https:\/\/www\.instagram\.com\/charkh_khayati_vaziri\?igsh=MWIzdjNqZ21zaHYxZw=="[\s\S]*?target="_blank"[\s\S]*?rel="noopener noreferrer"/i,
  );
  assert.match(html, /class="instagram-icon" aria-hidden="true"/i);
  assert.match(html, /<i class="instagram-icon" aria-hidden="true"><\/i>اینستاگرام چرخ کوک<\/span><\/a>/i);
  assert.doesNotMatch(html, />@charkh_khayati_vaziri</i);
  assert.match(html, /۰۹۱۲ ۴۰۹ ۱۸۸۵/);
  assert.doesNotMatch(html, /989212968977|0921 296 8977/i);
  assert.match(html, /class="header-cta" href="#contact"/i);
  assert.match(html, /class="button button-primary button-scroll" href="#contact"/i);
  assert.doesNotMatch(
    html,
    /class="(?:header-cta|button button-primary)[^\"]*" href="tel:/i,
  );
  assert.match(html, /"telephone": "\+989124091885"/i);
  assert.match(html, /تعمیر چرخ خیاطی در تهران؛/i);
  assert.match(html, /خیابان خیام، نرسیده به چهار راه گلوبندک، پاساژ همایون/i);
  assert.match(html, /class="location-card"/i);
  assert.match(html, /maps\.google\.com\/maps\?q=35\.676181791404275,51\.41692507968156/i);
  assert.match(robots, /Sitemap: https:\/\/www\.charkhkook\.com\/sitemap\.xml/i);
  assert.match(sitemap, /<loc>https:\/\/www\.charkhkook\.com\/<\/loc>/i);
  assert.doesNotMatch(`${robots}\n${sitemap}`, /charkhyar-repair/i);
  assert.match(html, /data-scroll-progress/i);
  assert.match(html, /class="service-marquee"/i);
  assert.match(html, /data-reveal="from-right"/i);
  assert.match(html, /data-reveal="from-left"/i);
  assert.match(html, /data-reveal="scale"/i);
  assert.doesNotMatch(html, /<form\b|data-contact-form|شرح مشکل و ارسال در واتساپ/i);
});

test("contact actions work without a form or database code", async () => {
  const html = await readFile(path.join(siteRoot, "index.html"), "utf8");
  const script = await readFile(path.join(siteRoot, "script.js"), "utf8");

  assert.match(html, /href="https:\/\/wa\.me\/989124091885"/i);
  assert.match(html, /href="tel:\+989124091885"/i);
  assert.doesNotMatch(html, /<form\b|<input\b|<textarea\b|<select\b/i);
  assert.doesNotMatch(script, /WHATSAPP_NUMBER|FormData|fetch\(|XMLHttpRequest|indexedDB/i);
});

test("responsive and reduced-motion behavior remain in plain CSS", async () => {
  const css = await readFile(path.join(siteRoot, "styles.css"), "utf8");

  assert.match(css, /@media \(max-width: 1120px\)/);
  assert.match(css, /@media \(max-width: 920px\)/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /html \{[\s\S]*?overflow-x: hidden;[\s\S]*?overflow-x: clip;/);
  assert.match(css, /\.site-header \{[\s\S]*?right: 0;[\s\S]*?left: 0;/);
  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?\[data-reveal="from-right"\],[\s\S]*?\[data-reveal="from-left"\][\s\S]*?translateY\(22px\)/,
  );
  assert.match(
    css,
    /\.floating-contact \{[\s\S]*?max-width: calc\(100% - 24px\);[\s\S]*?right: 12px;[\s\S]*?left: 12px;/,
  );
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@font-face[\s\S]*?font-family: "Yekan"/);
  assert.match(css, /font-display: swap/);
  assert.match(css, /\.brand-logo \{[\s\S]*?aspect-ratio: 26 \/ 21;[\s\S]*?object-fit: cover;/);
  assert.match(css, /\.contact-direct \.contact-action-primary \{[\s\S]*?grid-column: 1 \/ -1;/);
  assert.match(css, /\.contact-direct \.contact-action-instagram \{[\s\S]*?justify-content: center;/);
  assert.match(css, /\.instagram-icon::before/);
  assert.match(css, /\.instagram-icon::after/);
  assert.match(css, /@keyframes hero-copy-in/);
  assert.match(css, /@keyframes carousel-focus/);
  assert.match(css, /@keyframes contact-pulse/);
  assert.match(css, /@keyframes marquee-flow/);
  assert.match(css, /@keyframes heading-accent-in/);
  assert.match(css, /\[data-reveal="from-right"\]/);
  assert.match(css, /\[data-reveal="from-left"\]/);
  assert.match(css, /\.section-kicker[\s\S]*?min-height: 44px/);
  assert.match(css, /\.section-heading h2,[\s\S]*?line-height: 1\.3/);
  assert.match(css, /p,\s*summary[\s\S]*?line-height: 1\.9/);
  assert.match(css, /text-wrap: balance/);
  assert.match(css, /\.js \[data-reveal\]\.is-visible/);
  assert.match(css, /\.js \.diagnosis-answer:not\(\.is-active\)/);
  assert.match(css, /\.location-map iframe/);
});

test("package metadata has no framework or database dependencies", async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(projectRoot, "package.json"), "utf8"),
  );

  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.scripts.start, "node server.js");
  assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.devDependencies, undefined);
  assert.doesNotMatch(JSON.stringify(packageJson), /next|react|drizzle|database/i);

  for (const removedDirectory of ["app", "components", "db", "drizzle", "worker"] ) {
    await assert.rejects(access(path.join(projectRoot, removedDirectory)));
  }
});

test("Node server serves SEO HTML with security and cache headers", async (t) => {
  const origin = await startTestServer(t);
  const response = await fetch(`${origin}/`, {
    headers: { "Accept-Encoding": "gzip" },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'self'/);
  assert.match(
    response.headers.get("content-security-policy") ?? "",
    /frame-src https:\/\/www\.google\.com https:\/\/maps\.google\.com/,
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "no-cache");
  assert.match(await response.text(), /<main id="main-content">/i);
});

test("Node server serves the local font with the correct type and cache policy", async (t) => {
  const origin = await startTestServer(t);
  const response = await fetch(
    `${origin}/assets/fonts/Yekan.ttf`,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "font/ttf");
  assert.equal(response.headers.get("cache-control"), "public, max-age=86400");
  assert.ok((await response.arrayBuffer()).byteLength > 0);
});

test("Node server serves the optimized banner and carousel images", async (t) => {
  const origin = await startTestServer(t);
  const response = await fetch(
    `${origin}/assets/images/charkh-kook-banner.jpg`,
    { method: "HEAD" },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(response.headers.get("cache-control"), "public, max-age=86400");

  const heroResponse = await fetch(
    `${origin}/assets/images/repair-hero-corrected.jpg`,
    { method: "HEAD" },
  );
  assert.equal(heroResponse.status, 200);
  assert.equal(heroResponse.headers.get("content-type"), "image/jpeg");
  assert.equal(
    heroResponse.headers.get("cache-control"),
    "public, max-age=86400",
  );

  for (const image of ["repair-domestic.webp", "repair-industrial.webp"]) {
    const slideResponse = await fetch(`${origin}/assets/images/${image}`, {
      method: "HEAD",
    });
    assert.equal(slideResponse.status, 200);
    assert.equal(slideResponse.headers.get("content-type"), "image/webp");
    assert.equal(
      slideResponse.headers.get("cache-control"),
      "public, max-age=86400",
    );
  }
});

test("Node server redirects the duplicate URL and returns a real 404", async (t) => {
  const origin = await startTestServer(t);
  const redirect = await fetch(`${origin}/index.html?source=test`, {
    redirect: "manual",
  });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get("location"), "/?source=test");

  const missing = await fetch(`${origin}/missing-page`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /این صفحه پیدا نشد/);

  const traversal = await fetch(`${origin}/%2e%2e%2fpackage.json`);
  assert.ok([403, 404].includes(traversal.status));
  assert.doesNotMatch(await traversal.text(), /swing-machine-repair-static-site/);
});

test("deployment build contains the static client and Worker entry", async () => {
  await access(path.join(projectRoot, "dist", "client", "index.html"));
  await access(path.join(projectRoot, "dist", "client", "robots.txt"));
  await access(path.join(projectRoot, "dist", "server", "index.js"));
  await access(path.join(projectRoot, "dist", "server", "wrangler.json"));
});
