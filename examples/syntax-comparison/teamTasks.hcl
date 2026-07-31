// Prototype only: Surface semantics hosted in HCL native syntax.
surface {
  version = "0.1"
}

application "teamTasks" {
  name                = "Team Tasks"
  version             = "0.1.0"
  purpose             = "Help small teams create, assign, and complete shared tasks."
  specificationStatus = structuredDraft
}

actor "member" {
  kind        = human
  description = "A person who creates and completes team tasks."

  responsibilities = [
    "Create tasks.",
    "Complete assigned tasks.",
  ]
}

actor "administrator" {
  kind        = human
  description = "A person who manages every task in the application."
}

value "taskTitle" {
  base = string

  constraints = [
    "The title must contain between 1 and 120 characters.",
    "The title must not contain only whitespace.",
  ]
}

enum "taskStatus" {
  values = [
    "open",
    "completed",
    "archived",
  ]
}

entity "user" {
  field "id" {
    type      = uuid
    generated = true
  }

  field "displayName" {
    type          = string
    maximumLength = 100
  }

  field "email" {
    type      = email
    unique    = true
    sensitive = true
  }
}

entity "task" {
  field "id" {
    type      = uuid
    generated = true
  }

  field "title" {
    type = value.taskTitle
  }

  field "owner" {
    type = entity.user
  }

  field "status" {
    type    = enum.taskStatus
    default = "open"
  }

  field "createdAt" {
    type      = timestamp
    generated = true
  }

  field "completedAt" {
    type     = timestamp
    optional = true
  }
}

event "taskCompleted" {
  source = behavior.taskComplete

  payload "task" {
    type = entity.task
  }

  payload "completedBy" {
    type = entity.user
  }
}

policy "taskView" {
  actor    = actor.member
  resource = entity.task
  action   = "view"

  allowWhen = [
    "The actor owns the task.",
    "The actor is an administrator.",
  ]
}

policy "taskComplete" {
  actor    = actor.member
  resource = entity.task
  action   = "complete"

  allowWhen = [
    "The actor owns the task.",
    "The actor is an administrator.",
  ]

  denyWhen = [
    "The task status is not open.",
  ]
}

behavior "taskComplete" {
  actor    = actor.member
  resource = entity.task
  policy   = policy.taskComplete

  input "task" {
    type = entity.task
  }

  requires = [
    "The task status is open.",
  ]

  effects = [
    "Set the task status to completed.",
    "Record the current timestamp as completedAt.",
  ]

  emits = [event.taskCompleted]

  errors = [
    "taskNotFound",
    "permissionDenied",
    "invalidTaskState",
  ]

  idempotent = false
}

query "taskGet" {
  actor  = actor.member
  policy = policy.taskView

  input "taskId" {
    type = uuid
  }

  returns {
    type     = entity.task
    nullable = true
  }

  requirements = [
    "Return the task matching taskId.",
    "Return null when the task does not exist.",
  ]
}

workflow "taskLifecycle" {
  entity       = entity.task
  states       = ["open", "completed", "archived"]
  initialState = "open"

  transition "complete" {
    from     = "open"
    to       = "completed"
    behavior = behavior.taskComplete
    policy   = policy.taskComplete
  }

  transition "archive" {
    from = "completed"
    to   = "archived"

    conditions = [
      "The task satisfies the confirmed retention period.",
    ]
  }

  invariants = [
    "A completed task must have a completedAt timestamp.",
  ]
}

interface "taskApi" {
  kind           = http
  basePath       = "/api"
  authentication = "Require an authenticated user."

  operation "getTask" {
    method = "GET"
    path   = "/tasks/{taskId}"
    query  = query.taskGet

    responses = {
      success          = 200
      notFound         = 404
      permissionDenied = 403
    }
  }

  operation "completeTask" {
    method   = "POST"
    path     = "/tasks/{taskId}/complete"
    behavior = behavior.taskComplete

    responses = {
      success          = 200
      notFound         = 404
      permissionDenied = 403
      invalidTaskState = 409
    }
  }
}

component "taskStatusBadge" {
  input "status" {
    type = enum.taskStatus
  }

  states = ["open", "completed", "archived"]

  requirements = [
    "Display the task status as text.",
    "Do not communicate the task status using colour alone.",
  ]
}

screen "taskDetails" {
  route      = "/tasks/:taskId"
  actors     = [actor.member, actor.administrator]
  data       = [query.taskGet]
  sections   = ["Task summary", "Ownership"]
  components = [component.taskStatusBadge]

  action "completeTask" {
    label       = "Complete Task"
    behavior    = behavior.taskComplete
    visibleWhen = "The task status is open."
  }

  states = {
    loading  = "Display a loading placeholder."
    notFound = "Display a task-not-found message."
    error    = "Display an error message and a retry action."
  }
}

scenario "memberCompletesOpenTask" {
  relatesTo = [
    behavior.taskComplete,
    workflow.taskLifecycle,
  ]

  given = [
    "The actor owns the task.",
    "The task status is open.",
  ]

  when = [
    "The actor completes the task.",
  ]

  then = [
    "The task status becomes completed.",
    "The completion timestamp is recorded.",
    "Exactly one taskCompleted event is emitted.",
  ]
}
