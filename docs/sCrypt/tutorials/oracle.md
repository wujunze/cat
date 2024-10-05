---
sidebar_position: 3
---

# 教程 3: 预言机

## 概述

在本教程中，我们将介绍如何构建一个智能合约，该合约从预言机获取外部数据。具体来说，我们将实现一个智能合约，让两个玩家在某个未来时间点对 BSV 的价格进行押注。它从预言机获取价格。

### 什么是预言机？
区块链预言机是一种第三方服务或代理，它为区块链网络提供外部数据。它是区块链和外部世界之间的桥梁，使智能合约能够访问、验证和整合来自区块链外部的数据。这使得智能合约能够基于现实世界的事件和条件执行，增强其效用和功能。

![](/sCrypt/oracle-01.jpeg) 

[Credit: bitnovo](https://blog.bitnovo.com/en/what-is-a-blockchain-oracle/)

预言机提供的数据可以包括各种类型的信息，例如股票价格、天气数据、选举结果和体育比分。

### Rabin 签名
数字签名是验证智能合约中已知预言机提供的任意数据的真实性和完整性的必要条件。与比特币中使用的 ECDSA 不同，我们使用另一种称为 [Rabin 签名的数字签名算法](https://en.wikipedia.org/wiki/Rabin_signature_algorithm)。这是因为 Rabin 签名验证比 ECDSA 便宜得多。
我们已经在标准库 [`scrypt-ts-lib`](https://www.npmjs.com/package/scrypt-ts-lib) 中实现了 [Rabin 签名](https://github.com/sCrypt-Inc/scrypt-ts-lib/blob/master/src/rabinSignature.ts)，可以直接导入和使用。

## 合约属性

我们的合约将从 [WitnessOnChain 预言机](https://witnessonchain.com) 获取已签名的定价数据。根据价格目标是否达到，它将向两个玩家中的一个支付奖励。

我们的价格投注智能合约将需要以下属性：

```ts
// 需要达到的价格目标。
@prop()
targetPrice: bigint

// 代币对的符号，例如 "BSV_USDC"
@prop()
symbol: ByteString

// 价格目标需要达到的时间窗口。
@prop()
timestampFrom: bigint
@prop()
timestampTo: bigint

// 预言机的 Rabin 公钥。
@prop()
oraclePubKey: RabinPubKey

// 两个玩家的地址。
@prop()
aliceAddr: Addr
@prop()
bobAddr: Addr
```

请注意，类型 `RabinPubKey`，表示 Rabin 公钥，不是标准类型。您可以通过以下方式导入它：

```ts
import { RabinPubKey } from 'scrypt-ts-lib'
```

## 公共方法 - `unlock`

合约将只有一个公共方法，即 `unlock`。作为参数，它将接受预言机的签名、预言机签名的消息和获胜者的签名，以解锁资金：

```ts
@method()
public unlock(msg: ByteString, sig: RabinSig, winnerSig: Sig) {
    // 验证预言机签名。
    assert(
        RabinVerifierWOC.verifySig(msg, sig, this.oraclePubKey),
        'Oracle sig verify failed.'
    )

    // 解码数据。
    const exchangeRate = PriceBet.parseExchangeRate(msg)

    // 验证数据。
    assert(
        exchangeRate.timestamp >= this.timestampFrom,
        'Timestamp too early.'
    )
    assert(
        exchangeRate.timestamp <= this.timestampTo,
        'Timestamp too late.'
    )
    assert(exchangeRate.symbol == this.symbol, 'Wrong symbol.')

    // 决定获胜者并检查他们的签名。
    const winner =
        exchangeRate.price >= this.targetPrice
            ? this.alicePubKey
            : this.bobPubKey
    assert(this.checkSig(winnerSig, winner))
}
```

让我们逐步介绍每个部分。

首先，我们验证传递的签名是否正确。为此，我们使用 [`scrypt-ts-lib`](https://www.npmjs.com/package/scrypt-ts-lib) 包中的 `RabinVerifierWOC` 库

```ts
import { RabinPubKey, RabinSig, RabinVerifierWoc } from 'scrypt-ts-lib'
```

我们现在可以调用验证库的 `verifySig` 方法：

```ts
// 验证预言机签名。
assert(
    RabinVerifierWOC.verifySig(msg, sig, this.oraclePubKey),
    'Oracle sig verify failed.'
)
``` 
验证方法需要预言机签名的消息、预言机的签名和预言机的公钥，我们已经通过构造函数设置。

接下来，我们需要解析从预言机签名的数据块中的信息并断言它。有关消息格式的详细描述，请查看 [WitnessOnChain API 文档](https://witnessonchain.com) 中的 `"Exchange Rate"` 部分。

我们需要实现静态方法 `parseExchangeRate` 如下：

```ts
// 解析来自预言机的签名消息。
@method()
static parseExchangeRate(msg: ByteString): ExchangeRate {
    // 4字节时间戳（小端序）+ 8字节汇率（小端序）+ 1字节小数位 + 16字节符号
    return {
        timestamp: Utils.fromLEUnsigned(slice(msg, 0n, 4n)),
        price: Utils.fromLEUnsigned(slice(msg, 4n, 12n)),
        symbol: slice(msg, 13n, 29n),
    }
}
```

我们解析以下数据：
- `timestamp` - 此汇率存在的时刻。
- `price` - 汇率编码为整数 -> (priceFloat * (10^decimal)).
- `symbol` - 代币对的符号，例如 `BSV_USDC`.

最后，我们将解析的值包装在自定义类型 `ExchangeRate` 中，并返回它。这是类型的定义：

```ts
type ExchangeRate = {
    timestamp: bigint
    price: bigint
    symbol: ByteString
}
```

现在我们可以验证数据。首先，我们检查汇率的时间戳是否在我们指定的范围内：

```ts
assert(
    exchangeRate.timestamp >= this.timestampFrom,
    'Timestamp too early.'
)
assert(
    exchangeRate.timestamp <= this.timestampTo,
    'Timestamp too late.'
)
```

此外，我们检查汇率是否实际上是针对正确的代币对：

```ts
assert(exchangeRate.symbol == this.symbol, 'Wrong symbol.')
```

最后，在拥有所有必要信息后，我们可以选择获胜者并检查他们的签名：

```ts
const winner =
    exchangeRate.price >= this.targetPrice
        ? this.alicePubKey
        : this.bobPubKey
assert(this.checkSig(winnerSig, winner))
```

我们可以看到，如果达到价格目标，只有 Alice 能够解锁资金，如果没有，那么只有 Bob 能够这样做。


## 结论

恭喜！您已经完成了预言机教程！

完整的代码以及 [测试](https://github.com/sCrypt-Inc/boilerplate/blob/master/tests/priceBet.test.ts) 可以在 sCrypt 的 [boilerplate 仓库](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/priceBet.ts) 中找到。

