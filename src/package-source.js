import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { PACKAGE_MANIFEST, PACKAGE_ROLES } from "./contracts.js";
import { parsePackageRoleFile, parsePrototypeManifest } from "./parser.js";

export function detectSourceInput(inputPath) {
  const resolvedPath = path.resolve(inputPath);

  if (!existsSync(resolvedPath)) {
    return {
      sourceMode: path.basename(resolvedPath) === PACKAGE_MANIFEST ? "package" : "single-file",
      inputPath: resolvedPath,
      exists: false
    };
  }

  const stats = statSync(resolvedPath);
  if (stats.isDirectory()) {
    return {
      sourceMode: "package",
      packageRoot: resolvedPath,
      manifestPath: path.join(resolvedPath, PACKAGE_MANIFEST),
      exists: true
    };
  }

  if (path.basename(resolvedPath) === PACKAGE_MANIFEST) {
    return {
      sourceMode: "package",
      packageRoot: path.dirname(resolvedPath),
      manifestPath: resolvedPath,
      exists: true
    };
  }

  return {
    sourceMode: "single-file",
    inputPath: resolvedPath,
    exists: true
  };
}

export function loadPackageSource(inputPath) {
  const detected = detectSourceInput(inputPath);
  const packageRoot = detected.packageRoot ?? path.dirname(detected.inputPath ?? inputPath);
  const manifestPath = detected.manifestPath ?? path.join(packageRoot, PACKAGE_MANIFEST);
  const manifestFile = path.relative(packageRoot, manifestPath) || PACKAGE_MANIFEST;

  if (!existsSync(manifestPath)) {
    return emptyPackageSource(packageRoot, manifestPath, {
      code: "missing_package_manifest",
      message: `Package manifest "${PACKAGE_MANIFEST}" was not found.`,
      line: 1,
      sourceFile: manifestFile
    });
  }

  const manifestMarkdown = readFileSync(manifestPath, "utf8");
  const manifest = parsePrototypeManifest(manifestMarkdown, {
    manifestPath: manifestFile,
    sourceFile: manifestFile
  });
  const source = packageSourceFromManifest(manifest, packageRoot, manifestPath);

  source.package.sourceHashInputs.push(sourceHashInput(manifestFile, manifestMarkdown));

  for (const include of source.package.includes) {
    resolveInclude(include, packageRoot);

    if (include.outsideRoot) {
      include.parseStatus = "blocked";
      continue;
    }

    if (!include.exists) {
      include.parseStatus = include.required ? "missing" : "skipped";
      continue;
    }

    if (!PACKAGE_ROLES.has(include.role)) {
      include.parseStatus = "blocked";
      continue;
    }

    const markdown = readFileSync(include.absolutePath, "utf8");
    source.package.sourceHashInputs.push(sourceHashInput(include.path, markdown));

    const parsed = parsePackageRoleFile(markdown, {
      role: include.role,
      title: source.title,
      attrs: source.attrs,
      surface: source.surface,
      adapter: source.adapter,
      sourceFile: include.path,
      sourceRole: include.role
    });

    include.parseStatus = parsed.errors?.length ? "invalid" : "parsed";
    mergeRoleSource(source, parsed);
  }

  return source;
}

export function loadPackageInput(inputPath) {
  const detected = detectSourceInput(inputPath);
  const packageRoot = detected.packageRoot ?? path.dirname(detected.inputPath ?? inputPath);
  const manifestPath = detected.manifestPath ?? path.join(packageRoot, PACKAGE_MANIFEST);

  if (!existsSync(manifestPath)) {
    return {
      packageRoot,
      manifestPath,
      manifestMarkdown: "",
      manifest: {
        title: "",
        adapter: "bootstrap-html",
        target: "standalone-html",
        fidelity: "prototype",
        includes: []
      },
      files: []
    };
  }

  const manifestMarkdown = readFileSync(manifestPath, "utf8");
  const manifest = parsePrototypeManifest(manifestMarkdown, {
    manifestPath,
    sourceFile: manifestPath
  });
  const files = [];

  for (const include of manifest.includes) {
    const absolutePath = path.resolve(packageRoot, include.path);
    const relativeToRoot = path.relative(packageRoot, absolutePath);
    const outsideRoot =
      path.isAbsolute(include.path) ||
      relativeToRoot === ".." ||
      relativeToRoot.startsWith(`..${path.sep}`);

    if (outsideRoot || !existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      continue;
    }

    files.push({
      path: include.path,
      contents: readFileSync(absolutePath, "utf8")
    });
  }

  return {
    packageRoot,
    manifestPath,
    manifestMarkdown,
    manifest,
    files
  };
}

export function packageSourceFromManifest(manifest, packageRoot = "", manifestPath = "") {
  return {
    sourceMode: "package",
    title: manifest.title,
    attrs: manifest.attrs,
    surface: manifest.surface,
    adapter: manifest.adapter,
    target: manifest.target,
    fidelity: manifest.fidelity,
    line: manifest.line,
    sourceFile: manifest.sourceFile,
    screens: [],
    flows: [],
    contentRecords: [],
    layout: [],
    tokens: [],
    acceptance: {
      invariants: [],
      notes: []
    },
    package: {
      root: packageRoot,
      manifestPath,
      manifestFile: manifest.sourceFile,
      includes: manifest.includes.map((include, index) => ({
        ...include,
        order: index
      })),
      sourceHashInputs: []
    },
    errors: [...manifest.errors]
  };
}

function emptyPackageSource(packageRoot, manifestPath, error) {
  return {
    sourceMode: "package",
    title: "",
    attrs: {},
    adapter: "bootstrap-html",
    target: "standalone-html",
    fidelity: "prototype",
    sourceFile: PACKAGE_MANIFEST,
    screens: [],
    flows: [],
    contentRecords: [],
    layout: [],
    tokens: [],
    acceptance: {
      invariants: [],
      notes: []
    },
    package: {
      root: packageRoot,
      manifestPath,
      manifestFile: PACKAGE_MANIFEST,
      includes: [],
      sourceHashInputs: []
    },
    errors: [error]
  };
}

function resolveInclude(include, packageRoot) {
  const absolutePath = path.resolve(packageRoot, include.path);
  const relativeToRoot = path.relative(packageRoot, absolutePath);
  const outsideRoot =
    path.isAbsolute(include.path) ||
    relativeToRoot === ".." ||
    relativeToRoot.startsWith(`..${path.sep}`);

  include.absolutePath = absolutePath;
  include.outsideRoot = outsideRoot;
  include.exists = !outsideRoot && existsSync(absolutePath) && statSync(absolutePath).isFile();
}

function mergeRoleSource(source, parsed) {
  source.errors.push(...(parsed.errors ?? []));

  if (parsed.screens) source.screens.push(...parsed.screens);
  if (parsed.flows) source.flows.push(...parsed.flows);
  if (parsed.contentRecords) source.contentRecords.push(...parsed.contentRecords);
  if (parsed.layout) source.layout.push(...parsed.layout);
  if (parsed.tokens) source.tokens.push(...parsed.tokens);
  if (parsed.acceptance) {
    source.acceptance.invariants.push(...(parsed.acceptance.invariants ?? []));
    source.acceptance.notes.push(...(parsed.acceptance.notes ?? []));
  }
}

function sourceHashInput(filePath, content) {
  return {
    path: filePath,
    sha256: createHash("sha256").update(content).digest("hex")
  };
}
