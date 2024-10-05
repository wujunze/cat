---
sidebar_position: 11
---

# 教程 9: Ordinal 拍卖

## 概述

在本教程中，我们将介绍如何构建一个 ordinal-auction 合约。它对所有人开放且透明，最高出价者获胜，并在拍卖结束后获得 Ordinal。

有两种方式与合约互动：

1. Bid: 如果找到更高的出价，当前最高出价者将被更新，并且之前的最高出价者将被退款。
2. Close: 拍卖师可以在拍卖结束后关闭拍卖并接受出价。

## 合约属性

根据上述交互，此合约需要存储四个（4）属性：

- 拍卖的 ordinal 输出
- 拍卖师，谁启动拍卖
- 拍卖的截止日期
- 当前最高出价者

```ts
    // 拍卖的 ordinal 输出（txid + vout）。
    @prop()
    readonly ordinalPrevout: ByteString

    // 当前最高出价者。
    @prop(true)
    bidder: PubKey

    // 拍卖师。
    @prop()
    readonly auctioneer: PubKey

    // 拍卖的截止日期。可以是块高度或时间戳。
    @prop()
    readonly auctionDeadline: bigint
```

## 构造函数

在构造函数中初始化所有 `@prop` 属性。注意，我们不需要传递 `bidder` 参数，因为第一个出价者是拍卖师。

```ts
 constructor(
        ordinalPrevout: ByteString,
        auctioneer: PubKey,
        auctionDeadline: bigint
    ) {
        super(...arguments)
        this.ordinalPrevout = ordinalPrevout
        this.bidder = auctioneer
        this.auctioneer = auctioneer
        this.auctionDeadline = auctionDeadline
    }
```

在部署合约时，拍卖师将最低出价锁定到合约中，此时，当前最高出价者将是他自己。

```ts
const instance = new OrdinalAuction(
  ordinalPrevout,
  publicKeyAuctioneer,
  auctionDeadline
);
const deployTx = await instance.deploy(minBid);
```

## 公共方法

### 出价

当有更高的出价时，当前最高出价者将被更新，并且之前的最高出价者将被退款。
我们可以从合约 UTXO 的余额中读取之前的最高出价。

```ts
const highestBid: bigint = this.ctx.utxo.value;
```

然后很容易要求一个更高的出价。

```ts
assert(
  bid > highestBid,
  "the auction bid is lower than the current highest bid"
);
```

支出/赎回交易有这些输出。

![](/sCrypt/ordinal-auction-01.png)

上图显示了两次这样的出价交易，其中 Bob 和然后 Charlies 成功出价。
它们都有 3 个输入和 2 个输出。

```ts
@method()
public bid(bidder: PubKey, bid: bigint) {
    const highestBid: bigint = this.ctx.utxo.value
    assert(
        bid > highestBid,
        'the auction bid is lower than the current highest bid'
    )

    // 更新当前最高出价者。
    const highestBidder: PubKey = this.bidder
    this.bidder = bidder

    // 拍卖继续有更高的出价者。
    const auctionOutput: ByteString = this.buildStateOutput(bid)

    // 退款之前的最高出价者。
    const refundOutput: ByteString = Utils.buildPublicKeyHashOutput(
        hash160(highestBidder),
        highestBid
    )
    let outputs: ByteString = auctionOutput + refundOutput

    // 添加更改输出。
    outputs += this.buildChangeOutput()

    assert(
        hash256(outputs) == this.ctx.hashOutputs,
        'hashOutputs check failed'
    )
}
```

**_bid_** 方法非常简单。它首先检查出价是否足够大。如果是，则更新当前最高出价者。在其余部分，它检查新交易的输出。
第一个输出只是下一个具有更新状态的拍卖实例。此输出中锁定的值将等于新的出价。第二个输出将退款之前的最高出价者，退款金额等于他们之前的出价。最后添加更改输出。

### 关闭

当拍卖到期时，拍卖师可以关闭它并接受出价。拍卖师还必须将 ordinal 转移到最高出价者。这就是合约控制的地方。

![](/sCrypt/ordinal-auction-02.jpg)

上图显示了右边的关闭交易。它与出价交易在输入和输出上有所不同。

有一个额外的输入（第一个输入）包含我们正在拍卖的 ordinal。
有一个输出（第一个输出）将 ordinal 转移给中标者。
合约在第二个输入中被调用，而 ordinal 在第一个输入中被引用。它们在不同的 UTXO 中，但合约仍然可以控制 ordinal 的转移。

