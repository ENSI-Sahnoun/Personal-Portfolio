const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = parseInt(process.env.PORT || "8083", 10);
const REPO = path.resolve(process.env.GIT_REPO_DIRECTORY || ".");
const START_TIME = Date.now();
const SECRET = process.env.LOCAL_SERVER_SECRET;

function checkAuth(req, res) {
  if (!SECRET) return true;
  const auth = req.headers["authorization"] || "";
  if (auth === "Bearer " + SECRET) return true;
  res.writeHead(401, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify({ error: "Unauthorized" }));
  return false;
}

function safePath(base, userPath) {
  const resolved = path.resolve(path.join(base, userPath));
  const resolvedBase = path.resolve(base);
  if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) return null;
  return resolved;
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function readFile(p) {
  return fs.promises.readFile(p).then(b => b.toString());
}

function writeFile(p, content) {
  return fs.promises.mkdir(path.dirname(p), { recursive: true }).then(() =>
    fs.promises.writeFile(p, content)
  );
}

function deleteFile(p) {
  return fs.promises.unlink(p).catch(() => {});
}

function safeDecode(buf) {
  try { return JSON.parse(buf.toString()); } catch { return null; }
}

async function queryFiles(dir, ext, depth) {
  if (depth <= 0) return [];
  let results = [];
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) {
        results = results.concat(await queryFiles(fp, ext, depth - 1));
      } else if (!ext || e.name.endsWith(ext)) {
        results.push(fp);
      }
    }
  } catch {}
  return results;
}

function relPath(full) {
  return path.relative(REPO, full).replace(/\\/g, "/");
}

async function entriesFromFiles(files) {
  return Promise.all(files.map(async (f) => {
    try {
      const buf = await fs.promises.readFile(path.join(REPO, f.path));
      return { data: buf.toString(), file: { path: f.path, label: f.label, id: sha256(buf) } };
    } catch {
      return { data: null, file: { path: f.path, label: f.label, id: null } };
    }
  }));
}

async function readMediaFile(p) {
  const full = path.join(REPO, p);
  const buf = await fs.promises.readFile(full);
  return { id: sha256(buf), content: buf.toString("base64"), encoding: "base64", path: relPath(full), name: path.basename(p) };
}

function sendJSON(res, data) {
  res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(data));
}

function sendError(res, code, msg) {
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify({ error: msg }));
}

function getGitStatus() {
  try {
    const { execSync } = require("child_process");
    const out = execSync("git status --porcelain", { cwd: REPO, encoding: "utf8", stdio: "pipe" });
    const lines = out.trim().split("\n").filter(Boolean);
    return { dirty: lines.length > 0, files: lines.map(l => ({ status: l.slice(0, 2), path: l.slice(3) })) };
  } catch {
    return { dirty: false, files: [], error: "git not available" };
  }
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") { res.end(); return; }

  if (!checkAuth(req, res)) return;

  if (req.method === "GET" && req.url === "/status") {
    const git = getGitStatus();
    return sendJSON(res, {
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      running: true,
      git,
    });
  }

  if (req.method === "GET" && req.url === "/api/v1") {
    return sendJSON(res, { repo: path.basename(REPO), publish_modes: ["simple"], type: "local_fs" });
  }

  if (req.method === "GET" && /^\/api\/v1\//.test(req.url)) {
    return sendJSON(res, { branch: req.url.split("/").pop() });
  }

  if (req.method === "POST" && req.url === "/api/v1") {
    let body = [];
    req.on("data", c => body.push(c));
    req.on("end", async () => {
      const buf = Buffer.concat(body);
      const parsed = safeDecode(buf);
      if (!parsed) return sendError(res, 422, "Invalid JSON");
      const { action, params } = parsed;
      try {
        await handleAction(action, params, res);
      } catch (e) {
        console.error("[local-server] action error:", e.message);
        sendError(res, 500, "Internal server error");
      }
    });
    return;
  }

  res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
  res.end();
});

