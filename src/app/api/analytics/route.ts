import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
interface WhereClause {
  callStartTime: { gte: Date; lte: Date };
  clinicId?: string;
  agentId?: string;
}
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get("clinicId");
    const agentId = searchParams.get("agentId");
    const timeFrame = searchParams.get("timeFrame") || "week";
    const endDate = new Date();
    const startDate = calculateStartDate(endDate, timeFrame);
    const whereClause: WhereClause = {
      callStartTime: { gte: startDate, lte: endDate },
    };
    if (clinicId) {
      whereClause.clinicId = clinicId;
    }
    if (agentId) {
      whereClause.agentId = agentId;
    }
    const callVolumeData = await getCallVolumeData(
      startDate,
      endDate,
      whereClause
    );
    const avgCallDuration = await getAvgCallDuration(
      startDate,
      endDate,
      whereClause
    );
    const feedbackData = await getFeedbackData(startDate, endDate, whereClause);
    const peakCallHours = await getPeakCallHours(
      startDate,
      endDate,
      whereClause
    );
    const protocolAdherenceData = await getProtocolAdherenceData(
      startDate,
      endDate,
      whereClause
    );
    return NextResponse.json({
      callVolumeData,
      avgCallDuration,
      feedbackData,
      peakCallHours,
      protocolAdherenceData,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
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

interface CallVolumeDay {
  callDate: Date | null;
  _count: {
    id: number;
  };
}

async function getCallVolumeData(
  startDate: Date,
  endDate: Date,
  whereClause: WhereClause
) {
  const callsByDay = await prisma.call.groupBy({
    by: ["callDate"],
    where: whereClause,
    _count: {
      id: true,
    },
    orderBy: {
      callDate: "asc",
    },
  });
  return callsByDay.map((day: CallVolumeDay) => ({
    date: day.callDate,
    calls: day._count.id,
  }));
}

interface AvgDurationDay {
  callDate: Date | null;
  _avg: {
    durationSeconds: number | null;
  };
}

async function getAvgCallDuration(
  startDate: Date,
  endDate: Date,
  whereClause: WhereClause
) {
  const avgDuration = await prisma.call.groupBy({
    by: ["callDate"],
    where: whereClause,
    _avg: {
      durationSeconds: true,
    },
    orderBy: {
      callDate: "asc",
    },
  });
  return avgDuration.map((day: AvgDurationDay) => ({
    date: day.callDate,
    avgDuration: day._avg.durationSeconds,
  }));
}

interface ProtocolAdherenceDay {
  callDate: Date | null;
  _avg: {
    protocolAdherence: number | null;
  };
}

async function getProtocolAdherenceData(
  startDate: Date,
  endDate: Date,
  whereClause: WhereClause
) {
  const protocolData = await prisma.call.groupBy({
    by: ["callDate"],
    where: whereClause,
    _avg: {
      protocolAdherence: true,
    },
    orderBy: {
      callDate: "asc",
    },
  });
  return protocolData.map((day: ProtocolAdherenceDay) => ({
    date: day.callDate,
    protocolAdherence: day._avg.protocolAdherence || 0,
  }));
}

interface FeedbackItem {
  sentiment: string | null; // Assuming sentiment can be null from Prisma schema
  _count: {
    id: number;
  };
}

async function getFeedbackData(
  startDate: Date,
  endDate: Date,
  whereClause: WhereClause
) {
  const feedbackData = await prisma.call.groupBy({
    by: ["sentiment"],
    where: whereClause,
    _count: {
      id: true,
    },
  });
  return feedbackData.map((item: FeedbackItem) => ({
    sentiment: item.sentiment || "unknown",
    count: item._count.id,
  }));
}
async function getPeakCallHours(
  startDate: Date,
  endDate: Date,
  whereClause: WhereClause
) {
  const calls = await prisma.call.findMany({
    where: whereClause,
    select: {
      callStartTime: true,
      callDate: true,
    },
  });
  const hourDateCount: Record<
    string,
    { date: string; hour: number; count: number }
  > = {};
  calls.forEach((call) => {
    const hour = call.callStartTime.getHours();
    const date = call.callDate
      ? call.callDate.toISOString().split("T")[0]
      : "unknown";
    const key = `${date}-${hour}`;
    if (!hourDateCount[key]) {
      hourDateCount[key] = { date, hour, count: 0 };
    }
    hourDateCount[key].count += 1;
  });
  return Object.values(hourDateCount).sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.hour - b.hour;
  });
}
