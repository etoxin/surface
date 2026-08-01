export type TenantRole =
  | "owner"
  | "administrator"
  | "contributor"
  | "viewer";

export type TenantPermission =
  | "tenantRead"
  | "projectCreate"
  | "projectUpdate"
  | "workItemCreate"
  | "workItemUpdate"
  | "membershipManage";

export type WorkItemStatus = "backlog" | "active" | "done";

export interface Tenant {
  id: string;
  name: string;
}

export interface TenantMembership {
  tenantId: string;
  userId: string;
  role: TenantRole;
}

export interface Project {
  tenantId: string;
  id: string;
  name: string;
  description?: string;
  version: number;
}

export interface WorkItem {
  tenantId: string;
  projectId: string;
  id: string;
  title: string;
  status: WorkItemStatus;
  assigneeUserId?: string;
  version: number;
}

export interface AuthorizationRequest {
  actorUserId: string;
  tenantId: string;
  permission: TenantPermission;
}

export interface AuthorizationDecision {
  allowed: boolean;
  role?: TenantRole;
}

export interface UserTenantMembership {
  tenantId: string;
  tenantName: string;
  role: TenantRole;
}

export interface UserTenantList {
  memberships: UserTenantMembership[];
}

export interface TenantWorkspace {
  tenantId: string;
  projects: Project[];
  workItems: WorkItem[];
}

export interface TrackerState {
  tenants: Map<string, Tenant>;
  memberships: Map<string, TenantMembership>;
  projects: Map<string, Project>;
  workItems: Map<string, WorkItem>;
  nextId: number;
}

export interface CreateProjectInput {
  actorUserId: string;
  tenantId: string;
  name: string;
  description?: string;
}

export interface UpdateProjectInput extends CreateProjectInput {
  projectId: string;
  expectedVersion: number;
}

export interface CreateWorkItemInput {
  actorUserId: string;
  tenantId: string;
  projectId: string;
  title: string;
  assigneeUserId?: string;
}

export interface UpdateWorkItemInput {
  actorUserId: string;
  tenantId: string;
  workItemId: string;
  expectedVersion: number;
  title: string;
  status: WorkItemStatus;
  assigneeUserId?: string;
  clearAssignee: boolean;
}

export interface SetTenantMembershipInput {
  actorUserId: string;
  tenantId: string;
  memberUserId: string;
  role: TenantRole;
}

export const DEVELOPMENT_TENANTS = {
  atlas: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Atlas Studio",
  },
  beacon: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Beacon Works",
  },
} as const satisfies Record<string, Tenant>;

export const DEVELOPMENT_USERS = {
  owner: {
    id: "00000000-0000-4000-8000-000000000001",
    label: "Olivia — Atlas owner, Beacon viewer",
  },
  administrator: {
    id: "00000000-0000-4000-8000-000000000002",
    label: "Ari — Atlas administrator",
  },
  contributor: {
    id: "00000000-0000-4000-8000-000000000003",
    label: "Casey — Atlas contributor",
  },
  viewer: {
    id: "00000000-0000-4000-8000-000000000004",
    label: "Vivian — Atlas viewer",
  },
  dual: {
    id: "00000000-0000-4000-8000-000000000005",
    label: "Devon — Atlas contributor, Beacon owner",
  },
  outsider: {
    id: "00000000-0000-4000-8000-000000000099",
    label: "Morgan — no tenant memberships",
  },
} as const;

export const DEVELOPMENT_SHARED_PROJECT_ID = "33333333-3333-4333-8333-333333333333";
export const DEVELOPMENT_SHARED_WORK_ITEM_ID = "44444444-4444-4444-8444-444444444444";

const ROLE_PERMISSIONS: Record<TenantRole, ReadonlySet<TenantPermission>> = {
  owner: new Set([
    "tenantRead",
    "projectCreate",
    "projectUpdate",
    "workItemCreate",
    "workItemUpdate",
    "membershipManage",
  ]),
  administrator: new Set([
    "tenantRead",
    "projectCreate",
    "projectUpdate",
    "workItemCreate",
    "workItemUpdate",
  ]),
  contributor: new Set(["tenantRead", "workItemCreate", "workItemUpdate"]),
  viewer: new Set(["tenantRead"]),
};

export function createTrackerState(): TrackerState {
  return {
    tenants: new Map(),
    memberships: new Map(),
    projects: new Map(),
    workItems: new Map(),
    nextId: 1,
  };
}

