import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { assignUserToGroup, getActiveSessionCount } from "@/lib/session-engine";

// GET: Get user's assigned session or available sessions info
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Update user activity
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveAt: new Date() },
    });

    // Check if user has an active assignment
    const assignment = await prisma.groupAssignment.findFirst({
      where: {
        userId: session.user.id,
        group: {
          session: {
            status: { in: ["WAITING", "IN_PROGRESS", "VOTING"] },
          },
        },
      },
      include: {
        group: {
          include: {
            session: {
              include: {
                participant: {
                  select: {
                    id: true,
                    username: true,
                    trustScore: true,
                    appearanceCount: true,
                  },
                },
                answers: {
                  include: {
                    question: { select: { id: true, text: true, category: true } },
                  },
                  orderBy: { orderIndex: "asc" },
                },
                _count: { select: { votes: true } },
              },
            },
          },
        },
      },
    });

    // If user is the participant of an active session
    const participantSession = await prisma.session.findFirst({
      where: {
        participantId: session.user.id,
        status: { in: ["WAITING", "IN_PROGRESS", "VOTING"] },
      },
      include: {
        answers: {
          include: {
            question: { select: { id: true, text: true, category: true } },
          },
          orderBy: { orderIndex: "asc" },
        },
        _count: { select: { votes: true } },
      },
    });

    if (participantSession) {
      return NextResponse.json({
        type: "participant",
        session: participantSession,
      });
    }

    if (assignment) {
      const activeSession = assignment.group.session;
      // Check if user already voted
      const existingVote = await prisma.vote.findUnique({
        where: {
          sessionId_voterId: {
            sessionId: activeSession.id,
            voterId: session.user.id,
          },
        },
      });

      return NextResponse.json({
        type: "viewer",
        session: activeSession,
        hasVoted: !!existingVote,
        vote: existingVote?.vote || null,
      });
    }

    // Try to assign to a group
    const newAssignment = await assignUserToGroup(session.user.id);
    if (newAssignment) {
      // Return the session they were assigned to
      return NextResponse.json({
        type: "waiting",
        message: "تم تعيينك في مجموعة. جاري تحميل الجلسة...",
        assigned: true,
      });
    }

    // No active sessions
    const activeCount = await getActiveSessionCount();
    const activeUsers = await prisma.user.count({
      where: {
        lastActiveAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        isFrozen: false,
      },
    });

    return NextResponse.json({
      type: "no_session",
      message: "لا توجد جلسات نشطة حالياً",
      activeUsers,
      activeSessions: activeCount,
      minUsersNeeded: 40,
    });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب البيانات" },
      { status: 500 }
    );
  }
}
