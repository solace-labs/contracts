// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "../stackup/account-abstraction/contracts/samples/SimpleAccount.sol";
import "../stackup/account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./sessions/SessionBase.sol";

contract SolaceAccount is
    SessionBase,
    BaseAccount,
    TokenCallbackHandler,
    UUPSUpgradeable,
    Initializable
{
    using ECDSA for bytes32;
    error InvalidSignatureLength();
    address public owner;
    IEntryPoint private immutable _entryPoint;
    event SolaceAccountInitialized(
        IEntryPoint indexed entryPoint,
        address indexed owner
    );

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyOwner() internal view {
        //directly from EOA owner, or through the account itself (which gets redirected through execute())
        require(
            msg.sender == owner || msg.sender == address(this),
            "only owner"
        );
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
        _disableInitializers();
    }

    function getFunctionData(
        bytes calldata sig
    ) external view returns (FunctionCall memory fc) {
        (bytes memory ownerSig, , bytes memory data, ) = abi.decode(
            sig,
            (bytes, bytes, bytes, bytes[])
        );
        require(
            owner == keccak256(data).toEthSignedMessageHash().recover(ownerSig)
        );

        fc = decodeSessionData(data);
    }

    function _validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal returns (uint256 validationData) {
        validationData = _validateSignature(userOp, userOpHash);
    }

    function validateSessionUserOp(
        UserOperation calldata userOp
    ) internal view returns (uint256 validationData) {
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

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external virtual override returns (uint256 validationData) {
        _requireFromEntryPoint();
        if (userOp.signature.length == 65) {
            validationData = _validateUserOp(userOp, userOpHash);
        } else if (userOp.signature.length > 97) {
            validationData = validateSessionUserOp(userOp);
        } else {
            revert InvalidSignatureLength();
        }
        _validateNonce(userOp.nonce);
        _payPrefund(missingAccountFunds);
    }

    /**
     * execute a transaction (called directly from owner, or by entryPoint)
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        _requireFromEntryPointOrOwner();
        _call(dest, value, func);
    }

    /**
     * execute a sequence of transactions
     */
    function executeBatch(
        address[] calldata dest,
        bytes[] calldata func
    ) external {
        _requireFromEntryPointOrOwner();
        require(dest.length == func.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], 0, func[i]);
        }
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
     * a new implementation of SimpleAccount must be deployed with the new EntryPoint address, then upgrading
     * the implementation by calling `upgradeTo()`
     */
    function initialize(address anOwner) public virtual initializer {
        _initialize(anOwner);
    }

    function _initialize(address anOwner) internal virtual {
        owner = anOwner;
        emit SolaceAccountInitialized(_entryPoint, owner);
    }

    // Require the function call went through EntryPoint or owner
    function _requireFromEntryPointOrOwner() internal view {
        require(
            msg.sender == address(entryPoint()) || msg.sender == owner,
            "account: not Owner or EntryPoint"
        );
    }

    /// implement template method of BaseAccount
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        if (owner != hash.recover(userOp.signature))
            return SIG_VALIDATION_FAILED;
        return 0;
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    /**
     * withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     */
    function withdrawDepositTo(
        address payable withdrawAddress,
        uint256 amount
    ) public onlyOwner {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal view override {
        (newImplementation);
        _onlyOwner();
    }
}
