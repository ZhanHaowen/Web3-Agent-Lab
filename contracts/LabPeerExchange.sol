// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Local laboratory fixture. Accepts only the two immutable no-tax LabTokens.
/// No fees, partial fills, upgrade authority, or administrator withdrawals.
contract LabPeerExchange {
    enum State { None, Open, Filled, Cancelled, Expired }
    struct Order {
        address maker; address taker; address sellToken; uint256 sellAmount;
        address buyToken; uint256 buyAmount; uint256 deadline;
        bytes32 salt; bytes32 termsHash; State state;
    }
    bytes32 public immutable sessionScope;
    address public immutable tokenA;
    address public immutable tokenB;
    mapping(bytes32 => Order) private orders;
    mapping(address => uint256) public outstanding;
    uint256 private entered = 1;
    event OrderCreated(bytes32 indexed orderId, address indexed maker, address indexed taker, bytes32 termsHash);
    event OrderFilled(bytes32 indexed orderId, address indexed maker, address indexed taker);
    event OrderCancelled(bytes32 indexed orderId, address indexed maker);
    event OrderExpired(bytes32 indexed orderId, address indexed maker);
    modifier nonReentrant() { require(entered == 1, "REENTRANCY"); entered = 2; _; entered = 1; }
    constructor(address a, address b, bytes32 scope) {
        require(a != address(0) && b != address(0) && a != b && scope != bytes32(0), "CONFIG");
        tokenA = a; tokenB = b; sessionScope = scope;
    }
    function orderIdFor(address maker, bytes32 salt) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), sessionScope, maker, salt));
    }
    function hashTerms(address maker, address taker, address sellToken, uint256 sellAmount,
        address buyToken, uint256 buyAmount, uint256 deadline, bytes32 salt) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), sessionScope, maker, taker,
            sellToken, sellAmount, buyToken, buyAmount, deadline, salt));
    }
    function getOrder(bytes32 id) external view returns (Order memory) { return orders[id]; }
    function createOrder(address taker, address sellToken, uint256 sellAmount, address buyToken,
        uint256 buyAmount, uint256 deadline, bytes32 salt, bytes32 termsHash) external nonReentrant returns (bytes32 id) {
        require(taker != address(0) && taker != msg.sender, "TAKER");
        require((sellToken == tokenA || sellToken == tokenB) &&
            (buyToken == tokenA || buyToken == tokenB) && sellToken != buyToken, "ASSET");
        require(sellAmount > 0 && buyAmount > 0 && deadline > block.timestamp, "TERMS");
        require(termsHash == hashTerms(msg.sender, taker, sellToken, sellAmount, buyToken, buyAmount, deadline, salt), "HASH");
        id = orderIdFor(msg.sender, salt);
        require(orders[id].state == State.None, "SALT_USED");
        orders[id] = Order(msg.sender, taker, sellToken, sellAmount, buyToken, buyAmount, deadline, salt, termsHash, State.Open);
        outstanding[sellToken] += sellAmount;
        uint256 beforeBalance = balance(sellToken, address(this));
        safeCall(sellToken, abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), sellAmount));
        require(balance(sellToken, address(this)) == beforeBalance + sellAmount, "NON_STANDARD_TOKEN");
        emit OrderCreated(id, msg.sender, taker, termsHash);
    }
    function fillOrder(bytes32 id) external nonReentrant {
        Order storage o = orders[id];
        require(o.state == State.Open && block.timestamp < o.deadline, "NOT_OPEN");
        require(msg.sender == o.taker, "ONLY_TAKER");
        o.state = State.Filled; outstanding[o.sellToken] -= o.sellAmount;
        safeCall(o.buyToken, abi.encodeWithSignature("transferFrom(address,address,uint256)", o.taker, o.maker, o.buyAmount));
        safeCall(o.sellToken, abi.encodeWithSignature("transfer(address,uint256)", o.taker, o.sellAmount));
        emit OrderFilled(id, o.maker, o.taker);
    }
    function cancelOrder(bytes32 id) external nonReentrant {
        Order storage o = orders[id];
        require(o.state == State.Open && block.timestamp < o.deadline && msg.sender == o.maker, "CANCEL");
        o.state = State.Cancelled; outstanding[o.sellToken] -= o.sellAmount;
        safeCall(o.sellToken, abi.encodeWithSignature("transfer(address,uint256)", o.maker, o.sellAmount));
        emit OrderCancelled(id, o.maker);
    }
    function expireOrder(bytes32 id) external nonReentrant {
        Order storage o = orders[id];
        require(o.state == State.Open && block.timestamp >= o.deadline, "NOT_EXPIRED");
        o.state = State.Expired; outstanding[o.sellToken] -= o.sellAmount;
        safeCall(o.sellToken, abi.encodeWithSignature("transfer(address,uint256)", o.maker, o.sellAmount));
        emit OrderExpired(id, o.maker);
    }
    function balance(address token, address account) private view returns (uint256 value) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSignature("balanceOf(address)", account));
        require(ok && data.length == 32, "BALANCE"); value = abi.decode(data, (uint256));
    }
    // Optional-return ERC20 transfer check, restricted to immutable LabToken addresses.
    // Locally implemented; this is not a vendored or certified OpenZeppelin build.
    function safeCall(address token, bytes memory data) private {
        require(token.code.length > 0, "NO_CODE");
        (bool ok, bytes memory result) = token.call(data);
        require(ok && (result.length == 0 || (result.length == 32 && abi.decode(result, (bool)))), "TOKEN_TRANSFER");
    }
}
