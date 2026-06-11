const http = require("http");
const { execSync } = require("child_process");
const path = require("path");

const repo = process.argv[2] || ".";
http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/push" && req.method === "GET") {
    try {
      const out = execSync("git add -A && git commit -m 'Update from CMS' && git push", { cwd: repo, stdio: "pipe" });
      res.end("Pushed");
    } catch (e) {
      const msg = (e.stderr || e.message || "").toString();
      if (msg.includes("nothing to commit") || msg.includes("nothing to commit")) {
        res.end("Nothing to push");
      } else {
        res.statusCode = 500;
        res.end("Error: " + msg.slice(0, 200));
      }
    }
  } else {
    res.statusCode = 404;
    res.end();
  }
}).listen(8082, () => console.log("Push server on :8082"));
