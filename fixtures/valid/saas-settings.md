# Spec: SaaS Settings Fixture [surface="app" adapter="baseline"]

## Screen: Settings [id="settings" shell="app" kind="settings" gap="md"]

### Region: Sidebar [id="settings-sidebar" type="sidebar" gap="md"]
#### Block: Settings Navigation [id="settings-nav" type="nav" variant="compact" gap="md"]
- nav-item#nav-profile: Profile [action="navigate:settings"]
- nav-item#nav-billing: Billing [action="show-state:billing-panel"]

### Region: Content [id="settings-content" type="content" gap="md"]
#### Block: Workspace Settings [id="workspace-settings" type="settings-group" gap="md"]
- field#workspace-name: Workspace name [placeholder="Team workspace"]
- toggle#weekly-summary: Weekly summary [value="on"]
- select#timezone: Time zone [value="America/New_York"]
- button#save-settings: Save settings [action="show-state:settings-saved"]

##### State: Settings Saved [id="settings-saved" type="success"]
- success#settings-saved-message: Settings saved.

##### State: Billing Panel [id="billing-panel" type="drawer"]
- text#billing-plan: Current plan is Growth.
- button#close-billing: Close billing [action="toggle:billing-panel"]

#### Block: Danger Zone [id="danger-zone" type="settings-group" variant="danger" gap="md"]
- text#danger-copy: Disable the workspace for all members.
- button#disable-workspace: Disable workspace [action="show-state:disable-error"]

##### State: Disable Error [id="disable-error" type="error"]
- error#disable-error-message: Disable is unavailable in this prototype.
