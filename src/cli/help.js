import { SPEC_UI_VERSION } from "../contracts.js";

const COMMANDS = [
  ["init", "Create repo-local Spec UI conventions."],
  ["list", "List examples, packages, or adapters."],
  ["show", "Show prototype metadata and source structure."],
  ["status", "Check prototype readiness without writing artifacts."],
  ["validate", "Validate a prototype without writing artifacts."],
  ["instructions", "Print role-specific editing guidance."],
  ["compile", "Compile a prototype to portable handoff HTML."]
];

export function versionText() {
  return `${SPEC_UI_VERSION}\n`;
}

export function topLevelHelp() {
  return `Usage: spec-ui [--version] [--help]
       spec-ui help [command]
       spec-ui <command> [options]

Compile structured markdown specs into deterministic, portable HTML prototypes.

Global Options:
  --help       Show help.
  --version    Show the Spec UI version.

Commands:
${COMMANDS.map(([name, description]) => `  ${name.padEnd(13)} ${description}`).join("\n")}

Run "spec-ui help <command>" for command-specific usage.
`;
}

export function commandHelp(command) {
  const help = {
    init: `Usage: spec-ui init [path] [--examples] [--force] [--json]

Create optional repo-local Spec UI conventions.

.spec-ui/ stores config, guidance, and templates. Prototype source remains in
visible directories such as prototypes/.

Options:
  --examples   Create a starter prototype package.
  --force      Overwrite known generated files.
  --json       Print machine-readable output.
  --help       Show help for init.

Examples:
  spec-ui init
  spec-ui init . --examples
`,
    list: `Usage: spec-ui list [--examples | --packages | --adapters] [--json]

List discoverable Spec UI resources.

Options:
  --examples   List built-in examples only.
  --packages   List configured prototype packages only.
  --adapters   List supported HTML adapters only.
  --json       Print machine-readable output.
  --help       Show help for list.

Examples:
  spec-ui list
  spec-ui list --adapters --json
`,
    show: `Usage: spec-ui show <input-or-name> [--json]

Show prototype metadata and source structure without writing artifacts.

Options:
  --json       Print machine-readable output.
  --help       Show help for show.

Examples:
  spec-ui show examples/revenue-workspace-package
  spec-ui show revenue-workspace --json
`,
    status: `Usage: spec-ui status <input-or-name> [--json]

Check prototype readiness without writing artifacts.

Options:
  --json       Print machine-readable output.
  --help       Show help for status.

Examples:
  spec-ui status examples/task-board.md
  spec-ui status examples/revenue-workspace-package --json
`,
    validate: `Usage: spec-ui validate <input-or-name> [--strict] [--json]

Validate a prototype without writing HTML or IR artifacts.

Options:
  --strict     Include initialized repo and portability checks.
  --json       Print machine-readable output.
  --help       Show help for validate.

Examples:
  spec-ui validate examples/task-board.md
  spec-ui validate examples/revenue-workspace-package --strict
`,
    instructions: `Usage: spec-ui instructions [role] --input <input-or-name> [--json]

Print focused role-specific editing guidance.

Options:
  --input      Prototype input or configured package name.
  --json       Print machine-readable output.
  --help       Show help for instructions.

Examples:
  spec-ui instructions layout --input examples/revenue-workspace-package
  spec-ui instructions content --input revenue-workspace --json
`,
    compile: `Usage: spec-ui compile <input-or-name> --out <output.html> [--ir <output.json>] [--json]
       spec-ui compile <input-or-name> --status

Compile a prototype to deterministic portable handoff HTML.

Options:
  --out        HTML artifact path.
  --ir         Optional IR JSON artifact path.
  --status     Compatibility alias for "spec-ui status <input> --json".
  --json       Print machine-readable output.
  --help       Show help for compile.

Examples:
  spec-ui compile examples/task-board.md --out artifacts/task-board.html
  spec-ui compile examples/revenue-workspace-package --status
`
  };

  return help[command] ?? null;
}

export function commandNames() {
  return COMMANDS.map(([name]) => name);
}
