---
sidebar_position: 2
---

# 教程 2: 拍卖

## 概述

在本教程中，我们将介绍如何构建一个拍卖合约。这是一个开放且透明的拍卖，任何人都可以参与，最高出价者将在拍卖结束时赢得拍卖。

有两种方式与合约进行交互：

1. 出价：如果找到更高的出价，当前的最高出价者将被更新，并且前一个最高出价者将被退款。
2. 关闭：拍卖师可以在拍卖结束后关闭拍卖并取走最高出价。

## 合约属性

根据上述交互，此合约需要存储三个属性：

- 拍卖师，谁启动拍卖
- 拍卖的截止日期
- 当前的最高出价者

```ts
// 出价者的公钥。
@prop(true)
bidder: PubKey

// 拍卖师公钥。
@prop()
readonly auctioneer: PubKey

// 拍卖的截止日期。可以是区块高度或时间戳。
@prop()
readonly auctionDeadline: bigint
```

## 构造函数

在构造函数中初始化所有 `@prop` 属性。注意我们不需要传递 `bidder` 参数。

```ts
constructor(auctioneer: PubKey, auctionDeadline: bigint) {
    super(...arguments)
    // 初始出价者是拍卖师本人
    this.bidder = auctioneer
    this.auctioneer = auctioneer
    this.auctionDeadline = auctionDeadline
}
```

当部署合约时，拍卖师将最低出价锁定到合约中，此时，最高出价者将是他自己。

```ts
const auction = new Auction(publicKeyAuctioneer, auctionDeadline)
const deployTx = await auction.deploy(minBid)
```

## 公共方法

### 出价

在方法 `public bid(bidder: Addr, bid: bigint)` 中，我们需要检查出价者是否比前一个出价者出价更高。如果是，我们更新合约状态中的最高出价者并退还前一个出价者。

我们可以从合约 UTXO 的余额中读取前一个最高出价。

```ts
const highestBid: bigint = this.ctx.utxo.value
```

然后很容易要求一个更高的出价。

```ts
assert(bid > highestBid, 'the auction bid is lower than the current highest bid')
```

出价交易有这些输出。

![](/sCrypt/auction-01.png)

- 合约的新状态输出：记录新的出价者并将新的出价锁定到合约 UTXO。

```ts
// 记录前一个最高出价者
const highestBidder: PubKey = this.bidder
// 更改最高出价者的公钥。
this.bidder = bidder

// 拍卖继续进行，出价更高。
const auctionOutput: ByteString = this.buildStateOutput(bid)
```

- 退款 P2PKH 输出：退还前一个出价者。

```ts
// 退还前一个最高出价者。
const refundOutput: ByteString = Utils.buildPublicKeyHashOutput(highestBidder, highestBid)
```

- 可选的变更 P2PKH 输出。

```ts
let outputs: ByteString = auctionOutput + refundOutput
// 添加变更输出。
outputs += this.buildChangeOutput()
```

最后，我们要求交易具有这些输出，使用 `ScriptContext`。

```ts
assert(hash256(outputs) == this.ctx.hashOutputs, 'hashOutputs check failed')
```

由于 `bid` 被连续调用，合约的状态被不断更新。直到拍卖师关闭拍卖，最高出价者和最高出价都被记录在最新的合约 UTXO 中。

```ts
// 调用此公共方法以出价更高的出价。
@method()
public bid(bidder: Addr, bid: bigint) {
    const highestBid: bigint = this.ctx.utxo.value
    assert(bid > highestBid, 'the auction bid is lower than the current highest bid')

    // 更改最高出价者的公钥。
    const highestBidder: PubKey = this.bidder
    this.bidder = bidder

    // 拍卖继续进行，出价更高。
    const auctionOutput: ByteString = this.buildStateOutput(bid)

    // 退还前一个最高出价者。
    const refundOutput: ByteString = Utils.buildPublicKeyHashOutput(highestBidder, highestBid)

    let outputs: ByteString = auctionOutput + refundOutput
    // 添加变更输出。
    outputs += this.buildChangeOutput()

    assert(hash256(outputs) == this.ctx.hashOutputs, 'hashOutputs check failed')
}
```

### 关闭

![](/sCrypt/auction-02.png)

方法 `public close(sig: Sig)` 很简单，我们只需要：

- 只能由拍卖师调用。这就是为什么我们需要传递调用者的签名。

```ts
// 检查拍卖师的签名。
assert(this.checkSig(sig, this.auctioneer), 'signature check failed')
```

- 拍卖的截止日期已过

```ts
assert(this.ctx.locktime >= this.auctionDeadline, 'auction is not over yet')
```

:::note
我们在这里不放置任何约束，因为拍卖师可以将最高出价发送给任何他控制的地址，这正是我们想要的。
:::

```ts
// 如果截止日期已过，关闭拍卖。
@method()
public close(sig: Sig) {
    ...
    // 检查截止日期
    assert(this.ctx.locktime >= this.auctionDeadline, 'auction is not over yet')
    // 检查拍卖师的签名。
    assert(this.checkSig(sig, this.auctioneer), 'signature check failed')
}
```

## 为 `bid` 自定义交易构建器

