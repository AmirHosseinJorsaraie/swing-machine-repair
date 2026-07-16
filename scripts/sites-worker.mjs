const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self' data:",
    "form-action 'self' https://wa.me",
    "frame-ancestors 'none'",
    "frame-src https://www.google.com https://maps.google.com",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function cacheControl(pathname) {
  if (pathname.endsWith(".html")) return "no-cache";
  if (/\.(?:jpe?g|png|svg|ttf|webp)$/i.test(pathname)) {
    return "public, max-age=86400";
  }
  return "public, max-age=3600, must-revalidate";
}

function withHeaders(response, pathname, status = response.status) {
  const headers = new Headers(response.headers);
  Object.entries(securityHeaders).forEach(([name, value]) => {
    headers.set(name, value);
  });
  headers.set("Cache-Control", cacheControl(pathname));
  return new Response(response.body, {
    status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    if (!env?.ASSETS) {
      return new Response("Static asset binding is unavailable", { status: 500 });
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { ...securityHeaders, Allow: "GET, HEAD" },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/index.html") {
      url.pathname = "/";
      return Response.redirect(url.toString(), 308);
    }

    const assetUrl = new URL(request.url);
    if (assetUrl.pathname === "/") assetUrl.pathname = "/index.html";

    const assetRequest = new Request(assetUrl, request);
    const assetResponse = await env.ASSETS.fetch(assetRequest);

    if (assetResponse.status !== 404) {
      return withHeaders(assetResponse, assetUrl.pathname);
    }

    const notFoundUrl = new URL("/404.html", request.url);
    const notFoundResponse = await env.ASSETS.fetch(new Request(notFoundUrl, request));
    return withHeaders(notFoundResponse, "/404.html", 404);
  },
};
