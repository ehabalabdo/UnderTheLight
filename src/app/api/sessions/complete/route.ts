import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { completeSession } from "@/lib/trust-score";

// POST: Complete a session (transition from VOTING to COMPLETED)
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "معرف الجلسة مطلوب" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        status: "VOTING",
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "الجلسة غير موجودة أو ليست في مرحلة التصويت" },
        { status: 400 }
      );
    }

    await completeSession(sessionId);

    const completed = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participant: {
          select: { username: true, trustScore: true, isFrozen: true },
        },
      },
    });

    return NextResponse.json({
      message: "تم إكمال الجلسة",
      session: completed,
    });
  } catch (error) {
    console.error("Complete session error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إكمال الجلسة" },
      { status: 500 }
    );
  }
}
