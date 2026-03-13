import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const srcDir = path.join(repoRoot, "src");
const alertComponentFile = path.join(srcDir, "components", "ui", "Alert.tsx");

interface Violation {
  filePath: string;
  message: string;
}

const collectFilesRecursively = (directory: string, result: string[] = []): string[] => {
  if (!existsSync(directory)) return result;

  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      collectFilesRecursively(absolutePath, result);
      continue;
    }

    result.push(absolutePath);
  }

  return result;
};

const files = collectFilesRecursively(srcDir).filter(
  (filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"),
);

const violations: Violation[] = [];

if (existsSync(alertComponentFile)) {
  violations.push({
    filePath: path.relative(repoRoot, alertComponentFile),
    message: "componente legado `ui/Alert` encontrado. Use `sonner`.",
  });
}

const alertImportRegex = /from\s+["'][^"']*\/ui\/Alert["']/g;
const legacyToastRegex = /from\s+["']@\/components\/ui\/toast["']|\buseToast\s*\(/g;

for (const filePath of files) {
  const relativePath = path.relative(repoRoot, filePath);
  const content = readFileSync(filePath, "utf8");

  if (alertImportRegex.test(content)) {
    violations.push({
      filePath: relativePath,
      message: "import legado de `ui/Alert` detectado. Use `toast` do `sonner`.",
    });
  }
  alertImportRegex.lastIndex = 0;

  if (legacyToastRegex.test(content)) {
    violations.push({
      filePath: relativePath,
      message: "uso de toast legado detectado. Use `toast` do `sonner`.",
    });
  }
  legacyToastRegex.lastIndex = 0;

  if (relativePath.startsWith(path.join("src", "app")) && filePath.endsWith("loading.tsx")) {
    const hasSkeleton = content.includes("Skeleton");
    const hasLoadingComponentImport = /import\s+[A-Za-z0-9_]*Loading[A-Za-z0-9_]*\s+from/.test(content);
    const hasLegacySpinner = /animate-spin|Loader2|loading-spin\.svg/.test(content);

    if (hasLegacySpinner) {
      violations.push({
        filePath: relativePath,
        message: "arquivo `loading.tsx` com spinner legado (use Skeleton ou componente de loading com Skeleton).",
      });
    }

    if (!hasSkeleton && !hasLoadingComponentImport) {
      violations.push({
        filePath: relativePath,
        message: "arquivo `loading.tsx` sem Skeleton/componente de loading baseado em Skeleton.",
      });
    }
  }
}

if (violations.length > 0) {
  console.error("UI feedback regression check failed:");
  for (const violation of violations) {
    console.error(`- ${violation.filePath} -> ${violation.message}`);
  }
  process.exit(1);
}

console.log("UI feedback regression check passed.");

