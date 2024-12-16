#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("Aqvh4Xd9QZDeX6KrTXprZeRs7H161rmac3u4wdY1bhge");

#[program]
pub mod triviajam {
    use super::*;

  pub fn close(_ctx: Context<CloseTriviajam>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.triviajam.count = ctx.accounts.triviajam.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.triviajam.count = ctx.accounts.triviajam.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeTriviajam>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.triviajam.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeTriviajam<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Triviajam::INIT_SPACE,
  payer = payer
  )]
  pub triviajam: Account<'info, Triviajam>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseTriviajam<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub triviajam: Account<'info, Triviajam>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub triviajam: Account<'info, Triviajam>,
}

#[account]
#[derive(InitSpace)]
pub struct Triviajam {
  count: u8,
}
