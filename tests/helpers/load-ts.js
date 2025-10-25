import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const requireModule = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const cache = new Map();

function resolveWithExtensions(resolvedPath) {
  const candidates = [
    resolvedPath,
    `${resolvedPath}.ts`,
    `${resolvedPath}.tsx`,
    `${resolvedPath}.js`,
    `${resolvedPath}.jsx`,
    path.join(resolvedPath, "index.ts"),
    path.join(resolvedPath, "index.tsx"),
    path.join(resolvedPath, "index.js"),
    path.join(resolvedPath, "index.jsx"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to resolve module at ${resolvedPath}`);
}

function resolveSpecifier(specifier, baseDir) {
  if (specifier.startsWith("@/")) {
    const withoutAlias = specifier.slice(2);
    return resolveWithExtensions(path.resolve(projectRoot, "src", withoutAlias));
  }

  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    return resolveWithExtensions(path.resolve(baseDir, specifier));
  }

  return null;
}

export function loadTsModuleSync(specifier, fromDir = projectRoot) {
  const resolved = resolveSpecifier(specifier, fromDir);
  if (!resolved) {
    return requireModule(specifier);
  }

  if (cache.has(resolved)) {
    return cache.get(resolved);
  }

  const source = readFileSync(resolved, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      allowJs: true,
    },
    fileName: resolved,
  });

  const moduleExports = {};
  const module = { exports: moduleExports };
  cache.set(resolved, moduleExports);
  const dirname = path.dirname(resolved);
  const script = new vm.Script(transpiled.outputText, { filename: resolved });
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: (childSpecifier) => loadTsModuleSync(childSpecifier, dirname),
    __filename: resolved,
    __dirname: dirname,
    process,
    console,
    Buffer,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    global: undefined,
  });

  context.global = context;
  script.runInContext(context);

  const exported = module.exports.default ?? module.exports;
  cache.set(resolved, exported);
  return exported;
}

export function getProjectRoot() {
  return projectRoot;
}
