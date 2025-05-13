import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Get filters
    const clinicId = searchParams.get("clinicId");
    const agentId = searchParams.get("agentId");
    const timeFrame = searchParams.get("timeFrame") || "week";

    // Get sort option
    const sortBy = searchParams.get("sortBy") || "recent";

    // Calculate date range based on timeFrame
    const endDate = new Date();
    const startDate = calculateStartDate(endDate, timeFrame);

    // Prepare where clause
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

    // Prepare order by clause based on sort option
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
        // Priorizar las llamadas pendientes (checkStatus === 'pending')
        orderBy = [
          { checkStatus: "desc" }, // 'pending' viene después de null alfabéticamente
          { callStartTime: "desc" }, // Para las que tienen el mismo status, ordenar por más recientes
        ] as Prisma.CallOrderByWithRelationInput;
        break;
      case "recent":
      default:
        orderBy = { callStartTime: "desc" };
        break;
    }

    // Get total count for pagination
    const totalCount = await prisma.call.count({
      where: whereClause,
    });

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;

    // Get calls with pagination and sorting
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

// Helper function to calculate start date based on time frame
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
      startDate.setDate(endDate.getDate() - 7); // Default to week
  }

  return startDate;
}
