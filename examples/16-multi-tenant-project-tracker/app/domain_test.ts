import {
  deepStrictEqual as assertEquals,
  ok as assert,
  strictEqual,
} from "node:assert/strict";

import {
  authorizeTenantAction,
  createDevelopmentState,
  createProject,
  createWorkItem,
  DEVELOPMENT_SHARED_PROJECT_ID,
  DEVELOPMENT_SHARED_WORK_ITEM_ID,
  DEVELOPMENT_TENANTS,
  DEVELOPMENT_USERS,
  listUserTenants,
  loadTenantWorkspace,
  setTenantMembership,
  type TenantPermission,
  type TenantRole,
  updateProject,
  updateWorkItem,
} from "./domain.ts";

const atlasId = DEVELOPMENT_TENANTS.atlas.id;
const beaconId = DEVELOPMENT_TENANTS.beacon.id;

Deno.test("tenant lists and workspaces contain only exact memberships and tenant data", () => {
  const state = createDevelopmentState();
  const memberships = listUserTenants(state, {
    actorUserId: DEVELOPMENT_USERS.owner.id,
  });
  assertEquals(memberships, {
    memberships: [
      { tenantId: atlasId, tenantName: "Atlas Studio", role: "owner" },
      { tenantId: beaconId, tenantName: "Beacon Works", role: "viewer" },
    ],
  });
  assertEquals(
    listUserTenants(state, { actorUserId: DEVELOPMENT_USERS.outsider.id }),
    { memberships: [] },
  );

  const atlas = loadTenantWorkspace(state, {
    actorUserId: DEVELOPMENT_USERS.owner.id,
    tenantId: atlasId,
  });
  const beacon = loadTenantWorkspace(state, {
    actorUserId: DEVELOPMENT_USERS.owner.id,
    tenantId: beaconId,
  });
  assert(atlas && beacon);
  strictEqual(atlas.projects[0].id, beacon.projects[0].id);
  strictEqual(atlas.projects[0].name, "Atlas launch");
  strictEqual(beacon.projects[0].name, "Beacon launch");
  strictEqual(atlas.workItems[0].title, "Prepare Atlas brief");
  strictEqual(beacon.workItems[0].title, "Prepare Beacon brief");
  strictEqual(
    loadTenantWorkspace(state, {
      actorUserId: DEVELOPMENT_USERS.outsider.id,
      tenantId: atlasId,
    }),
    null,
  );
});

Deno.test("role permissions differ exactly by tenant role", () => {
  const state = createDevelopmentState();
  const matrix: Record<TenantRole, TenantPermission[]> = {
    owner: [
      "tenantRead",
      "projectCreate",
      "projectUpdate",
      "workItemCreate",
      "workItemUpdate",
      "membershipManage",
    ],
    administrator: [
      "tenantRead",
      "projectCreate",
      "projectUpdate",
      "workItemCreate",
      "workItemUpdate",
    ],
    contributor: ["tenantRead", "workItemCreate", "workItemUpdate"],
    viewer: ["tenantRead"],
  };
  const actors: Record<TenantRole, string> = {
    owner: DEVELOPMENT_USERS.owner.id,
    administrator: DEVELOPMENT_USERS.administrator.id,
    contributor: DEVELOPMENT_USERS.contributor.id,
    viewer: DEVELOPMENT_USERS.viewer.id,
  };
  const permissions = matrix.owner;
  for (const role of Object.keys(matrix) as TenantRole[]) {
    for (const permission of permissions) {
      assertEquals(
        authorizeTenantAction(state, {
          actorUserId: actors[role],
          tenantId: atlasId,
          permission,
        }),
        { allowed: matrix[role].includes(permission), role },
      );
    }
  }
  assertEquals(
    authorizeTenantAction(state, {
      actorUserId: DEVELOPMENT_USERS.outsider.id,
      tenantId: atlasId,
      permission: "tenantRead",
    }),
    { allowed: false },
  );

  strictEqual(
    createProject(state, {
      actorUserId: DEVELOPMENT_USERS.contributor.id,
      tenantId: atlasId,
      name: "Not permitted",
    }),
    null,
  );
  assert(
    createWorkItem(state, {
      actorUserId: DEVELOPMENT_USERS.contributor.id,
      tenantId: atlasId,
      projectId: DEVELOPMENT_SHARED_PROJECT_ID,
      title: "Contributor item",
    }),
  );
});

