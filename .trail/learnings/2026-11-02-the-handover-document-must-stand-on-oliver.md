---
title: "The handover document must stand on its own: no old-project names, no git talk, clickable contents, screenshots only added never removed"
author: Oliver
date: 2026-11-02
branch: reporting-overhaul
cost: { minutes: 25, tokens: 302233 }
id: l-0e2144d3
scope: repo
status: active
src: agent
---

## Decided
- The handover document is its own product. It never names the separate project it grew out of, never mentions git, branches, commits, repositories or session notes, and has no document history table. It describes the platform as one application.
- Wording the owner asked for: Reporting Platform and SaaS Platform are "a part of the product", not "the half of". Asterisk-wrapped phrases must be bold.
- Model the structure on the Rate My Impact Solution Guide (plain-language, functional first), then add the technical side: dependency map with failure impact, libraries and runtime, hosting, secrets, security and privacy, and decisions with their cost. Never reduce screenshots; add more.
- Contents rows are real links, and the PDF also carries a bookmark sidebar and a back-to-contents link on every chapter.

## Watch out
- The PDF is built from docs/handover-html/*.html by headless Chrome. Contents page numbers are static text: render, read each heading's page from the PDF /Dests table, write the numbers in, render again until stable. Section, figure and table numbers are also static and must be renumbered after adding content.
- Chrome writes link targets as an old-style /Dests dictionary, so pypdf's named_destinations comes back empty. Read the root /Dests directly.
- A removal regex that ends in a bare newline silently fails on this file because it uses Windows line endings.
- Public pages load seven images from the old website's media folder, so headless screenshots show empty frames; skip those pages for screenshots.
- A screenshot of Profile, Sign-in and devices shows real IP addresses: blur them before use.

In the code:
- docs/handover-html/WHRD_Hub_Platform_Handover_TDD.html, img/
