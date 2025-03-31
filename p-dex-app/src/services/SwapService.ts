import { ethers } from 'ethers';
import { ERC20_ABI, POOL_ABI } from '../constants/abis';
import { SWAP_HELPER_ABI, SWAP_HELPER_BYTECODE, SWAP_HELPER_ADDRESS } from '../constants/swapHelper';

// Interface for swap parameters
export interface SwapParams {
  tokenIn: {
    address: string;
    symbol: string;
    decimals: number;
  };
  tokenOut: {
    address: string;
    symbol: string;
    decimals: number;
  };
  amountIn: string;
  poolAddress: string;
  slippageTolerance?: number; // in percentage, default 0.5%
  deadline?: number; // in seconds, default 20 minutes
  recipient?: string; // default to sender
}

// Interface for swap result
export interface SwapResult {
  success: boolean;
  transactionHash?: string;
  amountIn?: string;
  amountOut?: string;
  error?: string;
}

/**
 * Service for handling token swaps using Uniswap V3 pools
 */
export class SwapService {
  private provider: ethers.providers.Web3Provider;
  private signer: ethers.Signer;

  constructor(provider: ethers.providers.Web3Provider) {
    this.provider = provider;
    this.signer = provider.getSigner();
  }

  /**
   * Check if a user has sufficient token balance for a swap
   * @param tokenAddress The address of the token to check
   * @param userAddress The address of the user
   * @param amount The amount to check in wei
   * @param tokenSymbol The symbol of the token (for error messages)
   * @param tokenDecimals The decimals of the token (for formatting)
   * @returns True if the user has sufficient balance
   * @throws Error if the user has insufficient balance
   */
  private async checkTokenBalance(
    tokenAddress: string,
    userAddress: string,
    amount: ethers.BigNumber,
    tokenSymbol: string,
    tokenDecimals: number
  ): Promise<boolean> {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const balance = await tokenContract.balanceOf(userAddress);
    
    if (balance.lt(amount)) {
      const formattedBalance = ethers.utils.formatUnits(balance, tokenDecimals);
      const formattedAmount = ethers.utils.formatUnits(amount, tokenDecimals);
      throw new Error(`Insufficient balance. You have ${formattedBalance} ${tokenSymbol}, but the swap requires ${formattedAmount} ${tokenSymbol}.`);
    }
    
    return true;
  }

