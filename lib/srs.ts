export type ReviewRating = 0 | 1 | 2 | 3 | 4 | 5;

export type SrsState = {
  repetitions: number;
  interval: number;
  easeFactor: number;
  dueAt: Date;
  lastReviewedAt?: Date;
};

export type ReviewResult = SrsState & {
  rating: ReviewRating;
  nextDueAt: Date;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function getInitialSrsState(now = new Date()): SrsState {
  return {
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    dueAt: now,
    lastReviewedAt: now,
  };
}

export function scheduleReview(
  state: SrsState,
  rating: ReviewRating,
  now = new Date()
): ReviewResult {
  const safeRating = clamp(rating, 0, 5) as ReviewRating;

  if (safeRating < 3) {
    const nextState: SrsState = {
      repetitions: 0,
      interval: 1,
      easeFactor: clamp(state.easeFactor, 1.3, 3),
      dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      lastReviewedAt: now,
    };

    return {
      ...nextState,
      rating: safeRating,
      nextDueAt: nextState.dueAt,
    };
  }

  const updatedEase = clamp(
    state.easeFactor +
      (0.1 - (5 - safeRating) * (0.08 + (5 - safeRating) * 0.02)),
    1.3,
    3
  );

  const nextRepetitions = state.repetitions + 1;
  const nextInterval =
    nextRepetitions === 1
      ? 1
      : Math.max(1, Math.round(state.interval * updatedEase));

  const nextState: SrsState = {
    repetitions: nextRepetitions,
    interval: nextInterval,
    easeFactor: updatedEase,
    dueAt: new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000),
    lastReviewedAt: now,
  };

  return {
    ...nextState,
    rating: safeRating,
    nextDueAt: nextState.dueAt,
  };
}

export function getSrsStatus(state: SrsState, now = new Date()) {
  const overdue = state.dueAt.getTime() <= now.getTime();
  const progress =
    state.repetitions === 0 ? 0 : Math.min(100, (state.repetitions / 10) * 100);

  return {
    overdue,
    progress,
    dueInDays: Math.max(
      0,
      Math.ceil((state.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    ),
  };
}