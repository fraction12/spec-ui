# Bootstrap HTML Adapter Assets

Spec UI pins the `bootstrap-html` adapter to a Bootstrap 5.3-compatible
markup contract. The runtime artifact does not load Bootstrap from a CDN,
package manager, font host, or any other network location.

The support CSS in `src/bootstrap-html-assets.js` is a small repo-vendored
compatibility layer authored for Spec UI against Bootstrap 5.3 class semantics.
It is emitted inline in generated HTML so prototypes remain portable in a
browser and Micro Canvas.

- Library identity: Bootstrap
- Pinned major version: 5
- Compatibility target: Bootstrap 5.3
- Asset delivery: inline CSS from this repository
- Upstream license: MIT
- Upstream project: https://github.com/twbs/bootstrap
