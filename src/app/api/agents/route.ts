import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get("clinicId");
    let whereClause = {};
    if (clinicId) {
      whereClause = {
        calls: {
          some: {
            clinicId: clinicId,
          },
        },
      };
    }
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
    const uniqueAgentsMap = new Map();

    interface AgentFromSelect {
      id: string; // Assuming id is a string, adjust if it's a number based on your Prisma schema
      name: string | null; // Corrected to allow null as per linter feedback
    }

    agents.forEach((agent: AgentFromSelect) => {
      if (agent.name && agent.name.trim() !== "") {
        // agent.name is guaranteed to be non-null by the Prisma query
        uniqueAgentsMap.set(agent.id, {
          id: agent.id,
          name: agent.name.trim(),
        });
      }
    });
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
