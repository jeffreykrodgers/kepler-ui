import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Compute __dirname for ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json from the current directory.
const pkgPath = path.resolve(__dirname, "package.json");
const pkgContent = fs.readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(pkgContent);

// Remove properties that shouldn't be published.
delete pkg.scripts;
delete pkg.devDependencies;

// Write the cleaned package.json to dist/package.json.
const outputPath = path.resolve(__dirname, "dist", "package.json");
fs.writeFileSync(outputPath, JSON.stringify(pkg, null, 2));
