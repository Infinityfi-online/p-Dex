// ABIs for Uniswap V3 contracts

export const FACTORY_ABI = [
  // Factory functions according to the actual contract implementation
  "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
  "function getPool(address, address, uint24) external view returns (address)",
  "function owner() external view returns (address)",
  "function feeAmountTickSpacing(uint24 fee) external view returns (int24)"
];

export const POOL_ABI = [
  // Required pool functions
  "function initialize(uint160 sqrtPriceX96) external",
  "function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data) external returns (int256 amount0, int256 amount1)",
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
];

export const ERC20_ABI = [
  // Basic ERC20 functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint)",
  "function totalSupply() view returns (uint)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
]; 