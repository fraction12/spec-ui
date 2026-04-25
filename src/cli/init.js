import { existsSync } from "node:fs";
import { lstat, mkdir, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  CONFIG_DIR,
  CONFIG_FILE,
  validateSafeRelativeDir
} from "./config.js";
import {
  DEFAULT_CONFIG,
  INSTRUCTIONS_MD,
  STARTER_PACKAGE,
  TEMPLATE_FILE_NAMES,
  TEMPLATES,
  defaultConfigJson
} from "./templates.js";

export async function runInitCommand(args, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const cwd = io.cwd ?? process.cwd();
  const parsed = parseInitArgs(args);

  if (parsed.help) {
    stdout.write(initHelp());
    return 0;
  }

  if (parsed.errors.length > 0) {
    const result = initFailure(parsed.errors);
    writeInitResult(result, { json: parsed.json, stdout, stderr });
    return 2;
  }

  const result = await initSpecUi({
    rootPath: parsed.path ? path.resolve(cwd, parsed.path) : cwd,
    examples: parsed.examples,
    force: parsed.force
  });

  writeInitResult(result, { json: parsed.json, stdout, stderr });
  return result.ok ? 0 : 1;
}

export async function initSpecUi(options = {}) {
  const rootPath = path.resolve(options.rootPath ?? process.cwd());
  const examples = options.examples === true;
  const force = options.force === true;
  const paths = buildInitPaths(rootPath, { examples });
  const created = [];
  const skipped = [];
  const overwritten = [];
  const createdDirectories = [];
  const skippedDirectories = [];

  const rootStatus = await ensureInitRoot(rootPath);
  if (!rootStatus.ok) {
    return initFailure([rootStatus.error], {
      rootPath,
      created,
      skipped,
      overwritten
    });
  }
  if (rootStatus.created) createdDirectories.push(rootPath);

  const directoryChecks = [
    validateSafeRelativeDir(DEFAULT_CONFIG.prototypesDir, {
      key: "prototypesDir",
      repoRoot: rootPath,
      configPath: paths.configPath
    }),
    validateSafeRelativeDir(DEFAULT_CONFIG.artifactsDir, {
      key: "artifactsDir",
      repoRoot: rootPath,
      configPath: paths.configPath
    })
  ];
  const directoryErrors = directoryChecks.filter((check) => !check.ok).map((check) => check.error);
  if (directoryErrors.length > 0) {
    return initFailure(directoryErrors, {
      rootPath,
      created,
      skipped,
      overwritten
    });
  }

  const directoryPreflight = await validateInitDirectories(paths.directories, rootPath);
  if (!directoryPreflight.ok) {
    return initFailure(directoryPreflight.errors, {
      rootPath,
      created,
      skipped,
      overwritten,
      createdDirectories,
      skippedDirectories
    });
  }

  const conflicts = findConflicts(paths.files);
  if (conflicts.length > 0 && !force) {
    return initFailure([
      {
        code: "init_already_exists",
        message: "Spec UI initialization files already exist. Use --force to overwrite generated files.",
        paths: conflicts
      }
    ], {
      rootPath,
      created,
      skipped: conflicts,
      overwritten
    });
  }

  const writePlan = paths.files.map((file) => ({
    ...file,
    existed: existsSync(file.path)
  }));

  for (const dirPath of paths.directories) {
    if (existsSync(dirPath)) {
      skippedDirectories.push(dirPath);
    } else {
      await mkdir(dirPath, { recursive: true });
      createdDirectories.push(dirPath);
    }
  }

  for (const file of writePlan) {
    await writeFile(file.path, file.contents, "utf8");
    if (file.existed) {
      overwritten.push(file.path);
    } else {
      created.push(file.path);
    }
  }

  return {
    command: "init",
    ok: true,
    rootPath,
    configPath: paths.configPath,
    templatesDir: paths.templatesDir,
    prototypesDir: paths.prototypesDir,
    artifactsDir: paths.artifactsDir,
    examplesCreated: examples,
    created,
    skipped,
    overwritten,
    createdDirectories,
    skippedDirectories,
    errors: []
  };
}

export function parseInitArgs(args) {
  const result = {
    path: undefined,
    examples: false,
    force: false,
    json: false,
    help: false,
    errors: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }

    if (arg === "--examples") {
      result.examples = true;
      continue;
    }

    if (arg === "--force") {
      result.force = true;
      continue;
    }

    if (arg === "--json") {
      result.json = true;
      continue;
    }

    if (arg.startsWith("--")) {
      result.errors.push({
        code: "unknown_option",
        message: `Unknown option "${arg}".`
      });
      continue;
    }

    if (result.path) {
      result.errors.push({
        code: "unexpected_argument",
        message: `Unexpected argument "${arg}".`
      });
      continue;
    }

    result.path = arg;
  }

  return result;
}

