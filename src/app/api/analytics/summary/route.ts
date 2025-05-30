import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get("clinicId");
    const agentId = searchParams.get("agentId");
    const timeFrame = searchParams.get("timeFrame") || "week";
    const endDate = new Date();
    const startDate = calculateStartDate(endDate, timeFrame);
    const whereClause: {
      callStartTime: { gte: Date; lte: Date };
      clinicId?: string;
      agentId?: string;
    } = {
      callStartTime: { gte: startDate, lte: endDate },
    };
    if (clinicId) {
      whereClause.clinicId = clinicId;
    }
    if (agentId) {
      whereClause.agentId = agentId;
    }
    try {
      const totalCalls = await prisma.call.count({
        where: whereClause,
      });
      const durationData = await prisma.call.aggregate({
        where: whereClause,
        _avg: {
          durationSeconds: true,
        },
      });
      const avgDuration = durationData._avg.durationSeconds || 0;
      const protocolData = await prisma.call.aggregate({
        where: whereClause,
        _avg: {
          protocolAdherence: true,
        },
      });
      const avgProtocolAdherence = protocolData._avg.protocolAdherence || 0;
      const needsReviewCount = await prisma.call.count({
        where: {
          ...whereClause,
          checkStatus: "PENDING",
        },
      });
      const previousPeriodStart = new Date(startDate);
      const previousPeriodEnd = new Date(startDate);
      switch (timeFrame) {
        case "day":
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
          break;
        case "week":
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
          break;
        case "month":
          previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
          break;
        case "6months":
          previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 6);
          break;
        case "year":
          previousPeriodStart.setFullYear(
            previousPeriodStart.getFullYear() - 1
          );
          break;
      }
      const previousWhereClause = {
        ...whereClause,
        callStartTime: { gte: previousPeriodStart, lte: previousPeriodEnd },
      };
      const prevTotalCalls = await prisma.call.count({
        where: previousWhereClause,
      });
      const prevNeedsReviewCount = await prisma.call.count({
        where: {
          ...previousWhereClause,
          checkStatus: "PENDING",
        },
      });
      const reviewChange =
        prevTotalCalls > 0
          ? (needsReviewCount / totalCalls -
              prevNeedsReviewCount / prevTotalCalls) *
            100
          : 0;
      const callsChange =
        prevTotalCalls > 0
          ? ((totalCalls - prevTotalCalls) / prevTotalCalls) * 100
          : 0;
      return NextResponse.json({
        totalCalls,
        avgDuration,
        avgProtocolAdherence,
        needsReviewCount,
        changes: {
          calls: callsChange,
          needsReview: reviewChange,
        },
      });
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return NextResponse.json(
        {
          error: "Database query failed",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
function calculateStartDate(endDate: Date, timeFrame: string): Date {
  const startDate = new Date(endDate);
  switch (timeFrame) {
    case "day":
      startDate.setDate(endDate.getDate() - 1);
      break;
    case "week":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case "6months":
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case "year":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7); 
  }
  return startDate;
}
