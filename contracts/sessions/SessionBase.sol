// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "../../stackup/account-abstraction/contracts/interfaces/UserOperation.sol";

abstract contract SessionBase {
    using ECDSA for bytes32;
    mapping(address => bool) sessionAllowList;

    uint8 constant UINT = 0;
    uint8 constant STRING = 1;
    uint8 constant ADDRESS = 2;
    uint8 constant BYTES = 3;

    struct Argument {
        uint8 argType;
        bytes paramLowerBound;
        bytes paramUpperBound;
    }

    struct FunctionCall {
        address targetContract;
        address sessionKey;
        bytes4 functionSelector;
        uint48 validFrom;
        uint48 validUntil;
        Argument[] arguments;
    }

    function decodeSessionData(
        bytes memory data
    ) internal pure returns (FunctionCall memory result) {
        bytes[] memory encodedArguments;
        (
            result.targetContract,
            result.sessionKey,
            result.functionSelector,
            result.validFrom,
            result.validUntil,
            encodedArguments
        ) = abi.decode(
            data,
            (address, address, bytes4, uint48, uint48, bytes[])
        );
        result.arguments = new Argument[](encodedArguments.length);
        for (uint i = 0; i < encodedArguments.length; i++) {
            Argument memory arg;
            (arg.argType, arg.paramLowerBound, arg.paramUpperBound) = abi
                .decode(encodedArguments[i], (uint8, bytes, bytes));
            result.arguments[i] = arg;
        }
    }

    function isSessionValid(address session) internal view {
        require(sessionAllowList[session]);
    }

    function getCallData(
        FunctionCall memory functionCall,
        bytes[] memory params
    ) internal pure returns (bytes memory cd) {
        cd = new bytes(4 + functionCall.arguments.length * 32);
        for (uint i; i < 4; i++) {
            cd[i] = functionCall.functionSelector[i];
        }
        uint256 fcArgLength = functionCall.arguments.length;
        for (uint i; i < fcArgLength; i++) {
            bytes memory arg = params[i];
            uint start = 4 + i * 32;
            uint256 argLength = arg.length;
            for (uint j; j < 32; j++) {
                if (j < argLength) {
                    cd[start + j] = arg[j];
                } else {
                    cd[start + j] = 0;
                }
            }
        }
    }

    function encodeSessionData(
        FunctionCall calldata call
    ) external pure returns (bytes memory) {
        bytes[] memory encodedArguments = new bytes[](call.arguments.length);

        for (uint i = 0; i < call.arguments.length; i++) {
            Argument memory arg = call.arguments[i];
            encodedArguments[i] = abi.encode(
                arg.argType,
                bytes(arg.paramLowerBound),
                bytes(arg.paramUpperBound)
            );
        }

        return (
            abi.encode(
                call.targetContract,
                call.sessionKey,
                call.functionSelector,
                call.validUntil,
                call.validFrom,
                encodedArguments
            )
        );
    }

    function validateSessionData(
        FunctionCall memory fc,
        bytes[] memory params
    ) internal pure returns (uint validationData) {
        uint argLength = fc.arguments.length;
        for (uint i; i < argLength; i++) {
            if (
                fc.arguments[i].argType == ADDRESS ||
                fc.arguments[i].argType == BYTES ||
                fc.arguments[i].argType == STRING
            ) {
                bytes32 hash = keccak256(params[i]);
                if (
                    hash != keccak256(fc.arguments[i].paramUpperBound) ||
                    hash != keccak256(fc.arguments[i].paramLowerBound)
                ) {
                    validationData = 1;
                }
            } else if (fc.arguments[i].argType == UINT) {
                uint256 val = abi.decode(params[i], (uint256));
                if (
                    val >
                    abi.decode(fc.arguments[i].paramUpperBound, (uint256)) ||
                    val < abi.decode(fc.arguments[i].paramLowerBound, (uint256))
                ) {
                    validationData = 1;
                }
            }
        }
    }

    function validateSessionUserOp(
        UserOperation calldata userOp,
        address owner
    ) internal pure returns (uint256 validationData) {
        (
            bytes memory ownerSig,
            bytes memory sessionSig,
            bytes memory data,
            bytes[] memory params
        ) = abi.decode(userOp.signature, (bytes, bytes, bytes, bytes[]));
        require(
            owner == keccak256(data).toEthSignedMessageHash().recover(ownerSig)
        );

        FunctionCall memory fc = decodeSessionData(data);
        bytes memory packedData = abi.encodePacked(data);
        bytes memory dataAndParams = packedData;

        for (uint i; i < params.length; i++) {
            // bytes memory packedParam = abi.encodePacked(params[i]);
            dataAndParams = abi.encodePacked(dataAndParams, params[i]);
        }

        require(
            fc.sessionKey ==
                keccak256(dataAndParams).toEthSignedMessageHash().recover(
                    sessionSig
                ),
            "Invalid Session Signature"
        );
        bytes4 selector = bytes4(
            keccak256(bytes("execute(address,uint256,bytes)"))
        );
        require(
            keccak256(userOp.callData) ==
                keccak256(
                    abi.encodeWithSelector(
                        selector,
                        fc.targetContract,
                        0,
                        getCallData(fc, params)
                    )
                ),
            "Invalid Calldata Requested"
        );
        validationData = validateSessionData(fc, params);
    }

    function getFunctionData(
        bytes calldata sig,
        address owner
    ) external pure returns (FunctionCall memory fc) {
        (bytes memory ownerSig, , bytes memory data, ) = abi.decode(
            sig,
            (bytes, bytes, bytes, bytes[])
        );
        require(
            owner == keccak256(data).toEthSignedMessageHash().recover(ownerSig)
        );

        fc = decodeSessionData(data);
    }
}
