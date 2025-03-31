# Token Minting and Swap Guide

This guide will help you mint Token A (TK0) to your wallet address and perform a swap using the p-dex-app.

## Your Wallet Address

```
0x4222Fd3257F7C760F07d11f0354e51BA4840Fae7
```

## Token Information

Based on the deployed contracts, these are the tokens available in the system:

- **Token0 (TK0)**: `0x1f28618A8334093240c1BA4847c517c8eDf687c4`
- **Token1 (TK1)**: `0x8A952a150d1B910Ef8185Da81c6605ab6Dc8A9e1`

## Pool Information

- **Pool Address**: `0x4Df991747110105E0d80DAa1167dB90865086766`
- **Fee**: 3000 (0.3%)

## How to Mint Tokens

To mint 20 Token A (TK0) to your wallet, run the following command:

```bash
npx hardhat run scripts/mint-token-to-wallet.ts --network devnet
```

This will mint 20 TK0 tokens to your wallet address. The script is already set up with your wallet address.

## How to Perform a Swap

After minting tokens, you can use the p-dex-app to perform a swap. Here's how to do it:

1. Make sure you have connected your wallet to the p-dex-app
2. Select Token A (TK0) as the input token
3. Select Token B (TK1) as the output token
4. Enter the amount you want to swap (up to 20 tokens)
5. Click the "Swap" button

## Using the SwapService

The SwapService in the p-dex-app is already configured to handle token swaps. It will:

1. Check if you have sufficient token balance
2. Approve the swap helper contract to spend your tokens
3. Execute the swap through the Uniswap V3 pool

The SwapService handles all the complex interactions with the Uniswap V3 contracts, including:
- Calculating price impact
- Applying slippage tolerance
- Managing token approvals
- Executing the swap

## Troubleshooting

If you encounter any issues:

1. Make sure your wallet is connected to the correct network (Pharos devnet)
2. Verify that you have sufficient token balance
3. Check that you have approved the swap helper contract to spend your tokens
4. Ensure the pool has sufficient liquidity for your swap

## Technical Details

The swap is executed through the SwapHelper contract at `0xdFcF98987310a068e9f0F8190A58eE2f98552d7e`, which interacts with the Uniswap V3 pool to perform the swap. The SwapService in the p-dex-app handles all the necessary interactions with this contract.