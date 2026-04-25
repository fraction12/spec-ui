# Spec: SaaS Dashboard Fixture [surface="app" adapter="baseline"]

## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="md"]

### Region: Sidebar [id="dashboard-sidebar" type="sidebar" gap="md"]
#### Block: Product Navigation [id="dashboard-nav" type="nav" variant="primary" gap="md"]
- nav-item#nav-dashboard: Dashboard [action="navigate:dashboard"]
- nav-item#nav-accounts: Accounts [action="navigate:accounts"]

### Region: Topbar [id="dashboard-topbar" type="topbar" gap="md"]
#### Block: Header Actions [id="dashboard-header" type="page-header" variant="with-actions" gap="md"]
- text#dashboard-title: Expansion dashboard
- button#open-new-account: New account [action="open-modal:new-account-modal"]

### Region: Content [id="dashboard-content" type="content" gap="md"]
#### Block: Revenue Metrics [id="revenue-metrics" type="metric-row" gap="md"]
- metric#metric-arr: ARR [value="$2.4M" status="up"]
- metric#metric-risk: At risk [value="7 accounts" status="attention"]

#### Block: Account Table [id="account-table" type="data-table" variant="selectable" gap="md"]
- column#col-account: Account
- column#col-owner: Owner
- column#col-status: Status
- row#row-acme: Acme Systems [owner="Rina" status="Expansion" action="navigate:accounts"]
- row#row-northstar: Northstar Labs [owner="Lee" status="At risk" action="show-state:account-risk"]

#### Block: Account Detail [id="account-detail" type="detail-panel" gap="md"]
- text#account-summary: Northstar Labs needs renewal review this week.
- badge#account-health: At risk [tone="critical"]
- button#open-risk-notes: Review notes [action="show-state:account-risk"]
##### State: Risk Notes [id="account-risk" type="revealed"]
- text#risk-note-one: Procurement asked for revised security terms.
- button#dismiss-risk: Done [action="toggle:account-risk"]

##### State: New Account Modal [id="new-account-modal" type="modal"]
- field#new-account-name: Account name [placeholder="Company name"]
- select#new-account-owner: Owner [value="Rina"]
- button#create-account: Create account [action="show-state:new-account-success"]
- button#cancel-account: Cancel [action="close-modal:new-account-modal"]

##### State: New Account Success [id="new-account-success" type="success"]
- success#new-account-message: Account created.

## Screen: Accounts [id="accounts" shell="app" kind="list" gap="md"]

### Region: Content [id="accounts-content" type="content" gap="md"]
#### Block: Accounts Header [id="accounts-header" type="page-header" gap="md"]
- text#accounts-title: Accounts
- button#accounts-back: Back to dashboard [action="navigate:dashboard"]

#### Block: Accounts List [id="accounts-list" type="collection-list" gap="md"]
- row#accounts-row-acme: Acme Systems [status="Expansion"]
- row#accounts-row-northstar: Northstar Labs [status="At risk"]
