// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Minimal ordinary ERC20 for repeatable experiments. No tax or rebase behavior.
contract LabToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    address public immutable owner;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    constructor(string memory n, string memory s) { name = n; symbol = s; owner = msg.sender; }
    function mint(address to, uint256 value) external {
        require(msg.sender == owner, "owner only");
        totalSupply += value; balanceOf[to] += value; emit Transfer(address(0), to, value);
    }
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value; emit Approval(msg.sender, spender, value); return true;
    }
    function transfer(address to, uint256 value) external returns (bool) { _transfer(msg.sender, to, value); return true; }
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender]; require(allowed >= value, "allowance");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - value;
        _transfer(from, to, value); return true;
    }
    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "zero recipient"); require(balanceOf[from] >= value, "balance");
        balanceOf[from] -= value; balanceOf[to] += value; emit Transfer(from, to, value);
    }
}

/// A -> B constant-product fixture, 0.30% fee, integers rounded down.
/// This deliberately small protocol is an experiment fixture, not a production DEX.
contract LabAMM {
    LabToken public immutable tokenA;
    LabToken public immutable tokenB;
    event Swap(address indexed sender, address indexed recipient, uint256 amountIn, uint256 amountOut);
    constructor(address a, address b) { tokenA = LabToken(a); tokenB = LabToken(b); }
    function quote(uint256 amountIn) public view returns (uint256) {
        uint256 withFee = amountIn * 997;
        return withFee * tokenB.balanceOf(address(this)) / (tokenA.balanceOf(address(this)) * 1000 + withFee);
    }
    function swap(uint256 amountIn, uint256 minAmountOut, address recipient) external returns (uint256 amountOut) {
        require(amountIn > 0, "zero input"); amountOut = quote(amountIn);
        require(amountOut > 0 && amountOut >= minAmountOut, "slippage");
        require(tokenA.transferFrom(msg.sender, address(this), amountIn), "input transfer");
        require(tokenB.transfer(recipient, amountOut), "output transfer");
        emit Swap(msg.sender, recipient, amountIn, amountOut);
    }
}

/// One asset unit mints one share; no yield. Models a deposit protocol only.
contract LabVault {
    LabToken public immutable asset;
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;
    event Deposit(address indexed sender, address indexed receiver, uint256 assets, uint256 shares);
    constructor(address b) { asset = LabToken(b); }
    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        require(assets > 0, "zero deposit"); require(asset.transferFrom(msg.sender, address(this), assets), "transfer");
        shares = assets; balanceOf[receiver] += shares; totalSupply += shares;
        emit Deposit(msg.sender, receiver, assets, shares);
    }
    function totalAssets() external view returns (uint256) { return asset.balanceOf(address(this)); }
}