Deno.test("composite resource keys and same-tenant assignment prevent cross-tenant use", () => {
  const state = createDevelopmentState();

  const beaconUpdate = updateProject(state, {
    actorUserId: DEVELOPMENT_USERS.dual.id,
    tenantId: beaconId,
    projectId: DEVELOPMENT_SHARED_PROJECT_ID,
    expectedVersion: 1,
    name: "Beacon only",
  });
  strictEqual(beaconUpdate?.name, "Beacon only");
  strictEqual(
    loadTenantWorkspace(state, {
      actorUserId: DEVELOPMENT_USERS.owner.id,
      tenantId: atlasId,
    })?.projects[0].name,
    "Atlas launch",
  );

  const atlasOnlyProject = createProject(state, {
    actorUserId: DEVELOPMENT_USERS.owner.id,
    tenantId: atlasId,
    name: "Atlas only",
  });
  assert(atlasOnlyProject);
  strictEqual(
    createWorkItem(state, {
      actorUserId: DEVELOPMENT_USERS.dual.id,
      tenantId: beaconId,
      projectId: atlasOnlyProject.id,
      title: "Cross-tenant parent",
    }),
    null,
  );
  strictEqual(
    createWorkItem(state, {
      actorUserId: DEVELOPMENT_USERS.dual.id,
      tenantId: beaconId,
      projectId: DEVELOPMENT_SHARED_PROJECT_ID,
      title: "Wrong tenant assignee",
      assigneeUserId: DEVELOPMENT_USERS.administrator.id,
    }),
    null,
  );
  assert(
    createWorkItem(state, {
      actorUserId: DEVELOPMENT_USERS.dual.id,
      tenantId: beaconId,
      projectId: DEVELOPMENT_SHARED_PROJECT_ID,
      title: "Same tenant assignee",
      assigneeUserId: DEVELOPMENT_USERS.owner.id,
    }),
  );
});

Deno.test("optimistic conflicts do not mutate projects or work items", () => {
  const state = createDevelopmentState();
  const projectConflict = updateProject(state, {
    actorUserId: DEVELOPMENT_USERS.owner.id,
    tenantId: atlasId,
    projectId: DEVELOPMENT_SHARED_PROJECT_ID,
    expectedVersion: 9,
    name: "Must not persist",
  });
  strictEqual(projectConflict, null);
  const unchangedProject = loadTenantWorkspace(state, {
    actorUserId: DEVELOPMENT_USERS.owner.id,
    tenantId: atlasId,
  })?.projects[0];
  assertEquals(unchangedProject, {
    tenantId: atlasId,
    id: DEVELOPMENT_SHARED_PROJECT_ID,
    name: "Atlas launch",
    description: "The Atlas tenant's independently scoped launch project.",
    version: 1,
  });

  const updated = updateWorkItem(state, {
    actorUserId: DEVELOPMENT_USERS.contributor.id,
    tenantId: atlasId,
    workItemId: DEVELOPMENT_SHARED_WORK_ITEM_ID,
    expectedVersion: 1,
    title: "Prepared Atlas brief",
    status: "done",
    clearAssignee: true,
  });
  assert(updated);
  strictEqual(updated.version, 2);
  strictEqual(updated.assigneeUserId, undefined);
  strictEqual(
    updateWorkItem(state, {
      actorUserId: DEVELOPMENT_USERS.contributor.id,
      tenantId: atlasId,
      workItemId: DEVELOPMENT_SHARED_WORK_ITEM_ID,
      expectedVersion: 1,
      title: "Stale overwrite",
      status: "backlog",
      clearAssignee: false,
    }),
    null,
  );
  const stored = loadTenantWorkspace(state, {
    actorUserId: DEVELOPMENT_USERS.owner.id,
    tenantId: atlasId,
  })?.workItems[0];
  strictEqual(stored?.title, "Prepared Atlas brief");
  strictEqual(stored?.version, 2);
});

Deno.test("membership management is owner-only and remains tenant-scoped", () => {
  const state = createDevelopmentState();
  strictEqual(
    setTenantMembership(state, {
      actorUserId: DEVELOPMENT_USERS.administrator.id,
      tenantId: atlasId,
      memberUserId: DEVELOPMENT_USERS.outsider.id,
      role: "viewer",
    }),
    null,
  );
  assertEquals(
    setTenantMembership(state, {
      actorUserId: DEVELOPMENT_USERS.owner.id,
      tenantId: atlasId,
      memberUserId: DEVELOPMENT_USERS.outsider.id,
      role: "administrator",
    }),
    {
      tenantId: atlasId,
      userId: DEVELOPMENT_USERS.outsider.id,
      role: "administrator",
    },
  );
  assertEquals(
    listUserTenants(state, { actorUserId: DEVELOPMENT_USERS.outsider.id }),
    {
      memberships: [{
        tenantId: atlasId,
        tenantName: "Atlas Studio",
        role: "administrator",
      }],
    },
  );
  strictEqual(
    setTenantMembership(state, {
      actorUserId: DEVELOPMENT_USERS.owner.id,
      tenantId: beaconId,
      memberUserId: DEVELOPMENT_USERS.outsider.id,
      role: "owner",
    }),
    null,
  );
  assertEquals(
    authorizeTenantAction(state, {
      actorUserId: DEVELOPMENT_USERS.outsider.id,
      tenantId: atlasId,
      permission: "projectCreate",
    }),
    { allowed: true, role: "administrator" },
  );
  assertEquals(
    authorizeTenantAction(state, {
      actorUserId: DEVELOPMENT_USERS.outsider.id,
      tenantId: beaconId,
      permission: "projectCreate",
    }),
    { allowed: false },
  );
});
