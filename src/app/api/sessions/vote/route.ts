import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST: Submit a vote (TRUE or FALSE)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check if user is frozen
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isFrozen: true },
    });

    if (user?.isFrozen) {
      return NextResponse.json(
        { error: "حسابك مجمّد. لا يمكنك التصويت" },
        { status: 403 }
      );
    }

    const { sessionId, vote } = await req.json();

    if (!sessionId || !vote) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    if (vote !== "TRUE" && vote !== "FALSE") {
      return NextResponse.json(
        { error: "التصويت يجب أن يكون TRUE أو FALSE" },
        { status: 400 }
      );
    }

    // Verify session is in VOTING status
    const activeSession = await prisma.session.findFirst({
      where: {
        id: sessionId,
        status: "VOTING",
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: "الجلسة غير متاحة للتصويت" },
        { status: 400 }
      );
    }

    // Can't vote on your own session
    if (activeSession.participantId === session.user.id) {
      return NextResponse.json(
        { error: "لا يمكنك التصويت على جلستك الخاصة" },
        { status: 400 }
      );
    }

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        sessionId_voterId: {
          sessionId,
          voterId: session.user.id,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "لقد صوّتت على هذه الجلسة مسبقاً" },
        { status: 400 }
      );
    }

    // Create vote
    const newVote = await prisma.vote.create({
      data: {
        sessionId,
        voterId: session.user.id,
        vote,
      },
    });

    // Update session vote counts
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        totalVotes: { increment: 1 },
        ...(vote === "TRUE"
          ? { trueVotes: { increment: 1 } }
          : { falseVotes: { increment: 1 } }),
      },
    });

    return NextResponse.json({
      message: "تم التصويت بنجاح",
      vote: newVote.vote,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في التصويت" },
      { status: 500 }
    );
  }
}
