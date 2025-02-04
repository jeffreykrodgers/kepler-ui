const fs = require("fs");
const path = require("path");

const pkgPath = path.resolve(__dirname, "package.json");
const pkg = require(pkgPath);

delete pkg.scripts;
delete pkg.devDependencies;

const outputPath = path.resolve(__dirname, "dist", "package.json");
fs.writeFileSync(outputPath, JSON.stringify(pkg, null, 2));
