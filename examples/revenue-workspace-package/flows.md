## Flow: Primary Review [id="primary-review" start="executive-dashboard"]
- Step: Open Pipeline [from="executive-dashboard" action="navigate:pipeline-review" to="pipeline-review"]
- Step: Approve Forecast [from="pipeline-review" action="show-state:approval-confirmation" to="approval-confirmation"]
- Step: Confirm Approval [from="approval-confirmation" action="show-state:approval-success" to="approval-success"]

## Flow: Opportunity Creation [id="opportunity-creation" start="executive-dashboard"]
- Step: Open Modal [from="executive-dashboard" action="open-modal:new-opportunity-modal" to="new-opportunity-modal"]
- Step: Create Opportunity [from="new-opportunity-modal" action="show-state:new-opp-success" to="new-opp-success"]
- Step: Close Modal [from="new-opportunity-modal" action="close-modal:new-opportunity-modal" to="executive-dashboard"]

## Flow: Settings Update [id="settings-update" start="executive-dashboard"]
- Step: Open Settings [from="executive-dashboard" action="navigate:workspace-settings" to="workspace-settings"]
- Step: Save Rules [from="workspace-settings" action="show-state:settings-save-success" to="settings-save-success"]