export function createDevelopmentState(): TrackerState {
  const state = createTrackerState();
  for (const tenant of Object.values(DEVELOPMENT_TENANTS)) {
    state.tenants.set(tenant.id, { ...tenant });
  }

  seedMembership(
    state,
    DEVELOPMENT_TENANTS.atlas.id,
    DEVELOPMENT_USERS.owner.id,
    "owner",
  );
  seedMembership(
    state,
    DEVELOPMENT_TENANTS.atlas.id,
    DEVELOPMENT_USERS.administrator.id,
    "administrator",
  );
  seedMembership(
    state,
    DEVELOPMENT_TENANTS.atlas.id,
    DEVELOPMENT_USERS.contributor.id,
    "contributor",
  );
  seedMembership(
    state,
    DEVELOPMENT_TENANTS.atlas.id,
    DEVELOPMENT_USERS.viewer.id,
    "viewer",
  );
  seedMembership(
    state,
    DEVELOPMENT_TENANTS.atlas.id,
    DEVELOPMENT_USERS.dual.id,
    "contributor",
  );
  seedMembership(
    state,
    DEVELOPMENT_TENANTS.beacon.id,
    DEVELOPMENT_USERS.owner.id,
    "viewer",
  );
  seedMembership(
    state,
    DEVELOPMENT_TENANTS.beacon.id,
    DEVELOPMENT_USERS.dual.id,
    "owner",
  );

  seedProject(state, {
    tenantId: DEVELOPMENT_TENANTS.atlas.id,
    id: DEVELOPMENT_SHARED_PROJECT_ID,
    name: "Atlas launch",
    description: "The Atlas tenant's independently scoped launch project.",
    version: 1,
  });
  seedProject(state, {
    tenantId: DEVELOPMENT_TENANTS.beacon.id,
    id: DEVELOPMENT_SHARED_PROJECT_ID,
    name: "Beacon launch",
    description: "The Beacon tenant may safely reuse the same project id.",
    version: 1,
  });
  seedWorkItem(state, {
    tenantId: DEVELOPMENT_TENANTS.atlas.id,
    projectId: DEVELOPMENT_SHARED_PROJECT_ID,
    id: DEVELOPMENT_SHARED_WORK_ITEM_ID,
    title: "Prepare Atlas brief",
    status: "active",
    assigneeUserId: DEVELOPMENT_USERS.contributor.id,
    version: 1,
  });
  seedWorkItem(state, {
    tenantId: DEVELOPMENT_TENANTS.beacon.id,
    projectId: DEVELOPMENT_SHARED_PROJECT_ID,
    id: DEVELOPMENT_SHARED_WORK_ITEM_ID,
    title: "Prepare Beacon brief",
    status: "backlog",
    assigneeUserId: DEVELOPMENT_USERS.dual.id,
    version: 1,
  });
  return state;
}

export function authorizeTenantAction(
  state: TrackerState,
  input: AuthorizationRequest,
): AuthorizationDecision {
  const membership = state.memberships.get(
    membershipKey(input.tenantId, input.actorUserId),
  );
  if (!membership) return { allowed: false };
  return {
    allowed: ROLE_PERMISSIONS[membership.role].has(input.permission),
    role: membership.role,
  };
}

export function listUserTenants(
  state: TrackerState,
  input: { actorUserId: string },
): UserTenantList {
  const memberships: UserTenantMembership[] = [];
  for (const membership of state.memberships.values()) {
    if (membership.userId !== input.actorUserId) continue;
    const tenant = state.tenants.get(membership.tenantId);
    if (!tenant) continue;
    memberships.push({
      tenantId: tenant.id,
      tenantName: tenant.name,
      role: membership.role,
    });
  }
  memberships.sort((left, right) =>
    compareText(left.tenantName, right.tenantName) ||
    compareText(left.tenantId, right.tenantId)
  );
  return { memberships };
}

export function loadTenantWorkspace(
  state: TrackerState,
  input: { actorUserId: string; tenantId: string },
): TenantWorkspace | null {
  if (!isAllowed(state, input, "tenantRead")) return null;

  const projects = [...state.projects.values()]
    .filter((project) => project.tenantId === input.tenantId)
    .sort((left, right) =>
      compareText(left.name, right.name) || compareText(left.id, right.id)
    )
    .map(copyProject);
  const projectIds = new Set(projects.map((project) => project.id));
  const workItems = [...state.workItems.values()]
    .filter((item) =>
      item.tenantId === input.tenantId && projectIds.has(item.projectId)
    )
    .sort((left, right) =>
      compareText(left.projectId, right.projectId) ||
      compareText(left.status, right.status) ||
      compareText(left.title, right.title) ||
      compareText(left.id, right.id)
    )
    .map(copyWorkItem);
  return { tenantId: input.tenantId, projects, workItems };
}

export function createProject(
  state: TrackerState,
  input: CreateProjectInput,
): Project | null {
  if (!isAllowed(state, input, "projectCreate")) return null;
  const name = input.name.trim();
  if (!name || projectNameExists(state, input.tenantId, name)) return null;
  const project: Project = {
    tenantId: input.tenantId,
    id: generateId(state),
    name,
    ...(input.description === undefined ? {} : { description: input.description }),
    version: 1,
  };
  state.projects.set(projectKey(project.tenantId, project.id), project);
  return copyProject(project);
}

