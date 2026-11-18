// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ISignatureTransfer} from "./upstream/permit2/src/interfaces/ISignatureTransfer.sol";

interface IBudgetToken {
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

/// @notice A single-task wallet for the lab's standard test ERC-20 and official Permit2.
contract BudgetSessionWallet {
    bytes32 private constant TOKEN_PERMISSIONS = keccak256("TokenPermissions(address token,uint256 amount)");
    bytes32 private constant TRANSFER_PERMIT = keccak256(
        "PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"
    );
    bytes32 private constant MAX_S = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    address public immutable administrator;
    address public immutable sessionSigner;
    address public immutable recipient;
    address public immutable relayer;
    IBudgetToken public immutable token;
    ISignatureTransfer public immutable permit2;
    uint256 public immutable limit;
    uint256 public immutable expiresAt;
    bool public immutable transferAllowed;
    bool public immutable permitAllowed;

    uint256 public spent;
    uint256 public directSpent;
    uint256 public nextNonce;

    struct Commitment {
        uint256 amount;
        uint256 nonce;
        uint256 deadline;
        bytes32 digest;
    }
    Commitment public pending;

    error SessionUnauthorized();
    error SessionExpired();
    error TransferDisabled();
    error PermitDisabled();
    error TaskBudgetExceeded();
    error InvalidAmount();
    error PermitAlreadyPending();
    error NoPendingPermit();
    error InvalidPermitDeadline();
    error InvalidPermitSignature();
    error TokenOperationFailed();

    event DirectPaid(uint256 amount);
    event PermitReserved(uint256 indexed nonce, uint256 amount, uint256 deadline, bytes32 digest);
    event PermitSettled(uint256 indexed nonce, uint256 amount);

    constructor(address asset, address permitContract, address signer, address payee, address submitter, uint256 budget, uint256 duration, bool allowTransfer, bool allowPermit) {
        administrator = msg.sender;
        token = IBudgetToken(asset);
        permit2 = ISignatureTransfer(permitContract);
        sessionSigner = signer;
        recipient = payee;
        relayer = submitter;
        limit = budget;
        expiresAt = block.timestamp + duration;
        transferAllowed = allowTransfer;
        permitAllowed = allowPermit;
        if (allowPermit && !IBudgetToken(asset).approve(permitContract, budget)) revert TokenOperationFailed();
    }

    modifier activeSession() {
        if (msg.sender != sessionSigner) revert SessionUnauthorized();
        if (block.timestamp >= expiresAt) revert SessionExpired();
        _;
    }

    function budgetState() external view returns (uint256, uint256, uint256) {
        return (spent, directSpent, pending.amount);
    }

    function pay(uint256 amount) external activeSession {
        if (!transferAllowed) revert TransferDisabled();
        _checkAmount(amount);
        spent += amount;
        directSpent += amount;
        if (!token.transfer(recipient, amount)) revert TokenOperationFailed();
        emit DirectPaid(amount);
    }

    function reservePermit(uint256 amount, uint256 deadline) external activeSession {
        if (!permitAllowed) revert PermitDisabled();
        if (pending.amount != 0) revert PermitAlreadyPending();
        if (deadline <= block.timestamp || deadline > expiresAt) revert InvalidPermitDeadline();
        _checkAmount(amount);
        uint256 nonce = nextNonce++;
        bytes32 permissions = keccak256(abi.encode(TOKEN_PERMISSIONS, address(token), amount));
        bytes32 message = keccak256(abi.encode(TRANSFER_PERMIT, permissions, address(this), nonce, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", permit2.DOMAIN_SEPARATOR(), message));
        pending = Commitment(amount, nonce, deadline, digest);
        emit PermitReserved(nonce, amount, deadline, digest);
    }

    // The fixed recipient and amount are applied here. The relay can only submit this action.
    function redeemPermit(bytes calldata signature) external {
        if (msg.sender != relayer) revert SessionUnauthorized();
        Commitment memory commitment = pending;
        if (commitment.amount == 0) revert NoPendingPermit();
        if (block.timestamp >= expiresAt || block.timestamp > commitment.deadline) revert SessionExpired();
        if (!_validSignature(commitment.digest, signature)) revert InvalidPermitSignature();
        permit2.permitTransferFrom(
            ISignatureTransfer.PermitTransferFrom(
                ISignatureTransfer.TokenPermissions(address(token), commitment.amount), commitment.nonce, commitment.deadline
            ),
            ISignatureTransfer.SignatureTransferDetails(recipient, commitment.amount),
            address(this),
            signature
        );
        delete pending;
        spent += commitment.amount;
        emit PermitSettled(commitment.nonce, commitment.amount);
    }

    function isValidSignature(bytes32 digest, bytes calldata signature) external view returns (bytes4) {
        return _validSignature(digest, signature) ? bytes4(0x1626ba7e) : bytes4(0xffffffff);
    }

    function _checkAmount(uint256 amount) private view {
        if (amount == 0) revert InvalidAmount();
        if (spent + pending.amount + amount > limit) revert TaskBudgetExceeded();
    }

    function _validSignature(bytes32 digest, bytes calldata signature) private view returns (bool) {
        if (pending.amount == 0 || digest != pending.digest || block.timestamp >= expiresAt || block.timestamp > pending.deadline) return false;
        if (signature.length != 65) return false;
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        return s <= MAX_S && (v == 27 || v == 28) && ecrecover(digest, v, r, s) == sessionSigner;
    }
}
