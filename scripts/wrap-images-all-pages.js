// pages 以下のHTMLを再帰的に探し、
// i.suwa.info/p/ の画像のうち、まだ <a> に囲まれていないものだけを
// オリジナル画像へのリンクで囲む一括処理スクリプト。
//
// 追加モジュール不要（Node.js標準の fs / path のみ）
//
// 使い方:
//   node scripts/wrap-images-all-pages.js
//
// pages 以下の .html / .htm を再帰的に処理します。
// 変更したHTMLだけ .bak を作成します。
// 既に <a> の中にある画像は、リンク先の種類に関係なく変更しません。
// 文字コードは UTF-8 として読み書きします。

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve("pages");

if (!fs.existsSync(ROOT)) {
  console.error(`対象フォルダが見つかりません: ${ROOT}`);
  process.exit(1);
}

let fileCount = 0;
let changedFileCount = 0;
let unchangedFileCount = 0;
let convertedCount = 0;
let skippedCount = 0;
let errorCount = 0;

function findHtmlFiles(dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (
      entry.isFile() &&
      /\.(html?|HTML?)$/.test(entry.name)
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

function processFile(filePath) {
  fileCount++;

  let html;

  try {
    html = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`読み込みエラー: ${filePath}`);
    console.error(error.message);
    errorCount++;
    return;
  }

  const imgPattern =
    /<img(\s+[^>]*?\bsrc="(https:\/\/i\.suwa\.info\/p\/[^"]+\.(?:jpg|jpeg|png|webp))"[^>]*)>/gi;

  let fileConverted = 0;
  let fileSkipped = 0;

  const result = html.replace(
    imgPattern,
    (fullMatch, attrs, imageUrl, offset, wholeHtml) => {

      // この<img>より前で最後に出てきた<a>と</a>を比較。
      // <a>の方が後なら、この<img>は<a>の中にあると判断する。
      const before = wholeHtml.slice(0, offset);
      const lastOpenA = before.lastIndexOf("<a");
      const lastCloseA = before.lastIndexOf("</a>");

      if (lastOpenA > lastCloseA) {
        fileSkipped++;
        return fullMatch;
      }

      fileConverted++;

      return `<a href="${imageUrl}" target="_blank">
  <img${attrs}>
</a>`;
    }
  );

  convertedCount += fileConverted;
  skippedCount += fileSkipped;

  if (fileConverted === 0) {
    unchangedFileCount++;
    return;
  }

  const backupPath = `${filePath}.bak`;

  try {
    fs.copyFileSync(filePath, backupPath);
    fs.writeFileSync(filePath, result, "utf8");

    changedFileCount++;

    const relativePath = path.relative(process.cwd(), filePath);
    console.log(
      `変換: ${relativePath} / ${fileConverted}枚` +
      (fileSkipped ? ` / スキップ${fileSkipped}枚` : "")
    );
  } catch (error) {
    console.error(`書き込みエラー: ${filePath}`);
    console.error(error.message);
    errorCount++;
  }
}

const files = findHtmlFiles(ROOT);

for (const filePath of files) {
  processFile(filePath);
}

console.log("");
console.log("===== 画像リンク一括処理 完了 =====");
console.log(`HTMLファイル数        : ${fileCount}`);
console.log(`変更したファイル      : ${changedFileCount}`);
console.log(`変更なしのファイル    : ${unchangedFileCount}`);
console.log(`変換した画像          : ${convertedCount}枚`);
console.log(`既に<a>内でスキップ   : ${skippedCount}枚`);
console.log(`エラー                : ${errorCount}件`);
console.log("文字コード            : UTF-8 → UTF-8");

if (errorCount > 0) {
  process.exitCode = 1;
}
