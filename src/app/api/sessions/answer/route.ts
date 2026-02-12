import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MAX_ANSWER_LENGTH } from "@/lib/constants";

// POST: Submit an answer to a question during a session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { sessionId, questionId, text } = await req.json();

    if (!sessionId || !questionId || !text) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    if (text.length > MAX_ANSWER_LENGTH) {
      return NextResponse.json(
        { error: `الإجابة يجب ألا تتجاوز ${MAX_ANSWER_LENGTH} حرف` },
        { status: 400 }
      );
    }

    // Verify the session belongs to this participant
    const activeSession = await prisma.session.findFirst({
      where: {
        id: sessionId,
        participantId: session.user.id,
        status: { in: ["WAITING", "IN_PROGRESS"] },
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: "لا يمكنك الإجابة على هذه الجلسة" },
        { status: 403 }
      );
    }

    // Check if answer already submitted
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        sessionId,
        questionId,
      },
    });

    if (!existingAnswer) {
      return NextResponse.json(
        { error: "السؤال غير موجود في هذه الجلسة" },
        { status: 404 }
      );
    }

    if (existingAnswer.text !== "") {
      return NextResponse.json(
        { error: "لا يمكن تعديل الإجابة بعد إرسالها" },
        { status: 400 }
      );
    }

    // Submit answer
    const answer = await prisma.answer.update({
      where: { id: existingAnswer.id },
      data: {
        text,
        revealedAt: new Date(),
      },
    });

    // If session is still WAITING, change to IN_PROGRESS
    if (activeSession.status === "WAITING") {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
    }

    // Check if all answers are submitted
    const unanswered = await prisma.answer.count({
      where: {
        sessionId,
        text: "",
      },
    });

    if (unanswered === 0) {
      // All questions answered, move to voting
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "VOTING" },
      });
    }

    return NextResponse.json({ answer, remainingQuestions: unanswered });
  } catch (error) {
    console.error("Answer submission error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إرسال الإجابة" },
      { status: 500 }
    );
  }
}
