import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const source = path.join(distDir, "index.html");
const target = path.join(distDir, "management.html");

if (!fs.existsSync(source)) {
  throw new Error(`Missing build output: ${source}`);
}

fs.copyFileSync(source, target);

