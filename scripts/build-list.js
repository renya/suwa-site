const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pagesDir = path.join(root, "pages");
const listDir = path.join(root, "list");
const outputFile = path.join(listDir, "index.html");

function getTitle(html, fallback) {
  const match = html.match(/<h1>(.*?)<\/h1>/);
  return match ? match[1].trim() : fallback;
}

const items = fs.readdirSync(pagesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => {
    const name = dirent.name;
    const indexPath = path.join(pagesDir, name, "index.html");

    if (!fs.existsSync(indexPath)) return null;

    const html = fs.readFileSync(indexPath, "utf8");
    const title = getTitle(html, name);

    return {
      title,
      url: `/pages/${name}/`
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.title.localeCompare(b.title, "ja"));

const listHtml = items.map(item => {
  return `      <li><a href="${item.url}">${item.title}</a></li>`;
}).join("\n");

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>信州・諏訪エリアの情報ページリスト｜suwa.info</title>
  <meta name="description" content="信州・諏訪エリアの情報ページリストを表示しています。">

  <link rel="icon" href="https://shimosuwa.info/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="https://shimosuwa.info/favicon.png">

  <meta property="og:image" content="https://shimosuwa.info/assets/suwako-head.png">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="stylesheet" href="https://shimosuwa.info/assets/css/style.css">
</head>

<body>
  <main class="container">
    <h1>信州・諏訪エリアの情報ページリスト</h1>

<p class="description">
  <a href="/pages/">信州・諏訪エリアの情報</a>ページリストを表示しています。<br>
  ${items.length}ページ
</p>

    <ul>
${listHtml}
    </ul>

<div class="footer-nav">
  <a href="https://shimosuwa.info/pages/" class="footer-link">
    下諏訪の情報へ→
  </a>
<a href="/contact/" class="footer-banner">
<img src="/assets/contact.png" alt="お問い合わせ">
</a>
</div>

  </main>
</body>
</html>
`;

fs.mkdirSync(listDir, { recursive: true });
fs.writeFileSync(outputFile, html, "utf8");

console.log(`生成しました: list/index.html`);
console.log(`ページ数: ${items.length}`);
