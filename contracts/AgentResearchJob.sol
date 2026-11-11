// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// Minimal, non-upgradeable ERC-8183 research kernel. No hooks, fees or forwarder.
/// Uses test assets only; it is not the Virtuals production implementation.
contract AgentResearchJob is ReentrancyGuard {
    using SafeERC20 for IERC20;
    enum Status { Open, Funded, Submitted, Completed, Rejected, Expired }
    struct Job { address client; address provider; address evaluator; string description; uint256 budget; uint256 expiredAt; Status status; address hook; }
    IERC20 public immutable paymentToken;
    uint256 public jobCounter;
    mapping(uint256 => Job) public jobs;
    event JobCreated(uint256 indexed jobId,address indexed client,address indexed provider,address evaluator,uint256 expiredAt);
    event ProviderSet(uint256 indexed jobId,address indexed provider);
    event BudgetSet(uint256 indexed jobId,uint256 amount);
    event JobFunded(uint256 indexed jobId,address indexed client,uint256 amount);
    event JobSubmitted(uint256 indexed jobId,address indexed provider,bytes32 deliverable);
    event JobCompleted(uint256 indexed jobId,address indexed evaluator,bytes32 reason);
    event JobRejected(uint256 indexed jobId,address indexed rejector,bytes32 reason);
    event JobExpired(uint256 indexed jobId);
    event PaymentReleased(uint256 indexed jobId,address indexed provider,uint256 amount);
    event Refunded(uint256 indexed jobId,address indexed client,uint256 amount);
    error InvalidJob(); error WrongStatus(); error Unauthorized(); error InvalidAddress(); error InvalidExpiry(); error BudgetMismatch(); error ZeroBudget(); error UnsupportedHook();
    constructor(address token) { if(token==address(0))revert InvalidAddress();paymentToken=IERC20(token); }
    function getJob(uint256 id) external view returns(Job memory) { return _job(id); }
    function _job(uint256 id) internal view returns(Job storage j) { if(id==0||id>jobCounter)revert InvalidJob();j=jobs[id]; }
    function createJob(address provider,address evaluator,uint256 expiredAt,string calldata description,address hook) external returns(uint256 id) {
        if(evaluator==address(0))revert InvalidAddress();if(expiredAt<=block.timestamp)revert InvalidExpiry();if(hook!=address(0))revert UnsupportedHook();
        id=++jobCounter;jobs[id]=Job(msg.sender,provider,evaluator,description,0,expiredAt,Status.Open,address(0));emit JobCreated(id,msg.sender,provider,evaluator,expiredAt);
    }
    function setProvider(uint256 id,address provider) external {Job storage j=_job(id);if(j.status!=Status.Open)revert WrongStatus();if(msg.sender!=j.client)revert Unauthorized();if(provider==address(0)||j.provider!=address(0))revert InvalidAddress();j.provider=provider;emit ProviderSet(id,provider);}
    function setBudget(uint256 id,uint256 amount) external {Job storage j=_job(id);if(j.status!=Status.Open)revert WrongStatus();if(msg.sender!=j.client&&msg.sender!=j.provider)revert Unauthorized();j.budget=amount;emit BudgetSet(id,amount);}
    function fund(uint256 id,uint256 expectedBudget) external nonReentrant {Job storage j=_job(id);if(j.status!=Status.Open)revert WrongStatus();if(msg.sender!=j.client)revert Unauthorized();if(j.provider==address(0))revert InvalidAddress();if(j.budget==0)revert ZeroBudget();if(j.budget!=expectedBudget)revert BudgetMismatch();if(block.timestamp>=j.expiredAt)revert InvalidExpiry();j.status=Status.Funded;paymentToken.safeTransferFrom(j.client,address(this),j.budget);emit JobFunded(id,j.client,j.budget);}
    function submit(uint256 id,bytes32 deliverable) external {Job storage j=_job(id);if(j.status!=Status.Funded)revert WrongStatus();if(msg.sender!=j.provider)revert Unauthorized();if(block.timestamp>=j.expiredAt)revert InvalidExpiry();j.status=Status.Submitted;emit JobSubmitted(id,j.provider,deliverable);}
    function complete(uint256 id,bytes32 reason) external nonReentrant {Job storage j=_job(id);if(j.status!=Status.Submitted)revert WrongStatus();if(msg.sender!=j.evaluator)revert Unauthorized();if(block.timestamp>=j.expiredAt)revert InvalidExpiry();j.status=Status.Completed;paymentToken.safeTransfer(j.provider,j.budget);emit JobCompleted(id,msg.sender,reason);emit PaymentReleased(id,j.provider,j.budget);}
    function reject(uint256 id,bytes32 reason) external nonReentrant {Job storage j=_job(id);Status before=j.status;if(before!=Status.Open&&before!=Status.Funded&&before!=Status.Submitted)revert WrongStatus();if(msg.sender!=(before==Status.Open?j.client:j.evaluator))revert Unauthorized();j.status=Status.Rejected;if(before!=Status.Open){paymentToken.safeTransfer(j.client,j.budget);emit Refunded(id,j.client,j.budget);}emit JobRejected(id,msg.sender,reason);}
    function claimRefund(uint256 id) external nonReentrant {Job storage j=_job(id);if(j.status!=Status.Funded&&j.status!=Status.Submitted)revert WrongStatus();if(block.timestamp<j.expiredAt)revert InvalidExpiry();j.status=Status.Expired;paymentToken.safeTransfer(j.client,j.budget);emit JobExpired(id);emit Refunded(id,j.client,j.budget);}
}
