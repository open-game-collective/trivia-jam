# Trivia Jam

A real-time trivia game where players join from their phones and play on shared TV displays.

## Game Flow

1. Host starts a game from their device
2. Players join using a unique game code
3. Host initiates game start
4. Host creates questions in real-time
5. Players buzz in to answer questions
6. Host validates answers
7. Points are tracked and winner is determined

## Routes Structure

### Main Routes

- `WEB_HOST/`

  - Landing page
  - Contains "Start New Game" button
  - Redirects host to a new game session

- `WEB_HOST/games/[gameId]`
  - Main game route (uses nanoid for gameId)
  - Detects device type:
    - Mobile: Player/Host interface
    - Desktop: Game board display

### Game Board Views (Desktop)

The game board will have different views based on game state:

1. **Lobby View**

   - Shows joining instructions
   - Displays currently joined players
   - Waiting for host to start

2. **Question Preparation View**

   - "Waiting for next question..."
   - Host is typing question

3. **Active Question View**

   - Displays current question
   - Shows buzzer order/queue
   - Displays scores

4. **Game Over View**
   - Final scores
   - Winner announcement
   - Option to start new game

### Player/Host Views (Mobile)

#### Host Views

1. **Setup View**

   - Game settings
   - Start game button
   - Player management

2. **Question Creation View**
   - Question input
   - Show/hide question controls
   - Answer validation interface

#### Player Views

1. **Join View**

   - Name entry
   - Waiting for game to start

2. **Game View**
   - Buzzer button
   - Current score
   - Game status

## Technical Architecture

- Next.js for the frontend
- Real-time server for game state management
- JSON patch for state synchronization
- Device detection for appropriate interface rendering
- WebSocket connections for real-time updates

## Development Resources

### Storybook
The component library and UI documentation can be viewed at:
[https://trivia-jam-storybook.pages.dev/](https://trivia-jam-storybook.pages.dev/)

### Live Application
Play Trivia Jam at:
[https://triviajam.tv](https://triviajam.tv)

## State Management

The game state will be managed centrally on the server with the following key components:

- Game session data
- Connected players
- Current question
- Buzzer queue
- Player scores
- Game phase tracking

## Real-time Updates

All game state changes will be synchronized across:

- Game board display
- Host interface
- Player interfaces

Using WebSocket connections and JSON patch for efficient updates.
