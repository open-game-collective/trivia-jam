# TJAM Token Implementation Plan

## Phase 1: Token Setup (Week 1-2)

### 1. Create Token Program
```rust
// programs/tjam-token/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[program]
pub mod tjam_token {
    use super::*;

    pub fn initialize_mint(ctx: Context<InitializeMint>) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        mint.supply = 1_000_000_000 * TJAM_DECIMALS; // 1B tokens
        mint.decimals = 0;  // No decimals
        mint.freeze_authority = None;
        Ok(())
    }

    pub fn create_token_account(ctx: Context<CreateTokenAccount>) -> Result<()> {
        // Create associated token account for user
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

### 2. Setup Vesting Contract
```rust
// programs/tjam-token/src/vesting.rs
pub struct VestingSchedule {
    pub beneficiary: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub cliff_time: i64,
    pub total_amount: u64,
    pub released_amount: u64,
}

impl VestingSchedule {
    pub fn get_releasable_amount(&self, current_time: i64) -> u64 {
        if current_time < self.cliff_time {
            return 0;
        }
        // Calculate vested amount
        let total_duration = self.end_time - self.start_time;
        let elapsed = current_time - self.start_time;
        let vested = (self.total_amount * elapsed as u64) / total_duration as u64;
        vested - self.released_amount
    }
}
```

## Phase 2: Game Integration (Week 3-4)

### 1. Game Vault Setup
```rust
// programs/tjam-game/src/lib.rs
pub struct GameVault {
    pub game_id: Pubkey,
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub locked_amount: u64,
}

pub fn create_game_vault(ctx: Context<CreateGameVault>) -> Result<()> {
    let (vault_key, bump) = Pubkey::find_program_address(
        &[
            b"vault",
            ctx.accounts.game.key().as_ref(),
            ctx.accounts.authority.key().as_ref(),
        ],
        ctx.program_id
    );
    // Initialize vault
    Ok(())
}
```

### 2. Entry Fee Handling
```rust
pub fn process_entry_fee(ctx: Context<ProcessEntryFee>) -> Result<()> {
    let amount = 100 * TJAM_DECIMALS; // 100 TJAM entry fee
    
    // Transfer tokens to game vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.game_vault.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            }
        ),
        amount
    )?;
    
    Ok(())
}
```

## Phase 3: Price Discovery (Week 5-6)

### 1. Initial DEX Setup
```rust
pub struct LiquidityPool {
    pub tjam_amount: u64,    // Initial: 1M TJAM
    pub sol_amount: u64,     // Initial: 100 SOL
    pub lp_tokens: u64,
}

pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
    // Create Raydium pool
    // Set initial price: 0.0001 SOL per TJAM
    Ok(())
}
```

### 2. Price Protection
```rust
pub struct PriceProtection {
    pub max_slippage: u16,    // e.g., 5%
    pub min_liquidity: u64,   // Minimum pool size
}

pub fn check_price_impact(ctx: Context<Trade>) -> Result<()> {
    // Implement price protection logic
    Ok(())
}
```

## Phase 4: Distribution (Week 7-8)

### 1. Discord Airdrop
```rust
pub fn airdrop_tokens(ctx: Context<Airdrop>) -> Result<()> {
    let amount = 500 * TJAM_DECIMALS; // 500 TJAM per user
    
    // Transfer tokens to user
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.distribution_wallet.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.distribution_authority.to_account_info(),
            }
        ),
        amount
    )?;
    
    Ok(())
}
```

### 2. Team Vesting
```rust
pub fn setup_team_vesting(ctx: Context<SetupVesting>) -> Result<()> {
    let schedule = VestingSchedule {
        beneficiary: ctx.accounts.team_wallet.key(),
        start_time: Clock::get()?.unix_timestamp,
        end_time: Clock::get()?.unix_timestamp + 2 * YEAR_IN_SECONDS,
        cliff_time: Clock::get()?.unix_timestamp + 6 * MONTH_IN_SECONDS,
        total_amount: 50_000_000 * TJAM_DECIMALS, // 50M TJAM
        released_amount: 0,
    };
    
    // Initialize vesting account
    Ok(())
}
```

## Testing Plan

### 1. Unit Tests
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_vesting_schedule() {
        let schedule = VestingSchedule {
            // ... setup test schedule
        };
        
        // Test different time periods
        assert_eq!(schedule.get_releasable_amount(cliff_time - 1), 0);
        assert_eq!(schedule.get_releasable_amount(end_time), total_amount);
    }
}
```

### 2. Integration Tests
```typescript
describe('Game Flow', () => {
    it('should handle full game cycle', async () => {
        // Create game
        const game = await program.methods
            .createGame()
            .accounts({...})
            .rpc();
            
        // Join game
        await program.methods
            .joinGame()
            .accounts({...})
            .rpc();
            
        // Verify token transfers
        const vaultBalance = await getTokenBalance(gameVault);
        assert.equal(vaultBalance, 100); // 100 TJAM entry fee
    });
});
```

## Deployment Checklist

1. **Token Program**
   - [ ] Deploy TJAM token program
   - [ ] Initialize mint
   - [ ] Set up vesting contracts
   - [ ] Lock team tokens

2. **Game Integration**
   - [ ] Deploy game program
   - [ ] Test vault creation
   - [ ] Verify entry fee handling
   - [ ] Test prize distribution

3. **Price Discovery**
   - [ ] Create Raydium pool
   - [ ] Add initial liquidity
   - [ ] Enable price protection
   - [ ] Monitor trading

4. **Distribution**
   - [ ] Setup airdrop program
   - [ ] Begin Discord distribution
   - [ ] Initialize team vesting
   - [ ] Start community incentives

## Security Considerations

1. **Access Control**
```rust
fn verify_authority(program_id: &Pubkey, authority: &Pubkey) -> Result<()> {
    require!(
        *program_id == authority,
        TjamError::InvalidAuthority
    );
    Ok(())
}
```

2. **Fund Safety**
```rust
fn verify_vault_balance(vault: &Account<TokenAccount>, amount: u64) -> Result<()> {
    require!(
        vault.amount >= amount,
        TjamError::InsufficientFunds
    );
    Ok(())
}
```

3. **Emergency Controls**
```rust
pub fn emergency_pause(ctx: Context<EmergencyPause>) -> Result<()> {
    require!(
        ctx.accounts.authority.key() == EMERGENCY_AUTHORITY,
        TjamError::InvalidAuthority
    );
    // Pause operations
    Ok(())
}
```

## Monitoring & Maintenance

1. **Health Checks**
```rust
pub struct HealthCheck {
    pub last_check: i64,
    pub vault_balances: Vec<(Pubkey, u64)>,
    pub active_games: u64,
    pub total_locked: u64,
}
```

2. **Metrics Collection**
```rust
pub fn update_metrics(ctx: Context<UpdateMetrics>) -> Result<()> {
    // Track key metrics
    // - Total games played
    // - Token velocity
    // - Average prize distribution
    Ok(())
}
```

Would you like me to expand on any of these sections or add more implementation details? 