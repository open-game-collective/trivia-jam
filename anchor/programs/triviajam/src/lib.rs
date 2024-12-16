#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer};

declare_id!("Aqvh4Xd9QZDeX6KrTXprZeRs7H161rmac3u4wdY1bhge");

#[program]
pub mod triviajam {
    use super::*;

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        entry_fee: u64,
        max_players: u8,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        game.host = ctx.accounts.host.key();
        game.entry_fee = entry_fee;
        game.max_players = max_players;
        game.player_count = 0;
        game.state = GameState::Lobby;
        game.total_prize_pool = 0;
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.state == GameState::Lobby, GameError::GameNotInLobby);
        require!(
            game.player_count < game.max_players,
            GameError::GameFull
        );

        // Transfer entry fee from player to game vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.game_vault.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, game.entry_fee)?;

        // Update game state
        game.player_count += 1;
        game.total_prize_pool += game.entry_fee;
        
        Ok(())
    }

    pub fn end_game(ctx: Context<EndGame>, winners: Vec<(Pubkey, u8)>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.host == ctx.accounts.host.key(), GameError::UnauthorizedHost);
        require!(game.state != GameState::Ended, GameError::GameAlreadyEnded);

        // Calculate prizes
        let total_prize = game.total_prize_pool;
        let host_fee = (total_prize * 4) / 100; // 4% host fee
        let platform_fee = total_prize / 100; // 1% platform fee
        let player_prize_pool = total_prize - host_fee - platform_fee;

        // Transfer fees
        // TODO: Implement fee transfers to host and platform wallets

        // Distribute prizes to winners
        // TODO: Implement prize distribution based on winners vector

        game.state = GameState::Ended;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Default)]
pub enum GameState {
    #[default]
    Lobby,
    InProgress,
    Ended,
}

#[account]
#[derive(Default)]
pub struct Game {
    pub host: Pubkey,
    pub entry_fee: u64,
    pub max_players: u8,
    pub player_count: u8,
    pub state: GameState,
    pub total_prize_pool: u64,
}

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(mut)]
    pub host: Signer<'info>,
    
    #[account(
        init,
        payer = host,
        space = 8 + std::mem::size_of::<Game>()
    )]
    pub game: Account<'info, Game>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    /// CHECK: This is safe because we check the token account owner in the token transfer CPI
    #[account(mut)]
    pub player_token_account: AccountInfo<'info>,
    
    /// CHECK: This is safe because we check the token account in the token transfer CPI
    #[account(mut)]
    pub game_vault: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EndGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    #[account(mut)]
    pub host: Signer<'info>,
}

#[error_code]
pub enum GameError {
    #[msg("Game is not in lobby state")]
    GameNotInLobby,
    #[msg("Game is full")]
    GameFull,
    #[msg("Unauthorized host")]
    UnauthorizedHost,
    #[msg("Game has already ended")]
    GameAlreadyEnded,
}
