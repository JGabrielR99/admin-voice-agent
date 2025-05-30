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
    const sentimentCounts = await prisma.call.groupBy({
      by: ["sentiment"],
      where: whereClause,
      _count: {
        id: true,
      },
    });
    const sentimentData = sentimentCounts.map((item) => ({
      sentiment: item.sentiment || "unknown",
      count: item._count.id,
    }));
    const defaultSentiments = [
      "very_positive",
      "positive",
      "neutral",
      "negative",
      "very_negative",
    ];
    const existingSentiments = sentimentData.map((item) => item.sentiment);
    defaultSentiments.forEach((sentiment) => {
      if (!existingSentiments.includes(sentiment)) {
        sentimentData.push({
          sentiment,
          count: 0,
        });
      }
    });
    const totalCalls = sentimentData.reduce((sum, item) => sum + item.count, 0);
    const sentimentWithPercentage = sentimentData.map((item) => ({
      ...item,
      percentage: totalCalls > 0 ? (item.count / totalCalls) * 100 : 0,
    }));
    sentimentWithPercentage.sort((a, b) => {
      const sentimentOrder = {
        very_positive: 1,
        positive: 2,
        neutral: 3,
        negative: 4,
        very_negative: 5,
        unknown: 6,
      };
      return (
        (sentimentOrder[a.sentiment as keyof typeof sentimentOrder] || 99) -
        (sentimentOrder[b.sentiment as keyof typeof sentimentOrder] || 99)
      );
    });
    return NextResponse.json(sentimentWithPercentage);
  } catch (error) {
    console.error("Error fetching sentiment data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch sentiment data",
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
