import { describe, it, expect } from 'vitest'
import { calculateScores } from './scoring'
import type { Answer, Question } from '../game.types'

describe('calculateScores', () => {
  const startTime = 1000 // Base timestamp

  describe('multiple choice questions', () => {
    const question: Question = {
      id: 'q1',
      text: 'What is the capital of France?',
      correctAnswer: 'Paris',
      questionType: 'multiple-choice',
      options: ['London', 'Paris', 'Berlin', 'Madrid']
    }

    it('awards points based on speed for correct answers', () => {
      const answers: Answer[] = [
        { playerId: 'p1', playerName: 'Player 1', value: 'Paris', timestamp: startTime + 1000 },
        { playerId: 'p2', playerName: 'Player 2', value: 'Paris', timestamp: startTime + 2000 },
        { playerId: 'p3', playerName: 'Player 3', value: 'Paris', timestamp: startTime + 3000 },
        { playerId: 'p4', playerName: 'Player 4', value: 'Paris', timestamp: startTime + 4000 }
      ]

      const scores = calculateScores(answers, question, startTime)

      expect(scores).toHaveLength(4)
      // Points are 4-3-2-1 for first through fourth place
      const sortedScores = [...scores].sort((a, b) => b.points - a.points)
      expect(sortedScores[0].points).toBe(4) // First correct answer
      expect(sortedScores[1].points).toBe(3) // Second correct answer
      expect(sortedScores[2].points).toBe(2) // Third correct answer
      expect(sortedScores[3].points).toBe(1) // Fourth correct answer
    })

    it('gives zero points for incorrect answers', () => {
      const answers: Answer[] = [
        { playerId: 'p1', playerName: 'Player 1', value: 'London', timestamp: startTime + 1000 },
        { playerId: 'p2', playerName: 'Player 2', value: 'Berlin', timestamp: startTime + 2000 }
      ]

      const scores = calculateScores(answers, question, startTime)

      expect(scores).toHaveLength(2)
      expect(scores[0].points).toBe(0)
      expect(scores[1].points).toBe(0)
    })

    it('maintains correct order based on submission time', () => {
      const answers: Answer[] = [
        { playerId: 'p2', playerName: 'Player 2', value: 'Paris', timestamp: startTime + 2000 },
        { playerId: 'p1', playerName: 'Player 1', value: 'Paris', timestamp: startTime + 1000 }
      ]

      const scores = calculateScores(answers, question, startTime)
      
      expect(scores.find(s => s.playerId === 'p1')?.points).toBe(4) // Earlier submission
      expect(scores.find(s => s.playerId === 'p2')?.points).toBe(3) // Later submission
    })
  })

  describe('numeric questions', () => {
    const question: Question = {
      id: 'q2',
      text: 'What is the population of Earth (in billions)?',
      correctAnswer: '8',
      questionType: 'numeric'
    }

    it('awards points based on closeness to correct answer', () => {
      const answers: Answer[] = [
        { playerId: 'p1', playerName: 'Player 1', value: '8.1', timestamp: startTime + 1000 }, // Closest
        { playerId: 'p2', playerName: 'Player 2', value: '7.8', timestamp: startTime + 2000 }, // Second closest
        { playerId: 'p3', playerName: 'Player 3', value: '7.5', timestamp: startTime + 3000 }, // Third closest
        { playerId: 'p4', playerName: 'Player 4', value: '6.0', timestamp: startTime + 4000 }  // Furthest
      ]

      const scores = calculateScores(answers, question, startTime)

      expect(scores).toHaveLength(4)
      const sortedScores = [...scores].sort((a, b) => b.points - a.points)
      expect(sortedScores[0].points).toBe(4) // Closest answer
      expect(sortedScores[1].points).toBe(3) // Second closest
      expect(sortedScores[2].points).toBe(2) // Third closest
      expect(sortedScores[3].points).toBe(0) // Too far off
    })

    it('handles ties in numeric answers', () => {
      const answers: Answer[] = [
        { playerId: 'p1', playerName: 'Player 1', value: '8.1', timestamp: startTime + 1000 },
        { playerId: 'p2', playerName: 'Player 2', value: '8.1', timestamp: startTime + 1050 } // Within 100ms
      ]

      const scores = calculateScores(answers, question, startTime)

      expect(scores).toHaveLength(2)
      expect(scores[0].points).toBe(scores[1].points) // Should have same points due to tie
      expect(scores[0].position).toBe(scores[1].position) // Should have same position
      expect(scores[0].points).toBe(4) // Both should get max points for being tied at first
    })

    it('filters out invalid numeric answers', () => {
      const answers: Answer[] = [
        { playerId: 'p1', playerName: 'Player 1', value: 'invalid', timestamp: startTime + 1000 },
        { playerId: 'p2', playerName: 'Player 2', value: '8.1', timestamp: startTime + 2000 }
      ]

      const scores = calculateScores(answers, question, startTime)

      expect(scores).toHaveLength(2)
      expect(scores[0].points).toBe(0) // Invalid answer
      expect(scores[1].points).toBe(4) // Valid answer gets full points as only valid answer
    })

    it('orders exact matches by time', () => {
      const answers: Answer[] = [
        { playerId: 'p1', playerName: 'Player 1', value: '8', timestamp: startTime + 2000 },
        { playerId: 'p2', playerName: 'Player 2', value: '8', timestamp: startTime + 1000 },
        { playerId: 'p3', playerName: 'Player 3', value: '8.1', timestamp: startTime + 500 }
      ];

      const scores = calculateScores(answers, question, startTime);

      // Find scores by player ID
      const p1Score = scores.find(s => s.playerId === 'p1')!;
      const p2Score = scores.find(s => s.playerId === 'p2')!;
      const p3Score = scores.find(s => s.playerId === 'p3')!;

      expect(p2Score.points).toBe(4); // First exact match
      expect(p1Score.points).toBe(3); // Second exact match
      expect(p3Score.points).toBe(2); // Close but not exact
      
      expect(p2Score.position).toBe(1);
      expect(p1Score.position).toBe(2);
      expect(p3Score.position).toBe(3);
    });

    it('handles multiple exact matches with some within time window', () => {
      const answers: Answer[] = [
        { playerId: 'p1', playerName: 'Player 1', value: '8', timestamp: startTime + 1000 },
        { playerId: 'p2', playerName: 'Player 2', value: '8', timestamp: startTime + 1050 }, // Within 100ms of p1
        { playerId: 'p3', playerName: 'Player 3', value: '8', timestamp: startTime + 2000 }  // Later exact match
      ];

      const scores = calculateScores(answers, question, startTime);

      // First two should tie for first place
      expect(scores.find(s => s.playerId === 'p1')?.points).toBe(4);
      expect(scores.find(s => s.playerId === 'p2')?.points).toBe(4);
      // Third gets second place points
      expect(scores.find(s => s.playerId === 'p3')?.points).toBe(3);
    });
  })
}) 