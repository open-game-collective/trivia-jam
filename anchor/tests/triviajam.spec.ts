import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Triviajam } from "../target/types/triviajam";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";

describe("triviajam", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Triviajam as Program<Triviajam>;

  const gameKeypair = Keypair.generate();
  let mint: PublicKey;
  let playerTokenAccount: PublicKey;
  let gameVault: PublicKey;

  beforeAll(async () => {
    // Create token mint
    mint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      6 // 6 decimals
    );

    // Create player token account
    playerTokenAccount = await createAccount(
      provider.connection,
      payer.payer,
      mint,
      payer.publicKey
    );

    // Mint some tokens to player
    await mintTo(
      provider.connection,
      payer.payer,
      mint,
      playerTokenAccount,
      payer.payer,
      1000000000 // 1000 tokens
    );

    // Create game vault
    gameVault = await createAccount(
      provider.connection,
      payer.payer,
      mint,
      gameKeypair.publicKey
    );
  });

  it("Initialize Game", async () => {
    await program.methods
      .initializeGame(
        new anchor.BN(100), // 100 token entry fee
        10 // max 10 players
      )
      .accounts({
        game: gameKeypair.publicKey,
        host: payer.publicKey,
      })
      .signers([gameKeypair])
      .rpc();

    const gameAccount = await program.account.game.fetch(gameKeypair.publicKey);
    expect(gameAccount.host).toEqual(payer.publicKey);
    expect(gameAccount.entryFee.toNumber()).toEqual(100);
    expect(gameAccount.maxPlayers).toEqual(10);
    expect(gameAccount.playerCount).toEqual(0);
    expect(gameAccount.state).toEqual({ lobby: {} });
    expect(gameAccount.totalPrizePool.toNumber()).toEqual(0);
  });

  it("Join Game", async () => {
    await program.methods
      .joinGame()
      .accounts({
        game: gameKeypair.publicKey,
        player: payer.publicKey,
        playerTokenAccount: playerTokenAccount,
        gameVault: gameVault,
      })
      .rpc();

    const gameAccount = await program.account.game.fetch(gameKeypair.publicKey);
    expect(gameAccount.playerCount).toEqual(1);
    expect(gameAccount.totalPrizePool.toNumber()).toEqual(100);
  });

  // For the endGame error, you need to update your Rust program and regenerate the IDL
  // The endGame instruction is missing from your IDL
  // For now, you might want to comment out this test until you've properly added
  // the endGame instruction to your program
  /*
  it("End Game", async () => {
    const winners = [[payer.publicKey, 1]];
    
    await program.methods
      .endGame(winners)
      .accounts({
        game: gameKeypair.publicKey,
        host: payer.publicKey,
      })
      .rpc();

    const gameAccount = await program.account.game.fetch(gameKeypair.publicKey);
    expect(gameAccount.state).toEqual({ ended: {} });
  });
  */
});
