# Trivia Jam 🎮

Trivia Jam is a real-time multiplayer trivia game designed for social gatherings, classrooms, and events. Players join from their phones while questions and scores are displayed on a shared TV or large screen.

## How It Works 🎯

1. **Host Creates Game**: A host starts a game and gets a unique game code
2. **Players Join**: Players join using the game code on their phones at triviajam.tv
3. **Questions**: The host presents numerical questions (e.g., "What year was the Declaration of Independence signed?")
4. **Fast-Paced Answers**: Players submit their answers within a time limit
5. **Scoring**: Points are awarded based on accuracy and speed:
   - Exact answers get more points
   - When no exact answers exist, the closest answer scores
   - Faster correct answers rank higher
   - Ties are handled fairly with averaged points

## Features ✨

- **Real-time Gameplay**: Instant updates for all players using WebSocket technology
- **Flexible Scoring**: Supports both exact and closest-answer modes
- **Time-Based Competition**: Players race against the clock and each other
- **Multiple Display Modes**:
  - Host View: Controls game flow and presents questions
  - Player View: Mobile-optimized interface for submitting answers
  - Spectator View: Large-screen display showing questions and scores

## Technical Stack 🛠

- Built with React and TypeScript
- State management using XState and Actor Kit
- Real-time updates via WebSocket
- Storybook for component documentation
- Fully tested with interactive stories

## Development 🚀

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run Storybook
npm run storybook

# Run tests
npm test
```

## Component Library 📚

Browse our component library and UI documentation:
[Trivia Jam Storybook](https://trivia-jam-storybook.pages.dev/)

## Play Now 🎮

Try Trivia Jam at [https://triviajam.tv](https://triviajam.tv)