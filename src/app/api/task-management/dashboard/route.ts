// src/app/api/task-management/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

interface DepartmentStats {
  departmentId: number;
  departmentName: string;
  total: number;
  active: number;
  done: number;
  overdue: number;
}

interface StatusBreakdown {
  statusName: string;
  statusColor: string | null;
  count: number;
}

interface TaskSummary {
  id: number;
  name: string;
  priority: string | null;
  dueDate: string | null;
  client: { id: number; businessName: string } | null;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
  department: { id: number; name: string } | null;
  status: { id: number; name: string; color: string | null } | null;
}

interface DashboardData {
  stats: {
    total: number;
    active: number;
    done: number;
    overdue: number;
    urgent: number;
  };
  departmentStats: DepartmentStats[];
  statusBreakdown: StatusBreakdown[];
  overdueTasks: TaskSummary[];
  upcomingTasks: TaskSummary[];
}

/**
 * GET /api/task-management/dashboard
 * Returns aggregated task statistics for the dashboard
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all tasks with necessary relations
  const allTasks = await prisma.task.findMany({
    select: {
      id: true,
      name: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      client: { select: { id: true, businessName: true } },
      department: { select: { id: true, name: true } },
      status: { select: { id: true, name: true, color: true, isExitStep: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Helper: check if task is done based on status name or isExitStep flag
  const isDone = (task: typeof allTasks[0]) => {
    if (!task.status) return false;
    return task.status.isExitStep || /done|complet|finish/i.test(task.status.name);
  };

  // Helper: check if task is overdue
  const isOverdue = (task: typeof allTasks[0]) => {
    if (!task.dueDate || isDone(task)) return false;
    return new Date(task.dueDate) < today;
  };

  // Calculate overall stats
  const total = allTasks.length;
  const doneTasks = allTasks.filter(isDone);
  const done = doneTasks.length;
  const active = total - done;
  const overdue = allTasks.filter(isOverdue).length;
  const urgent = allTasks.filter(
    (t) => t.priority === "URGENT" && !isDone(t)
  ).length;

  // Department-wise breakdown
  const deptMap = new Map<number, DepartmentStats>();
  for (const task of allTasks) {
    if (!task.department) continue;
    const deptId = task.department.id;
    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, {
        departmentId: deptId,
        departmentName: task.department.name,
        total: 0,
        active: 0,
        done: 0,
        overdue: 0,
      });
    }
    const stats = deptMap.get(deptId)!;
    stats.total++;
    if (isDone(task)) {
      stats.done++;
    } else {
      stats.active++;
      if (isOverdue(task)) stats.overdue++;
    }
  }
  const departmentStats = Array.from(deptMap.values()).sort((a, b) =>
    a.departmentName.localeCompare(b.departmentName)
  );

  // Status breakdown
  const statusMap = new Map<string, { name: string; color: string | null; count: number }>();
  for (const task of allTasks) {
    if (!task.status) continue;
    const statusName = task.status.name;
    if (!statusMap.has(statusName)) {
      statusMap.set(statusName, {
        name: statusName,
        color: task.status.color,
        count: 0,
      });
    }
    statusMap.get(statusName)!.count++;
  }
  const statusBreakdown = Array.from(statusMap.values()).map((s) => ({
    statusName: s.name,
    statusColor: s.color,
    count: s.count,
  }));

  // Overdue tasks (top 8, sorted by due date ascending)
  const overdueTasks = allTasks
    .filter(isOverdue)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      name: t.name,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      client: t.client,
      assignedTo: t.assignedTo,
      department: t.department,
      status: t.status,
    }));

  // Upcoming tasks (not done, due date >= today, top 8, sorted by due date ascending)
  const upcomingTasks = allTasks
    .filter((t) => !isDone(t) && t.dueDate && new Date(t.dueDate) >= today)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      name: t.name,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      client: t.client,
      assignedTo: t.assignedTo,
      department: t.department,
      status: t.status,
    }));

  const data: DashboardData = {
    stats: { total, active, done, overdue, urgent },
    departmentStats,
    statusBreakdown,
    overdueTasks,
    upcomingTasks,
  };

  return NextResponse.json({ data });
}
