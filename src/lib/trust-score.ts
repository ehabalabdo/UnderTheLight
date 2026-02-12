import prisma from "@/lib/prisma";
import {
  MIN_APPEARANCES_FOR_FREEZE,
  MIN_VOTES_PER_SESSION_FOR_FREEZE,
  FREEZE_THRESHOLD_PERCENT,
} from "@/lib/constants";

/**
 * Recalculate TrustScore for a participant
 * TrustScore = average percentage of TRUE votes across all completed sessions
 */
export async function recalculateTrustScore(userId: string): Promise<number> {
  const sessions = await prisma.session.findMany({
    where: {
      participantId: userId,
      status: "COMPLETED",
      totalVotes: { gt: 0 },
    },
    select: {
      trueVotes: true,
      totalVotes: true,
    },
  });

  if (sessions.length === 0) return 50.0;

  const totalTrustPercent = sessions.reduce((sum, session) => {
    return sum + (session.trueVotes / session.totalVotes) * 100;
  }, 0);

  const trustScore = totalTrustPercent / sessions.length;

  await prisma.user.update({
    where: { id: userId },
    data: { trustScore },
  });

  return trustScore;
}

/**
 * Check if a participant should be frozen
 * Conditions:
 * - Appeared at least 3 times
 * - TrustScore < 10%
 * - Each session had at least 30 votes
 */
export async function checkAndApplyFreeze(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      appearanceCount: true,
      trustScore: true,
    },
  });

  if (!user) return false;

  // Must have appeared at least MIN_APPEARANCES_FOR_FREEZE times
  if (user.appearanceCount < MIN_APPEARANCES_FOR_FREEZE) return false;

  // Check all completed sessions have minimum votes
  const sessions = await prisma.session.findMany({
    where: {
      participantId: userId,
      status: "COMPLETED",
    },
    select: {
      totalVotes: true,
    },
  });

  const allSessionsMeetMinVotes = sessions.every(
    (s) => s.totalVotes >= MIN_VOTES_PER_SESSION_FOR_FREEZE
  );

  if (!allSessionsMeetMinVotes) return false;

  // Check trust score below threshold
  if (user.trustScore >= FREEZE_THRESHOLD_PERCENT) return false;

  // Apply freeze
  await prisma.user.update({
    where: { id: userId },
    data: { isFrozen: true },
  });

  return true;
}

/**
 * Complete a session: calculate trust result, update scores, check freeze
 */
export async function completeSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      participantId: true,
      trueVotes: true,
      falseVotes: true,
      totalVotes: true,
    },
  });

  if (!session) throw new Error("Session not found");

  // Calculate trust result for this session
  const trustResult =
    session.totalVotes > 0
      ? (session.trueVotes / session.totalVotes) * 100
      : 0;

  // Update session
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      endedAt: new Date(),
      trustResult,
    },
  });

  // Recalculate participant trust score
  await recalculateTrustScore(session.participantId);

  // Check freeze
  await checkAndApplyFreeze(session.participantId);
}
