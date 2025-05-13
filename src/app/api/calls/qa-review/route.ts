import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const clinicId = searchParams.get("clinicId");
    const agentId = searchParams.get("agentId");
    const whereClause: {
      engineerStatus: { equals: null } | { not: null };
      clinicId?: string;
      agentId?: string;
    } = {
      engineerStatus: { equals: null },
    };
    if (clinicId) {
      whereClause.clinicId = clinicId;
    }
    if (agentId) {
      whereClause.agentId = agentId;
    }
    const totalCount = await prisma.call.count({
      where: whereClause,
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;
    const calls = await prisma.call.findMany({
      where: whereClause,
      orderBy: { callStartTime: "asc" },
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
    console.error("Error fetching QA review calls:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch calls for QA review",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