export function updateProject(
  state: TrackerState,
  input: UpdateProjectInput,
): Project | null {
  if (!isAllowed(state, input, "projectUpdate")) return null;
  const key = projectKey(input.tenantId, input.projectId);
  const project = state.projects.get(key);
  const name = input.name.trim();
  if (!project || !name || project.version !== input.expectedVersion) return null;
  if (projectNameExists(state, input.tenantId, name, input.projectId)) return null;

  const updated: Project = {
    tenantId: project.tenantId,
    id: project.id,
    name,
    ...(input.description === undefined ? {} : { description: input.description }),
    version: project.version + 1,
  };
  state.projects.set(key, updated);
  return copyProject(updated);
}

export function createWorkItem(
  state: TrackerState,
  input: CreateWorkItemInput,
): WorkItem | null {
  if (!isAllowed(state, input, "workItemCreate")) return null;
  if (!state.projects.has(projectKey(input.tenantId, input.projectId))) return null;
  const title = input.title.trim();
  if (!title || !validAssignee(state, input.tenantId, input.assigneeUserId)) {
    return null;
  }

  const workItem: WorkItem = {
    tenantId: input.tenantId,
    projectId: input.projectId,
    id: generateId(state),
    title,
    status: "backlog",
    ...(input.assigneeUserId === undefined
      ? {}
      : { assigneeUserId: input.assigneeUserId }),
    version: 1,
  };
  state.workItems.set(workItemKey(workItem.tenantId, workItem.id), workItem);
  return copyWorkItem(workItem);
}

export function updateWorkItem(
  state: TrackerState,
  input: UpdateWorkItemInput,
): WorkItem | null {
  if (!isAllowed(state, input, "workItemUpdate")) return null;
  const key = workItemKey(input.tenantId, input.workItemId);
  const item = state.workItems.get(key);
  const title = input.title.trim();
  if (
    !item || !title || item.version !== input.expectedVersion ||
    (input.clearAssignee && input.assigneeUserId !== undefined) ||
    !validAssignee(state, input.tenantId, input.assigneeUserId)
  ) return null;

  const assigneeUserId = input.clearAssignee
    ? undefined
    : input.assigneeUserId ?? item.assigneeUserId;
  const updated: WorkItem = {
    tenantId: item.tenantId,
    projectId: item.projectId,
    id: item.id,
    title,
    status: input.status,
    ...(assigneeUserId === undefined ? {} : { assigneeUserId }),
    version: item.version + 1,
  };
  state.workItems.set(key, updated);
  return copyWorkItem(updated);
}

export function setTenantMembership(
  state: TrackerState,
  input: SetTenantMembershipInput,
): TenantMembership | null {
  if (!isAllowed(state, input, "membershipManage")) return null;
  const membership: TenantMembership = {
    tenantId: input.tenantId,
    userId: input.memberUserId,
    role: input.role,
  };
  state.memberships.set(membershipKey(input.tenantId, input.memberUserId), membership);
  return { ...membership };
}

function isAllowed(
  state: TrackerState,
  input: { actorUserId: string; tenantId: string },
  permission: TenantPermission,
): boolean {
  return authorizeTenantAction(state, { ...input, permission }).allowed;
}

function validAssignee(
  state: TrackerState,
  tenantId: string,
  assigneeUserId: string | undefined,
): boolean {
  return assigneeUserId === undefined ||
    state.memberships.has(membershipKey(tenantId, assigneeUserId));
}

function projectNameExists(
  state: TrackerState,
  tenantId: string,
  name: string,
  exceptProjectId?: string,
): boolean {
  const folded = name.toLocaleLowerCase("en-US");
  return [...state.projects.values()].some((project) =>
    project.tenantId === tenantId && project.id !== exceptProjectId &&
    project.name.toLocaleLowerCase("en-US") === folded
  );
}

function membershipKey(tenantId: string, userId: string): string {
  return `${tenantId}\u0000${userId}`;
}

function projectKey(tenantId: string, projectId: string): string {
  return `${tenantId}\u0000${projectId}`;
}

function workItemKey(tenantId: string, workItemId: string): string {
  return `${tenantId}\u0000${workItemId}`;
}

function generateId(state: TrackerState): string {
  const suffix = String(state.nextId++).padStart(12, "0");
  return `90000000-0000-4000-8000-${suffix}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function copyProject(project: Project): Project {
  return {
    tenantId: project.tenantId,
    id: project.id,
    name: project.name,
    ...(project.description === undefined ? {} : { description: project.description }),
    version: project.version,
  };
}

function copyWorkItem(item: WorkItem): WorkItem {
  return {
    tenantId: item.tenantId,
    projectId: item.projectId,
    id: item.id,
    title: item.title,
    status: item.status,
    ...(item.assigneeUserId === undefined
      ? {}
      : { assigneeUserId: item.assigneeUserId }),
    version: item.version,
  };
}

function seedMembership(
  state: TrackerState,
  tenantId: string,
  userId: string,
  role: TenantRole,
): void {
  state.memberships.set(membershipKey(tenantId, userId), { tenantId, userId, role });
}

function seedProject(state: TrackerState, project: Project): void {
  state.projects.set(projectKey(project.tenantId, project.id), project);
}

function seedWorkItem(state: TrackerState, item: WorkItem): void {
  state.workItems.set(workItemKey(item.tenantId, item.id), item);
}
