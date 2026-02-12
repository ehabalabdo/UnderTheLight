import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Get user profile
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        trustScore: true,
        lastAppearanceDate: true,
        isFrozen: true,
        appearanceCount: true,
        createdAt: true,
        _count: {
          select: {
            sessions: true,
            votes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // Get session history
    const sessions = await prisma.session.findMany({
      where: {
        participantId: session.user.id,
        status: "COMPLETED",
      },
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        trustResult: true,
        totalVotes: true,
        trueVotes: true,
        falseVotes: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ user, sessions });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الملف الشخصي" },
      { status: 500 }
    );
  }
}
