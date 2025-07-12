// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

interface ICurveTricrypto {
    /// @notice Returns the token address at index i
    function coins(uint256 i) external view returns (address);

    /// @notice Returns the EMA oracle price of coin i w.r.t. coin 0
    /// @dev Scaled by 1e18
    function price_oracle(uint256 i) external view returns (uint256);
}
