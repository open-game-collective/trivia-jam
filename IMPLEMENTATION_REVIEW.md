# Trivia Game Token Implementation Review

## Player Flow

### 1. Initial Setup
- Player needs:
  - Phantom wallet connected
  - Small amount of SOL (< 0.01) for transaction fees
  - 100 JAM tokens for game entry

### 2. Entry Flow
1. Player arrives at game lobby
2. System checks:
   ```typescript
   // Check both SOL and JAM balances
   async function checkPlayerEligibility(wallet: PublicKey) {
     // Check SOL for gas
     const solBalance = await connection.getBalance(wallet);
     if (solBalance < MINIMUM_SOL_FOR_GAS) {
       throw new Error("Insufficient SOL for transaction fees");
     }

     // Check JAM for entry fee
     const jamBalance = await getTokenBalance(wallet, JAM_TOKEN_ADDRESS);
     if (jamBalance < ENTRY_FEE_AMOUNT) {
       throw new Error("Insufficient JAM tokens for entry fee");
     }

     return true;
   }
   ```

3. UI States:
   ```typescript
   type WalletState = {
     connected: boolean;
     solBalance: number;
     jamBalance: number;
   };

   // UI shows appropriate action based on balances
   function getWalletAction(state: WalletState) {
     if (!state.connected) {
       return "Connect Wallet";
     }
     if (state.solBalance < MINIMUM_SOL_FOR_GAS) {
       return "Get SOL";  // Link to SOL faucet (devnet) or exchange
     }
     if (state.jamBalance < ENTRY_FEE_AMOUNT) {
       return "Get JAM";  // Link to get JAM tokens
     }
     return "Join Game";  // Ready to play
   }
   ```

### Questions to Address
1. Should we provide a faucet for JAM tokens on devnet?
2. Should we integrate a SOL/JAM swap directly in the UI?
3. Should we show both balances in the UI?
4. What's the minimum SOL we should require?

## Next Steps
1. Implement JAM token integration
2. Create wallet connection flow
3. Build token balance checking
4. Add payment status UI
5. Implement error handling
6. Create token acquisition flow

## Technical Requirements
```typescript
// Token Configuration
const JAM_TOKEN_ADDRESS = "...";
const ENTRY_FEE_AMOUNT = 100;

// Balance Check
async function checkPlayerEligibility(wallet: PublicKey) {
  const balance = await getTokenBalance(wallet, JAM_TOKEN_ADDRESS);
  return balance >= ENTRY_FEE_AMOUNT;
}

// Payment Flow
async function handleGameEntry(wallet: PublicKey) {
  // 1. Check balance
  if (!await checkPlayerEligibility(wallet)) {
    throw new Error("Insufficient JAM tokens");
  }

  // 2. Get approval
  const approval = await requestTokenApproval(
    wallet, 
    JAM_TOKEN_ADDRESS, 
    ENTRY_FEE_AMOUNT
  );

  // 3. Submit payment
  const tx = await submitEntryPayment(wallet, approval);
  
  // 4. Verify and join
  await verifyPayment(tx);
  return joinGame(wallet);
}
```

## Current Implementation

### State Machine Changes
- Added token-related context to track:
  - Entry fees
  - Prize pool
  - Paid players
  - Game vault
  - Transaction signatures
- New states for handling payments:
  - `initializingVault`: Initial state for setting up game vault
  - `waitingForPlayers`: Handles player payments and verification
  - `distributingPrizes`: Manages reward distribution at game end

### Event Flow
1. Client submits entry fee:
   ```typescript
   SUBMIT_ENTRY_FEE {
     transactionSignature: string
   }
   ```

2. Server verifies and responds:
   ```typescript
   ENTRY_FEE_VERIFIED {
     playerId: string
   }
   ```
   or
   ```typescript
   ENTRY_FEE_FAILED {
     playerId: string
     error: string
   }
   ```

3. Prize distribution:
   ```typescript
   REWARDS_DISTRIBUTED {
     transactions: Array<{
       playerId: string
       amount: number
       signature: string
     }>
   }
   ```

## Needed Implementations

### 1. Solana Integration
- [ ] Create game vault PDA
- [ ] Implement token transfer functions
- [ ] Add error handling for failed transactions
- [ ] Set up proper devnet/mainnet configuration

### 2. UI Components
- [ ] Wallet connection status
- [ ] Entry fee display
- [ ] Payment confirmation flow
- [ ] Prize distribution visualization
- [ ] Transaction history view

### 3. Game Logic
- [ ] Define prize distribution algorithm
- [ ] Handle disconnections during payment
- [ ] Implement refund mechanism
- [ ] Add timeout for payment verification

### 4. Testing
- [ ] Mock wallet interactions for stories
- [ ] Test transaction failure scenarios
- [ ] Verify prize distribution accuracy
- [ ] Test concurrent payment handling

### 5. Security
- [ ] Validate transaction signatures
- [ ] Prevent double payments
- [ ] Secure vault key storage
- [ ] Rate limit payment attempts

### 6. Error Handling
- [ ] User-friendly error messages
- [ ] Recovery mechanisms
- [ ] Transaction retry logic
- [ ] Timeout handling

## Questions to Address
1. How should we handle partial payments?
2. What happens if a player disconnects after paying?
3. Should we implement a minimum player count?
4. How do we handle network fees?
5. What's the prize distribution formula?
6. Should we implement a house fee?

## Next Steps
1. Implement Solana token program integration
2. Build UI components for wallet interaction
3. Add comprehensive error handling
4. Create test suite for payment flows
5. Document security considerations
6. Set up monitoring for transactions

## Resources
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [SPL Token Program](https://spl.solana.com/token)
- [Wallet Adapter](https://github.com/solana-labs/wallet-adapter) 