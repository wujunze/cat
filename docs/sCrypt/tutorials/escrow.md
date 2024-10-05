---
sidebar_position: 7
---

# 教程 7: 托管

## 概述

在本教程中，我们将介绍如何创建具有一些高级功能的托管智能合约，例如多个仲裁员的要求和截止日期，在此之后，买家可以获得退款。

### 什么是托管智能合约？

托管智能合约是一种数字协议，使用比特币在各方之间进行安全的、无需信任的交易。

在传统的托管服务中，受信任的第三方持有资产——如金钱、财产或商品——代表交易各方。只有在满足特定条件时，资产才会释放。

在托管智能合约的情况下，"第三方"是区块链上编程的智能合约本身。合约中写入了交易的条件，如果这些条件得到满足，合约就可以解锁，接收方就会得到付款。

### 我们的实现

我们将实现一种特定的托管类型，称为多重签名托管。该合同的参与者是买家（Alice）、卖家（Bob）和一名或多名仲裁员。

假设 Alice 想从 Bob 那里购买一件特定的商品。他们不信任对方，所以他们决定使用一个托管智能合约。他们选择一名或多名仲裁员，他们信任他们。仲裁员的工作是验证物品是否按要求交付。如果满足条件，合约将支付给卖家 Bob。在相反的情况下，Alice 可以获得退款。此外，如果仲裁员没有响应，Alice 在一段时间后也有资格获得退款。

## 合约属性

让我们声明我们的智能合约的属性：

```ts
// 选择的仲裁员数量。
static readonly N_ARBITERS = 3

// 买家（Alice）地址。
@prop()
readonly buyerAddr: Addr

// 卖家（Bob）地址。
@prop()
readonly sellerAddr: Addr

// 仲裁员公钥。
@prop()
readonly arbiters: FixedArray<PubKey, typeof MultiSigEscrow.N_ARBITERS>

// 合约截止日期 nLocktime 值。
// 可以是时间戳或块高度。
@prop()
readonly deadline: bigint
```

## 公共方法

### `confirmPayment`

我们的合约的第一个方法是 `confirmPayment`。如果物品按要求交付，将调用此公共方法。

该方法将买方的签名、她的公钥和仲裁员的签名作为输入。

```ts
// 买家和仲裁员确认物品已交付。
// 卖家收到付款。
@method(SigHash.ANYONECANPAY_SINGLE)
public confirmPayment(
    buyerSig: Sig,
    buyerPubKey: PubKey,
    arbiterSigs: FixedArray<Sig, typeof MultiSigEscrow.N_ARBITERS>
) {
    // 验证买方签名。
    assert(
        pubKey2Addr(buyerPubKey) == this.buyerAddr,
        'invalid public key for buyer'
    )
    assert(
        this.checkSig(buyerSig, buyerPubKey),
        'buyer signature check failed'
    )
    // 验证仲裁员签名。
    assert(
        this.checkMultiSig(arbiterSigs, this.arbiters),
        'arbiters checkMultiSig failed'
    )

    // 确保卖家收到付款。
    const amount = this.ctx.utxo.value
    const out = Utils.buildPublicKeyHashOutput(this.sellerAddr, amount)
    assert(hash256(out) == this.ctx.hashOutputs, 'hashOutputs mismatch')
}
```

该方法验证所有签名是否正确，并确保卖家收到资金。

### `refund`

接下来，我们实现公共方法 `refund`。如果交付不成功或物品有问题，买家有资格获得退款。

该方法将买方的签名、他们的公钥和仲裁员的签名作为输入。

```ts
// 常规退款。需要仲裁员同意。
@method()
public refund(
    buyerSig: Sig,
    buyerPubKey: PubKey,
    arbiterSigs: FixedArray<Sig, typeof MultiSigEscrow.N_ARBITERS>
) {
    // 验证买方签名。
    assert(
        pubKey2Addr(buyerPubKey) == this.buyerAddr,
        'invalid public key for buyer'
    )
    assert(
        this.checkSig(buyerSig, buyerPubKey),
        'buyer signature check failed'
    )
    // 验证仲裁员签名。
    assert(
        this.checkMultiSig(arbiterSigs, this.arbiters),
        'arbiters checkMultiSig failed'
    )

    // 确保买家获得退款。
    const amount = this.ctx.utxo.value
    const out = Utils.buildPublicKeyHashOutput(this.buyerAddr, amount)
    assert(hash256(out) == this.ctx.hashOutputs, 'hashOutputs mismatch')
}
```

该方法验证所有签名是否正确，并确保买家获得退款。

### `refundDeadline`

最后，我们实现 `refundDeadline` 方法。在指定的合约截止日期之后，可以调用此方法。在截止日期之后，买家可以获得退款，即使没有仲裁员同意。

该方法将买方的签名和她的公钥作为输入。

```ts
// 截止日期。如果达到，买家获得退款。
@method()
public refundDeadline(buyerSig: Sig, buyerPubKey: PubKey) {
    assert(
        pubKey2Addr(buyerPubKey) == this.buyerAddr,
        'invalid public key for buyer'
    )
    assert(
        this.checkSig(buyerSig, buyerPubKey),
        'buyer signature check failed'
    )

    // 要求 nLocktime 启用 https://wiki.bitcoinsv.io/index.php/NLocktime_and_nSequence
    assert(
        this.ctx.sequence < UINT_MAX,
        'require nLocktime enabled'
    )

    // 检查是否使用块高度。
    if (this.deadline < LOCKTIME_BLOCK_HEIGHT_MARKER) {
        // 强制 nLocktime 字段也使用块高度。
        assert(
            this.ctx.locktime < LOCKTIME_BLOCK_HEIGHT_MARKER
        )
    }
    assert(this.ctx.locktime >= this.deadline, 'deadline not yet reached')

    // 确保买家获得退款。
    const amount = this.ctx.utxo.value
    const out = Utils.buildPublicKeyHashOutput(this.buyerAddr, amount)
    assert(hash256(out) == this.ctx.hashOutputs, 'hashOutputs mismatch')
}
```

该方法检查买方的签名有效性。它还检查交易 nLocktime 值，以确保在截止日期之后只能由矿工接受。

## 结论

恭喜！您已经完成了托管教程！

完整的代码可以在 [sCrypt 样板库](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/multisigEscrow.ts) 中找到。
