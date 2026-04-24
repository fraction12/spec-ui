# Spec: Task Board

## Screen: Board [id="board"]

### Section: Header [id="header"]
- text#title: Team task board
- badge#active-count: 3 active
- button#new-task: New task [action="open-modal:new-task-modal"]

### Section: Task List [id="task-list"]
- card#task-101: Draft onboarding copy [action="navigate:task-detail"]
- card#task-102: Review billing states [action="navigate:task-detail"]
- action#refresh-board: Refresh board [type="show-state" target="board-loading"]

#### State: Board loading [id="board-loading" type="loading"]
- loading#loading-message: Loading latest tasks

#### State: New task modal [id="new-task-modal" type="modal"]
- field#task-title: Task title
- input#task-owner: Owner
- button#create-task: Create task [action="show-state:create-success"]
- button#cancel-create: Cancel [action="close-modal:new-task-modal"]

#### State: Create success [id="create-success" type="success"]
- success#created-message: Task created
- button#return-board: Return to board [action="close-modal:new-task-modal"]

## Screen: Task Detail [id="task-detail"]

### Section: Detail Header [id="detail-header"]
- button#back-board: Back to board [action="navigate:board"]
- text#detail-title: Draft onboarding copy

### Section: Detail Body [id="detail-body"]
- text#summary: Prepare first-run checklist and empty-state copy
- button#toggle-notes: Notes [action="toggle:detail-notes"]

#### State: Detail notes [id="detail-notes" type="revealed"]
- text#note-one: Confirm copy with support before shipping