export function initHelp() {
  return `Usage: spec-ui init [path] [--examples] [--force] [--json]

Initialize optional repo-local Spec UI conventions.

Arguments:
  path        Directory to initialize. Defaults to the current directory.

Options:
  --examples  Create one starter package in the visible prototypes directory.
  --force     Overwrite generated config, instructions, templates, and starter files.
  --json      Print a machine-readable result.
  --help      Show this help.

Examples:
  spec-ui init
  spec-ui init apps/prototype-workspace --examples

.spec-ui/ stores conventions and templates. Prototype source remains visible in
the configured prototypes directory.
`;
}

function buildInitPaths(rootPath, options = {}) {
  const configDir = path.join(rootPath, CONFIG_DIR);
  const templatesDir = path.join(configDir, "templates");
  const prototypesDir = path.join(rootPath, DEFAULT_CONFIG.prototypesDir);
  const artifactsDir = path.join(rootPath, DEFAULT_CONFIG.artifactsDir);
  const files = [
    {
      path: path.join(configDir, CONFIG_FILE),
      contents: defaultConfigJson()
    },
    {
      path: path.join(configDir, "instructions.md"),
      contents: INSTRUCTIONS_MD
    },
    ...TEMPLATE_FILE_NAMES.map((fileName) => ({
      path: path.join(templatesDir, fileName),
      contents: TEMPLATES[fileName]
    }))
  ];
  const directories = [configDir, templatesDir];

  if (options.examples) {
    const starterDir = path.join(prototypesDir, "starter");
    directories.push(prototypesDir, starterDir);
    files.push(
      ...TEMPLATE_FILE_NAMES.map((fileName) => ({
        path: path.join(starterDir, fileName),
        contents: STARTER_PACKAGE[fileName]
      }))
    );
  }

  return {
    configDir,
    configPath: path.join(configDir, CONFIG_FILE),
    templatesDir,
    prototypesDir,
    artifactsDir,
    directories,
    files
  };
}

async function ensureInitRoot(rootPath) {
  if (!existsSync(rootPath)) {
    await mkdir(rootPath, { recursive: true });
    return { ok: true, created: true };
  }

  const stats = await stat(rootPath);
  if (!stats.isDirectory()) {
    return {
      ok: false,
      error: {
        code: "invalid_init_path",
        message: "Init path must be a directory.",
        path: rootPath
      }
    };
  }

  return { ok: true, created: false };
}

async function validateInitDirectories(directories, rootPath) {
  const rootRealPath = await realpath(rootPath);
  const errors = [];

  for (const dirPath of directories) {
    if (!existsSync(dirPath)) continue;

    const stats = await lstat(dirPath);
    if (!stats.isDirectory() && !stats.isSymbolicLink()) {
      errors.push({
        code: "init_already_exists",
        message: `Spec UI init path exists and is not a directory: ${dirPath}`,
        path: dirPath
      });
      continue;
    }

    const resolvedPath = await realpath(dirPath);
    if (!isInsideRoot(resolvedPath, rootRealPath)) {
      errors.push({
        code: "init_path_escape",
        message: `Spec UI init path must resolve inside the init root: ${dirPath}`,
        path: dirPath
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

function findConflicts(files) {
  return files
    .map((file) => file.path)
    .filter((filePath) => existsSync(filePath));
}

function isInsideRoot(filePath, rootPath) {
  const relativePath = path.relative(rootPath, filePath);
  return relativePath === "" ||
    (relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath));
}

function initFailure(errors, partial = {}) {
  return {
    command: "init",
    ok: false,
    rootPath: partial.rootPath ?? null,
    configPath: partial.configPath ?? null,
    templatesDir: partial.templatesDir ?? null,
    prototypesDir: partial.prototypesDir ?? null,
    artifactsDir: partial.artifactsDir ?? null,
    examplesCreated: false,
    created: partial.created ?? [],
    skipped: partial.skipped ?? [],
    overwritten: partial.overwritten ?? [],
    createdDirectories: partial.createdDirectories ?? [],
    skippedDirectories: partial.skippedDirectories ?? [],
    errors
  };
}

function writeInitResult(result, options) {
  if (options.json) {
    options.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (!result.ok) {
    for (const error of result.errors) {
      options.stderr.write(`${error.code}: ${error.message}\n`);
      if (error.paths) {
        for (const filePath of error.paths) {
          options.stderr.write(`  ${filePath}\n`);
        }
      }
    }
    return;
  }

  options.stdout.write("Spec UI initialized.\n");
  options.stdout.write(`Config: ${result.configPath}\n`);
  options.stdout.write(`Templates: ${result.templatesDir}\n`);
  options.stdout.write(`Prototypes: ${result.prototypesDir}\n`);
  if (result.examplesCreated) {
    options.stdout.write("Starter package: prototypes/starter\n");
  }
  options.stdout.write(`Created: ${result.created.length}\n`);
  options.stdout.write(`Skipped: ${result.skipped.length}\n`);
  options.stdout.write(`Overwritten: ${result.overwritten.length}\n`);
}
