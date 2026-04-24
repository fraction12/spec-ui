# Spec: Task Board

## Screen: Board [id="board"]

### Section: Header [id="header"]
- text#title: Team task board
- badge#active-count: 3 active
- button#new-task: New task [action="open-modal:new-task-modal"]

### Section: Filters [id: filters]
- button#filter-all: All [action="set-tab:tab-all"]
- button#filter-mine: Mine [action="set-tab:tab-mine"]
- button#filter-blocked: Blocked [action="set-tab:tab-blocked"]

### Section: Task List [id="task-list"]
- card#task-101: Draft onboarding copy [action="navigate:task-detail"]
- card#task-102: Review billing states [action="navigate:task-detail"]
- card#task-103: Confirm empty board behavior [action="navigate:task-detail"]
- action#refresh-board: Refresh board [type="show-state" target="board-loading"]

#### State: Board loading [id="board-loading" type="loading"]
- loading#loading-message: Loading latest tasks

#### State: Board default [id="board-default" type="default"]
- text#default-message: Showing all active tasks

#### State: Empty board [id="board-empty" type="empty"]
- empty#empty-message: No tasks match this filter
- button#clear-filters: Clear filters [action="show-state:board-default"]

#### State: All tasks tab [id="tab-all" type="tab"]
- list#all-tasks: All tasks

#### State: Mine tab [id="tab-mine" type="tab"]
- list#mine-tasks: My assigned tasks

#### State: Blocked tab [id="tab-blocked" type="tab"]
- list#blocked-tasks: Blocked tasks

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
- badge#status: In review

### Section: Detail Body [id="detail-body"]
- text#summary: Prepare first-run checklist and empty-state copy
- field#assignee: Sam
- field#due-date: Friday
- button#toggle-notes: Notes [action="toggle:detail-notes"]

#### State: Detail notes [id="detail-notes" type="revealed"]
- text#note-one: Confirm copy with support before shipping
