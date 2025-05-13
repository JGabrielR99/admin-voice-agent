import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Call ID is required" },
        { status: 400 }
      );
    }

    const call = await prisma.call.findUnique({
      where: {
        id: id,
      },
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

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error("Error fetching call:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Call ID is required" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { engineerStatus, engineerComments } = data;

    const updatedCall = await prisma.call.update({
      where: {
        id: id,
      },
      data: {
        engineerStatus,
        engineerComments,
      },
    });

    return NextResponse.json(updatedCall);
  } catch (error) {
    console.error("Error updating call:", error);
    return NextResponse.json(
      {
        error: "Failed to update call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
