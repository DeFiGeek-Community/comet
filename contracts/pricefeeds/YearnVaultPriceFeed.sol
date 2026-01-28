// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "../vendor/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../IPriceFeed.sol";

interface IVault {
    function pricePerShare() external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @title YearnVaultPriceFeed
 * @notice A price feed that multiplies a Yearn vault's pricePerShare with a Chainlink oracle price
 */
contract YearnVaultPriceFeed is IPriceFeed {
    error BadDecimals();
    error InvalidInt256();

    /// @notice Version of the price feed
    uint public constant VERSION = 1;

    /// @notice Description of the price feed
    string public override description;

    /// @notice Number of decimals for returned prices
    uint8 public immutable override decimals;

    /// @notice Chainlink price feed
    address public immutable priceFeedChainlink;

    /// @notice The Yearn vault
    address public immutable vault;

    /// @notice Combined scale of the two underlying Chainlink price feeds
    int public immutable combinedScale;

    /// @notice Scale of this price feed
    int public immutable priceFeedScale;

    /**
     * @notice Constructor
     * @param priceFeedChainlink_ Address of the Chainlink price feed
     * @param vault_ Address of the Yearn vault
     * @param decimals_ Number of decimals for the returned prices
     * @param description_ Description of the price feed
     */
    constructor(
        address priceFeedChainlink_,
        address vault_,
        uint8 decimals_,
        string memory description_
    ) {
        priceFeedChainlink = priceFeedChainlink_;
        vault = vault_;
        uint8 chainlinkDecimals = AggregatorV3Interface(priceFeedChainlink_)
            .decimals();
        uint8 vaultDecimals = IVault(vault_).decimals();
        combinedScale = signed256(10 ** (chainlinkDecimals + vaultDecimals));

        if (decimals_ > 18) revert BadDecimals();
        decimals = decimals_;
        description = description_;
        priceFeedScale = int256(10 ** decimals);
    }

    /**
     * @notice Get the latest price data
     * @return roundId The round ID from Chainlink
     * @return answer The calculated price (pricePerShare * chainlinkPrice)
     * @return startedAt When the round started
     * @return updatedAt When the round was last updated
     * @return answeredInRound The round in which the answer was computed
     */
    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        // Get Chainlink price data
        (
            uint80 roundId_,
            int256 chainlinkPrice,
            uint256 startedAt_,
            uint256 updatedAt_,
            uint80 answeredInRound_
        ) = AggregatorV3Interface(priceFeedChainlink).latestRoundData();

        // Get vault's price per share
        uint256 pricePerShare = IVault(vault).pricePerShare();

        // Return zero if either price is invalid
        if (chainlinkPrice <= 0 || pricePerShare == 0) {
            return (roundId_, 0, startedAt_, updatedAt_, answeredInRound_);
        }

        // Calculate combined price
        int256 price = (chainlinkPrice *
            signed256(pricePerShare) *
            priceFeedScale) / combinedScale;

        return (roundId_, price, startedAt_, updatedAt_, answeredInRound_);
    }

    /**
     * @notice Convert uint256 to int256, reverting on overflow
     */
    function signed256(uint256 n) internal pure returns (int256) {
        if (n > uint256(type(int256).max)) revert InvalidInt256();
        return int256(n);
    }

    /**
     * @notice Get the price feed version
     */
    function version() external pure returns (uint256) {
        return VERSION;
    }
}
