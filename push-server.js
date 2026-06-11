const http = require("http");
const { execSync } = require("child_process");
const path = require("path");

const repo = path.resolve(process.argv[2] || ".");
const START_TIME = Date.now();

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.end();
    return;
  }

  if (req.url === "/clean-empty" && req.method === "GET") {
    console.log("[clean] scanning for empty directories");
    try {
      const fs = require("fs");
      const pathModule = require("path");
      const empty = [];

      function findEmpty(dir, rel) {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return false; }
        const subdirs = entries.filter(e => e.isDirectory());
        const files = entries.filter(e => !e.isDirectory());
        for (const d of subdirs) {
          const full = pathModule.join(dir, d.name);
          const childRel = rel + "/" + d.name;
          findEmpty(full, childRel);
        }
        if (files.length === 0 && subdirs.length === 0) {
          empty.push(rel);
        }
      }

      const contentDir = pathModule.join(repo, "content");
      const entries = fs.readdirSync(contentDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const full = pathModule.join(contentDir, e.name);
          findEmpty(full, "content/" + e.name);
        }
      }

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ empty: empty }));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (req.url === "/clean-empty" && req.method === "POST") {
    let body = [];
    req.on("data", c => body.push(c));
    req.on("end", () => {
      try {
        const fs = require("fs");
        const { paths } = JSON.parse(Buffer.concat(body).toString());
        const removed = [];
        for (const p of paths) {
          const full = pathModule.join(repo, p);
          try { fs.rmdirSync(full); removed.push(p); } catch (e) { console.log("[clean] failed to delete", full, e.message); }
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ removed: removed.length, paths: removed }));
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.url === "/push" && req.method === "GET") {
    console.log("[push] received push request");
    try {
      const out = execSync("git add -A && git commit -m 'Update from CMS' && git push", {
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
        res.end("Error: Timed out (60s)");
      } else {
        console.log("[push] error: " + msg.slice(0, 200));
        res.statusCode = 500;
        res.end("Error: " + msg.slice(0, 300));
      }
    }
    return;
  }

  if (req.url === "/status" && req.method === "GET") {
    try {
      const out = execSync("git status --porcelain", { cwd: repo, encoding: "utf8", stdio: "pipe" });
      const lines = out.trim().split("\n").filter(Boolean);
      const status = lines.length > 0;
      const body = JSON.stringify({
        running: true,
        uptime: Math.floor((Date.now() - START_TIME) / 1000),
        dirty: status,
        files: status ? lines.map(l => ({ status: l.slice(0, 2).trim(), path: l.slice(3) })) : [],
      });
      res.setHeader("Content-Type", "application/json");
      res.end(body);
    } catch (e) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ running: true, uptime: 0, dirty: false, files: [] }));
    }
    return;
  }

  res.statusCode = 404;
  res.end();
}).listen(8082, () => console.log("push-server on :8082"));