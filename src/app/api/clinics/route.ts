import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        companyId: true,
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(clinics);
  } catch (error) {
    console.error("Error fetching clinics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch clinics",
      },
      { status: 500 }
    );
  }
}
