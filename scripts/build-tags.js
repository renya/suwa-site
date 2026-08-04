const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pagesDir = path.join(root, "pages");
const listDir = path.join(root, "list");

// 自動生成したいタグ
const allowedTags = new Set([
  "スポット",
  "グルメ",
  "文化",
  "買い物",
  "宿泊",
  "諏訪圏",
  "アルバム",
  "温泉",
  "ワイン"
]);

const tagPages = new Map();

function getTitle(html, fallback) {
  const match = html.match(/<h1>(.*?)<\/h1>/);
  return match ? match[1].trim() : fallback;
}

function collectTagPages() {
  const pageDirs = fs.readdirSync(pagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

  for (const dirent of pageDirs) {
    const name = dirent.name;
    const indexPath = path.join(pagesDir, name, "index.html");

    if (!fs.existsSync(indexPath)) continue;

    const html = fs.readFileSync(indexPath, "utf8");
    const title = getTitle(html, name);
    const pageUrl = `/pages/${name}/`;

const tagMatches = [...html.matchAll(
  /<a[^>]*class="tag"[^>]*href="(?:https:\/\/shimosuwa\.info)?\/pages\/([^"]+)\/"[^>]*>([^<]+)<\/a>/g
)];

    for (const match of tagMatches) {
      const tagName = match[2].trim();

      if (!allowedTags.has(tagName)) continue;

      // タグページ自身は除外
      if (name === tagName) continue;

      if (!tagPages.has(tagName)) {
        tagPages.set(tagName, []);
      }

      tagPages.get(tagName).push({
        title,
        url: pageUrl
      });
    }
  }
}

function buildTagPage(tagName, items) {
  const uniqueItems = Array.from(
    new Map(items.map(item => [item.url, item])).values()
  ).sort((a, b) => a.title.localeCompare(b.title, "ja"));

  const listHtml = uniqueItems.map(item => {
    return `      <li><a href="${item.url}">${item.title}</a></li>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${tagName}｜suwa.info</title>
  <meta name="description" content="suwa.info内の「${tagName}」タグが付いたページリストです。">

  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">

  <meta property="og:image" content="https://shimosuwa.info/assets/suwako-head.png">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="stylesheet" href="https://shimosuwa.info/assets/css/style.css">
  
  <!-- Google Analytics (GA4) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-6XFB1XKL4T"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-6XFB1XKL4T');
  </script>
  </head>

<body>
  <main class="container">
    <h1>${tagName}</h1>

<p class="description">
  <a href="https://shimosuwa.info/pages/${tagName}/">${tagName}</a>タグが付いたページリストを表示しています。<br>
  ${uniqueItems.length}ページ
</p>

    <ul>
${listHtml}
    </ul>

<div class="footer-nav">
  <a href="https://shimosuwa.info/pages/" class="footer-link">
    下諏訪の情報へ→
  </a>
  <a href="https://shimosuwa.info/pages/タグ/" class="footer-link">
    タグ一覧へ→
  </a>
<a href="https://shimosuwa.info/contact/" class="footer-banner">
<img src="https://shimosuwa.info/assets/contact.png" alt="お問い合わせ">
</a>
</div>
</main>
</body>
</html>
`;
}

function writeTagPages() {
  for (const [tagName, items] of tagPages.entries()) {
    const tagDir = path.join(listDir, tagName);
    const outputFile = path.join(tagDir, "index.html");

    fs.mkdirSync(tagDir, { recursive: true });

    const html = buildTagPage(tagName, items);
    fs.writeFileSync(outputFile, html, "utf8");

    const uniqueCount = new Map(items.map(item => [item.url, item])).size;

    console.log(`生成しました: list/${tagName}/index.html`);
    console.log(`${tagName}: ${uniqueCount}ページ`);
  }
}

collectTagPages();
writeTagPages();
