#!/usr/bin/env bun
// Renders content/changelog/*.md into a single /changelog/index.html page.
//
// Source:   content/changelog/<slug>.md  (frontmatter: date, title, tag, slug)
// Output:   changelog/index.html          (gitignored — rebuilt in CI)
//
// Entries sort by `date` descending. Each entry gets an anchor id `<slug>` so
// URLs are shareable.

import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(repoRoot, "content", "changelog");
const outDir = join(repoRoot, "changelog");
const outFile = join(outDir, "index.html");

mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));
const entries = files
  .map((name) => {
    const raw = readFileSync(join(srcDir, name), "utf8");
    const { data, content } = matter(raw);
    if (!data.date || !data.title || !data.slug) {
      throw new Error(`${name}: missing required frontmatter (date/title/slug)`);
    }
    return {
      date: new Date(data.date),
      title: String(data.title),
      tag: String(data.tag || "post"),
      slug: String(data.slug),
      html: marked.parse(content),
    };
  })
  .sort((a, b) => b.date.getTime() - a.date.getTime());

const fmtDate = (d) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const entriesHtml = entries
  .map(
    (e) => `      <article class="cl-entry" id="${escape(e.slug)}">
        <header class="cl-entry-head">
          <time datetime="${e.date.toISOString().slice(0, 10)}">${fmtDate(e.date)}</time>
          <span class="cl-tag cl-tag-${escape(e.tag)}">${escape(e.tag.toUpperCase())}</span>
          <h2><a href="#${escape(e.slug)}">${escape(e.title)}</a></h2>
        </header>
        <div class="cl-body">
${e.html
  .split("\n")
  .map((l) => (l ? "          " + l : l))
  .join("\n")}
        </div>
      </article>`
  )
  .join("\n\n");

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Changelog — UIpen</title>
<meta name="description" content="UIpen releases and notes." />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta property="og:title" content="UIpen Changelog" />
<meta property="og:description" content="Releases and notes from the UIpen team." />
<meta property="og:type" content="website" />
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
<link rel="stylesheet" href="/styles.css" />
</head>
<body class="cl-page">
  <header class="cl-header">
    <a class="brand" href="/">
      <span class="logo-mark"><svg viewBox="0 0 64 64"><defs><linearGradient id="clg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8691F0"/><stop offset="100%" stop-color="#5E6AD2"/></linearGradient></defs><path d="M32 8 L52 44 L32 56 L12 44 Z" fill="url(#clg)"/><path d="M32 8 L32 54" stroke="#0a0a12" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="56" r="5" fill="#BFFF00"/></svg></span>
      <span>UIPEN</span>
    </a>
    <a class="cl-back" href="/">← Home</a>
  </header>

  <main class="cl-main">
    <h1 class="cl-title">Changelog</h1>
    <p class="cl-lede">Releases, shipping notes, and the occasional short post.</p>

    <div class="cl-entries">
${entriesHtml}
    </div>
  </main>

  <footer class="cl-foot">
    <a href="/">uipen.dev</a>
    <span class="cl-foot-sep">·</span>
    <a href="https://github.com/HousamKak/uipen" rel="noopener">GitHub</a>
    <span class="cl-foot-sep">·</span>
    <a href="/#pricing">Buy — $29</a>
  </footer>
</body>
</html>
`;

writeFileSync(outFile, page);
console.log(`wrote ${outFile} (${entries.length} entries)`);
