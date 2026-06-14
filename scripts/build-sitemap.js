// scripts/build-sitemap.js

const fs = require("fs");
const path = require("path");

const ROOT_URL = "https://suwa.info";

const pagesDir = path.join(__dirname, "../pages");
const listDir = path.join(__dirname, "../list");
const outputPath = path.join(__dirname, "../sitemap.xml");

function getDirectories(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function getLastMod(filePath) {
  const stat = fs.statSync(filePath);

  return stat.mtime.toISOString().split("T")[0];
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const urls = [];

// top page
{
  const topIndex = path.join(__dirname, "../index.html");

  let lastmod = null;

  if (fs.existsSync(topIndex)) {
    lastmod = getLastMod(topIndex);
  }

  urls.push({
    url: `${ROOT_URL}/`,
    lastmod,
  });
}

// pages/*
if (fs.existsSync(pagesDir)) {
  const pageDirs = getDirectories(pagesDir);

  for (const name of pageDirs) {
    const indexPath = path.join(pagesDir, name, "index.html");

    let lastmod = null;

    if (fs.existsSync(indexPath)) {
      lastmod = getLastMod(indexPath);
    }

    urls.push({
      url: `${ROOT_URL}/pages/${name}/`,
      lastmod,
    });
  }
}

// list/*
if (fs.existsSync(listDir)) {
  const listDirs = getDirectories(listDir);

  for (const name of listDirs) {
    if (name === "assets") continue;

    const indexPath = path.join(listDir, name, "index.html");

    let lastmod = null;

    if (fs.existsSync(indexPath)) {
      lastmod = getLastMod(indexPath);
    }

    urls.push({
      url: `${ROOT_URL}/list/${name}/`,
      lastmod,
    });
  }

  // /list/
  const listIndex = path.join(listDir, "index.html");

  let lastmod = null;

  if (fs.existsSync(listIndex)) {
    lastmod = getLastMod(listIndex);
  }

  urls.push({
    url: `${ROOT_URL}/list/`,
    lastmod,
  });
}

// XML生成
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((item) => {
    return `  <url>
    <loc>${escapeXml(item.url)}</loc>
    ${
      item.lastmod
        ? `<lastmod>${item.lastmod}</lastmod>`
        : ""
    }
  </url>`;
  })
  .join("\n")}
</urlset>
`;

// 出力
fs.writeFileSync(outputPath, xml, "utf8");

console.log(`sitemap.xml generated: ${urls.length} URLs`);
