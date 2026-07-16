import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const defaultSiteRoot = path.join(projectRoot, "site");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".ttf", "font/ttf"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);

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

function cacheControlFor(extension) {
  if (extension === ".html") return "no-cache";
  if ([".webp", ".png", ".svg", ".jpg", ".jpeg", ".ttf"].includes(extension)) {
    return "public, max-age=86400";
  }
  return "public, max-age=3600, must-revalidate";
}

function isCompressible(contentType) {
  return (
    contentType.startsWith("text/") ||
    contentType.includes("javascript") ||
    contentType.includes("json") ||
    contentType.includes("xml")
  );
}

function safeFilePath(siteRoot, pathname) {
  const relativePath = pathname.replace(/^\/+/, "");
  const resolvedRoot = path.resolve(siteRoot);
  const resolvedFile = path.resolve(resolvedRoot, relativePath);

  if (
    resolvedFile !== resolvedRoot &&
    !resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    return null;
  }

  return resolvedFile;
}

function writePlainResponse(response, statusCode, message, method = "GET") {
  const body = Buffer.from(message, "utf8");
  response.writeHead(statusCode, {
    ...securityHeaders,
    "Cache-Control": "no-store",
    "Content-Length": body.length,
    "Content-Type": "text/plain; charset=utf-8",
  });
  if (method === "HEAD") response.end();
  else response.end(body);
}

async function serveFile(request, response, filePath, statusCode = 200) {
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) throw new Error("Not a file");

  const extension = path.extname(filePath).toLowerCase();
  const contentType = contentTypes.get(extension) ?? "application/octet-stream";
  const etag = `W/\"${fileStats.size.toString(16)}-${Math.trunc(fileStats.mtimeMs).toString(16)}\"`;

  if (request.headers["if-none-match"] === etag) {
    response.writeHead(304, {
      ...securityHeaders,
      "Cache-Control": cacheControlFor(extension),
      ETag: etag,
    });
    response.end();
    return;
  }

  const acceptsGzip = /(?:^|,)\s*gzip\s*(?:,|$)/i.test(
    request.headers["accept-encoding"] ?? "",
  );
  const useGzip =
    request.method !== "HEAD" &&
    fileStats.size > 1024 &&
    acceptsGzip &&
    isCompressible(contentType);

  const headers = {
    ...securityHeaders,
    "Cache-Control": cacheControlFor(extension),
    "Content-Type": contentType,
    ETag: etag,
  };

  if (useGzip) {
    headers["Content-Encoding"] = "gzip";
    headers.Vary = "Accept-Encoding";
  } else {
    headers["Content-Length"] = fileStats.size;
  }

  response.writeHead(statusCode, headers);
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = createReadStream(filePath);
  stream.on("error", () => response.destroy());
  if (useGzip) stream.pipe(createGzip({ level: 6 })).pipe(response);
  else stream.pipe(response);
}

export function createStaticServer({ siteRoot = defaultSiteRoot } = {}) {
  return createServer(async (request, response) => {
    const method = request.method ?? "GET";
    if (!['GET', 'HEAD'].includes(method)) {
      response.setHeader("Allow", "GET, HEAD");
      writePlainResponse(response, 405, "Method Not Allowed", method);
      return;
    }

    let url;
    try {
      url = new URL(request.url ?? "/", "http://localhost");
      url.pathname = decodeURIComponent(url.pathname);
    } catch {
      writePlainResponse(response, 400, "Bad Request", method);
      return;
    }

    if (url.pathname === "/index.html") {
      response.writeHead(308, {
        ...securityHeaders,
        "Cache-Control": "no-store",
        Location: `/${url.search}`,
      });
      response.end();
      return;
    }

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = safeFilePath(siteRoot, pathname);

    if (!filePath) {
      writePlainResponse(response, 403, "Forbidden", method);
      return;
    }

    try {
      await serveFile(request, response, filePath);
    } catch {
      const notFoundPath = path.join(siteRoot, "404.html");
      try {
        await serveFile(request, response, notFoundPath, 404);
      } catch {
        writePlainResponse(response, 404, "Not Found", method);
      }
    }
  });
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const portFlag = process.argv.indexOf("--port");
  const hostFlag = process.argv.indexOf("--host");
  const portValue =
    portFlag >= 0 ? process.argv[portFlag + 1] : process.env.PORT ?? "3000";
  const host =
    hostFlag >= 0 ? process.argv[hostFlag + 1] : process.env.HOST ?? "0.0.0.0";
  const port = Number.parseInt(portValue, 10);
  const server = createStaticServer();

  server.listen(Number.isFinite(port) ? port : 3000, host, () => {
    console.log(`Static site running at http://localhost:${Number.isFinite(port) ? port : 3000}`);
  });
}
