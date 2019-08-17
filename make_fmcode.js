const fs = require("fs");

try {
    const text = fs.readFileSync("public/index.html", { encoding: "utf-8" });
    const js = fs.readFileSync("public/bundle.js", { encoding: "utf-8" });
    const replaced = js.replace(/\[\[.*]]/, "[[__SQLRESULT__]]")
    const allhtml = text.replace(/<script.*<\/script>/, `<script>${replaced}</script>`);
    fs.writeFileSync("public/allinone.html", allhtml);
} catch (err) {
    console.log("err:" + err);
}