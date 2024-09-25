---
sidebar_position: 2
---

# 如何自定义合约事务

## 部署事务

### 默认

对于合约部署，默认的事务构建器会创建一个具有以下结构的事务：

* 输入：

  * [0…]: 一个或多个 [P2PKH](https://learnmeabitcoin.com/technical/p2pkh)输入，用于支付交易费用。

* 输出：

  * \[0\]: 包含合约的输出。
  * \[1\]: 如果需要，一个P2PKH更改输出。

[] 中的数字表示索引，从0开始。

![img](https://lucid.app/publicSegments/view/5242c7cb-d30d-4a92-826c-4d6290e2af04/image.png)

### 自定义

您可以通过覆盖其 [buildDeployTransaction](../how-to-write-a-contract/built-ins#builddeploytransaction) 方法来自定义合约的部署事务构建器。以下是一个示例。

```ts
class DemoContract extends SmartContract {
  // ...

  // 通过覆盖 `SmartContract.buildDeployTransaction` 方法来自定义合约的部署事务构建器
  override async buildDeployTransaction(utxos: UTXO[], amount: number,
    changeAddress?: bsv.Address | string): Promise<bsv.Transaction> {

    const deployTx = new bsv.Transaction()
      // 添加P2PKH输入以支付交易费用
      .from(utxos)
      // 添加合约输出
      .addOutput(new bsv.Transaction.Output({
        script: this.lockingScript,
        satoshis: amount,
      }))
      // 添加OP_RETURN输出
      .addData('Hello World')

    if (changeAddress) {
      deployTx.change(changeAddress);
      if (this._provider) {
        deployTx.feePerKb(await this.provider.getFeePerKb())
      }
    }

    return deployTx;
  }
}
```

有关更多详细信息，请参阅 [完整代码](https://github.com/sCrypt-Inc/boilerplate/blob/f63c37038a03bc51267e816d9441969d3e1d2ece/src/contracts/auction.ts#L100-L127)。

## 调用事务

### 默认事务构建器

对于合约调用，默认的事务构建器会创建一个具有以下结构的事务：

* 输入

  * \[0\]: 花费合约UTXO的输入。
  * \[1…\]: 零个或多个P2PKH输入以支付交易费用。

* 输出

  * \[0…N-1\]: 一个或多个输出，每个输出包含一个新的合约实例（UTXO），如果合约是[有状态的](../how-to-write-a-contract/stateful-contract)。
  * \[N\]: 如果需要，一个P2PKH更改输出。

![img](https://lucid.app/publicSegments/view/9dfde0f0-7275-48da-9411-057e895b5fb3/image.png)

### 自定义

您可以通过调用 `bindTxBuilder` 来自定义合约的公共 `@method` 的事务构建器。第一个参数是公共方法名称，第二个参数是类型为 [MethodCallTxBuilder](https://docs.scrypt.io/reference/interfaces/MethodCallTxBuilder) 的自定义事务构建器。

`MethodCallTxBuilder` 接受三个参数：

1. `current: T`: 智能合约 T 的实际实例。
2. `options`: 类型为 [`MethodCallOptions<T>`](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#methodcalloptions) 的选项。
3. `...args: any`: 与绑定的公共 `@method` 相同的参数列表。

以我们的 [auction 智能合约](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/auction.ts) 为例：

```ts
import Transaction = bsv.Transaction
........
........


// 为公共方法 `Auction.bid` 绑定一个自定义的事务构建器
auction.bindTxBuilder('bid', Auction.bidTxBuilder)

static bidTxBuilder(
    current: Auction,
    options: MethodCallOptions<Auction>,
    bidder: PubKey,
    bid: bigint
): Promise<ContractTransaction> {
    const nextInstance = current.next()
    nextInstance.bidder = bidder

    const unsignedTx: Transaction = new bsv.Transaction()
      // 添加合约输入
      .addInput(current.buildContractInput())
      // 构建下一个实例输出
      .addOutput(
          new bsv.Transaction.Output({
              script: nextInstance.lockingScript,
              satoshis: Number(bid),
          })
      )
      // 构建退款输出
      .addOutput(
          new bsv.Transaction.Output({
              script: bsv.Script.fromHex(
                  Utils.buildPublicKeyHashScript(pubKey2Addr(current.bidder))
              ),
              satoshis: current.balance,
          })
      )

    // 构建退款输出
    if (options.changeAddress) {
      // 构建退款输出
      unsignedTx.change(options.changeAddress)
    }

    return Promise.resolve({
        tx: unsignedTx,
        atInputIndex: 0,
        nexts: [
            {
                instance: nextInstance,
                atOutputIndex: 0,
                balance: Number(bid),
            },
        ],
    })
}
```

在这个例子中，我们为公共方法 `@method` `bid` 自定义了调用事务。`...args` 解析为它的参数：`bidder: PubKey` 和 `bid: bigint`。第一个输入是引用 UTXO 的输入，其中当前位于我们的智能合约实例。我们使用 `buildContractInput` 函数来构建输入。请注意，在执行事务构建器函数时，此输入的脚本为空。脚本将在方法调用的稍后阶段由方法参数填充。

事务构建器将返回一个对象：

* `tx`: 我们的方法调用的未签名事务。
* `atInputIndex`: 引用智能合约 UTXO 的输入的索引。
* `nexts`: 一个对象数组，表示合约的下一个实例（s）。

当调用 [有状态的智能合约](../how-to-write-a-contract/stateful-contract.md) 时，我们必须定义合约的下一个实例。这个实例将包含更新的状态。正如我们所见，首先使用当前实例的 `next()` 函数创建一个新实例。然后更新新实例的 `bidder` 属性。然后将这个新实例包含在新的未签名事务的第 0 个输出中，并进入返回对象的 `nexts` 数组。

#### 隐式绑定约定

作为捷径，如果一个类型为 `MethodCallTxBuilder` 的静态函数被命名为 `buildTxFor${camelCaseCapitalized(methodName)}`，则不需要显式调用 `bindTxBuilder()`，其中 `camelCaseCapitalized()` 将 `methodName` 的第一个字母大写。

在上面的例子中，如果静态函数 `bidTxBuilder` 被重命名为 `buildTxForBid`，它将作为调用 `bid` 的隐式事务构建器。没有必要显式调用 `auction.bindTxBuilder('bid', Auction.buildTxForBid)`。

```ts
// 不需要显式绑定
// auction.bindTxBuilder('bid', Auction.buildTxForBid)

// buildTxForBid 是公共方法 `Auction.bid` 的自定义事务构建器
static buildTxForBid(
    current: Auction,
    options: MethodCallOptions<Auction>,
    bidder: PubKey,
    bid: bigint
): Promise<ContractTransaction> {
...
```

## 注意

请注意，每个这些事务构建器应仅创建一个**未签名的**事务。如果需要，在广播之前，事务会在稍后的步骤中自动签名。

此外，你自定义的交易必须满足所调用的 `@method` 的所有断言。
