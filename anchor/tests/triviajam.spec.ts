import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { Triviajam } from "../target/types/triviajam";

describe("triviajam", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Triviajam as Program<Triviajam>;

  const triviajamKeypair = Keypair.generate();

  it("Initialize Triviajam", async () => {
    await program.methods
      .initialize()
      .accounts({
        triviajam: triviajamKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([triviajamKeypair])
      .rpc();

    const currentCount = await program.account.triviajam.fetch(
      triviajamKeypair.publicKey
    );

    expect(currentCount.count).toEqual(0);
  });

  it("Increment Triviajam", async () => {
    await program.methods
      .increment()
      .accounts({ triviajam: triviajamKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.triviajam.fetch(
      triviajamKeypair.publicKey
    );

    expect(currentCount.count).toEqual(1);
  });

  it("Increment Triviajam Again", async () => {
    await program.methods
      .increment()
      .accounts({ triviajam: triviajamKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.triviajam.fetch(
      triviajamKeypair.publicKey
    );

    expect(currentCount.count).toEqual(2);
  });

  it("Decrement Triviajam", async () => {
    await program.methods
      .decrement()
      .accounts({ triviajam: triviajamKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.triviajam.fetch(
      triviajamKeypair.publicKey
    );

    expect(currentCount.count).toEqual(1);
  });

  it("Set triviajam value", async () => {
    await program.methods
      .set(42)
      .accounts({ triviajam: triviajamKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.triviajam.fetch(
      triviajamKeypair.publicKey
    );

    expect(currentCount.count).toEqual(42);
  });

  it("Set close the triviajam account", async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        triviajam: triviajamKeypair.publicKey,
      })
      .rpc();

    // The account should no longer exist, returning null.
    const userAccount = await program.account.triviajam.fetchNullable(
      triviajamKeypair.publicKey
    );
    expect(userAccount).toBeNull();
  });
});
