export const BOOTSTRAP_HTML_ADAPTER_VERSION = "0.1.0";
export const BOOTSTRAP_LIBRARY = Object.freeze({
  name: "Bootstrap",
  version: "5.3-compatible",
  pinnedMajor: "5",
  provenance: "repo-vendored-inline",
  source: "assets/bootstrap-html/PROVENANCE.md"
});

export const BOOTSTRAP_COMPAT_CSS = `    /*
     * Bootstrap 5.3-compatible support layer for Spec UI.
     * Provenance: assets/bootstrap-html/PROVENANCE.md
     */
    :root {
      color-scheme: light;
      --bs-body-font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --bs-body-color: #1f2933;
      --bs-body-bg: #f6f7f9;
      --bs-border-color: #d7dde5;
      --bs-border-radius: 0.5rem;
      --bs-primary: #2357a7;
      --bs-primary-rgb: 35 87 167;
      --bs-secondary-color: #516070;
      --spec-bs-gap: 1rem;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: var(--bs-body-font-family); color: var(--bs-body-color); background: var(--bs-body-bg); }
    [hidden] { display: none !important; }
    h1, h2, h3, h4, h5, h6, p { margin-top: 0; }
    button, input, select { font: inherit; }
    .container-fluid { width: 100%; max-width: 1180px; margin-inline: auto; padding-inline: 1rem; }
    .row { display: flex; flex-wrap: wrap; margin-inline: calc(var(--spec-bs-gap) * -0.5); row-gap: var(--spec-bs-gap); }
    .row > * { min-width: 0; padding-inline: calc(var(--spec-bs-gap) * 0.5); }
    .col-12 { flex: 0 0 auto; width: 100%; }
    .col { flex: 1 0 0%; }
    .g-0 { --spec-bs-gap: 0; }
    .g-1 { --spec-bs-gap: 0.25rem; }
    .g-2 { --spec-bs-gap: 0.5rem; }
    .g-3 { --spec-bs-gap: 1rem; }
    .g-4 { --spec-bs-gap: 1.5rem; }
    .g-5 { --spec-bs-gap: 2rem; }
    .card { min-width: 0; background: #fff; border: 1px solid var(--bs-border-color); border-radius: var(--bs-border-radius); box-shadow: 0 1px 2px rgb(31 41 51 / 0.06); overflow: hidden; }
    .card-body { min-width: 0; padding: 1rem; }
    .card-title { margin-bottom: 0.65rem; font-size: 1rem; color: #243447; }
    .card-text, .text-body-secondary { color: var(--bs-secondary-color); }
    .btn { min-height: 2.35rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; border: 1px solid transparent; border-radius: 0.375rem; padding: 0.45rem 0.75rem; background: #fff; color: #243447; cursor: pointer; text-decoration: none; overflow-wrap: anywhere; }
    .btn-primary { border-color: var(--bs-primary); background: var(--bs-primary); color: #fff; }
    .btn-outline-secondary { border-color: #a8b3c1; color: #243447; background: #fff; }
    .nav { display: flex; flex-wrap: wrap; gap: 0.35rem; padding-left: 0; margin: 0; list-style: none; }
    .nav.flex-column { flex-direction: column; align-items: stretch; }
    .nav-link { border: 0; border-radius: 0.375rem; padding: 0.5rem 0.65rem; background: transparent; color: #243447; text-align: left; text-decoration: none; cursor: pointer; }
    .nav-link:hover, .nav-link:focus { background: #e7eef7; }
    .navbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
    .navbar-brand { margin: 0; font-weight: 700; color: #102033; }
    .table-responsive { width: 100%; overflow-x: auto; }
    .table { width: 100%; min-width: 420px; margin-bottom: 0; border-collapse: collapse; }
    .table th, .table td { padding: 0.65rem; border-bottom: 1px solid var(--bs-border-color); text-align: left; vertical-align: top; }
    .table th { color: var(--bs-secondary-color); font-size: 0.82rem; }
    .form-label { display: grid; gap: 0.35rem; color: #243447; }
    .form-control, .form-select { width: 100%; min-height: 2.35rem; border: 1px solid #a8b3c1; border-radius: 0.375rem; padding: 0.45rem 0.6rem; background: #fff; color: #1f2933; }
    .form-check { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 2.35rem; }
    .badge { display: inline-flex; align-items: center; min-height: 1.75rem; border-radius: 999px; padding: 0.35rem 0.6rem; background: #e7eef7; color: #21364d; }
    .lead { color: var(--bs-secondary-color); font-size: 1.05rem; line-height: 1.5; }
    .display-6 { font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.05; letter-spacing: 0; }
    .list-group { display: grid; gap: 0.5rem; padding: 0; margin: 0; list-style: none; }
    .list-group-item { min-width: 0; border: 1px solid var(--bs-border-color); border-radius: var(--bs-border-radius); padding: 0.75rem; background: #fff; overflow-wrap: anywhere; }
    .spec-bs-shell { padding-block: 1rem 2rem; }
    .spec-bs-title { margin: 0 0 1rem; font-size: 1.5rem; }
    .spec-bs-screen { display: grid; gap: var(--spec-bs-gap); }
    .spec-bs-screen-header { margin-bottom: 0.75rem; }
    .spec-bs-region { min-width: 0; }
    .spec-bs-region-title { margin: 0 0 0.5rem; color: var(--bs-secondary-color); font-size: 0.78rem; letter-spacing: 0; text-transform: uppercase; }
    .spec-bs-stack { display: grid; gap: var(--spec-bs-gap); }
    .spec-bs-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: var(--spec-bs-gap); }
    .spec-bs-metric strong { display: block; color: #0f766e; font-size: 1.5rem; }
    .spec-bs-marketing-hero { padding-block: clamp(2rem, 6vw, 5rem); background: #f8fbff; border-color: #c7d7ea; }
    .spec-bs-state-overlay { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 1.5rem; background: rgb(31 41 51 / 0.38); }
    .spec-bs-state-modal, .spec-bs-state-confirmation { width: min(500px, calc(100vw - 3rem)); max-height: calc(100vh - 3rem); overflow: auto; }
    .spec-bs-state-drawer { position: fixed; inset: 1.5rem 1.5rem 1.5rem auto; z-index: 21; width: min(420px, calc(100vw - 3rem)); overflow: auto; }
    .spec-bs-pad-none > .card-body, .spec-bs-pad-none.card-body { padding: 0; }
    .spec-bs-pad-xs > .card-body, .spec-bs-pad-xs.card-body { padding: 0.5rem; }
    .spec-bs-pad-sm > .card-body, .spec-bs-pad-sm.card-body { padding: 0.75rem; }
    .spec-bs-pad-md > .card-body, .spec-bs-pad-md.card-body { padding: 1rem; }
    .spec-bs-pad-lg > .card-body, .spec-bs-pad-lg.card-body { padding: 1.5rem; }
    .spec-bs-pad-xl > .card-body, .spec-bs-pad-xl.card-body { padding: 2rem; }
    .spec-bs-density-compact { --spec-bs-gap: 0.5rem; }
    .spec-bs-density-cozy { --spec-bs-gap: 1rem; }
    .spec-bs-density-spacious { --spec-bs-gap: 1.5rem; }
    .spec-bs-width-narrow { max-width: 720px; }
    .spec-bs-width-content { max-width: 960px; }
    .spec-bs-width-wide { max-width: 1180px; }
    .spec-bs-width-full { max-width: none; }
    .spec-bs-align-start { text-align: start; }
    .spec-bs-align-center { text-align: center; }
    .spec-bs-align-end { text-align: end; }
    .spec-bs-align-stretch { align-items: stretch; }
    .spec-bs-columns-1 { grid-template-columns: minmax(0, 1fr); }
    .spec-bs-columns-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .spec-bs-columns-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .spec-bs-columns-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .spec-bs-text-wrap { overflow-wrap: anywhere; }
    .spec-bs-text-nowrap { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .spec-bs-text-balance { text-wrap: balance; }
    .spec-bs-overflow-contain { overflow: hidden; }
    .spec-bs-overflow-scroll { overflow: auto; }
    .spec-bs-overflow-visible { overflow: visible; }
    .spec-bs-tone-blue { --bs-primary: #2357a7; }
    .spec-bs-tone-teal { --bs-primary: #0f766e; }
    .spec-bs-tone-indigo { --bs-primary: #4338ca; }
    .spec-bs-tone-green { --bs-primary: #15803d; }
    .spec-bs-tone-gray { --bs-primary: #4b5563; }
    .spec-bs-radius-sm { --bs-border-radius: 0.25rem; }
    .spec-bs-radius-md { --bs-border-radius: 0.5rem; }
    .spec-bs-radius-lg { --bs-border-radius: 0.75rem; }
    .spec-bs-radius-pill .btn, .spec-bs-radius-pill .card, .spec-bs-radius-pill .form-control, .spec-bs-radius-pill .form-select { border-radius: 999px; }
    .spec-bs-cards-outlined .card { box-shadow: none; }
    .spec-bs-cards-elevated .card { box-shadow: 0 10px 24px rgb(31 41 51 / 0.12); }
    .spec-bs-cards-filled .card { background: #fbfcfd; }
    @media (min-width: 992px) {
      .col-lg-2 { flex: 0 0 auto; width: 16.666667%; }
      .col-lg-3 { flex: 0 0 auto; width: 25%; }
      .col-lg-4 { flex: 0 0 auto; width: 33.333333%; }
      .col-lg-6 { flex: 0 0 auto; width: 50%; }
      .col-lg-8 { flex: 0 0 auto; width: 66.666667%; }
      .col-lg-9 { flex: 0 0 auto; width: 75%; }
      .col-lg-10 { flex: 0 0 auto; width: 83.333333%; }
    }
    @media (max-width: 860px) {
      .container-fluid { padding-inline: 0.5rem; }
      .spec-bs-shell { padding-top: 0.5rem; }
      .spec-bs-columns-2, .spec-bs-columns-3, .spec-bs-columns-4 { grid-template-columns: minmax(0, 1fr); }
      .spec-bs-collapse-scroll { display: flex; overflow-x: auto; }
    }`;
