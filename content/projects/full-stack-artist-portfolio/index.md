---
title: Full Stack Artist Portfolio
slug: artistportfolio
date: 2026-05-07T21:45:04.000+01:00
media:
  showHero: true
display:
  showDate: true
  showReadingTime: true
  showWordCount: true
  showPagination: true
  showAuthor: true
  showHeadingAnchors: true
layout_opts:
  layoutBackgroundBlur: true
  layoutBackgroundHeaderSpace: true
  groupByYear: true
draft: false
---
# Portfolio Website for Mohamed Sahnoun

An online portfolio and digital gallery designed for **Mohamed Sahnoun**, a Tunisian sculptor and visual artist. This project showcases his biography, artistic journey, exhibitions, media recognition, institutional acquisitions, and features a curated catalog of wood and marble sculptures.

## Overview
This project is built primarily as a static HTML/CSS website utilizing light Vanilla JavaScript for client-side interactions and PHP for database management. Each webpage features a unique, dedicated layout while sharing a unified navigation system, footer, and brand identity.

The website is configured to run locally using a XAMPP server environment:
http://localhost/portfolio/

---

## Main Pages

### Homepage (index.html)
*   Features an immersive hero section showcasing a large background artwork and the artist's name.
*   Presents a concise introduction and biographical snippet of Mohamed Sahnoun with an asymmetric image collage.
*   Provides quick-access category previews for artworks created from wood, marble, and polystyrene.
*   Displays curated promotional cards highlighting major press and media features.

### Curriculum Vitae (cv.html)
*   Includes a professional portrait of the artist alongside detailed biographical write-ups and direct contact information.
*   Features a dynamic chronological timeline of exhibitions generated via a custom JavaScript array (exhibitions).
*   Implements a visual sticky-year indicator that updates smoothly on the viewport as the user scrolls.

### Testimonials & Press (testimonials.html)
*   Displays media recognition cards embedded with outbound links to external critique and coverage sources.
*   Hosts a comprehensive index of institutional validation and regional media coverage.
*   Contains an expandable user feedback form requesting fields for name, email, location, purchased artwork type, star rating, text review, visitation context, and preferred artistic medium.
*   Leverages JavaScript-driven visual notification blocks triggered natively via ?success or ?error URL parameters.

### Government Acquisitions (gov.html)
*   Showcases formal art pieces acquired directly by ministries, state institutions, and official public collections.
*   Arranges high-quality media outputs using a clean, modern masonry-style grid layout.

### Exhibitions (exhibitions.html)
*   Implements an exhibition-themed landing section.
*   Renders a highly curated gallery showing past event entries loaded dynamically via the images/sympo-*.jpg naming convention.
*   Triggers contextual information panels and contact triggers smoothly on user hover states.

### Storefront Catalog (catalog.html)
*   Splits the product layout neatly into two core tabs: Wood and Marble.
*   Populates product cards with details including clear asset imagery, titles, base material compositions, precise dimensions, and pricing structured in Tunisian Dinars (TND).
*   Enforces a lightweight "Load More" pagination script to smoothly render hidden inventory items incrementally.
*   Integrates an interactive product detail modal driven directly by a central client-side JavaScript object named products.
*   Employs a vanilla client-side shopping cart utility supporting item additions, structural deletions, and automatic subtotal/total calculations.
*   Deploys an integrated checkout form modal routing collected transactional data securely to buying_process.php.

---

## Features & Mechanics
*   **Unified Shell Architecture:** Shared header, footer, and navigation menus persist across all primary views.
*   **Decoupled Responsive Styling:** Responsive breakpoints are structured across specific CSS files segregated by page scope to optimize rendering speeds.
*   **Vanilla Core Logic:** The storefront engine, modal popups, and user checkout workflows are engineered entirely in pure JavaScript without external framework dependencies.
*   **Animated UI Modules:** Custom CSS transitions control operations for product lookups, shopping cart adjustments, review sliders, and checkout forms.

---

## Database Schema
*   **Database Name:** portfolio

| Table | Role / Function | Field Definitions |
| :--- | :--- | :--- |
| **`clients`** | Records all formal purchase requests dispatched from the store checkout modal. | `id`, `name`, `email`, `phone`, `location`, `carte`, `adresse`, `date`, `note` |
| **`testimonials`** | Logs community reviews and press entries submitted from the feedback terminal. | `id`, `name`, `email`, `location`, `artwork_type`, `rating`, `review`, `visitation`, `date`, `medium` |

---

## Local Deployment (XAMPP Setup)

1. Clone or extract the project directory explicitly into your local XAMPP web root directory:
   `C:\xampp\htdocs\portfolio`
2. Launch the **XAMPP Control Panel** and execute the **Apache** module (and **MySQL** if testing the database features).
3. Access the application profile securely through any local web browser via:
   `http://localhost/portfolio/index.html`

> ⚠️ **Implementation Note:** While static structural layouts (`.html` files) can be reviewed by rendering them directly in the browser via file path routing, all backend endpoints (`.php` files) and interactive forms must be executed through the local Apache server layer to handle data operations accurately.

---

## Maintenance Guidelines
*   **Zero Dependencies:** This codebase requires no active compilation steps, script builders, or package managers.
*   **Script Strategy:** JavaScript algorithms are embedded cleanly inside their respective views to maintain simple page-scoped execution environments.
*   **Data Synchronicity:** Product information is duplicated within both the hardcoded catalog HTML elements and the client-side JavaScript object (`products`). Ensure both structures are updated in tandem whenever modifying or adding items to the inventory.
