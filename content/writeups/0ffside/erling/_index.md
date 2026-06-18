---
title: Erling
date: 2026-06-15T00:00:00.000+01:00
draft: false
category: misc
tags:
  - misc
  - robots
  - recon
featureimage: https://media.tenor.com/IO5gWP5FrTUAAAAM/haaland-robot.gif
display:
  showAuthor: true
  showReadingTime: true
  showWordCount: true
  showPagination: true
showTableOfContents: true
media:
  showHero: false
---
{{< alert icon="flag" cardColor="rgba(var(--color-primary-500),0.1)" iconColor="rgb(var(--color-primary-400))" textColor="inherit" >}}
**Erling** &nbsp;·&nbsp; `Misc` &nbsp;·&nbsp; 200 pts

Haaland? aah! you mean the goal robo-.. Sorry I meant machine !
{{< /alert >}}

## First Look

Challenge name is Erling as in Erling Haaland, known as a "robot" for his machine-like goal scoring. The description leans into that joke. No attachment, no link, just a web target.

When there's nothing else to go on, the first thing to check on any web target is `robots.txt`. It's a standard file that tells crawlers what pages to avoid and CTF authors *(myself)* love hiding things there.

## Getting the Flag

```
GET https://0ffsidectf.ddns.net/robots.txt
```

```
User-agent: *
Disallow: /admin
[... many blank lines ...]
0ffside{m41s_qu3l_g4m3pl4y}
```

Flag was sitting at the bottom of `robots.txt`, buried under a wall of blank lines to make you scroll past the `Disallow` entries.

## Flag

`0ffside{m41s_qu3l_g4m3pl4y}`\
*Malla Gameplay !!!*
