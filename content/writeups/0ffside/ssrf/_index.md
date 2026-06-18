---
title: 0FF THE PITCH!
date: 2026-06-18T00:00:00.000+01:00
draft: false
category: web
tags: []
featureimage: https://static01.nyt.com/athletic/uploads/wp/2025/02/15174712/Screenshot-2025-02-15-at-16.08.33.png?width=1200&height=1200&fit=cover
display:
  showAuthor: true
  showReadingTime: true
  showWordCount: true
  showPagination: true
  showHeadingAnchors: true
showTableOfContents: true
media:
  showHero: false
---
{{< alert icon="flag" cardColor="rgba(var(--color-primary-500),0.1)" iconColor="rgb(var(--color-primary-400))" textColor="inherit" >}}
**0FF THE PITCH !!** &nbsp;·&nbsp; `Web`

A FIFA tournament dashboard has an internal rankings service that seems to fetch from an API you can influence. Some players might need **discipline**, but you'll have to find the right official to make that call from the right place.

> **https://0ffsidectf.ddns.net/ssrf**
{{< /alert >}}

Writeup for "[SSRF](https://0ffsidectf.ddns.net/challenges)"

**Flag:** `0ffside{SSR3f_1s_Pr0ud}`

## First Look

> The challenge drops you on a FIFA World Cup 2026 Dashboard. Two pages: the main dashboard and a squad registry. The squad page lists six players, Messi, Ronaldo, Mbappe and co. One of them is **Jude Bellingham** *(Description says "#HALA_MADRID")*

On the dashboard there's a "FIFA Rankings API v2" section with a single button that says "Check Rankings". Nothing suspicious on the surface. Then I opened DevTools.

![Dashboard with Rankings widget](img/2026-06-18-165809_hyprshot.png)

Hidden inside the form:

```html
<input type="hidden" name="api_url" value="http://api.fifa.internal:5001/api/internal/rankings">
```



![](img/2026-06-18-165904_hyprshot.png)

\
A hidden `api_url` field that the JS reads and POSTs to `/ssrf/check-rankings`. The server fetches whatever URL you give it. That's the whole challenge right there.

## Confirming the SSRF

First I just sent the default value to make sure it actually works:

```bash
curl -s -X POST https://0ffsidectf.ddns.net/ssrf/check-rankings \
  --data "api_url=http://api.fifa.internal:5001/api/internal/rankings"
```

```json
{"nation": "Argentina", "fifa_rank": 1, "points": 1883, "next_match": "World Cup 2026 Group Stage"}
```

Real response from an internal service. The server is definitely fetching this for us. Now let's point it somewhere more interesting.

## Internal Service Discovery

Tried the obvious — `http://localhost/ssrf/admin` and `http://127.0.0.1/ssrf/admin`. Both returned "Could not reach the rankings API service." Port blocking probably. Flask apps default to **port 5000**, so:

```bash
curl -s -X POST https://0ffsidectf.ddns.net/ssrf/check-rankings \
  --data "api_url=http://localhost:5000/admin"
```

Got back a full HTML page titled **"Tournament Admin — World Cup 2026"**. Externally this route returns 403. Internally via SSRF, no problem.

![Admin panel accessible via SSRF](img/2026-06-18-170224_hyprshot.png)

The admin panel has a disciplinary section — **Red Cards**. Issues red cards to players by name. The endpoint pattern is `/admin/red-card?name=<player>`.

Bellingham was on the squad page. The challenge is literally called SSRF. Not hard to connect the dots.

## Getting the Flag

```bash
curl -s -X POST https://0ffsidectf.ddns.net/ssrf/check-rankings \
  --data "api_url=http://127.0.0.1:5000/admin/red-card?name=Jude%20Bellingham"
```



![](img/2026-06-18-170358_hyprshot.png)

**`Flag found : 0ffside{SSR3f_1s_Pr0ud}`**

## Why It Works

The vulnerability is the server blindly fetching a URL supplied by the user. The internal `/admin` route was protected at the network level, it only accepts requests from localhost. \
SSRF bypasses this because *the server makes the request*, so from the admin panel's perspective it's coming from `127.0.0.1`, not from us.