使用 [默认交易构建器](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md#default-1) 无法满足我们调用 `bid` 的需求，因为第二个输出 - 退款 P2PKH 输出 - 不是新的合约实例。

在函数 `static bidTxBuilder(current: Auction, options: MethodCallOptions<Auction>, bidder: PubKey, bid: bigint): Promise<ContractTransaction>` 中，我们将所有三个输出添加为设计。

```ts
const unsignedTx: Transaction = new bsv.Transaction()
    // 添加合约输入
    .addInput(current.buildContractInput())
    // 构建下一个实例输出
    .addOutput(new bsv.Transaction.Output({script: nextInstance.lockingScript, satoshis: Number(bid),}))
    // 构建退款输出
    .addOutput(
        new bsv.Transaction.Output({
            script: bsv.Script.fromHex(Utils.buildPublicKeyHashScript(current.bidder)),
            satoshis: current.balance,
        })
    )
    // 构建变更输出
    .change(options.changeAddress)
```

## 结论

恭喜，您已经完成了 `Auction` 合约！要在实践中使用它，您可以参考这个示例 [NFT 拍卖](https://xiaohuiliu.medium.com/integrate-ordinals-with-smart-contracts-on-bitcoin-part-2-d638b7ca3742)。

完整的 [代码](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/auction.ts) 如下：

```ts
import { 
     assert, 
     MethodCallOptions, 
     ContractTransaction, 
     ByteString, 
     hash256, 
     method, 
     prop, 
     PubKey, 
     Sig, 
     SmartContract, 
     Utils, 
     UTXO, 
     bsv, 
     pubKey2Addr, 
 } from 'scrypt-ts' 
  
 import Transaction = bsv.Transaction 
 import Address = bsv.Address 
 import Script = bsv.Script 
  
 /* 
  * 阅读关于此合约的Medium文章： 
  * https://medium.com/@xiaohuiliu/auction-on-bitcoin-4ba2b6c18ba7 
  */ 
 export class Auction extends SmartContract { 
     // 出价者的公钥。 
     @prop(true) 
     bidder: PubKey 
  
     // 拍卖师的公钥。 
     @prop() 
     readonly auctioneer: PubKey 
  
     // 拍卖的截止日期。可以是区块高度或时间戳。 
     @prop() 
     readonly auctionDeadline: bigint 
  
     constructor(auctioneer: PubKey, auctionDeadline: bigint) { 
         super(...arguments) 
         this.bidder = auctioneer 
         this.auctioneer = auctioneer 
         this.auctionDeadline = auctionDeadline 
     } 
  
     // 调用此公共方法以出价更高的出价。 
     @method() 
     public bid(bidder: PubKey, bid: bigint) { 
         const highestBid: bigint = this.ctx.utxo.value 
         assert( 
             bid > highestBid, 
             'the auction bid is lower than the current highest bid' 
         ) 
  
         // 更改最高出价者的公钥。 
         const highestBidder: PubKey = this.bidder 
         this.bidder = bidder 
  
         // 拍卖继续进行，出价更高。 
         const auctionOutput: ByteString = this.buildStateOutput(bid) 
  
         // 退还前一个最高出价者。 
         const refundOutput: ByteString = Utils.buildPublicKeyHashOutput( 
             pubKey2Addr(highestBidder), 
             highestBid 
         ) 
         let outputs: ByteString = auctionOutput + refundOutput 
  
         // 添加变更输出。 
         outputs += this.buildChangeOutput() 
  
         assert( 
             hash256(outputs) == this.ctx.hashOutputs, 
             'hashOutputs check failed' 
         ) 
     } 
  
     // 如果截止日期已过，关闭拍卖。 
     @method() 
     public close(sig: Sig) { 
         // 检查截止日期。 
         assert(this.timeLock(this.auctionDeadline), 'deadline not reached') 
  
         // 检查拍卖师的签名。 
         assert(this.checkSig(sig, this.auctioneer), 'signature check failed') 
     } 
  
     // 通过覆盖 `SmartContract.buildDeployTransaction` 方法自定义部署交易 
     override async buildDeployTransaction( 
         utxos: UTXO[], 
         amount: number, 
         changeAddress?: Address | string 
     ): Promise<Transaction> { 
         const deployTx = new Transaction() 
             // 添加 p2pkh 输入 
             .from(utxos) 
             // 添加合约输出 
             .addOutput( 
                 new Transaction.Output({ 
                     script: this.lockingScript, 
                     satoshis: amount, 
                 }) 
             ) 
             // 添加 OP_RETURN 输出 
             .addData('Hello World') 
  
         if (changeAddress) { 
             deployTx.change(changeAddress) 
             if (this.provider) { 
                 deployTx.feePerKb(await this.provider.getFeePerKb()) 
             } 
         } 
  
         return deployTx 
     } 
  
     // 为用户定义的交易构建器，用于调用函数 `bid` 
     static buildTxForBid( 
         current: Auction, 
         options: MethodCallOptions<Auction>, 
         bidder: PubKey, 
         bid: bigint 
     ): Promise<ContractTransaction> { 
         const nextInstance = current.next() 
         nextInstance.bidder = bidder 
  
         const unsignedTx: Transaction = new Transaction() 
             // 添加合约输入 
             .addInput(current.buildContractInput()) 
             // 构建下一个实例输出 
             .addOutput( 
                 new Transaction.Output({ 
                     script: nextInstance.lockingScript, 
                     satoshis: Number(bid), 
                 }) 
             ) 
             // 构建退款输出 
             .addOutput( 
                 new Transaction.Output({ 
                     script: Script.fromHex( 
                         Utils.buildPublicKeyHashScript( 
                             pubKey2Addr(current.bidder) 
                         ) 
                     ), 
                     satoshis: current.balance, 
                 }) 
             ) 
  
         if (options.changeAddress) { 
             // 构建变更输出 
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
 }
```
