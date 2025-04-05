// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPositionManager} from "v4-periphery/src/interfaces/IPositionManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

/**
 * @title EasyPosm
 * @notice Utility library for easier interaction with Uniswap V4 PositionManager
 */
library EasyPosm {
    /**
     * @notice Mint a new position
     * @param self The PositionManager instance
     * @param key The pool key
     * @param tickLower The lower tick boundary
     * @param tickUpper The upper tick boundary
     * @param liquidity The amount of liquidity to provide
     * @param amount0Max The maximum amount of token0 to use
     * @param amount1Max The maximum amount of token1 to use
     * @param recipient The recipient of the position NFT
     * @param deadline The deadline for the transaction
     * @param hookData Additional data to pass to hooks
     * @return tokenId The ID of the newly minted position
     * @return amounts The amounts of token0 and token1 actually used
     */
    function mint(
        IPositionManager self,
        PoolKey memory key,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        uint256 amount0Max,
        uint256 amount1Max,
        address recipient,
        uint256 deadline,
        bytes memory hookData
    ) internal returns (uint256 tokenId, uint128[2] memory amounts) {
        // Encode parameters for the mint function
        bytes memory data = abi.encode(
            key,
            tickLower,
            tickUpper,
            liquidity,
            amount0Max,
            amount1Max,
            recipient,
            hookData
        );
        
        // Call the mint function
        bytes memory result = self.mint(data, deadline);
        
        // Decode the result
        (tokenId, amounts) = abi.decode(result, (uint256, uint128[2]));
        
        return (tokenId, amounts);
    }

    /**
     * @notice Decrease liquidity for a position
     * @param self The PositionManager instance
     * @param tokenId The ID of the position
     * @param liquidity The amount of liquidity to remove
     * @param amount0Min The minimum amount of token0 to receive
     * @param amount1Min The minimum amount of token1 to receive
     * @param recipient The recipient of the withdrawn tokens
     * @param deadline The deadline for the transaction
     * @param hookData Additional data to pass to hooks
     * @return amounts The amounts of token0 and token1 received
     */
    function decreaseLiquidity(
        IPositionManager self,
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0Min,
        uint256 amount1Min,
        address recipient,
        uint256 deadline,
        bytes memory hookData
    ) internal returns (uint128[2] memory amounts) {
        // Encode parameters for the decreaseLiquidity function
        bytes memory data = abi.encode(
            tokenId,
            liquidity,
            amount0Min,
            amount1Min,
            recipient,
            hookData
        );
        
        // Call the decreaseLiquidity function
        bytes memory result = self.decreaseLiquidity(data, deadline);
        
        // Decode the result
        amounts = abi.decode(result, (uint128[2]));
        
        return amounts;
    }

    /**
     * @notice Collect fees for a position
     * @param self The PositionManager instance
     * @param tokenId The ID of the position
     * @param recipient The recipient of the collected fees
     * @param amount0Max The maximum amount of token0 fees to collect
     * @param amount1Max The maximum amount of token1 fees to collect
     * @param deadline The deadline for the transaction
     * @return amounts The amounts of token0 and token1 fees collected
     */
    function collect(
        IPositionManager self,
        uint256 tokenId,
        address recipient,
        uint128 amount0Max,
        uint128 amount1Max,
        uint256 deadline
    ) internal returns (uint128[2] memory amounts) {
        // Encode parameters for the collect function
        bytes memory data = abi.encode(
            tokenId,
            recipient,
            amount0Max,
            amount1Max
        );
        
        // Call the collect function
        bytes memory result = self.collect(data, deadline);
        
        // Decode the result
        amounts = abi.decode(result, (uint128[2]));
        
        return amounts;
    }
}