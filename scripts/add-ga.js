// Google Analytics(GA4) タグを全HTMLへ追加
// 2026-06 作成
const fs = require("fs");
const path = require("path");

// ==========================
// 設定
// ==========================
const ROOT_DIR = path.resolve(__dirname, ".."); // サイトのルート
const GA_ID = "G-6XFB1XKL4T";                   // ←ここを書き換える ←suwa.info

// ==========================
// GAタグ
// ==========================
const gaTag = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', '${GA_ID}');
</script>
`;

// ==========================

function processFile(filePath) {

    let html = fs.readFileSync(filePath, "utf8");

    // 既に追加済みならスキップ
    if (html.includes("googletagmanager.com/gtag/js")) {
        console.log("SKIP :", filePath);
        return;
    }

    const headClose = html.search(/<\/head>/i);

    if (headClose === -1) {
        console.log("NO </head> :", filePath);
        return;
    }

    html =
        html.slice(0, headClose) +
        gaTag +
        "\n" +
        html.slice(headClose);

    fs.writeFileSync(filePath, html, "utf8");

    console.log("ADD  :", filePath);
}

function walk(dir) {

    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {

        const full = path.join(dir, file.name);

        if (file.isDirectory()) {

            // node_modules等は除外
            if (["node_modules", ".git"].includes(file.name))
                continue;

            walk(full);

        } else {

            if (/\.(html?|xhtml)$/i.test(file.name)) {
                processFile(full);
            }

        }

    }

}

walk(ROOT_DIR);

console.log("完了");
