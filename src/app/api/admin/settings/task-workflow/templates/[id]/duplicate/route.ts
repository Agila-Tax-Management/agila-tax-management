// src/app/api/admin/settings/task-workflow/templates/[id]/duplicate/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/settings/task-workflow/templates/[id]/duplicate
 * Deep-copies a template (routes + subtasks). The copy is named "<original> (Copy)".
 * Service links (servicePlans / serviceOneTimePlans) are NOT copied — a new template
 * starts unlinked so the user can intentionally link the right services.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const source = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
    include: {
      departmentRoutes: {
        orderBy: { routeOrder: "asc" },
        include: { subtasks: { orderBy: { subtaskOrder: "asc" } } },
      },
    },
  });

  if (!source) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const rawCopy = await prisma.taskTemplate.create({
    data: {
      name:        `${source.name} (Copy)`,
      description: source.description,
      daysDue:     source.daysDue,
      departmentRoutes: {
        create: source.departmentRoutes.map(r => ({
          departmentId: r.departmentId,
          routeOrder:   r.routeOrder,
          daysDue:      r.daysDue,
          subtasks: {
            create: r.subtasks.map(s => ({
              name:         s.name,
              description:  s.description,
              priority:     s.priority,
              daysDue:      s.daysDue,
              subtaskOrder: s.subtaskOrder,
            })),
          },
        })),
      },
    },
    include: {
      departmentRoutes: {
        orderBy: { routeOrder: "asc" },
        include: {
          department: { select: { id: true, name: true } },
          subtasks: { orderBy: { subtaskOrder: "asc" } },
        },
      },
      servicePlanLinks:    { include: { servicePlan: { select: { id: true, name: true, serviceRate: true, recurring: true, status: true } } } },
      serviceOneTimeLinks: { include: { serviceOneTime: { select: { id: true, name: true, serviceRate: true, status: true } } } },
    },
  });

  const { servicePlanLinks, serviceOneTimeLinks, ...copyRest } = rawCopy;
  const copy = {
    ...copyRest,
    servicePlans: servicePlanLinks.map((l) => l.servicePlan),
    serviceOneTimePlans: serviceOneTimeLinks.map((l) => l.serviceOneTime),
  };

  void logActivity({
    userId:      session.user.id,
    action:      "CREATED",
    entity:      "TaskTemplate",
    entityId:    String(copy.id),
    description: `Duplicated template "${source.name}" as "${copy.name}"`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: copy }, { status: 201 });
}
