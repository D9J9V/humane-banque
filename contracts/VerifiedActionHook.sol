// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// --- Interfaces ---
import { IPoolManager } from "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";
import { PoolKey } from "@uniswap/v4-core/contracts/libraries/PoolKey.sol";
import { Hooks } from "@uniswap/v4-core/contracts/libraries/Hooks.sol";
import { BaseHook } from "./BaseHook.sol"; // Assuming BaseHook is in the same directory or adjust path

// Placeholder for World ID Interface
interface IWorldID {
     function verifyProof(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external view; // Or similar signature
}

// OpenZeppelin Interfaces/Contracts
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
// import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


/**
 * @title VerifiedActionHook
 * @notice A simplified Uniswap V4 Hook demonstrating World ID verification
 * and nullifier-based blacklisting for a custom action.
 * @dev Step 1 Implementation: Focuses only on the gating mechanism.
 */
contract VerifiedActionHook is BaseHook, Ownable {
    // using SafeERC20 for IERC20;

    // --- State Variables ---

    IWorldID public immutable worldIdRouter;
    address public immutable quoteToken; // Example token for the verified action

    // Blacklist mapping: nullifier hash => blacklisted status
    mapping(uint256 => bool) public isNullifierBlacklisted;

    // Simple state to modify in the verified action (example)
    mapping(address => uint256) public userVerifiedDeposits;

    // PoolKey stored for context, though not used in this simplified step
    PoolKey public poolKey;

    // --- Events ---
    event PoolKeySet(PoolKey key);
    event UserBlacklisted(uint256 indexed nullifierHash);
    event UserUnblacklisted(uint256 indexed nullifierHash); // If allowing reversal
    event VerifiedDepositMade(address indexed user, uint256 indexed nullifierHash, uint256 amount);

    // --- Constructor ---

    constructor(
        IPoolManager _poolManager,
        IWorldID _worldIdRouter,
        address _quoteToken,
        address _initialOwner
    ) BaseHook(_poolManager) Ownable(_initialOwner) {
        require(_quoteToken != address(0), "Quote token cannot be zero address");
        worldIdRouter = _worldIdRouter;
        quoteToken = _quoteToken;
    }

    // --- Uniswap V4 Hook Overrides ---

    function getHookPermissions() public pure virtual override returns (Hooks.Permissions memory) {
        // Minimal permissions needed for this example
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true, // Store PoolKey for context
            beforeModifyPosition: false,
            afterModifyPosition: false,
            beforeSwap: false,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false
        });
    }

    function afterInitialize(PoolKey calldata key, uint160, int24, bytes calldata) external virtual override returns (bytes4) {
       // require(msg.sender == address(poolManager()), "Only PoolManager"); // May be handled by BaseHook
       require(key.hooks == address(this), "Invalid hook address in key");
       require(poolKey.hooks == address(0), "PoolKey already set");

       // Optional: Validate quoteToken presence if needed
       // require(key.currency0 == quoteToken || key.currency1 == quoteToken, "Pool mismatch");

       poolKey = key;
       emit PoolKeySet(key);
       
       return this.afterInitialize.selector;
    }

    // --- Internal Verification Logic ---

    /**
     * @dev Verifies World ID proof against the router and checks the blacklist. Reverts on failure.
     * @param signal The signal used for the proof (e.g., user address).
     * @param root The Merkle root.
     * @param nullifierHash The unique nullifier hash from the proof.
     * @param proof The ZK proof data.
     * @return The verified nullifier hash.
     */
    function _verifyProofAndCheckBlacklist(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) internal view returns (uint256) {
        // 1. Check blacklist first
        require(!isNullifierBlacklisted[nullifierHash], "VerifiedActionHook: User is blacklisted");

        // 2. Verify World ID proof
        // Wrap in try/catch if the interface might revert unexpectedly, or handle errors if it returns status codes.
        try worldIdRouter.verifyProof(signal, root, nullifierHash, proof) {
             // Proof is valid (no revert)
        } catch {
             revert("VerifiedActionHook: Invalid World ID proof");
        }

        // Return nullifier hash if successful
        return nullifierHash;
    }

    // --- Custom External Function ---

    /**
     * @notice Example function allowing a user to deposit quoteToken, gated by World ID verification and blacklist check.
     * @param amount Amount of quoteToken to deposit.
     * @param signal User's address or unique signal for World ID proof.
     * @param root Merkle root for World ID proof.
     * @param nullifierHash World ID nullifier hash.
     * @param proof World ID ZK proof.
     */
    function registerVerifiedDeposit(
        uint256 amount,
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external /* Add nonReentrant if needed */ {
        require(amount > 0, "Deposit amount must be positive");

        // Step 1: Verify World ID and check blacklist (reverts if fails)
        uint256 verifiedNullifierHash = _verifyProofAndCheckBlacklist(
            signal, root, nullifierHash, proof
        );

        // Step 2: Perform the action (e.g., transfer funds and update state)
        // Use SafeERC20 ideally: SafeERC20.safeTransferFrom(IERC20(quoteToken), msg.sender, address(this), amount);
        bool success = IERC20(quoteToken).transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");

        userVerifiedDeposits[msg.sender] += amount;

        emit VerifiedDepositMade(msg.sender, verifiedNullifierHash, amount);
    }


    // --- Blacklist Management (Owner Controlled for now) ---

    /**
     * @notice Adds a nullifier hash to the blacklist. Only callable by the owner.
     * @dev In the full protocol, this would be triggered by default/liquidation logic.
     * @param _nullifierHash The nullifier hash to blacklist.
     */
    function ownerAddToBlacklist(uint256 _nullifierHash) external onlyOwner {
        require(_nullifierHash != 0, "Invalid nullifier"); // Basic check
        isNullifierBlacklisted[_nullifierHash] = true;
        emit UserBlacklisted(_nullifierHash);
    }

     /**
     * @notice Removes a nullifier hash from the blacklist. Only callable by the owner.
     * @dev Allows reversing a blacklist entry if needed (e.g., errors, redemption path).
     * @param _nullifierHash The nullifier hash to un-blacklist.
     */
    function ownerRemoveFromBlacklist(uint256 _nullifierHash) external onlyOwner {
         require(_nullifierHash != 0, "Invalid nullifier");
         isNullifierBlacklisted[_nullifierHash] = false;
         emit UserUnblacklisted(_nullifierHash);
     }
}