`public close(sig: Sig)` 方法很简单，我们要求：

```ts
// 拍卖的 ordinal 输出（txid + vout）。
@prop()
readonly ordnialPrevout: ByteString

@method()
public close(sigAuctioneer: Sig) {
    // 检查是否使用区块高度。
    assert(
        this.timeLock >= this.auctionDeadline,
        'auction is not over yet'
    )

    // 检查拍卖师的签名。
    assert(
        this.checkSig(sigAuctioneer, this.auctioneer),
        'signature check failed'
    )

    // 确保第一个输入花费了拍卖的 ordinal UTXO。
    assert(
        slice(this.prevouts, 0n, 36n) == this.ordnialPrevout,
        'first input is not spending specified ordinal UTXO'
    )

    // 确保 1 sat 的 ordinal 转移给中标者。
    let outputs = Utils.buildPublicKeyHashOutput(hash160(this.bidder), 1n)

    // 确保第二个输出支付给拍卖师。
    outputs += Utils.buildPublicKeyHashOutput(
        hash160(this.auctioneer),
        this.ctx.utxo.value
    )

    // 添加更改输出。
    outputs += this.buildChangeOutput()

    // 检查输出。
    assert(hash256(outputs) == this.ctx.hashOutputs, 'hashOutputs mismatch')
}
```

- 它只能由拍卖师调用。这就是为什么我们需要传递调用者的签名。

```ts
// 检查拍卖师的签名。
assert(this.checkSig(sig, this.auctioneer), "signature check failed");
```

- 现在拍卖的截止日期已经过了

```ts
assert(this.timeLock >= this.auctionDeadline, "auction is not over yet");
```

