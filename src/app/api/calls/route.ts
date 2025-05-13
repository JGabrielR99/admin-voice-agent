import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const clinicId = searchParams.get("clinicId");
    const agentId = searchParams.get("agentId");
    const timeFrame = searchParams.get("timeFrame") || "week";
    const sortBy = searchParams.get("sortBy") || "recent";
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
    let orderBy: Prisma.CallOrderByWithRelationInput;
    switch (sortBy) {
      case "duration":
        orderBy = { durationSeconds: "desc" };
        break;
      case "sentiment_asc":
        orderBy = { sentiment: "asc" };
        break;
      case "sentiment_desc":
        orderBy = { sentiment: "desc" };
        break;
      case "oldest":
        orderBy = { callStartTime: "asc" };
        break;
      case "pending":
        orderBy = [
          { checkStatus: "desc" }, 
          { callStartTime: "desc" }, 
        ] as Prisma.CallOrderByWithRelationInput;
        break;
      case "recent":
      default:
        orderBy = { callStartTime: "desc" };
        break;
    }
    const totalCount = await prisma.call.count({
      where: whereClause,
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;
    const calls = await prisma.call.findMany({
      where: whereClause,
      orderBy: orderBy,
      skip: skip,
      take: pageSize,
      include: {
        agent: {
          select: {
            name: true,
          },
        },
        clinic: {
          select: {
            name: true,
          },
        },
      },
    });
    return NextResponse.json({
      data: calls,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch calls",
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
