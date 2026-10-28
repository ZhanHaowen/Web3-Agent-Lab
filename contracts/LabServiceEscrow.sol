// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
/// @notice Local profile; no ERC-8183 compatibility claim.
contract LabServiceEscrow {
 enum Status { None, Created, Funded, Submitted, Completed, Rejected, Refunded, Cancelled }
 struct Job {address buyer; uint256 budget; uint64 deadline; bytes32 requestHash; bytes32 artifactHash; bytes32 evaluationHash; Status status;}
 address public immutable token; address public immutable provider; address public immutable evaluator; bytes32 public immutable sessionScope;
 mapping(bytes32=>Job) private jobs; uint256 private entered;
 event JobCreated(bytes32 indexed id,address indexed buyer,uint256 budget,uint64 deadline,bytes32 requestHash);
 event Funded(bytes32 indexed id,uint256 budget); event Submitted(bytes32 indexed id,bytes32 artifactHash);
 event Evaluated(bytes32 indexed id,bool accepted,bytes32 evaluationHash); event Refunded(bytes32 indexed id,address buyer,uint256 budget); event Cancelled(bytes32 indexed id);
 modifier guard(){require(entered==0,"REENTRANCY");entered=1;_;entered=0;}
 constructor(address t,address p,address e,bytes32 scope){require(t.code.length>0&&p!=address(0)&&e!=address(0)&&p!=e&&scope!=bytes32(0),"CONFIG");token=t;provider=p;evaluator=e;sessionScope=scope;}
 function jobIdFor(address buyer,bytes32 salt) public view returns(bytes32){return keccak256(abi.encode(block.chainid,address(this),sessionScope,buyer,salt));}
 function getJob(bytes32 id) external view returns(Job memory){return jobs[id];}
 function createJob(uint256 budget,uint64 deadline,bytes32 requestHash,bytes32 salt) external guard returns(bytes32 id){
  require(msg.sender!=provider&&msg.sender!=evaluator&&budget>0&&deadline>block.timestamp&&requestHash!=bytes32(0),"TERMS");id=jobIdFor(msg.sender,salt);require(jobs[id].status==Status.None,"EXISTS");
  jobs[id]=Job(msg.sender,budget,deadline,requestHash,0,0,Status.Created);emit JobCreated(id,msg.sender,budget,deadline,requestHash);
 }
 function fundJob(bytes32 id,uint256 expectedBudget) external guard {Job storage j=jobs[id];require(msg.sender==j.buyer&&j.status==Status.Created&&block.timestamp<j.deadline,"STATE_OR_ROLE");require(expectedBudget==j.budget,"EXPECTED_BUDGET");j.status=Status.Funded;
  transfer(abi.encodeWithSignature("transferFrom(address,address,uint256)",j.buyer,address(this),j.budget));emit Funded(id,j.budget);}
 function submit(bytes32 id,bytes32 artifactHash) external guard {Job storage j=jobs[id];require(msg.sender==provider&&j.status==Status.Funded&&block.timestamp<j.deadline&&artifactHash!=bytes32(0),"STATE_OR_ROLE");j.artifactHash=artifactHash;j.status=Status.Submitted;emit Submitted(id,artifactHash);}
 function evaluate(bytes32 id,bytes32 artifactHash,bool accepted,bytes32 evaluationHash) external guard {Job storage j=jobs[id];require(msg.sender==evaluator&&j.status==Status.Submitted&&block.timestamp<j.deadline,"STATE_OR_ROLE");require(j.artifactHash==artifactHash&&evaluationHash!=bytes32(0),"COMMITMENT");j.evaluationHash=evaluationHash;j.status=accepted?Status.Completed:Status.Rejected;
  transfer(abi.encodeWithSignature("transfer(address,uint256)",accepted?provider:j.buyer,j.budget));emit Evaluated(id,accepted,evaluationHash);if(!accepted)emit Refunded(id,j.buyer,j.budget);}
 function refund(bytes32 id) external guard {Job storage j=jobs[id];require((j.status==Status.Funded||j.status==Status.Submitted)&&block.timestamp>=j.deadline,"NOT_REFUNDABLE");j.status=Status.Refunded;transfer(abi.encodeWithSignature("transfer(address,uint256)",j.buyer,j.budget));emit Refunded(id,j.buyer,j.budget);}
 function cancel(bytes32 id) external guard {Job storage j=jobs[id];require(msg.sender==j.buyer&&j.status==Status.Created,"STATE_OR_ROLE");j.status=Status.Cancelled;emit Cancelled(id);}
 function transfer(bytes memory data) private {(bool ok,bytes memory r)=token.call(data);require(ok&&(r.length==0||abi.decode(r,(bool))),"TOKEN_TRANSFER");}
}
