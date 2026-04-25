#!/usr/bin/env node
import { runCli } from "../src/cli/index.js";

const exitCode = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: process.stdout,
  stderr: process.stderr,
  env: process.env
});

process.exit(exitCode);
