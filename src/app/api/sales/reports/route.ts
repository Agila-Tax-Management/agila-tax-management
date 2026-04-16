// src/app/api/sales/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import prisma from "@/lib/db";

/**
 * GET /api/sales/reports?filter=weekly&date=2026-04-16
 * 
 * Returns sales reports with metrics for the specified time period.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = (searchParams.get("filter") ?? "weekly") as "daily" | "weekly" | "monthly" | "yearly";
  const dateParam = searchParams.get("date") ?? new Date().toISOString();

  try {
    const targetDate = new Date(dateParam);
    let startDate: Date;
    let endDate: Date;

    // Calculate date range based on filter
    switch (filter) {
      case "daily":
        startDate = new Date(targetDate.setHours(0, 0, 0, 0));
        endDate = new Date(targetDate.setHours(23, 59, 59, 999));
        break;
      case "weekly": {
        const dayOfWeek = targetDate.getDay();
        startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "monthly":
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "yearly":
        startDate = new Date(targetDate.getFullYear(), 0, 1);
        endDate = new Date(targetDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(targetDate.setHours(0, 0, 0, 0));
        endDate = new Date(targetDate.setHours(23, 59, 59, 999));
    }

    // Fetch paid invoices in the date range
    const invoices = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        total: true,
        issueDate: true,
      },
    });

    // Calculate total sales
    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Fetch active recurring subscriptions
    const activeRetainers = await prisma.subscription.count({
      where: {
        status: "ACTIVE",
      },
    });

    // Build chart data based on filter
    const chartData: Array<{ name: string; sales: number }> = [];
    
    if (filter === "daily") {
      // Hourly breakdown
      for (let hour = 0; hour < 24; hour += 2) {
        const hourStart = new Date(startDate);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(startDate);
        hourEnd.setHours(hour + 2, 0, 0, 0);

        const hourSales = invoices
          .filter((inv) => new Date(inv.issueDate) >= hourStart && new Date(inv.issueDate) < hourEnd)
          .reduce((sum, inv) => sum + Number(inv.total), 0);

        chartData.push({
          name: `${String(hour).padStart(2, "0")}:00`,
          sales: hourSales,
        });
      }
    } else if (filter === "weekly") {
      // Daily breakdown
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(startDate.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const daySales = invoices
          .filter((inv) => new Date(inv.issueDate) >= dayStart && new Date(inv.issueDate) <= dayEnd)
          .reduce((sum, inv) => sum + Number(inv.total), 0);

        chartData.push({
          name: days[dayStart.getDay()]!,
          sales: daySales,
        });
      }
    } else if (filter === "monthly") {
      // Weekly breakdown
      let weekStart = new Date(startDate);
      let weekNum = 1;
      while (weekStart < endDate) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());

        const weekSales = invoices
          .filter((inv) => new Date(inv.issueDate) >= weekStart && new Date(inv.issueDate) <= weekEnd)
          .reduce((sum, inv) => sum + Number(inv.total), 0);

        chartData.push({
          name: `Week ${weekNum}`,
          sales: weekSales,
        });

        weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() + 1);
        weekNum++;
      }
    } else if (filter === "yearly") {
      // Monthly breakdown
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(targetDate.getFullYear(), month, 1);
        const monthEnd = new Date(targetDate.getFullYear(), month + 1, 0, 23, 59, 59, 999);

        const monthSales = invoices
          .filter((inv) => new Date(inv.issueDate) >= monthStart && new Date(inv.issueDate) <= monthEnd)
          .reduce((sum, inv) => sum + Number(inv.total), 0);

        chartData.push({
          name: months[month]!,
          sales: monthSales,
        });
      }
    }

    return NextResponse.json({
      data: {
        totalSales,
        totalCommission: 0, // Coming soon
        netSales: totalSales,
        activeRetainers,
        averageCommissionRate: 0, // Coming soon
        trend: "N/A", // Requires historical comparison
        chartData,
      },
    });
  } catch (err) {
    console.error("[GET /api/sales/reports]", err);
    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}
