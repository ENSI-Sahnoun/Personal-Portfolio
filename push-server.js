const http = require("http");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const repo = path.resolve(process.argv[2] || ".");
const START_TIME = Date.now();
const SECRET = process.env.PUSH_SERVER_SECRET;

function checkAuth(req, res) {
  if (!SECRET) return true; // no secret configured → local dev, allow
  const auth = req.headers["authorization"] || "";
  if (auth === "Bearer " + SECRET) return true;
  res.statusCode = 401;
  res.end(JSON.stringify({ error: "Unauthorized" }));
  return false;
}

function safePath(base, userPath) {
  const resolved = path.resolve(path.join(base, userPath));
  if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
    return null;
  }
  return resolved;
}

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.end();
    return;
  }

  if (!checkAuth(req, res)) return;

  if (req.url === "/clean-empty" && req.method === "GET") {
    console.log("[clean] scanning for empty directories");
    try {
      const empty = [];

      function findEmpty(dir, rel) {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return false; }
        const subdirs = entries.filter(e => e.isDirectory());
        const files = entries.filter(e => !e.isDirectory());
        for (const d of subdirs) {
          const full = path.join(dir, d.name);
          const childRel = rel + "/" + d.name;
          findEmpty(full, childRel);
        }
        if (files.length === 0 && subdirs.length === 0) {
          empty.push(rel);
        }
      }

      const contentDir = path.join(repo, "content");
      const entries = fs.readdirSync(contentDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const full = path.join(contentDir, e.name);
          findEmpty(full, "content/" + e.name);
        }
      }

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ empty: empty }));
    } catch (e) {
      console.error("[clean] error:", e.message);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  if (req.url === "/clean-empty" && req.method === "POST") {
    let body = [];
    req.on("data", c => body.push(c));
    req.on("end", () => {
      try {
        const { paths } = JSON.parse(Buffer.concat(body).toString());
        const removed = [];
        for (const p of paths) {
          const full = safePath(repo, p);
          if (!full) {
            console.warn("[clean] rejected path traversal attempt:", p);
            continue;
          }
          try { fs.rmdirSync(full); removed.push(p); } catch (e) { console.log("[clean] failed to delete", p, e.message); }
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ removed: removed.length, paths: removed }));
      } catch (e) {
        console.error("[clean] post error:", e.message);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
    return;
  }

  if (req.url === "/commit" && req.method === "GET") {
    console.log("[commit] received commit request");
    try {
      execSync("bash scripts/gen-writeup-dates.sh", { cwd: repo, stdio: "pipe", encoding: "utf8", timeout: 10000 });
      execSync("git add -A && git commit -m 'Update from CMS'", {
        cwd: repo, stdio: "pipe", encoding: "utf8", timeout: 30000,
      });
      console.log("[commit] success");
      res.end("Committed");
    } catch (e) {
      const msg = (e.stderr || e.message || "").toString();
      if (/nothing to commit|nothing added/i.test(msg)) {
        console.log("[commit] nothing to commit");
        res.end("Nothing to commit");
      } else {
        console.error("[commit] error:", msg.slice(0, 500));
        res.statusCode = 500;
        res.end("Error: Commit failed");
      }
    }
    return;
  }

  if (req.url === "/push" && req.method === "GET") {
    console.log("[push] received push request");
    try {
      execSync("git pull --rebase origin main 2>/dev/null || true", { cwd: repo, stdio: "pipe", encoding: "utf8", timeout: 30000 });
      execSync("git push", {
        cwd: repo, stdio: "pipe", encoding: "utf8", timeout: 60000,
      });
      console.log("[push] success");
      res.end("Pushed");
    } catch (e) {
      const msg = (e.stderr || e.message || "").toString();
      if (/nothing to commit|nothing added|everything up-to-date/i.test(msg)) {
        console.log("[push] nothing to push");
        res.end("Nothing to push");
      } else if (e.code === "ETIMEDOUT" || e.killed) {
        console.log("[push] timed out");
        res.statusCode = 500;
        res.end("Error: Timed out");
      } else {
        console.error("[push] error:", msg.slice(0, 500));
        res.statusCode = 500;
        res.end("Error: Push failed");
      }
    }
    return;
  }

  if (req.url === "/status" && req.method === "GET") {
    try {
      const out = execSync("git status --porcelain", { cwd: repo, encoding: "utf8", stdio: "pipe" });
      const lines = out.trim().split("\n").filter(Boolean);
      const status = lines.length > 0;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        running: true,
        uptime: Math.floor((Date.now() - START_TIME) / 1000),
        dirty: status,
        files: status ? lines.map(l => ({ status: l.slice(0, 2).trim(), path: l.slice(3) })) : [],
      }));
    } catch (e) {
      console.error("[status] error:", e.message);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ running: true, uptime: 0, dirty: false, files: [] }));
    }
    return;
  }

  res.statusCode = 404;
  res.end();
}).listen(8082, () => console.log("push-server on :8082"));
