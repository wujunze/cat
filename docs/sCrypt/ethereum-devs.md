---
sidebar_position: 12
---

# 以太坊开发者的sCrypt

## 比特币智能合约与以太坊智能合约

比特币和以太坊都是具有[完全可编程智能合约](https://xiaohuiliu.medium.com/turing-machine-on-bitcoin-7f0ebe0d52b1)的第1层区块链。
然而，他们的设计从根本上不同。

以太坊是一个全局状态机，其状态由部署在其上的所有智能合约组成。每个交易都是状态机的一个输入，根据交易调用的智能合约的规则，将状态机转换到下一个状态。由于潜在的竞争条件，交易必须顺序处理，这严重限制了可扩展性。

比特币中，交易处理是独立的，因为所有需要的信息都是本地的。没有共享的全局状态。比特币的设计是最大程度地并行化。

详细的侧边对比可以在这里找到 [here](ttps://xiaohuiliu.medium.com/bitcoin-vs-ethereum-smart-contracts-921e0a12b043)，总结如下。

|| Ethereum | Bitcoin |
|---|---|---|
| 执行环境 | [Ethereum Virtual Machine](https://ethereum.org/en/developers/docs/evm/) (EVM) | [Bitcoin Virtual Machine](https://xiaohuiliu.medium.com/introduction-to-bitcoin-smart-contracts-9c0ea37dc757) (BVM)|
| 模型 | 账户 | [UTXO](./overview.md#how-do-bitcoin-smart-contracts-work) |
| 交易费用 | $1-10 | $0.00001 |
| 每秒交易量 | 15 | 3000+ |
| 交易处理 | 顺序 | 并行 |
| 可扩展性 | 垂直 | 水平 |
| 范式 | 不纯 | 纯 |
| 矿工额外收益 (MEV) | Yes | No |

## 比特币与以太坊智能合约开发

除了一个无限制可扩展的基础，比特币还提供了一个卓越的智能合约开发体验。

下表显示了流行的以太坊开发工具及其在比特币生态系统中的对应工具的比较。

有两个明显的区别。

1. 比特币智能合约是用 TypeScript 编写的，这是一种数十亿 Web2 开发人员已经熟悉的流行编程语言。他们不必学习像 Solidity 这样的新专业编程语言，这为初学者设置了很高的门槛。他们可以重用他们喜欢的工具，例如 [Visual Studio Code](https://code.visualstudio.com/)、[WebStorm](https://www.jetbrains.com/webstorm/) 和 NPM。
1. 以太坊的开发工具是 **碎片化的**。它们由不同的实体开发，这些实体通常是竞争对手。有动机使它们不兼容，因此它们不能很好地相互通信。相比之下，sCrypt 采取了一种更全面和系统的方法。它构建了一个统一的完整堆栈平台，涵盖了从编程语言到框架/库的几乎所有工具。协同开发，它们是完全兼容的，大大简化了和简化了开发过程。

| Ethereum | Bitcoin ||
|---|---|---|
| 编程语言 | [Solidity](https://soliditylang.org/) | [sCrypt DSL](https://docs.scrypt.io/) |
| 框架 | [Hardhat](https://hardhat.org/) / [Truffle](https://trufflesuite.com/truffle/) | [The sCrypt CLI](https://www.npmjs.com/package/scrypt-cli) |
| 库 | [Web3.js](https://web3js.org/#/) / [Ethers.js](https://docs.ethers.org) | [scrypt-ts](https://docs.scrypt.io/how-to-write-a-contract/) |
| 开发者平台 | [Alchemy](https://www.alchemy.com/) / [Infura](https://www.infura.io/) | [sCrypt](https://scrypt.io) |
| IDE | [Remix](https://remix.ethereum.org)[^1] | [Visual Studio Code](https://code.visualstudio.com/) |
| 钱包 | [MetaMask](https://metamask.io/) | [Yours](https://github.com/yours-org/yours-wallet) |
| 浏览器 | [Etherscan](https://etherscan.io/) | [WhatsOnChain](https://whatsonchain.com/) |

[^1]: Visual Studio Code 也可以用于 Solidity 与各种扩展。然而，与 sCrypt 相比，它的支持非常有限，sCrypt 是一个 TypeScript DSL，支持开箱即用，无需扩展。例如，[VS Code 调试器](./how-to-debug-a-contract.md) 对 sCrypt 有第一类全面的支持，但不支持 Solidity。

## 示例代码

让我们比较一个 `Counter` 智能合约在 Solidity 和 sCrypt 中的实现。

```js
pragma solidity >=0.7.0 <0.9.0;

contract Counter {

    int private count;

    constructor(int _initialCount) {
        count = _initialCount;
    }

    function incrementCounter() public {
        count += 1;
    }

    function getCount() public view returns (int) {
        return count;
    }

}
```

```ts
class Counter extends SmartContract {

    @prop(true)
    count: bigint

    constructor(count: bigint) {
        super(...arguments)
        this.count = count
    }

    @method()
    public incremenCounter() {
        this.count++

        assert(hash256(this.buildStateOutput(this.ctx.utxo.value)) == this.ctx.hashOutputs)
    }

}
```
