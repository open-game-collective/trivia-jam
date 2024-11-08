# Component Structure

This directory contains all React components for the Trivia Jam application, organized by their role in the game.

## Directory Structure

```
components/
├── broadcast/          # TV/projector display components
│   ├── BroadcastView.tsx
│   ├── views/         
│   │   ├── LobbyBroadcast.tsx     # Join code & waiting room
│   │   ├── QuestionBroadcast.tsx  # Active question display
│   │   └── ResultsBroadcast.tsx   # Final scores & winner
│   └── parts/         
│       ├── BuzzerQueue.tsx        # Shows buzz-in order
│       ├── PlayerList.tsx         # Connected players
│       ├── QuestionDisplay.tsx    # Current question
│       └── ScoreDisplay.tsx       # Current scores
│
├── host/              # Host's mobile interface
│   ├── HostView.tsx
│   ├── views/         
│   │   ├── LobbyControls.tsx      # Pre-game setup
│   │   └── QuestionControls.tsx   # Question management
│   └── parts/         
│       ├── PlayerManager.tsx      # Add/remove players
│       ├── QuestionForm.tsx       # Question input
│       ├── AnswerValidator.tsx    # Correct/incorrect controls
│       └── GameSettings.tsx       # Game configuration
│
├── player/            # Player's mobile interface
│   ├── PlayerView.tsx
│   ├── views/         
│   │   ├── JoinView.tsx          # Join game screen
│   │   ├── GameView.tsx          # Buzzer interface
│   │   └── ResultsView.tsx       # Final score view
│   └── parts/         
│       ├── BuzzerButton.tsx      # Main buzzer
│       ├── PlayerScore.tsx       # Score display
│       └── JoinForm.tsx          # Name entry
│
├── ui/                # Shared UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── GameCode.tsx
│   ├── LoadingSpinner.tsx
│   └── StatusIndicator.tsx
│
├── layout/            # Layout components
│   ├── Container.tsx
│   ├── Header.tsx
│   └── Footer.tsx
│
└── feedback/          # Feedback components
    ├── ErrorMessage.tsx
    ├── SuccessMessage.tsx
    ├── LoadingState.tsx
    └── ConnectionStatus.tsx
```

## Component Categories

### Broadcast Components
Non-interactive components displayed on the TV/projector that everyone watches. These components receive game state but don't dispatch actions.

### Host Components
Mobile interface components for the game host. These components handle game management, question creation, and answer validation.

### Player Components
Mobile interface components for players. These components handle joining games, buzzing in, and viewing scores.

## State-Component Mapping

Components are organized to match the game machine states:

### Lobby State
- `broadcast/views/LobbyBroadcast.tsx`
- `host/views/LobbyControls.tsx`
- `player/views/JoinView.tsx`

### Active.questionPrep State
- `broadcast/views/QuestionBroadcast.tsx` (waiting state)
- `host/views/QuestionControls.tsx` (input mode)
- `player/views/GameView.tsx` (waiting state)

### Active.questionActive State
- `broadcast/views/QuestionBroadcast.tsx` (question display)
- `host/views/QuestionControls.tsx` (show/hide controls)
- `player/views/GameView.tsx` (buzzer active)

### Active.answerValidation State
- `broadcast/views/QuestionBroadcast.tsx` (answer pending)
- `host/views/QuestionControls.tsx` (validation controls)
- `player/views/GameView.tsx` (waiting state)

### Finished State
- `broadcast/views/ResultsBroadcast.tsx`
- `host/views/ResultsView.tsx`
- `player/views/ResultsView.tsx`

## Component Organization

Each major section (broadcast/host/player) follows this structure:
- A main View component that handles routing between states
- A `views/` directory for full-screen views
- A `parts/` directory for smaller, reusable components

## Component Conventions

1. Each component should:
   - Live in the most specific directory possible
   - Have a clear, single responsibility
   - Be typed with TypeScript
   - Include basic JSDoc documentation

2. File naming:
   - Use PascalCase for component files
   - Use `.tsx` extension
   - Match component name to filename

3. Component structure:
   ```tsx
   // ComponentName.tsx
   import { type FC } from 'react'
   
   interface ComponentNameProps {
     // props interface
   }
   
   export const ComponentName: FC<ComponentNameProps> = (props) => {
     return (
       // JSX
     )
   }
   ```

4. State management:
   - Broadcast components read-only
   - Host/Player components can dispatch actions
   - Use game machine context for state

## Testing

Components should have corresponding test files:
- Unit tests for logic
- Integration tests for user interactions
- Storybook stories for visual testing

## Documentation

Each component should include:
- JSDoc comments describing purpose
- Props documentation
- Usage examples where appropriate
