// src/app/api/sales/dashboard/route.ts
import { NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import prisma from "@/lib/db";

/**
 * GET /api/sales/dashboard
 * 
 * Returns sales dashboard metrics and pipeline analytics.
 */
export async function GET() {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all lead statuses with their sequence
    const leadStatuses = await prisma.leadStatus.findMany({
      orderBy: { sequence: "asc" },
      select: { id: true, name: true, sequence: true, isConverted: true },
    });

    // Parallel database queries for optimal performance
    const [
      totalLeads,
      statusGroups,
      totalValue,
      convertedCount,
      convertedLeadsWithDates,
    ] = await Promise.all([
      // Total lead count
      prisma.lead.count(),

      // Group by status for stage counts
      prisma.lead.groupBy({
        by: ['statusId'],
        _count: { id: true },
      }),

      // Total pipeline value (sum of all accepted quote line items)
      prisma.quoteLineItem.aggregate({
        _sum: { negotiatedRate: true },
        where: { quote: { status: 'ACCEPTED' } },
      }),

      // Converted leads count
      prisma.lead.count({
        where: { status: { isConverted: true } },
      }),

      // Converted leads with dates for average close time
      prisma.lead.findMany({
        where: {
          status: { isConverted: true },
          isSignedTSA: true,
          isCreatedJobOrder: true,
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // Build stage counts map
    const statusCountMap = new Map(statusGroups.map((g) => [g.statusId, g._count.id]));
    const stageCounts = leadStatuses.map((status) => statusCountMap.get(status.id) ?? 0);

    // Active opportunities (total leads - converted leads)
    const activeOpportunities = totalLeads - convertedCount;

    // Conversion rate (converted leads / total leads)
    const conversionRate =
      totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : "0.0";

    // Average close time - calculated from converted leads with signed TSA and approved job orders
    let avgCloseTime = "Coming Soon";
    if (convertedLeadsWithDates.length > 0) {
      const totalDays = convertedLeadsWithDates.reduce((sum, lead) => {
        const created = new Date(lead.createdAt);
        const converted = new Date(lead.updatedAt);
        const diffMs = converted.getTime() - created.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      const avgDays = Math.round(totalDays / convertedLeadsWithDates.length);
      avgCloseTime = `${avgDays} days`;
    }

    // Trends (placeholder - requires historical comparison)
    const trends = {
      value: "N/A",
      opportunities: "N/A",
      conversion: "N/A",
      closeTime: "N/A",
    };

    // Pipeline data for charts
    const pipelineData = leadStatuses.map((status, index) => ({
      name: status.name,
      value: stageCounts[index] ?? 0,
    }));

    const totalValueNum = Number(totalValue._sum.negotiatedRate ?? 0);

    return NextResponse.json({
      data: {
        stageCounts,
        totalValue: `₱${totalValueNum.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        activeOpportunities,
        conversionRate: `${conversionRate}%`,
        avgCloseTime,
        trends,
        pipelineData,
        hasData: totalLeads > 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[GET /api/sales/dashboard]", err);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
