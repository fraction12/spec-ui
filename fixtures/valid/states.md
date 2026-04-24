# Spec: Account Settings

## Screen: Settings [id="settings"]

### Section: Profile [id="profile"]
- field#name: Display name
- input#email: Email address
- button#save-profile: Save profile [action="show-state:save-success"]
- button#show-danger: Delete account [action="open-modal:delete-modal"]

#### State: Default profile [id="profile-default" type="default"]
- text#profile-help: Update the details visible to teammates

#### State: Save success [id="save-success" type="success"]
- success#save-message: Profile saved

#### State: Delete modal [id="delete-modal" type="modal"]
- error#delete-warning: This action cannot be undone
- button#confirm-delete: Confirm delete [action="show-state:delete-error"]
- button#cancel-delete: Cancel [action="close-modal:delete-modal"]

#### State: Delete error [id="delete-error" type="error"]
- error#delete-error-message: Delete is disabled for this fixture
