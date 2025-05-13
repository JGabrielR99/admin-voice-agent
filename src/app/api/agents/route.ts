import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get("clinicId");

    let whereClause = {};

    // Add clinic filter if provided
    if (clinicId) {
      whereClause = {
        calls: {
          some: {
            clinicId: clinicId,
          },
        },
      };
    }

    // Fetch agents from the database with clinic filter
    const agents = await prisma.agent.findMany({
      where: {
        ...whereClause,
        name: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
      },
      distinct: ["id"],
      orderBy: {
        name: "asc",
      },
    });

    // Create a Map to ensure we have absolutely no duplicates based on ID
    // and filter out empty names
    const uniqueAgentsMap = new Map();

    agents.forEach((agent) => {
      if (agent.name && agent.name.trim() !== "") {
        uniqueAgentsMap.set(agent.id, {
          id: agent.id,
          name: agent.name.trim(), // Normalize by trimming whitespace
        });
      }
    });

    // Convert back to array and sort by name
    const uniqueAgents = Array.from(uniqueAgentsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json(uniqueAgents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
