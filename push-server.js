const http = require("http");
const { execSync } = require("child_process");
const path = require("path");

const repo = process.argv[2] || ".";
http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/push" && req.method === "GET") {
    try {
      const out = execSync("git add -A && git commit -m 'Update from CMS' && git push", { cwd: repo }).toString();
      res.end("Pushed");
    } catch (e) {
      if (e.message.includes("nothing to commit")) {
        res.end("Nothing to push");
      } else {
        res.statusCode = 500;
        res.end("Error: " + e.stderr.toString().slice(0, 200));
      }
    }
  } else {
    res.statusCode = 404;
    res.end();
  }
}).listen(8082, () => console.log("Push server on :8082"));
