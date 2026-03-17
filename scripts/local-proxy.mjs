#!/usr/bin/env node
import http from "node:http";
import { URL } from "node:url";

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i === -1) return undefined;
  const exact = args[i];
  if (exact.includes("=")) return exact.split("=").slice(1).join("=");
  return args[i + 1];
};

const target = getArg("target") || process.env.TARGET_URL;
const port = Number(getArg("port") || process.env.PROXY_PORT || 8080);
const insecure = (getArg("insecure") || process.env.PROXY_INSECURE_TLS || "0") === "1";

if (insecure) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

if (!target) {
  console.error("Missing target API URL.");
  console.error("Usage: npm run proxy -- --target https://your-api-host");
  process.exit(1);
}

const targetBase = new URL(target.endsWith("/") ? target : `${target}/`);

const corsHeaders = (req) => ({
  "Access-Control-Allow-Origin": req.headers.origin || "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": req.headers["access-control-request-headers"] || "*",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin, Access-Control-Request-Headers",
});

const stripHopByHopHeaders = (headers) => {
  const blocked = new Set([
    "host",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "origin",
    "referer",
    "content-length",
  ]);

  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (blocked.has(k.toLowerCase())) continue;
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
};

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Bad request" }));
      return;
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders(req));
      res.end();
      return;
    }

    const targetUrl = new URL(req.url, targetBase);

    const bodyChunks = [];
    for await (const chunk of req) bodyChunks.push(chunk);
    const bodyBuffer = bodyChunks.length ? Buffer.concat(bodyChunks) : undefined;

    const headers = stripHopByHopHeaders(req.headers);

    const fetchRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : bodyBuffer,
    });

    const responseHeaders = {
      ...corsHeaders(req),
    };

    fetchRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === "content-encoding" || lower === "content-length") return;
      responseHeaders[key] = value;
    });

    const responseBody = Buffer.from(await fetchRes.arrayBuffer());
    responseHeaders["Content-Length"] = String(responseBody.length);

    res.writeHead(fetchRes.status, responseHeaders);
    res.end(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy error";
    res.writeHead(502, {
      ...corsHeaders(req),
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify({ error: message }));
  }
});

server.listen(port, () => {
  console.log(`CORS proxy running: http://localhost:${port}`);
  console.log(`Forwarding to: ${targetBase.origin}`);
  if (insecure) {
    console.log("TLS verification disabled (PROXY_INSECURE_TLS=1)");
  }
});
