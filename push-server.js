const http = require("http");
const { execSync } = require("child_process");
const path = require("path");

const repo = process.argv[2] || ".";
const START_TIME = Date.now();

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.end();
    return;
  }

  if (req.url === "/push" && req.method === "GET") {
    try {
      const out = execSync("git add -A && git commit -m 'Update from CMS' && git push", {
        cwd: repo, stdio: "pipe", encoding: "utf8", timeout: 60000,
      });
      res.end("Pushed");
    } catch (e) {
      const msg = (e.stderr || e.message || "").toString();
      if (/nothing to commit|nothing added|everything up-to-date/i.test(msg)) {
        res.end("Nothing to push");
      } else if (e.code === "ETIMEDOUT" || e.killed) {
        res.statusCode = 500;
        res.end("Error: Timed out (60s)");
      } else {
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