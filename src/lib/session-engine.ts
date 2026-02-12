import prisma from "@/lib/prisma";
import {
  USERS_PER_SESSION,
  MIN_USERS_FOR_SESSION,
  MAX_DAILY_SESSIONS,
  ACTIVE_WINDOW_MINUTES,
  APPEARANCE_COOLDOWN_DAYS,
  QUESTIONS_PER_SESSION,
} from "@/lib/constants";

/**
 * Get number of active users (active within last ACTIVE_WINDOW_MINUTES)
 */
export async function getActiveUserCount(): Promise<number> {
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000);
  return prisma.user.count({
    where: {
      lastActiveAt: { gte: cutoff },
      isFrozen: false,
    },
  });
}

/**
 * Get number of sessions created today
 */
async function getTodaySessionCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.session.count({
    where: {
      createdAt: { gte: today },
    },
  });
}

/**
 * Get currently active sessions (not completed)
 */
export async function getActiveSessionCount(): Promise<number> {
  return prisma.session.count({
    where: {
      status: { in: ["WAITING", "IN_PROGRESS", "VOTING"] },
    },
  });
}

/**
 * Find eligible participants who can go "Under the Light"
 * - Not frozen
 * - Role is PARTICIPANT
 * - Haven't appeared within the last 30 days
 * - Not currently in an active session
 * Priority: those who haven't appeared in the longest time
 */
async function findEligibleParticipants(count: number) {
  const cooldownDate = new Date(
    Date.now() - APPEARANCE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  );
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000);

  // Get IDs of users currently in active sessions
  const activeSessions = await prisma.session.findMany({
    where: { status: { in: ["WAITING", "IN_PROGRESS", "VOTING"] } },
    select: { participantId: true },
  });
  const activeParticipantIds = activeSessions.map((s) => s.participantId);

  const eligible = await prisma.user.findMany({
    where: {
      role: "PARTICIPANT",
      isFrozen: false,
      lastActiveAt: { gte: cutoff },
      id: { notIn: activeParticipantIds.length > 0 ? activeParticipantIds : ["__none__"] },
      OR: [
        { lastAppearanceDate: null },
        { lastAppearanceDate: { lte: cooldownDate } },
      ],
    },
    orderBy: [
      { lastAppearanceDate: "asc" }, // Priority: longest time since last appearance
    ],
    take: count,
  });

  return eligible;
}

/**
 * Select random questions for a session
 * - 5 questions from different categories
 * - Avoid recently used questions
 */
async function selectQuestionsForSession(excludeUserId?: string) {
  const categories = [
    "PERSONAL",
    "SITUATIONS",
    "BELIEFS",
    "PAST",
    "RELATIONSHIPS",
    "SECRETS",
  ] as const;

  // Shuffle categories and pick QUESTIONS_PER_SESSION
  const shuffled = [...categories].sort(() => Math.random() - 0.5);
  const selectedCategories = shuffled.slice(0, QUESTIONS_PER_SESSION);

  const questions = [];

  for (const category of selectedCategories) {
    // Get questions not asked to this participant before
    let excludeQuestionIds: string[] = [];
    if (excludeUserId) {
      const previousAnswers = await prisma.answer.findMany({
        where: {
          session: { participantId: excludeUserId },
        },
        select: { questionId: true },
      });
      excludeQuestionIds = previousAnswers.map((a) => a.questionId);
    }

    const question = await prisma.question.findFirst({
      where: {
        category,
        isActive: true,
        id: { notIn: excludeQuestionIds.length > 0 ? excludeQuestionIds : ["__none__"] },
      },
      orderBy: { usageCount: "asc" },
    });

    if (question) {
      questions.push(question);
      // Increment usage count
      await prisma.question.update({
        where: { id: question.id },
        data: { usageCount: { increment: 1 } },
      });
    }
  }

  return questions;
}

/**
 * Get active users who are not currently assigned to any group
 */
