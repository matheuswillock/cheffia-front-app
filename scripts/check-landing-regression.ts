import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const componentsDir = path.join(repoRoot, "src", "components");
const canonicalGlobalsFile = path.join(repoRoot, "src", "app", "globals.css");

const staticTargetFiles = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/components/Navbar.tsx",
  "src/components/FooterSection.tsx",
  "src/components/NeonEffects.tsx",
];

const componentFiles = readdirSync(componentsDir)
  .filter((name) => name.startsWith("Apresentation") && name.endsWith(".tsx"))
  .map((name) => path.join("src", "components", name));

const targetFiles = [...staticTargetFiles, ...componentFiles]
  .map((filePath) => path.join(repoRoot, filePath))
  .filter((filePath) => {
    try {
      return statSync(filePath).isFile();
    } catch {
      return false;
    }
  });

const rules = [
  {
    id: "invalid-responsive-token",
    regex: /\b(?:sm|md|lg|xl|2xl):(?=\s|["'`])/g,
    message: "token responsivo vazio (ex: `sm:`).",
  },
  {
    id: "invalid-fixed-width-token",
    regex: /\bw-50\b/g,
    message: "classe `w-50` invalida no Tailwind.",
  },
  {
    id: "invalid-fixed-height-token",
    regex: /\bh-50\b/g,
    message: "classe `h-50` invalida no Tailwind.",
  },
  {
    id: "invalid-dimension-bracket-no-unit",
    regex: /\b[wh]-\[\d+\](?=\s|["'`])/g,
    message: "classe com dimensao sem unidade (ex: `w-[42]`).",
  },
  {
    id: "forbidden-min-w-screen",
    regex: /\bmin-w-screen\b/g,
    message: "uso proibido de `min-w-screen` (quebra layout responsivo).",
  },
  {
    id: "forbidden-w-screen",
    regex: /\bw-screen\b/g,
    message: "uso proibido de `w-screen` na LP (pode gerar overflow horizontal).",
  },
  {
    id: "forbidden-hardcoded-hex",
    regex: /#[0-9A-Fa-f]{3,8}\b/g,
    message: "uso proibido de cor hardcoded na LP (use tokens semanticos).",
  },
];

const violations = [];

for (const filePath of targetFiles) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    rules.forEach((rule) => {
      if (rule.regex.test(line)) {
        violations.push({
          filePath: path.relative(repoRoot, filePath),
          line: index + 1,
          message: rule.message,
        });
      }
      rule.regex.lastIndex = 0;
    });
  });
}

if (statSync(canonicalGlobalsFile).isFile()) {
  const globalsContent = readFileSync(canonicalGlobalsFile, "utf8");
  const globalsLines = globalsContent.split(/\r?\n/);
  const forbiddenTailwindV3Directive = /@tailwind\s+(base|components|utilities)\b/g;

  globalsLines.forEach((line, index) => {
    if (forbiddenTailwindV3Directive.test(line)) {
      violations.push({
        filePath: path.relative(repoRoot, canonicalGlobalsFile),
        line: index + 1,
        message: "diretiva Tailwind v3 proibida no arquivo canônico (`@tailwind ...`).",
      });
    }
    forbiddenTailwindV3Directive.lastIndex = 0;
  });
}

if (violations.length > 0) {
  console.error("Landing regression check failed:");
  for (const violation of violations) {
    console.error(`- ${violation.filePath}:${violation.line} -> ${violation.message}`);
  }
  process.exit(1);
}

console.log("Landing regression check passed.");
