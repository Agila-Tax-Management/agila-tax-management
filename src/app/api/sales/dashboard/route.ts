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

    // Fetch all leads with their status and accepted quotes
    const leads = await prisma.lead.findMany({
      include: {
        status: { select: { id: true, name: true, isConverted: true } },
        quotes: {
          where: { status: "ACCEPTED" },
          include: {
            lineItems: { select: { negotiatedRate: true } },
          },
        },
      },
    });

    // Calculate stage counts (leads per status)
    const stageCounts = leadStatuses.map((status) => {
      return leads.filter((lead) => lead.statusId === status.id).length;
    });

    // Calculate total pipeline value (sum of all accepted quote line items)
    let totalValue = 0;
    for (const lead of leads) {
      for (const quote of lead.quotes) {
        for (const lineItem of quote.lineItems) {
          totalValue += Number(lineItem.negotiatedRate);
        }
      }
    }

    // Active opportunities (leads not in converted status)
    const activeOpportunities = leads.filter(
      (lead) => !lead.status.isConverted
    ).length;

    // Conversion rate (converted leads / total leads)
    const convertedLeads = leads.filter((lead) => lead.status.isConverted).length;
    const conversionRate =
      leads.length > 0 ? ((convertedLeads / leads.length) * 100).toFixed(1) : "0.0";

    // Average close time - calculated from converted leads with signed TSA and approved job orders
    let avgCloseTime = "Coming Soon";
    const convertedLeadsWithDates = leads.filter(
      (lead) => lead.status.isConverted && lead.isSignedTSA && lead.isCreatedJobOrder
    );

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

    return NextResponse.json({
      data: {
        stageCounts,
        totalValue: `₱${totalValue.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        activeOpportunities,
        conversionRate: `${conversionRate}%`,
        avgCloseTime,
        trends,
        pipelineData,
        hasData: leads.length > 0,
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
