// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TickMath
 * @notice Simplified version of Uniswap's TickMath library for testing
 */
library TickMath {
    /// @dev The minimum tick that can be used on any pool
    int24 internal constant MIN_TICK = -887272;
    /// @dev The maximum tick that can be used on any pool
    int24 internal constant MAX_TICK = 887272;
    /// @dev The minimum value that can be returned from getSqrtRatioAtTick
    uint160 internal constant MIN_SQRT_PRICE = 4295128739;
    /// @dev The maximum value that can be returned from getSqrtRatioAtTick
    uint160 internal constant MAX_SQRT_PRICE = 1461446703485210103287273052203988822378723970342;

    /**
     * @notice Get the minimum usable tick for a given tick spacing
     * @param tickSpacing The tick spacing
     * @return The minimum usable tick
     */
    function minUsableTick(int24 tickSpacing) internal pure returns (int24) {
        return (MIN_TICK / tickSpacing) * tickSpacing;
    }

    /**
     * @notice Get the maximum usable tick for a given tick spacing
     * @param tickSpacing The tick spacing
     * @return The maximum usable tick
     */
    function maxUsableTick(int24 tickSpacing) internal pure returns (int24) {
        return (MAX_TICK / tickSpacing) * tickSpacing;
    }

    /**
     * @notice Get the sqrt price at a given tick
     * @param tick The tick
     * @return sqrtPriceX96 The sqrt price as a Q64.96 value
     */
    function getSqrtPriceAtTick(int24 tick) internal pure returns (uint160 sqrtPriceX96) {
        // For test simplicity, we're using a basic approximation
        // This is not suitable for production use
        
        unchecked {
            uint256 absTick = tick < 0 ? uint256(-int256(tick)) : uint256(int256(tick));
            require(absTick <= uint256(int256(MAX_TICK)), "TickMath: TICK_OUT_OF_RANGE");
            
            // Base calculation at tick 0
            sqrtPriceX96 = 79228162514264337593543950336; // 1.0 in Q64.96 format
            
            // Simple linear approximation for testing
            if (tick > 0) {
                // For positive ticks, increase by 0.1% per tick
                sqrtPriceX96 += (sqrtPriceX96 * absTick) / 1000;
            } else if (tick < 0) {
                // For negative ticks, decrease by 0.1% per tick
                sqrtPriceX96 -= (sqrtPriceX96 * absTick) / 1000;
            }
            
            // Ensure result is within bounds
            if (sqrtPriceX96 < MIN_SQRT_PRICE) sqrtPriceX96 = MIN_SQRT_PRICE;
            if (sqrtPriceX96 > MAX_SQRT_PRICE) sqrtPriceX96 = MAX_SQRT_PRICE;
        }
    }
}