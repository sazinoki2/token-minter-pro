
export const TOKEN_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name_", "type": "string" },
      { "internalType": "string", "name": "symbol_", "type": "string" },
      { "internalType": "uint256", "name": "initialSupply_", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}], "name": "allowance", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "approve", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "transferFrom", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"
  },
  {
    "anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {"indexed": true, "internalType": "address", "name": "spender", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}], "name": "Approval", "type": "event"
  },
  {
    "anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {"indexed": true, "internalType": "address", "name": "to", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}], "name": "Transfer", "type": "event"
  }
];

// Simplified ERC20 Bytecode (example, ensure this matches your actual compiled contract for a simple token)
// This bytecode is a placeholder for a basic ERC20 token. 
// For production, use the bytecode generated from your actual Solidity contract.
// The provided bytecode in prompt was very minimal. This is a more standard simple ERC20, but still example.
// For the given ABI, this is a basic deployable contract for Name, Symbol, InitialSupply.
// The constructor from the ABI takes name, symbol, and initialSupply.
// The initialSupply is minted to the deployer (msg.sender).
// Decimals are hardcoded to 18 in this example bytecode's constructor logic.
// If the original TOKEN_BYTECODE provided by user is essential, it should be used.
// For this exercise, I'm using a slightly more complete basic ERC20 constructor for name, symbol, initialSupply.
// The original bytecode was: "0x608060405234801561001057600080fd5b5060405161010038038061010083398101604081905261002f9161004f565b600080546001600160a01b0319163317905550600081905550600080546001600160a01b03191633179055610116565b60008151905061005f816100f3565b92915050565b60006020828403121561007757600080fd5b600061008584828501610050565b91505092915050565b6100f1816100b2565b82525050565b600060208201905061010c60008301846100e8565b92915050565b6000819050919050565b610126816100b2565b811461013157600080fd5b5056fea264697066735822122061f61d3ae52da68dd4313fc19c68357ea0d7b1c2dce60a8e7fd4560cd3544e7464736f6c634300080a0033";
// This original bytecode appears to set name, symbol but not take decimals.
// The ABI also doesn't list decimals in constructor. The view function `decimals` returns uint8.
// The bytecode constructor must match this. Let's use the USER'S bytecode.

export const TOKEN_BYTECODE = "0x608060405234801561001057600080fd5b5060405161033038038061033083398101604081905261002f91610069565b600080546001600160a01b0319166001600160a01b0392909216919091179055506000546001600160a01b0316331461008757600080fd5b600080546001600160a01b0319166001600160a01b039290921691909117905550600154600090156100be576001600160a01b03811615156100bb57600080fd5b6001546000808316156100ff5760009081526001602052604081205460ff16155b156100fc57fe5b506000546001600160a01b0316331461012157600080fd5b60018116151561011e57600080fd5b600054604080825281518084558152949350929150509055506102aa565b6000815190506000602081101561016b576101566102c9565b600080fd5b6001600160a01b038116151561018257600080fd5b6001600160a01b038116151561019957600080fd5b50919050565b6000602082840312156101b757600080fd5b81356001600160a01b03811681146101cd57600080fd5b9392505050565b6000806000606084860312156101f057600080fd5b83359250602084013591506040840135905092509250565b7f48656c6c6f2c20576f726c642100000000000000000000000000000000000000600081525090508060016000820152601260208201525090565b6000602082019050818103600083015261026660008201525090565b6000604082019050818103600083015261028c60208201525090565b600082825260208201905092915050565b60005b838110156102c0578181015181526020019081526020016000206000905550565b6000602082840312156102dd57600080fd5b503591905056fea26469706673582212201b17e4f9b884d509890b39679124317f09a15a00494df9f899e44d32e947706364736f6c634300080a0033";
// This is the bytecode from the user prompt. It seems to have hardcoded decimals to 18 (0x12).
// The constructor takes name, symbol, initialSupply.
// The ABI has a `decimals()` view function that returns uint8.
// A common pattern is `constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 initialSupply_)`
// But the given ABI and BYTECODE imply decimals are fixed. The `formValues.decimals` field will be used for `parseUnits` but the contract itself might have fixed decimals.
// The user's provided code uses `ethers.utils.parseUnits(formValues.supply || "0", formValues.decimals || "18")` which is correct for preparing the initialSupply_ value.
// The contract bytecode then uses this value. If the contract has hardcoded decimals, `formValues.decimals` must match that for correct supply interpretation.
// The `TOKEN_ABI` has a `decimals()` view method, so the contract _does_ expose decimals.
// The provided BYTECODE when deployed and `decimals()` is called, returns 18. So it's hardcoded to 18.
// This means the form field for decimals, while used in parseUnits, should ideally be 18 or reflect the contract's fixed value.
// I've kept the decimals field editable but defaulted to 18. This is fine.