  /**
   * Execute a token swap
   * @param params Swap parameters
   * @returns Swap result
   */
  public async executeSwap(params: SwapParams): Promise<SwapResult> {
    try {
      const {
        tokenIn,
        tokenOut,
        amountIn,
        poolAddress,
        slippageTolerance = 0.5, // default 0.5%
        deadline = 20 * 60, // default 20 minutes
        recipient
      } = params;

      // Get signer's address if recipient not specified
      const signerAddress = recipient || await this.signer.getAddress();
      
      // Convert amount to wei
      const amountInWei = ethers.utils.parseUnits(amountIn, tokenIn.decimals);
      
      // Get pool contract
      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, this.signer);
      
      // Get token contracts
      const tokenInContract = new ethers.Contract(tokenIn.address, ERC20_ABI, this.signer);
      
      // Use the pre-deployed TestUniswapV3SwapPay contract or deploy a new one if needed
      let swapHelperContract;
      
      if (SWAP_HELPER_ADDRESS) {
        // Use the pre-deployed contract
        console.log('Using pre-deployed SwapHelper at:', SWAP_HELPER_ADDRESS);
        swapHelperContract = new ethers.Contract(SWAP_HELPER_ADDRESS, SWAP_HELPER_ABI, this.signer);
      } else {
        // Deploy a new contract if no address is provided
        console.log('No pre-deployed SwapHelper found, deploying a new one...');
        const swapHelperFactory = new ethers.ContractFactory(
          SWAP_HELPER_ABI,
          SWAP_HELPER_BYTECODE,
          this.signer
        );
        
        // Deploy the contract
        swapHelperContract = await swapHelperFactory.deploy();
        await swapHelperContract.deployTransaction.wait();
        console.log('Deployed new SwapHelper at:', swapHelperContract.address);
      }
      
      // Check user's token balance before proceeding
      await this.checkTokenBalance(
        tokenIn.address,
        signerAddress,
        amountInWei,
        tokenIn.symbol,
        tokenIn.decimals
      );
      
      // Now approve the swap helper contract to spend tokens
      const allowance = await tokenInContract.allowance(signerAddress, swapHelperContract.address);
      if (allowance.lt(amountInWei)) {
        console.log('Approving SwapHelper to spend tokens...');
        const approveTx = await tokenInContract.approve(swapHelperContract.address, ethers.constants.MaxUint256);
        await approveTx.wait();
        console.log('Approval transaction confirmed');
      }
      
      // Get current pool state
      const slot0 = await poolContract.slot0();
      const sqrtPriceX96 = slot0.sqrtPriceX96;
      
      // Determine swap direction
      const zeroForOne = tokenIn.address.toLowerCase() < tokenOut.address.toLowerCase();
      
      // Calculate price limit based on slippage
      const sqrtPriceLimitX96 = zeroForOne 
        ? sqrtPriceX96.mul(ethers.BigNumber.from(10000 - slippageTolerance * 100)).div(10000) // Price can't go down more than slippage %
        : sqrtPriceX96.mul(ethers.BigNumber.from(10000 + slippageTolerance * 100)).div(10000); // Price can't go up more than slippage %
      
      // Determine the payment amounts based on swap direction
      const pay0 = zeroForOne ? amountInWei : ethers.BigNumber.from(0);
      const pay1 = zeroForOne ? ethers.BigNumber.from(0) : amountInWei;
      
      // Execute the swap through the swap helper
      const swapTx = await swapHelperContract.swap(
        poolAddress,           // pool address
        signerAddress,         // recipient
        zeroForOne,            // zeroForOne
        sqrtPriceLimitX96,     // sqrtPriceLimitX96
        amountInWei,           // amountSpecified (positive for exactInput)
        pay0,                  // pay0
        pay1                   // pay1
      );
      
      const receipt = await swapTx.wait();
      
      // Parse transaction receipt to get the output amount
      // For router transactions, we need to look for Transfer events to the recipient
      const transferEvents = receipt.events?.filter((e:any) => {
        // Look for Transfer events from the output token contract
        return e.address.toLowerCase() === tokenOut.address.toLowerCase() && 
               e.topics[0] === ethers.utils.id("Transfer(address,address,uint256)") &&
               ethers.utils.defaultAbiCoder.decode(['address'], e.topics[2])[0].toLowerCase() === signerAddress.toLowerCase();
      });
      
      let amountOut = '0';
      if (transferEvents && transferEvents.length > 0) {
        // Get the last transfer event to the recipient
        const transferEvent = transferEvents[transferEvents.length - 1];
        const amount = ethers.BigNumber.from(transferEvent.data);
        amountOut = ethers.utils.formatUnits(amount, tokenOut.decimals);
      }
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        amountIn,
        amountOut
      };
    } catch (error: any) {
      console.error('Swap execution error:', error);
      
      // Provide more detailed error information
      let errorMessage = error.message || 'Unknown error during swap';
      
      // Try to extract revert reason from error
      if (error.data) {
        try {
          // Extract error data from the error object
          const errorData = error.data.data?.message || error.data.message || '';
          
          // Check if the error contains the hex-encoded revert reason
          if (errorData.includes('0x08c379a0')) {
            // This is the function selector for Error(string)
            const startIndex = errorData.indexOf('0x08c379a0') + 10; // Skip the function selector
            const hexData = '0x' + errorData.substring(startIndex);
            
            // Decode the error message
            const decodedError = ethers.utils.defaultAbiCoder.decode(['string'], hexData);
            errorMessage = `Contract reverted: ${decodedError[0]}`;
          } else if (errorData.includes('underflow balance sender')) {
            errorMessage = 'Insufficient token balance for this swap.';
          }
        } catch (decodeError) {
          console.error('Error decoding revert reason:', decodeError);
        }
      }
      
      // Check for common errors
      if (errorMessage.includes('insufficient allowance')) {
        errorMessage = 'Insufficient token allowance. Please approve the swap helper contract to spend your tokens.';
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('underflow balance')) {
        errorMessage = 'Insufficient token balance for this swap.';
      } else if (errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by the user.';
      } else if (errorMessage.includes('price impact too high')) {
        errorMessage = 'Price impact is too high. Try a smaller amount or adjust slippage tolerance.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Calculate the expected output amount for a given input
   * @param params Swap parameters
   * @returns Expected output amount
   */
  public async calculateOutputAmount(params: Omit<SwapParams, 'deadline' | 'slippageTolerance'>): Promise<string> {
    try {
      const { tokenIn, tokenOut, amountIn, poolAddress } = params;
      
      // Get pool contract
      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
      
      // Get current price from pool
      const slot0 = await poolContract.slot0();
      const sqrtPriceX96 = slot0.sqrtPriceX96;
      
      // Convert sqrtPriceX96 to price
      const price = sqrtPriceX96.pow(2).div(ethers.BigNumber.from(2).pow(192));
      
      // Determine token order in pool
      const zeroForOne = tokenIn.address.toLowerCase() < tokenOut.address.toLowerCase();
      
      // Convert amount to wei
      const amountInWei = ethers.utils.parseUnits(amountIn, tokenIn.decimals);
      
      // Calculate expected output (simplified)
      // In a real implementation, you would account for fees and slippage more precisely
      let amountOutWei;
      if (zeroForOne) {
        // token0 to token1
        amountOutWei = amountInWei.mul(price).div(ethers.constants.WeiPerEther);
      } else {
        // token1 to token0
        amountOutWei = amountInWei.mul(ethers.constants.WeiPerEther).div(price);
      }
      
      // Apply fee (0.3% for medium fee tier)
      amountOutWei = amountOutWei.mul(997).div(1000);
      
      // Format to human-readable amount
      return ethers.utils.formatUnits(amountOutWei, tokenOut.decimals);
    } catch (error) {
      console.error('Error calculating output amount:', error);
      return '0';
    }
  }
}