async function handleAction(action, params, res) {
  switch (action) {
    case "info": {
      return sendJSON(res, { repo: path.basename(REPO), publish_modes: ["simple"], type: "local_fs" });
    }
    case "entriesByFolder": {
      const { folder, extension, depth } = params;
      const full = safePath(REPO, folder);
      if (!full) return sendError(res, 400, "Invalid path");
      const files = await queryFiles(full, extension, depth || 1);
      const entries = await entriesFromFiles(files.map(f => ({ path: relPath(f) })));
      return sendJSON(res, entries);
    }
    case "entriesByFiles": {
      const entries = await entriesFromFiles(params.files || []);
      return sendJSON(res, entries);
    }
    case "getEntry": {
      const [entry] = await entriesFromFiles([{ path: params.path }]);
      return sendJSON(res, entry);
    }
    case "persistEntry": {
      const { entry, dataFiles = [entry], assets = [], options } = params;
      for (const df of dataFiles) {
        if (!safePath(REPO, df.path)) return sendError(res, 400, "Invalid path");
        await writeFile(path.join(REPO, df.path), df.raw);
      }
      for (const asset of assets) {
        if (!safePath(REPO, asset.path)) return sendError(res, 400, "Invalid path");
        await writeFile(path.join(REPO, asset.path), Buffer.from(asset.content, asset.encoding || "utf8"));
      }
      if (dataFiles.every(e => e.newPath)) {
        for (const df of dataFiles) {
          if (!safePath(REPO, df.newPath)) return sendError(res, 400, "Invalid path");
          const oldP = path.join(REPO, df.path);
          const newP = path.join(REPO, df.newPath);
          await fs.promises.rename(oldP, newP).catch(() => {});
        }
      }
      return sendJSON(res, { message: "entry persisted" });
    }
    case "getMedia": {
      const { mediaFolder } = params;
      const full = safePath(REPO, mediaFolder);
      if (!full) return sendError(res, 400, "Invalid path");
      const files = await queryFiles(full, null, 1);
      const items = await Promise.all(files.map(f => readMediaFile(relPath(f))));
      return sendJSON(res, items);
    }
    case "getMediaFile": {
      const item = await readMediaFile(params.path);
      return sendJSON(res, item);
    }
    case "persistMedia": {
      const { asset } = params;
      if (!safePath(REPO, asset.path)) return sendError(res, 400, "Invalid path");
      await writeFile(path.join(REPO, asset.path), Buffer.from(asset.content, asset.encoding || "utf8"));
      const item = await readMediaFile(asset.path);
      return sendJSON(res, item);
    }
    case "deleteFile": {
      if (!safePath(REPO, params.path)) return sendError(res, 400, "Invalid path");
      await deleteFile(path.join(REPO, params.path));
      return sendJSON(res, { message: `deleted ${params.path}` });
    }
    case "deleteFiles": {
      for (const p of params.paths) {
        if (!safePath(REPO, p)) return sendError(res, 400, "Invalid path");
        await deleteFile(path.join(REPO, p));
      }
      return sendJSON(res, { message: `deleted ${params.paths.join(", ")}` });
    }
    case "getDeployPreview": {
      return sendJSON(res, null);
    }
    default: {
      // Unpublished entry actions — return empty/null for editorial workflow
      if (["unpublishedEntries", "unpublishedEntry", "unpublishedEntryDataFile", "unpublishedEntryMediaFile", "deleteUnpublishedEntry", "updateUnpublishedEntryStatus", "publishUnpublishedEntry"].includes(action)) {
        if (action === "unpublishedEntries") return sendJSON(res, []);
        if (action === "unpublishedEntry") return sendError(res, 404, "Not Found");
        return sendJSON(res, {});
      }
      return sendError(res, 422, `Unknown action: ${action}`);
    }
  }
}

server.listen(PORT, () => {
  console.log(`local-server running on :${PORT} (no git mode)`);
});
