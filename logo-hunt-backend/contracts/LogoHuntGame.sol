// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

// ============ External Imports ============
import {Router} from "@hyperlane-xyz/core/contracts/client/Router.sol";
import {StandardHookMetadata} from "@hyperlane-xyz/core/contracts/hooks/libs/StandardHookMetadata.sol";

/*
 * @title The Logo Hunt Game
 * @dev Cross-chain logo discovery game where players can find logos on one chain
 * and the discovery is synchronized across all participating chains.
 */
contract LogoHuntGame is Router {
    // A generous upper bound on the amount of gas to use in the handle
    // function when a message is processed. Used for paying for gas.
    uint256 public constant HANDLE_GAS_AMOUNT = 50_000;

    // Total number of logos found across all chains
    uint256 public logosFound;
    
    // Personal collection tracking - tracks how many logos each address has found
    mapping(address => uint256) public personalCollection;
    
    // Optional: Track total unique participants (addresses that have found at least one logo)
    uint256 public uniqueParticipants;
    
    // A counter of how many messages have been sent from this contract.
    uint256 public sent;
    // A counter of how many messages have been received by this contract.
    uint256 public received;

    // Keyed by domain, a counter of how many messages that have been sent
    // from this contract to the domain.
    mapping(uint32 => uint256) public sentTo;
    // Keyed by domain, a counter of how many messages that have been received
    // by this contract from the domain.
    mapping(uint32 => uint256) public receivedFrom;

    // ============ Events ============
    event LogoFound(
        address indexed finder,
        uint256 totalCount,
        uint256 personalCount,
        uint32 indexed origin,
        uint32 indexed destination
    );
    
    event LogoDiscoverySync(
        uint256 newTotalCount,
        uint32 indexed origin,
        uint32 indexed destination
    );
    
    event SentLogoDiscovery(
        uint32 indexed origin,
        uint32 indexed destination,
        address finder,
        uint256 totalCount,
        uint256 personalCount
    );
    
    event ReceivedLogoDiscovery(
        uint32 indexed origin,
        uint32 indexed destination,
        bytes32 sender,
        address finder,
        uint256 totalCount,
        uint256 personalCount
    );
    
    event HandleGasAmountSet(
        uint32 indexed destination,
        uint256 handleGasAmount
    );

    constructor(address _mailbox, address _hook) Router(_mailbox) {
        // Transfer ownership of the contract to deployer
        _transferOwnership(msg.sender);
        setHook(_hook);
    }

    // ============ External functions ============

    /**
     * @notice Allows a user to find a logo and sync the discovery across chains
     * @param _destinationDomain The destination domain to send the discovery to.
     * @param _userWallet The wallet address that will own the collected logo.
     */
    function findLogo(uint32 _destinationDomain, address _userWallet) external payable {
        // Increment personal collection for the user wallet
        personalCollection[_userWallet] += 1;
        
        // Track unique participants (only increment if this is their first logo)
        if (personalCollection[_userWallet] == 1) {
            uniqueParticipants += 1;
        }
        
        // Increment the local counter
        logosFound += 1;
        
        // Increment message counters
        sent += 1;
        sentTo[_destinationDomain] += 1;
        
        // Prepare the discovery data for cross-chain sync
        // Encode: finder address + total count + personal count
        bytes memory discoveryData = abi.encode(_userWallet, logosFound, personalCollection[_userWallet]);
        
        // Send the discovery to the destination chain
        _Router_dispatch(
            _destinationDomain,
            msg.value,
            discoveryData,
            "",
            address(hook)
        );
        
        emit LogoFound(
            _userWallet,
            logosFound,
            personalCollection[_userWallet],
            mailbox.localDomain(),
            _destinationDomain
        );
        
        emit SentLogoDiscovery(
            mailbox.localDomain(),
            _destinationDomain,
            _userWallet,
            logosFound,
            personalCollection[_userWallet]
        );
    }

    /**
     * @notice Fetches the amount of gas that will be used when a message is
     * dispatched to the given domain.
     */
    function quoteDispatch(
        uint32 _destinationDomain,
        bytes calldata _message
    ) external view returns (uint256) {
        return
            _Router_quoteDispatch(
                _destinationDomain,
                _message,
                "",
                address(hook)
            );
    }

    // ============ Internal functions ============
    /**
     * @notice Handles a message from a remote router.
     * @dev Only called for messages sent from a remote router, as enforced by Router.sol.
     * @param _origin The domain of the origin of the message.
     * @param _sender The sender of the message.
     * @param _message The message body.
     */
    function _handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) internal override {
        received += 1;
        receivedFrom[_origin] += 1;
        
        // Decode the discovery data
        (address finder, uint256 totalCount, uint256 personalCount) = abi.decode(_message, (address, uint256, uint256));
        
        // Update the local counter to match the total from the origin chain
        logosFound = totalCount;
        
        // Update personal collection (use max to handle out-of-order messages)
        if (personalCount > personalCollection[finder]) {
            personalCollection[finder] = personalCount;
        }
        
        // Update unique participants if this is a new participant
        if (personalCollection[finder] == 1) {
            uniqueParticipants += 1;
        }
        
        emit LogoDiscoverySync(
            totalCount,
            _origin,
            mailbox.localDomain()
        );
        
        emit ReceivedLogoDiscovery(
            _origin,
            mailbox.localDomain(),
            _sender,
            finder,
            totalCount,
            personalCount
        );
    }
} 