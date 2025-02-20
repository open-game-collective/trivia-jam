import type { Answer, Question, QuestionResult } from "../game.types";

export function calculateScores(
  answers: Answer[],
  question: Question,
  startTime: number
): QuestionResult["scores"] {
  if (question.questionType === "multiple-choice") {
    return calculateMultipleChoiceScores(answers, question, startTime);
  }
  return calculateNumericScores(answers, question, startTime);
}

function calculateMultipleChoiceScores(
  answers: Answer[],
  question: Question,
  startTime: number
): QuestionResult["scores"] {
  const correctAnswers = answers.filter(
    (answer) => answer.value === question.correctAnswer
  );

  // Sort by time taken
  const sortedAnswers = correctAnswers.sort(
    (a, b) => a.timestamp - startTime - (b.timestamp - startTime)
  );

  // Award points based on position
  return answers.map((answer) => {
    const isCorrect = answer.value === question.correctAnswer;
    const position =
      sortedAnswers.findIndex((a) => a.playerId === answer.playerId) + 1;
    let points = 0;

    if (isCorrect) {
      // If correct, get at least 1 point, more for being faster
      points = position <= 3 ? 5 - position : 1;
    }

    return {
      playerId: answer.playerId,
      playerName: answer.playerName,
      points,
      position: position > 0 ? position : sortedAnswers.length + 1,
      timeTaken: (answer.timestamp - startTime) / 1000,
    };
  });
}

function calculateNumericScores(
  answers: Answer[],
  question: Question,
  startTime: number
): QuestionResult["scores"] {
  const numericAnswers = answers.map((answer) => {
    const numericValue = Number(answer.value);
    const correctNumericValue = Number(question.correctAnswer);
    const isValid = !isNaN(numericValue) && isFinite(numericValue);
    const isExactMatch = isValid && numericValue === correctNumericValue;
    
    return {
      ...answer,
      numericValue: isValid ? numericValue : NaN,
      difference: isValid ? Math.abs(numericValue - correctNumericValue) : Infinity,
      timeTaken: (answer.timestamp - startTime) / 1000,
      isValid,
      isExactMatch
    };
  });

  // Sort valid answers by exact match first, then by difference, then by time
  const validAnswers = numericAnswers
    .filter(a => a.isValid)
    .sort((a, b) => {
      // Exact matches come first, sorted by time
      if (a.isExactMatch && b.isExactMatch) {
        return a.timeTaken - b.timeTaken;
      }
      if (a.isExactMatch) return -1;
      if (b.isExactMatch) return 1;

      // Then sort by difference
      if (a.difference !== b.difference) {
        return a.difference - b.difference;
      }
      // For same differences, sort by time
      return a.timeTaken - b.timeTaken;
    });

  // Group answers by position (handling ties)
  const positions = validAnswers.reduce<typeof validAnswers[]>(
    (acc, answer) => {
      const lastGroup = acc[acc.length - 1];

      if (!lastGroup) {
        acc.push([answer]);
        return acc;
      }

      const lastAnswer = lastGroup[0];
      // Exact matches are never tied unless within time window
      if (lastAnswer.isExactMatch && answer.isExactMatch) {
        if (Math.abs(lastAnswer.timeTaken - answer.timeTaken) < 0.1) {
          lastGroup.push(answer);
        } else {
          acc.push([answer]);
        }
      } else if (
        lastAnswer.difference === answer.difference &&
        Math.abs(lastAnswer.timeTaken - answer.timeTaken) < 0.1 // Tie if within 100ms
      ) {
        lastGroup.push(answer);
      } else {
        acc.push([answer]);
      }

      return acc;
    },
    []
  );

  // Calculate points for each position group
  const pointsMap = new Map<string, number>();

  // Set points for invalid answers
  numericAnswers.forEach(answer => {
    if (!answer.isValid) {
      pointsMap.set(answer.playerId, 0);
    }
  });

  // Set points for valid answers
  positions.forEach((group, groupIndex) => {
    if (groupIndex >= 3) {
      group.forEach(answer => pointsMap.set(answer.playerId, 0));
    } else {
      // All answers in the same group get the highest possible points for that position
      const points = 4 - groupIndex;
      group.forEach(answer => pointsMap.set(answer.playerId, points));
    }
  });

  // Create final scores array including all answers
  return answers.map(answer => {
    const scoredAnswer = numericAnswers.find(
      sa => sa.playerId === answer.playerId
    );
    const position = scoredAnswer?.isValid
      ? positions.findIndex(group =>
          group.some(a => a.playerId === answer.playerId)
        ) + 1
      : positions.length + 1;

    return {
      playerId: answer.playerId,
      playerName: answer.playerName,
      points: pointsMap.get(answer.playerId) || 0,
      position,
      timeTaken: (answer.timestamp - startTime) / 1000,
    };
  });
} 