# Personal Portfolio

![Hugo](https://img.shields.io/badge/Hugo-FF4088?style=for-the-badge&logo=hugo&logoColor=white)
![Blowfish](https://img.shields.io/badge/Blowfish_Theme-FF4088?style=for-the-badge&logo=hugo&logoColor=white)
![Decap CMS](https://img.shields.io/badge/Decap_CMS-FF5E5B?style=for-the-badge&logo=netlify&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![TOML](https://img.shields.io/badge/TOML-9C4121?style=for-the-badge&logo=toml&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)


Personal portfolio and blog of Youssef Sahnoun, ENSI Student, CTF player, Technical trainer & Design Manager @ OSSEC.

🟢 Live at **[sahnoun.dev](https://sahnoun.dev)**

![Home page](screenshots/home.png)

---

## Content Sections

- **Writeups** — CTF writeups
- **Achievements** — certifications and competition placements
- **Projects** — personal projects
- **Resume** — CV page
- **About** — bio

## Local Development

**Requirements:** Node.js, Hugo extended

```bash
npm install
npm run dev
```

Starts three processes concurrently:
1. `decap-server` — local CMS backend (no git)
2. `push-server.js` — git push bridge on `:8082`
3. `hugo server` — dev server with live reload

or run `./dev.sh`

## Environment Variables

| Variable | Purpose |
|---|---|
| `PUSH_SERVER_SECRET` | Bearer token for `push-server.js` (optional, enables auth) |
| `LOCAL_SERVER_SECRET` | Bearer token for `local-server.js` (optional, enables auth) |

Copy `.env.example` to `.env` and fill in values. `.env` is gitignored.

## Build

```bash
npm run build   # outputs to ./public
```

## Project Structure

```
content/        # Markdown content
layouts/        # Hugo template overrides
assets/         # CSS / JS / images
static/         # Served as-is (admin panel, media)
config/         # Hugo configuration (TOML)
tina/           # TinaCMS schema
push-server.js  # Git push HTTP bridge
local-server.js # Local CMS file API server
dev.sh          # Dev orchestration script
```
