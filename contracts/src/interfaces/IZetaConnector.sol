// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IZetaConnector
 * @notice ZetaChain 跨链接口
 */
interface IZetaConnector {
    struct ZetaMessage {
        bytes zetaTxSenderAddress;
        uint256 sourceChainId;
        address destinationAddress;
        uint256 zetaValue;
        bytes message;
    }

    struct ZetaRevert {
        bytes zetaTxSenderAddress;
        uint256 sourceChainId;
        address destinationAddress;
        uint256 destinationChainId;
        uint256 remainingZetaValue;
        bytes message;
    }

    /**
     * @notice 发送跨链消息
     * @param destinationChainId 目标链 ID
     * @param destinationAddress 目标合约地址
     * @param destinationGasLimit Gas 限制
     * @param message 消息内容
     * @param zetaParams 额外参数
     */
    function send(
        uint256 destinationChainId,
        bytes memory destinationAddress,
        uint256 destinationGasLimit,
        bytes memory message,
        bytes memory zetaParams
    ) external payable;

    /**
     * @notice 接收跨链消息的回调
     * @param zetaMessage ZetaChain 消息
     */
    function onZetaMessage(ZetaMessage calldata zetaMessage) external;

    /**
     * @notice 跨链失败的回调
     * @param zetaRevert 回滚信息
     */
    function onZetaRevert(ZetaRevert calldata zetaRevert) external;
}
