# Trivia Jam Scoring Rules

## Overview
Trivia Jam supports two types of answer validation:
1. Exact Match - Only precise answers earn points
2. Closest Answer - Points awarded based on proximity to correct answer

## Scoring Mechanics

### Points Distribution
- Maximum of 3 points per question
- Points are awarded to up to 30% of players (minimum 3 players)
- Points are distributed in descending order (3, 2, 1)

### Exact Match Mode
When a question requires exact answers:
- Only players who submit the exact correct value earn points
- Points are awarded based on submission speed
- Example for 10 players:
  - First exact match: 3 points
  - Second exact match: 2 points
  - Third exact match: 1 point
  - All other exact matches: 0 points
  - Non-exact matches: 0 points

### Closest Answer Mode
When exact matches aren't required:
1. If any player gets the exact answer:
   - Exact matches are prioritized and scored as above
   - Non-exact answers receive 0 points, regardless of proximity

2. If no player gets the exact answer:
   - Only the closest answer receives points (1 point)
   - All other answers receive 0 points
   - In case of ties, earlier submission wins

### Tiebreakers
1. For equal answers (exact or closest):
   - Earlier submission time wins
   - Timestamps are recorded to millisecond precision

### Example Scenarios

#### Scenario 1: Exact Match Required
Question: What year was the Declaration of Independence signed? (1776)
```
Player   Answer   Time    Points
Alice    1776     3.2s    3
Bob      1776     3.5s    2
Carol    1776     4.1s    1
Dave     1776     4.2s    0
Eve      1775     2.9s    0
```

#### Scenario 2: Closest Answer (With Exact Match)
Question: What year was the Declaration of Independence signed? (1776)
```
Player   Answer   Time    Points
Alice    1776     3.2s    3
Bob      1776     3.5s    2
Carol    1775     2.1s    0
Dave     1777     2.9s    0
Eve      1775     3.0s    0
```

#### Scenario 3: Closest Answer (No Exact Match)
Question: What year was the Declaration of Independence signed? (1776)
```
Player   Answer   Time    Points
Alice    1775     3.2s    1
Bob      1777     2.1s    0
Carol    1774     2.9s    0
Dave     1778     3.0s    0
Eve      1773     3.1s    0
```

## Implementation Details

The scoring logic is implemented in the `calculateScores` function in `app/game.machine.ts`:

1. Filters out invalid answers (NaN, Infinity)
2. Identifies exact matches
3. Determines scoring positions based on:
   - Number of players
   - Presence of exact matches
   - Answer mode requirements
4. Sorts answers by accuracy and submission time
5. Assigns points based on position

## UI Feedback

The game provides visual feedback for scores:
- Green text for exact matches
- Points displayed prominently when earned
- Player's own row highlighted
- Results sorted by points first, then time 

### Scaling Points Distribution
The scoring system scales based on player count while maintaining competitive balance:

- Points are awarded to 30% of players (rounded down)
- Minimum of 3 scoring positions
- Maximum of 10 scoring positions
- Points always descend from 3 to 1

#### Examples by Player Count:

**10 Players:**
- 30% = 3 positions
- 1st: 3 points
- 2nd: 2 points
- 3rd: 1 point

**100 Players:**
- 30% = 30 positions, capped at 10
- 1st: 3 points
- 2nd-5th: 2 points
- 6th-10th: 1 point
- 11th-100th: 0 points

**1,000 Players:**
- 30% = 300 positions, capped at 10
- Same distribution as 100 players
- Emphasizes speed for top 10 positions
- Positions 11-1000: 0 points

**1,000,000 Players:**
- Still capped at 10 scoring positions
- Extremely competitive for top spots
- Makes each point more valuable
- Positions 11-1,000,000: 0 points

### Point Value Distribution

```
Players    Scoring Positions    Point Distribution
1-10       3                   3,2,1
11-20      3                   3,2,1
21-30      6                   3,3,2,2,1,1
31-99      9                   3,3,3,2,2,2,1,1,1
100+       10                  3,2,2,2,2,1,1,1,1,1
```

### Scaling Considerations

1. **Competition Balance**
   - Fixed maximum of 10 scoring positions prevents point inflation
   - Maintains value of each point regardless of player count
   - Creates exciting competition for top spots

2. **Time Pressure**
   - Larger player counts increase importance of quick responses
   - Millisecond precision becomes crucial for tiebreakers
   - Early submission advantage becomes more significant

3. **Strategic Impact**
   - Players must balance accuracy vs speed
   - Risk/reward of waiting to see other answers
   - Higher stakes for exact matches in large games

4. **Technical Implementation**
   - Scoring calculation remains efficient regardless of player count
   - Results display optimized for any number of players
   - Real-time updates maintain performance at scale

### Example: 1000-Player Game

Question: What year was the Declaration of Independence signed? (1776)
```
Position    Answer    Time      Points    Notes
1st         1776      1.234s    3         Fastest exact match
2nd         1776      1.236s    2         
3rd         1776      1.245s    2
4th         1776      1.246s    2
5th         1776      1.247s    2
6th         1776      1.248s    1
7th         1776      1.249s    1
8th         1776      1.250s    1
9th         1776      1.251s    1
10th        1776      1.252s    1
11th-1000th various   various   0         Including other exact matches
```

This scaling system ensures:
- Games remain competitive at any size
- Points maintain their value
- Speed matters more as player count increases
- Simple to understand regardless of game size
- Technical performance at scale