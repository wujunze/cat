---
sidebar_position: 5
---

# 与已部署的合约交互

## 概述

在本教程中，我们将通过调用其公共方法与已部署的智能合约进行交互，在单独的进程或由不同的方进行。

为此，我们需要创建一个与链上已部署合约相对应的智能合约实例。

## 智能合约

我们将重用之前步骤中的状态合约 `Counter` [from a previous step](../how-to-write-a-contract/stateful-contract#create-a-stateful-contract)。

```ts
export class Counter extends SmartContract {
  // 状态变量
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

      // 确保下一个输出将包含带有更新计数器属性的此合约的代码。
      // 并确保合约中的余额不变
      const amount: bigint = this.ctx.utxo.value
      // 包含最新状态和可选更改输出的输出
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

## 部署

要部署智能合约，我们定义以下函数：

```ts
async function deploy(initialCount = 100n): Promise<string> {
    const instance = new Counter(initialCount)
    await instance.connect(getDefaultSigner())
    const tx = await instance.deploy(1)
    console.log(`Counter deployed: ${tx.id}, the count is: ${instance.count}`)
    return tx.id
}
```

该函数以 1 聪的余额部署合约，并返回已部署合约的事务 ID。

## 交互

Next, we update our deployed smart contract by calling the following function:

```ts
async function callIncrementOnChain(
    txId: string,
    atOutputIndex = 0
): Promise<string> {
    // 通过提供者获取 TX 并重建合约实例。
    const signer = getDefaultSigner()
    const tx = await signer.connectedProvider.getTransaction(txId)
    const instance = Counter.fromTx(tx, atOutputIndex)

    await instance.connect(signer)

    const nextInstance = instance.next()
    nextInstance.increment()

    const { tx: callTx } = await instance.methods.incrementOnChain({
        next: {
            instance: nextInstance,
            balance: instance.balance,
        },
    } as MethodCallOptions<Counter>)
    console.log(`Counter incrementOnChain called: ${callTx.id}, the count now is: ${nextInstance.count}`)
    return callTx.id
}
```

该函数将已部署智能合约的事务 ID 作为参数，并使用 [`DefaultProvider`](../reference/classes/DefaultProvider) 从区块链中获取事务数据。随后，它使用 [`fromTx`](../how-to-write-a-contract/built-ins.md#fromtx) 函数重建智能合约实例。

让我们将整个过程封装在一个主函数中，该函数设计为部署合约并将其值增加五次：

```ts
async function main() {
    await compileContract()
    let lastTxId = await deploy()
    for (let i = 0; i < 5; ++i) {
        lastTxId = await callIncrementOnChain(lastTxId)
    }
}

(async () => {
    await main()
})()
```

如果我们执行代码，我们应该得到类似于以下内容的输出：

```ts
Counter deployed: 1cd6eb4ff0a5bd83f06c60c5e9a5c113c6e44fd876096e4e94e04a80fee8c8ca, the count is: 100
Counter incrementOnChain called: c5b8d8f37f5d9c089a73a321d58c3ae205087ba21c1e32ed09a1b2fbd4f65330, the count now is: 101
Counter incrementOnChain called: c62bb0f187f81dfeb5b70eafe80d549d3b2c6219e16d9575639b4fbdffd1d391, the count now is: 102
Counter incrementOnChain called: 9fb217b98324b633d8a0469d6a2478f522c1f40c0b6d806430efe5ae5457ca0e, the count now is: 103
Counter incrementOnChain called: 2080ddecc7f7731fc6afd307a57c8b117227755bd7b82eb0bc7cd8b78417ad9a, the count now is: 104
Counter incrementOnChain called: de43687fd386e92cd892c18600d473bc38d5adb0cc34bbda892b94c61b5d5eb8, the count now is: 105
```

## 结论

恭喜！您现在已成功部署并调用了一个比特币智能合约。
您可以在我们的 [boilerplate 仓库](https://github.com/sCrypt-Inc/boilerplate/blob/master/tests/counterFromTx.test.ts) 中看到一个完整的测试示例。
