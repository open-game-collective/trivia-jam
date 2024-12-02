# Implementation Steps

## Step 1: Create JAM Token
```bash
# Create token
spl-token create-token --decimals 9

# Create token account
spl-token create-account <TOKEN_ADDRESS>

# Mint initial supply for testing
spl-token mint <TOKEN_ADDRESS> 1000000000
```

## Step 2: Create Initial Integration Files

1. Create `app/solana/token.ts`:
```typescript
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export class JamToken {
  private connection: Connection;
  private mintAuthority: Keypair;
  private tokenMint: PublicKey;

  constructor(
    connection: Connection,
    mintAuthority: Keypair,
    tokenMint: PublicKey
  ) {
    this.connection = connection;
    this.mintAuthority = mintAuthority;
    this.tokenMint = tokenMint;
  }

  static async initialize(
    connection: Connection,
    mintAuthority: Keypair
  ): Promise<JamToken> {
    // Create mint
    const token = await Token.createMint(
      connection,
      mintAuthority,
      mintAuthority.publicKey,
      mintAuthority.publicKey, // Freeze authority
      9,
      TOKEN_PROGRAM_ID
    );

    return new JamToken(connection, mintAuthority, token.publicKey);
  }
}
```

2. Create `app/solana/game.ts`:
```typescript
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

export class TriviaGame {
  private connection: Connection;
  private gameAccount: PublicKey;
  
  constructor(connection: Connection, gameAccount: PublicKey) {
    this.connection = connection;
    this.gameAccount = gameAccount;
  }

  static async create(
    connection: Connection,
    host: Keypair,
    entryFee: number
  ): Promise<TriviaGame> {
    // Implementation coming soon
    throw new Error("Not implemented");
  }
}
```

3. Create `app/solana/config.ts`:
```typescript
export const DEVNET_CONFIG = {
  rpcEndpoint: "https://api.devnet.solana.com",
  wsEndpoint: "wss://api.devnet.solana.com",
  tokenMint: "<YOUR_TOKEN_MINT>", // We'll add this after creating token
};
```

## Step 3: Add Wallet Integration

1. Update `app/root.tsx` to add wallet provider:
```typescript
import { WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const wallets = [new PhantomWalletAdapter()];

export default function App() {
  return (
    <WalletProvider wallets={wallets}>
      {/* Existing app content */}
    </WalletProvider>
  );
}
```

## Step 4: Create Test Script

Create `scripts/test-game.ts`:
```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { JamToken } from '../app/solana/token';
import { TriviaGame } from '../app/solana/game';
import { DEVNET_CONFIG } from '../app/solana/config';

async function main() {
  // Connect to devnet
  const connection = new Connection(DEVNET_CONFIG.rpcEndpoint);
  
  // Load test keypair
  const keypair = Keypair.fromSecretKey(
    // Load from id.json
  );

  // Initialize token
  const jamToken = await JamToken.initialize(connection, keypair);
  
  // Create test game
  const game = await TriviaGame.create(connection, keypair, 100);
  
  console.log('Test setup complete');
}

main().catch(console.error);
```

## Next Steps
1. Run initial token creation
2. Test token minting and transfers
3. Implement basic game account creation
4. Add entry fee collection logic 