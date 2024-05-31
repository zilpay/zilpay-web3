# ZilPay Web3.js

ZilPay Web3.js is a JavaScript library that provides a convenient way to interact with the Zilliqa blockchain and the ZilPay wallet extension. It allows developers to easily integrate Zilliqa functionality into their web applications.

## Installation

To use ZilPay Web3.js in your project, you can include it via a script tag or install it using npm.

### Script Tag

Include the following script tag in your HTML file:

```html
<script src="path/to/zilpay-web3.js"></script>
```

### npm

Install the package using npm:

```bash
npm install zilpay-web3
```

Then, you can import the library in your JavaScript file:

```javascript
import { initZilPayWeb3, zilPay } from 'zilpay-web3';
```

## Initialization

This will inject into global onject the `windows.zilPay`.
To initialize ZilPay Web3.js, call the `initZilPayWeb3()` function:

```javascript
initZilPayWeb3();
```

This function checks if the ZilPay wallet extension is available and initializes the `zilPay` object on the global `window` object.

## Usage

After initializing ZilPay Web3.js, you can access the `zilPay` object to interact with the Zilliqa blockchain and the ZilPay wallet.

### Wallet

The `zilPay.wallet` object provides methods to interact with the user's ZilPay wallet.

#### Connecting to the Wallet

To connect to the user's ZilPay wallet, use the `connect()` method:

```javascript
const isConnected = await zilPay.wallet.connect();
```

This method prompts the user to grant permission to your application to access their wallet.

#### Disconnecting from the Wallet

To disconnect from the user's ZilPay wallet, use the `disconnect()` method:

```javascript
await zilPay.wallet.disconnect();
```

This method revokes the permission granted to your application to access the user's wallet.

#### Signing Transactions

To sign a transaction using the user's ZilPay wallet, use the `sign()` method:

```javascript
const signedTransaction = await zilPay.wallet.sign(transaction);
```

This method prompts the user to sign the provided transaction using their ZilPay wallet.

### Blockchain

The `zilPay.blockchain` object provides methods to interact with the Zilliqa blockchain.

#### Getting Blockchain Information

To retrieve information about the Zilliqa blockchain, use the `getBlockChainInfo()` method:

```javascript
const blockchainInfo = await zilPay.blockchain.getBlockChainInfo();
```

This method returns information such as the current block number, network ID, and more.

#### Getting Account Balance

To retrieve the balance of a specific account, use the `getBalance()` method:

```javascript
const balance = await zilPay.blockchain.getBalance(address);
```

This method returns the balance of the specified account address.

### Contracts

The `zilPay.contracts` object provides methods to interact with smart contracts on the Zilliqa blockchain.

#### Deploying a Contract

To deploy a new contract, use the `deploy()` method:

```javascript
const [transaction, contract] = await zilPay.contracts.new(code, init).deploy(params, priority);
```

This method deploys a new contract with the provided code and initialization parameters.

#### Calling a Contract Function

To call a function on a deployed contract, use the `call()` method:

```javascript
const transaction = await contract.call(functionName, args, params, priority);
```

This method calls the specified function on the contract with the provided arguments and parameters.

## Examples

Here are a few examples of how to use ZilPay Web3.js:

### Connecting to the Wallet

```javascript
async function connectToWallet() {
  const isConnected = await zilPay.wallet.connect();
  if (isConnected) {
    console.log('Connected to ZilPay wallet');
  } else {
    console.log('Failed to connect to ZilPay wallet');
  }
}
```

### Getting Account Balance

```javascript
async function getAccountBalance(address) {
  const balance = await zilPay.blockchain.getBalance(address);
  console.log(`Account balance: ${balance}`);
}
```

### Deploying a Contract

```javascript
async function deployContract(code, init, params) {
  const [transaction, contract] = await zilPay.contracts.new(code, init).deploy(params);
  console.log(`Contract deployed: ${contract.address}`);
}
```

## Contributing

Contributions to ZilPay Web3.js are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/your/repository).

## License

ZilPay Web3.js is released under the [MIT License](https://opensource.org/licenses/MIT).
