# Spec: Revenue Operations Console [surface="app" adapter="baseline"]

## Screen: Executive Dashboard [id="executive-dashboard" shell="app" kind="dashboard" gap="md"]

### Region: Sidebar [id="exec-sidebar" type="sidebar" gap="md"]
#### Block: Primary Navigation [id="exec-nav" type="nav" variant="primary" gap="md"]
- nav-item#nav-exec-dashboard: Dashboard [action="navigate:executive-dashboard"]
- nav-item#nav-pipeline: Pipeline [action="navigate:pipeline-review"]
- nav-item#nav-settings: Settings [action="navigate:workspace-settings"]

### Region: Topbar [id="exec-topbar" type="topbar" gap="md"]
#### Block: Page Header [id="exec-page-header" type="page-header" variant="with-actions" gap="md"]
- text#exec-title: Revenue operations console
- badge#exec-period: Q4 forecast
- button#exec-new-opportunity: New opportunity [action="open-modal:new-opportunity-modal"]

### Region: Content [id="exec-content" type="content" gap="md"]
#### Block: Forecast Metrics [id="forecast-metrics" type="metric-row" gap="md"]
- metric#metric-pipeline: Weighted pipeline [value="$8.6M" status="up"]
- metric#metric-coverage: Coverage [value="3.1x" status="healthy"]
- metric#metric-risk: Renewal risk [value="$420K" status="attention"]
- metric#metric-cycle: Sales cycle [value="42 days" status="down"]

#### Block: Pipeline Filters [id="pipeline-filters" type="filters" variant="inline" gap="md"]
- button#filter-enterprise: Enterprise [action="set-tab:enterprise-tab"]
- button#filter-commercial: Commercial [action="set-tab:commercial-tab"]
- button#filter-risk: Risk review [action="show-state:risk-review-panel"]

##### State: Enterprise Tab [id="enterprise-tab" type="tab"]
- text#enterprise-copy: Enterprise opportunities over $250K are visible in the table below.

##### State: Commercial Tab [id="commercial-tab" type="tab"]
- text#commercial-copy: Commercial opportunities under $250K are visible in the table below.

##### State: Risk Review Panel [id="risk-review-panel" type="revealed"]
- text#risk-review-copy: Risk view highlights accounts with legal, security, or procurement blockers.
- button#risk-review-dismiss: Clear risk review [action="toggle:risk-review-panel"]

#### Block: Opportunity Table [id="opportunity-table" type="data-table" variant="selectable" gap="md"]
- column#opp-col-account: Account
- column#opp-col-stage: Stage
- column#opp-col-owner: Owner
- column#opp-col-amount: Amount
- row#opp-row-cobalt: Cobalt Bank [stage="Security review" owner="Maya" amount="$640K" action="navigate:pipeline-review"]
- row#opp-row-polar: Polar Health [stage="Procurement" owner="Ira" amount="$380K" action="show-state:risk-review-panel"]
- row#opp-row-summit: Summit Robotics [stage="Proposal" owner="Noor" amount="$240K" action="navigate:pipeline-review"]

#### Block: Account Detail [id="account-detail-panel" type="detail-panel" variant="summary" gap="md"]
- text#detail-account: Polar Health is waiting on revised data retention language.
- badge#detail-health: Needs executive sponsor [tone="critical"]
- button#detail-open-drawer: Open action plan [action="toggle:action-plan-drawer"]
- button#detail-log-note: Log note [action="open-modal:new-opportunity-modal"]

##### State: Action Plan Drawer [id="action-plan-drawer" type="drawer"]
- step#drawer-step-legal: Legal owner to approve redlines.
- step#drawer-step-sponsor: VP Sales to confirm sponsor call.
- button#drawer-close: Close action plan [action="toggle:action-plan-drawer"]

##### State: New Opportunity Modal [id="new-opportunity-modal" type="modal"]
- field#new-opp-account: Account [placeholder="Company name"]
- select#new-opp-stage: Stage [value="Discovery"]
- field#new-opp-amount: Amount [placeholder="$0"]
- button#new-opp-create: Create opportunity [action="show-state:new-opp-success"]
- button#new-opp-cancel: Cancel [action="close-modal:new-opportunity-modal"]

##### State: New Opportunity Success [id="new-opp-success" type="success"]
- success#new-opp-success-message: Opportunity created in prototype mode.

### Region: Aside [id="exec-aside" type="aside" gap="md"]
#### Block: Activity Feed [id="exec-activity" type="activity-feed" variant="compact" gap="md"]
- activity#activity-one: Maya moved Cobalt Bank to security review.
- activity#activity-two: Ira requested procurement support for Polar Health.
- activity#activity-three: Finance refreshed weighted pipeline.

### Region: Footer [id="exec-footer" type="footer" gap="md"]
#### Block: Footer Status [id="exec-footer-status" type="state-panel" variant="default" gap="md"]
- text#footer-sync: Forecast synced five minutes ago.

## Screen: Pipeline Review [id="pipeline-review" shell="app" kind="detail" gap="md"]

### Region: Sidebar [id="pipeline-sidebar" type="sidebar" gap="md"]
#### Block: Detail Navigation [id="pipeline-nav" type="nav" variant="compact" gap="md"]
- nav-item#pipeline-back-dashboard: Dashboard [action="navigate:executive-dashboard"]
- nav-item#pipeline-settings-link: Settings [action="navigate:workspace-settings"]

### Region: Content [id="pipeline-content" type="content" gap="md"]
#### Block: Review Header [id="pipeline-header" type="page-header" gap="md"]
- text#pipeline-title: Cobalt Bank review
- badge#pipeline-stage: Security review
- button#pipeline-open-confirm: Approve forecast [action="show-state:approval-confirmation"]

#### Block: Review Form [id="pipeline-review-form" type="form" variant="stacked" gap="md"]
- field#review-owner: Deal owner [value="Maya"]
- select#review-commit: Forecast category [value="Commit"]
- toggle#review-exec-needed: Executive sponsor needed [value="on"]
- button#review-save: Save review [action="show-state:review-saved"]

##### State: Review Saved [id="review-saved" type="success"]
- success#review-saved-message: Review saved.

##### State: Approval Confirmation [id="approval-confirmation" type="confirmation"]
- text#approval-copy: Mark Cobalt Bank as approved for the Q4 commit forecast?
- button#approval-confirm: Approve [action="show-state:approval-success"]
- button#approval-cancel: Cancel [action="navigate:pipeline-review"]

##### State: Approval Success [id="approval-success" type="success"]
- success#approval-success-message: Forecast approved.

## Screen: Workspace Settings [id="workspace-settings" shell="app" kind="settings" gap="md"]

### Region: Sidebar [id="settings-sidebar" type="sidebar" gap="md"]
#### Block: Settings Navigation [id="settings-nav" type="nav" variant="compact" gap="md"]
- nav-item#settings-dashboard-link: Dashboard [action="navigate:executive-dashboard"]
- nav-item#settings-review-link: Pipeline [action="navigate:pipeline-review"]

### Region: Content [id="settings-content" type="content" gap="md"]
#### Block: Forecast Rules [id="forecast-rules" type="settings-group" gap="md"]
- field#settings-fiscal-year: Fiscal year start [value="February"]
- toggle#settings-auto-risk: Auto flag procurement risk [value="on"]
- select#settings-approval-threshold: Approval threshold [value="$250K"]
- button#settings-save: Save rules [action="show-state:settings-save-success"]

##### State: Settings Save Success [id="settings-save-success" type="success"]
- success#settings-save-message: Forecast rules saved.