async function getAvailableViewers(excludeParticipantIds: string[]) {
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000);

  // Get users already in active groups
  const activeGroupAssignments = await prisma.groupAssignment.findMany({
    where: {
      group: {
        session: {
          status: { in: ["WAITING", "IN_PROGRESS", "VOTING"] },
        },
      },
    },
    select: { userId: true },
  });
  const assignedUserIds = activeGroupAssignments.map((a) => a.userId);

  return prisma.user.findMany({
    where: {
      lastActiveAt: { gte: cutoff },
      isFrozen: false,
      id: {
        notIn: [...excludeParticipantIds, ...assignedUserIds],
      },
    },
  });
}

/**
 * Main session creation algorithm
 * Called periodically (every 5 minutes) or after a session ends
 */
export async function createSessionsIfNeeded() {
  // Check daily limit
  const todayCount = await getTodaySessionCount();
  if (todayCount >= MAX_DAILY_SESSIONS) return [];

  // Get counts
  const activeUsers = await getActiveUserCount();
  const activeSessions = await getActiveSessionCount();

  // Calculate needed sessions
  const targetSessions = Math.floor(activeUsers / USERS_PER_SESSION);
  const neededSessions = Math.max(
    0,
    Math.min(targetSessions - activeSessions, MAX_DAILY_SESSIONS - todayCount)
  );

  // Need at least MIN_USERS_FOR_SESSION for a session
  if (activeUsers < MIN_USERS_FOR_SESSION && activeSessions === 0) {
    // Not enough users even for one session
    return [];
  }

  // If we have enough users but target is 0, try at least 1 session
  const sessionsToCreate =
    neededSessions === 0 && activeSessions === 0 && activeUsers >= MIN_USERS_FOR_SESSION
      ? 1
      : neededSessions;

  if (sessionsToCreate <= 0) return [];

  // Find eligible participants
  const participants = await findEligibleParticipants(sessionsToCreate);
  if (participants.length === 0) return [];

  const createdSessions = [];

  for (const participant of participants) {
    // Select questions
    const questions = await selectQuestionsForSession(participant.id);
    if (questions.length < QUESTIONS_PER_SESSION) continue;

    // Create session
    const session = await prisma.session.create({
      data: {
        participantId: participant.id,
        status: "WAITING",
      },
    });

    // Create session group
    const group = await prisma.sessionGroup.create({
      data: {
        sessionId: session.id,
      },
    });

    // Create empty answer slots
    for (let i = 0; i < questions.length; i++) {
      await prisma.answer.create({
        data: {
          sessionId: session.id,
          questionId: questions[i].id,
          text: "",
          orderIndex: i,
        },
      });
    }

    // Update participant appearance info
    await prisma.user.update({
      where: { id: participant.id },
      data: {
        lastAppearanceDate: new Date(),
        appearanceCount: { increment: 1 },
      },
    });

    createdSessions.push({ session, group, questions });
  }

  // Assign available viewers to groups
  if (createdSessions.length > 0) {
    const participantIds = createdSessions.map(
      (s) => s.session.participantId
    );
    const viewers = await getAvailableViewers(participantIds);

    // Shuffle viewers randomly
    const shuffledViewers = [...viewers].sort(() => Math.random() - 0.5);

    // Distribute evenly across sessions
    for (let i = 0; i < shuffledViewers.length; i++) {
      const sessionIndex = i % createdSessions.length;
      const group = createdSessions[sessionIndex].group;

      await prisma.groupAssignment.create({
        data: {
          groupId: group.id,
          userId: shuffledViewers[i].id,
        },
      });
    }
  }

  return createdSessions;
}

/**
 * Assign a new user to the smallest active group
 */
export async function assignUserToGroup(userId: string) {
  const activeGroups = await prisma.sessionGroup.findMany({
    where: {
      session: {
        status: { in: ["WAITING", "IN_PROGRESS", "VOTING"] },
      },
    },
    include: {
      _count: { select: { assignments: true } },
    },
    orderBy: {
      assignments: { _count: "asc" },
    },
  });

  if (activeGroups.length === 0) return null;

  // Assign to smallest group
  const smallestGroup = activeGroups[0];

  // Check if already assigned
  const existing = await prisma.groupAssignment.findUnique({
    where: {
      groupId_userId: {
        groupId: smallestGroup.id,
        userId,
      },
    },
  });

  if (existing) return existing;

  return prisma.groupAssignment.create({
    data: {
      groupId: smallestGroup.id,
      userId,
    },
  });
}
