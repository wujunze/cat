---
sidebar_position: 4
---

# 状态合约

## 概述

在比特币的 UTXO 模型中，智能合约默认是**无状态**的，因为包含合约的 UTXO 在花费后会被销毁。无状态允许它扩展，类似于 [HTTP](https://stackoverflow.com/questions/5836881/stateless-protocol-and-stateful-protocol) 和 [REST API](https://www.geeksforgeeks.org/restful-statelessness/)。
智能合约可以通过要求包含相同合约但具有更新状态的支出交易的输出，来模拟状态，这由 [ScriptContext](scriptcontext.md) 启用。
这类似于使用 cookies 使 HTTP 看起来有状态。

### 在比特币交易中管理状态

到目前为止，我们通过的所有合约都是无状态的。但通常，你可能希望合约具有某种“记忆”，以便它可以记住其先前的交互信息。也就是说，我们需要**有状态**的合约。

为此，我们将智能合约的锁定脚本分为两部分：1. 代码和 2. 状态，如下所示。

代码部分包含合约的业务逻辑，这些逻辑编码了状态转换的规则，并且**不能更改**。
当一笔交易花费包含旧状态的输出并创建一个包含新状态的输出时，就会发生状态转换，同时保持合约代码不变。
由于新输出包含相同的合约代码，其花费交易也必须保留相同的代码，否则它将失败。这条交易链可以无限期地继续下去，从而在链上保持状态，递归地。
![img](/sCrypt/stateful-contract.png)

## 创建一个有状态的合约

我们可以使用以下命令创建一个有状态的合约：

```sh
npx scrypt-cli project --state counter
```

注意，`state` 选项已打开。

这会创建一个包含一个名为 `Counter` 的示例有状态合约的项目。这个基本的合约维护一个状态：自从部署以来被调用了多少次。

让我们看看合约源文件 `/src/contracts/counter.ts`。

### 有状态的属性

如 [之前](basics#properties) 所示，使用 `@prop(true)` 装饰器将属性标记为有状态的，这意味着当合约被调用时，它可以被修改。

```ts
@prop(true)
count: bigint
```

### 更新状态

`incrementOnChain()` 方法做了两件事：

1. 调用 `increment` 更新状态：

```ts
@method()
increment(): void {
    this.count++
}
```

1. 验证新状态进入下一个包含相同合约的 UTXO，即状态被维护。

```ts
// 确保合约中的余额不变
const amount: bigint = this.ctx.utxo.value
// 包含最新状态和可选找零输出的输出
const outputs: ByteString = this.buildStateOutput(amount) + this.buildChangeOutput()
// 验证解锁交易具有相同的输出
assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
```

内置函数 `this.buildStateOutput()` 创建一个包含最新状态的输出。它接受一个输入：输出的聪数。我们在示例中保持聪数不变。内置函数 `this.buildChangeOutput()` 在必要时创建一个 P2PKH 找零输出。它会自动计算找零金额，并默认使用签名者的地址。

如果我们在合约中创建的所有输出哈希到 [ScriptContext](scriptcontext.md) 中的 `hashOutputs`，我们可以确定它们实际上是当前交易的输出。因此，更新后的状态被传播。

完整的合约如下：

```ts
export class Counter extends SmartContract {
  // 有状态的
  @prop(true)
  count: bigint

  constructor(count: bigint) {
    super(...arguments)
    this.count = count
  }

  @method()
  public incrementOnChain() {
    // 增加计数器。
    this.increment()

    // 确保下一个输出将包含具有更新计数属性的此合约的代码。
    // 并确保合约中的余额不变
    const amount: bigint = this.ctx.utxo.value
    // 包含最新状态和可选找零输出的输出
    const outputs: ByteString = this.buildStateOutput(amount) + this.buildChangeOutput()
    // 验证解锁交易具有相同的输出
    assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
  }

  @method()
  increment(): void {
    this.count++
  }
}
```

## 无状态合约 vs 有状态合约

选择无状态还是状态合约取决于区块链应用程序的需求。

如果你的应用程序需要在链上存储持久化数据，有状态合约是合适的。例如，在 [拍卖应用](../tutorials/auction.md) 中，你需要存储当前的最高出价和出价者，以便在有更高出价时将其退还给当前的出价者。

如果你的应用程序仅验证花费条件而不保留数据，无状态合约是理想的。一个简单的例子是使用签名和公钥在 [P2PKH 合约](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#method-with-signatures) 中进行简单的转账。
