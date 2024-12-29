// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";

import "../vendor/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../ERC20.sol";
import "../IPriceFeed.sol";
import "../IUniswapV3TwapPriceOracle.sol";

/**
 * @title UniTwapChainlinkPriceFeed price feed
 * @notice A custom price feed that calculates the price for Uniswapv3 Twap and Chainlink
 */
contract UniTwapChainlinkPriceFeed is IPriceFeed {
    /** Custom errors **/
    error BadDecimals();
    error InvalidInt256();

    /// @notice Version of the price feed
    uint public constant VERSION = 1;

    /// @notice Description of the price feed
    string public override description;

    /// @notice Number of decimals for returned prices
    uint8 public immutable override decimals;

    /// @notice Uniswap pool
    address public immutable uniswapPool;

    /// @notice Uniswap pool underlying token
    address public immutable uniswapUnderlying;

    /// @notice Uniswap pool base token
    address public immutable uniswapBase;

    /// @notice Chainlink price feed
    address public immutable priceFeedChainlink;

    /// @notice The base unit amount of the `uniswapUnderlying` token, scaled by its decimals.
    uint128 public immutable baseUnit;

    /// @notice Combined scale of the two underlying Chainlink price feeds
    int public immutable combinedScale;

    /// @notice Scale of this price feed
    int public immutable priceFeedScale;

    /**
     * @dev Ideal TWAP interval.
     */
    uint32 public constant TWAP_PERIOD = 10 minutes;

    /**
     * @notice Construct a new multiplicative price feed
     * @param uniswapPool_ The address of the Uniswap V3 pool used for price calculation.
     * @param uniswapUnderlying_ The address of the token in the Uniswap pair being priced.
     * @param uniswapBase_ The address of the base token in the Uniswap pair.
     * @param priceFeedChainlink_ The address of the second price feed to fetch prices from Chainlink
     * @param decimals_ The number of decimals for the returned prices
     * @param description_ The description of the price feed
     **/
    constructor(
        address uniswapPool_,
        address uniswapUnderlying_,
        address uniswapBase_,
        address priceFeedChainlink_,
        uint8 decimals_,
        string memory description_
    ) {
        uniswapPool = uniswapPool_;
        uniswapUnderlying = uniswapUnderlying_;
        uniswapBase = uniswapBase_;
        priceFeedChainlink = priceFeedChainlink_;
        baseUnit = uint128(10 ** ERC20(uniswapUnderlying_).decimals());
        uint8 priceFeedUniswapDecimals = 18 -
            (ERC20(uniswapUnderlying_).decimals() -
                ERC20(uniswapBase_).decimals());
        uint8 priceFeedChainlinkDecimals = AggregatorV3Interface(
            priceFeedChainlink_
        ).decimals();
        combinedScale = signed256(
            10 ** (priceFeedUniswapDecimals + priceFeedChainlinkDecimals)
        );

        if (decimals_ > 18) revert BadDecimals();
        decimals = decimals_;
        description = description_;
        priceFeedScale = int256(10 ** decimals);
    }

    /**
     * @notice Fetches the TWAP of the `underlying` token using the specified Uniswap V3 pool.
     */
    function uniswapPrice() public view returns (uint) {
        (int24 timeWeightedAverageTick, ) = OracleLibrary.consult(
            uniswapPool,
            TWAP_PERIOD
        );

        uint256 quote = OracleLibrary.getQuoteAtTick(
            timeWeightedAverageTick,
            baseUnit,
            uniswapUnderlying,
            uniswapBase
        );
        return quote;
    }

    /**
     * @notice Calculates the latest round data using data from the two price feeds
     * @return roundId Round id from price feed B
     * @return answer Latest price
     * @return startedAt Timestamp when the round was started; passed on from price feed B
     * @return updatedAt Timestamp when the round was last updated; passed on from price feed B
     * @return answeredInRound Round id in which the answer was computed; passed on from price feed B
     * @dev Note: Only the `answer` really matters for downstream contracts that use this price feed (e.g. Comet)
     **/
    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        int256 priceUniswap = signed256(uniswapPrice());
        (
            uint80 roundId_,
            int256 priceChainlink,
            uint256 startedAt_,
            uint256 updatedAt_,
            uint80 answeredInRound_
        ) = AggregatorV3Interface(priceFeedChainlink).latestRoundData();

        if (priceChainlink <= 0)
            return (roundId_, 0, startedAt_, updatedAt_, answeredInRound_);

        int256 price = (priceUniswap * priceChainlink * priceFeedScale) /
            combinedScale;
        return (roundId_, price, startedAt_, updatedAt_, answeredInRound_);
    }

    function signed256(uint256 n) internal pure returns (int256) {
        if (n > uint256(type(int256).max)) revert InvalidInt256();
        return int256(n);
    }

    /**
     * @notice Price for the latest round
     * @return The version of the price feed contract
     **/
    function version() external pure returns (uint256) {
        return VERSION;
    }
}