`public close(sig: Sig)` 方法稍微复杂一些。首先，它使用典型的 [time-lock](https://docs.scrypt.io/tutorials/timeLock) 模式检查是否在截止日期之后调用。
然后，它验证拍卖师的签名，只有拍卖师被允许关闭拍卖。

![](/sCrypt/ordinal-auction-03.webp)

[this.prevouts](https://docs.scrypt.io/how-to-write-a-contract/scriptcontext/#prevouts) 在 ScriptContext 中包含所有指向输入中引用的 UTXO 的指针，称为 outpoints。一个 outpoint 包含两部分：

- TXID: 32 bytes
- Output index: 4 bytes.

一个 UTXO 由一个唯一的 outpoint 标识。

我们提取第一个输入的 outpoint（前 36 个字节），并将其与实际的 ordinal UTXO 进行比较，该 UTXO 在拍卖开始时硬编码并部署合约。这确保了 ordinal 的真实性，并且无法伪造。

我们然后构造并确认输出，就像之前一样。第一个输出是一个常规的 P2PKH 转移给最高出价者。第二个输出支付给拍卖师。最后，我们添加更改输出（如果需要）。

**_注意合约确保 ordinal 在第一个输入中，所以它结束在第一个输出中并转移给中标者_**

## 自定义 `bid` 的 tx 构建器

使用 [默认 tx 构建器](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md#default-1) 无法满足我们的需求，因为当调用 `bid` 时，第二个输出 - 退款 P2PKH 输出 - 不是新的合约实例。

在 Function `static bidTxBuilder(current: Auction, options: MethodCallOptions<Auction>, bidder: PubKey, bid: bigint): Promise<ContractTransaction>`, 我们添加所有三个输出，如设计。

```ts
 static buildTxForBid(
        current: OrdinalAuction,
        options: MethodCallOptions<OrdinalAuction>,
        bidder: PubKey,
        bid: bigint
    ): Promise<ContractTransaction> {
        const next = options.next as StatefulNext<OrdinalAuction>

        const unsignedTx: Transaction = new Transaction()
            // 添加合约输入
            .addInput(current.buildContractInput())
            // 构建下一个实例输出
            .addOutput(
                new Transaction.Output({
                    script: next.instance.lockingScript,
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
            // 构建更改输出
            unsignedTx.change(options.changeAddress)
        }
```

恭喜，您已经完成了 `Ordinal Auction` 合约！要了解更多信息，您可以参考此示例 [NFT 拍卖](https://xiaohuiliu.medium.com/integrate-ordinals-with-smart-contracts-on-bitcoin-part-2-d638b7ca3742)。

[最终完整代码](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/ordinalAuction.ts) 如下：

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
  bsv,
  slice,
  StatefulNext,
  pubKey2Addr,
} from "scrypt-ts";

import Transaction = bsv.Transaction;
import Script = bsv.Script;

export class OrdinalAuction extends SmartContract {
  // 拍卖的 ordinal 输出（txid + vout）。
  @prop()
  readonly ordinalPrevout: ByteString;

  // 当前最高出价者。
  @prop(true)
  bidder: PubKey;

  // 拍卖师。
  @prop()
  readonly auctioneer: PubKey;

  // 拍卖的截止日期。可以是块高度或时间戳。
  @prop()
  readonly auctionDeadline: bigint;

  constructor(
    ordinalPrevout: ByteString,
    auctioneer: PubKey,
    auctionDeadline: bigint
  ) {
    super(...arguments);
    this.ordinalPrevout = ordinalPrevout;
    this.bidder = auctioneer;
    this.auctioneer = auctioneer;
    this.auctionDeadline = auctionDeadline;
  }

  // 调用此公共方法以更高的出价出价。
  @method()
  public bid(bidder: PubKey, bid: bigint) {
    const highestBid: bigint = this.ctx.utxo.value;
    assert(
      bid > highestBid,
      "the auction bid is lower than the current highest bid"
    );

    // 更新当前最高出价者。
    const highestBidder: PubKey = this.bidder;
    this.bidder = bidder;

    // 拍卖继续有更高的出价者。
    const auctionOutput: ByteString = this.buildStateOutput(bid);

    // 退款之前的最高出价者。
    const refundOutput: ByteString = Utils.buildPublicKeyHashOutput(
      pubKey2Addr(highestBidder),
      highestBid
    );
    let outputs: ByteString = auctionOutput + refundOutput;

    // 添加更改输出。
    outputs += this.buildChangeOutput();

    assert(
      hash256(outputs) == this.ctx.hashOutputs,
      "hashOutputs check failed"
    );
  }

  // 如果截止日期已到，则关闭拍卖。
  @method()
  public close(sigAuctioneer: Sig) {
    // 检查截止日期。
    assert(this.timeLock(this.auctionDeadline), "auction is not yet over");

    // 检查拍卖师的签名。
    assert(
      this.checkSig(sigAuctioneer, this.auctioneer),
      "signature check failed"
    );

    // 确保第一个输入花费了拍卖的 ordinal UTXO。
    assert(
      slice(this.prevouts, 0n, 36n) == this.ordinalPrevout,
      "first input is not spending specified ordinal UTXO"
    );

    // 确保 ordinal 转移给中标者。
    let outputs = Utils.buildPublicKeyHashOutput(pubKey2Addr(this.bidder), 1n);

    // 确保第二个输出支付给拍卖师。
    outputs += Utils.buildPublicKeyHashOutput(
      pubKey2Addr(this.auctioneer),
      this.ctx.utxo.value
    );

    // 添加更改输出。
    outputs += this.buildChangeOutput();

    // 检查输出。
    assert(hash256(outputs) == this.ctx.hashOutputs, "hashOutputs mismatch");
  }

  // 用于调用函数 `bid` 的自定义 tx 构建器
  static buildTxForBid(
    current: OrdinalAuction,
    options: MethodCallOptions<OrdinalAuction>,
    bidder: PubKey,
    bid: bigint
  ): Promise<ContractTransaction> {
    const next = options.next as StatefulNext<OrdinalAuction>;

    const unsignedTx: Transaction = new Transaction()
      // 添加合约输入
      .addInput(current.buildContractInput())
      // 构建下一个实例输出
      .addOutput(
        new Transaction.Output({
          script: next.instance.lockingScript,
          satoshis: Number(bid),
        })
      )
      // 构建退款输出
      .addOutput(
        new Transaction.Output({
          script: Script.fromHex(
            Utils.buildPublicKeyHashScript(pubKey2Addr(current.bidder))
          ),
          satoshis: current.balance,
        })
      );

    if (options.changeAddress) {
      // 构建更改输出
      unsignedTx.change(options.changeAddress);
    }

    return Promise.resolve({
      tx: unsignedTx,
      atInputIndex: 0,
      nexts: [
        {
          instance: next.instance,
          atOutputIndex: 0,
          balance: next.balance,
        },
      ],
    });
  }
}
```
