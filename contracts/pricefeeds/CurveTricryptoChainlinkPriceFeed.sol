// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "../vendor/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../IPriceFeed.sol";
import "../ICurveTricrypto.sol";

/**
 * @title CurveTricryptoChainlinkPriceFeed
 * @notice A custom price feed that calculates the price for Curve and Chainlink
 */
contract CurveTricryptoChainlinkPriceFeed is IPriceFeed {
    /** Custom errors **/
    error BadDecimals();
    error InvalidInt256();
    error CoinNotFound();

    /// @notice Version of the price feed
    uint public constant VERSION = 1;

    /// @notice Description of the price feed
    string public override description;

    /// @notice Number of decimals for returned prices
    uint8 public immutable override decimals;

    /// @notice Curve price feed
    address public immutable priceFeedCurve;

    /// @notice Curve underlying
    address public immutable curveUnderlying;

    /// @notice Curve coin index
    uint public immutable curveCoinIndex;

    /// @notice Chainlink price feed
    address public immutable priceFeedChainlink;

    /// @notice Combined scale of the two underlying Chainlink price feeds
    int public immutable combinedScale;

    /// @notice Scale of this price feed
    int public immutable priceFeedScale;

    /**
     * @notice Construct a new multiplicative price feed
     * @param priceFeedCurve_ The address of the first price feed to fetch prices from Curve
     * @param priceFeedChainlink_ The address of the second price feed to fetch prices from Chainlink
     * @param decimals_ The number of decimals for the returned prices
     * @param description_ The description of the price feed
     **/
    constructor(
        address priceFeedCurve_,
        address curveUnderlying_,
        address priceFeedChainlink_,
        uint8 decimals_,
        string memory description_
    ) {
        priceFeedCurve = priceFeedCurve_;
        curveUnderlying = curveUnderlying_;
        curveCoinIndex = getCoinIndex(curveUnderlying_) - 1;
        priceFeedChainlink = priceFeedChainlink_;
        uint8 priceFeedCurveDecimals = 18;
        uint8 priceFeedChainlinkDecimals = AggregatorV3Interface(
            priceFeedChainlink_
        ).decimals();
        combinedScale = signed256(
            10 ** (priceFeedCurveDecimals + priceFeedChainlinkDecimals)
        );

        if (decimals_ > 18) revert BadDecimals();
        decimals = decimals_;
        description = description_;
        priceFeedScale = int256(10 ** decimals);
    }

    /**
     * @notice Get the coin index for a given token address
     * @param token The token address to find the index for
     * @return The index of the token in the coins array
     */
    function getCoinIndex(address token) public view returns (uint256) {
        ICurveTricrypto curve = ICurveTricrypto(priceFeedCurve);

        for (uint i; i < 3; i++) {
            try curve.coins(i) returns (address coin) {
                if (coin == token) {
                    return i;
                }
            } catch {
                // If coins(i) reverts, we've reached the end of the array
                break;
            }
        }

        revert CoinNotFound();
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
        int256 priceCurve = signed256(
            ICurveTricrypto(priceFeedCurve).price_oracle(curveCoinIndex)
        );
        (
            uint80 roundId_,
            int256 priceChainlink,
            uint256 startedAt_,
            uint256 updatedAt_,
            uint80 answeredInRound_
        ) = AggregatorV3Interface(priceFeedChainlink).latestRoundData();

        if (priceChainlink <= 0)
            return (roundId_, 0, startedAt_, updatedAt_, answeredInRound_);

        int256 price = (priceCurve * priceChainlink * priceFeedScale) /
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
