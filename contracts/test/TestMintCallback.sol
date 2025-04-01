// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;

import '../interfaces/IERC20Minimal.sol';
import '../interfaces/callback/IUniswapV3MintCallback.sol';
import '../interfaces/IUniswapV3Pool.sol';

contract TestMintCallback is IUniswapV3MintCallback {
    // Callback function that's called by the pool during mint
    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata data
    ) external override {
        // Decode the callback data to get the sender address
        address sender = abi.decode(data, (address));
        
        // Get the tokens from the pool
        address token0 = IUniswapV3Pool(msg.sender).token0();
        address token1 = IUniswapV3Pool(msg.sender).token1();
        
        // Transfer the tokens from the sender to the pool
        if (amount0Owed > 0) {
            IERC20Minimal(token0).transferFrom(sender, msg.sender, amount0Owed);
        }
        
        if (amount1Owed > 0) {
            IERC20Minimal(token1).transferFrom(sender, msg.sender, amount1Owed);
        }
    }
    
    // Function to mint liquidity in a pool
    function mint(
        address pool,
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external returns (uint256 amount0, uint256 amount1) {
        // Encode the caller's address to pass through the callback
        bytes memory data = abi.encode(msg.sender);
        
        // Call the mint function on the pool
        return IUniswapV3Pool(pool).mint(
            recipient,
            tickLower,
            tickUpper,
            amount,
            data
        );
    }
} 