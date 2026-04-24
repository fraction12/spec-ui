# Portable HTML Handoff

Spec UI owns parsing, validation, IR generation, and HTML artifact generation. Viewers own opening and presenting generated artifacts. A viewer must not reinterpret Spec UI markdown or become responsible for compiler semantics.

## Handoff Artifact

Successful compilation produces a portable HTML file. The file is the primary handoff contract for browsers, Micro Canvas, and other compatible viewers.

The artifact should be openable without a running Spec UI compiler process. It may contain embedded CSS and JavaScript needed for supported V1 interactions, as long as unchanged input and configuration produce stable output.

## Metadata

A successful compile should expose handoff metadata to orchestration or viewer layers:

- `artifactPath`: path to the generated HTML file.
- `sourcePath`: path to the markdown spec, when available.
- `generatedAt`: generation timestamp or deterministic placeholder when tests require stable snapshots.
- `specTitle`: parsed `# Spec: <title>`.
- `screenCount`: number of compiled screens.
- `warnings`: deterministic warning list, if warnings are supported.

A failed compile should expose validation failure metadata:

- `sourcePath`: path to the markdown spec, when available.
- `errors`: ordered validation errors with code, message, source line when known, and source column when known.
- `artifactPath`: absent.

## Viewer Responsibilities

Compatible viewers should:

- Open the generated HTML artifact as-is.
- Present supported interactions implemented inside the artifact.
- Surface compile metadata or validation failures supplied by Spec UI.
- Treat Spec UI as the owner of grammar and compilation behavior.

Compatible viewers should not:

- Parse markdown specs as a substitute for Spec UI compilation.
- Rewrite unsupported structures into new UI semantics.
- Add non-deterministic behavior that changes the intended prototype flow.
- Require Micro Canvas-specific APIs for basic artifact inspection.

## Browser Handoff

A standards-based browser should be able to open the generated HTML artifact directly from disk or through a static file server. Browser inspection is the baseline portability check.

## Micro Canvas Handoff

Micro Canvas may stage, show, verify, or snapshot the generated HTML artifact. It remains a viewing surface. Spec UI remains responsible for the source grammar, validation model, IR, and renderer semantics.

## Other Viewer Handoff

Other compatible viewers may accept the same HTML artifact if they can present standard HTML, CSS, and JavaScript used by V1 output. They do not need to understand Spec UI markdown to display a successfully generated prototype.
