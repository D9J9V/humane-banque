// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPoolManager} from "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/contracts/libraries/PoolKey.sol";
import {BalanceDelta, BalanceDelta_Lib} from "@uniswap/v4-core/contracts/types/BalanceDelta.sol";

/**
 * @title Mock Pool Manager
 * @dev A simple mock implementation of the Uniswap V4 Pool Manager for testing purposes.
 */
contract MockPoolManager {
    // Mock variables
    mapping(bytes32 => uint256) public mockPrices;
    
    /**
     * @notice Set a mock price for a token pair
     * @param token0 The first token address
     * @param token1 The second token address
     * @param price The price to set
     */
    function setMockPrice(address token0, address token1, uint256 price) external {
        bytes32 pairHash = keccak256(abi.encodePacked(token0, token1));
        mockPrices[pairHash] = price;
    }
    
    /**
     * @notice Mock implementation of getOracleData
     * @param key Pool key (not used in mock)
     * @param twapInterval Time interval for the TWAP (ignored in mock)
     * @return Encoded oracle data (mocked)
     */
    function getOracleData(PoolKey calldata key, uint32 twapInterval) external view returns (bytes memory) {
        // In a real implementation, this would return actual TWAP data
        // For our mock, we return a simple fixed value
        return abi.encode(100 * 1e18); // Mock price of 100 USD per token
    }
    
    /**
     * @notice Mock implementation of swap
     */
    function swap(
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata data
    ) external returns (BalanceDelta) {
        // Mock implementation that simply returns a dummy result
        return BalanceDelta_Lib.wrap(1);
    }
}