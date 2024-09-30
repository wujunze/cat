---
sidebar_position: 3
---


# 脚本语境

在 UTXO 模型中，验证智能合约的上下文是包含它的 UTXO 和花费它的交易，包括它的输入和输出。在以下示例中，当 `tx1` 的第二个输入是 `tx0` 的第二个输出时（3 个输入和 3 个输出），智能合约的上下文大致是包含它的 UTXO 和 `tx1` 中被圈出的部分。

![scriptContext](/sCrypt/scriptcontext-01.png)

上下文仅包含本地信息。
这与基于账户的区块链（如 Ethereum）不同，后者包含整个区块链的全局状态。
所有智能合约共享一个全局状态会危及可扩展性，因为交易必须顺序处理，从而导致潜在的竞争条件。

这个上下文在 `ScriptContext` 接口中表达。

```ts
export interface ScriptContext {
  // 交易版本号
  version: ByteString,
  // 这个交易输入花费的特定 UTXO
  utxo: UTXO,
  // 所有输入的序列化输出的双 SHA256 哈希
  hashPrevouts: ByteString,
  // 所有输入的序列化输入序列值的双 SHA256 哈希
  hashSequence: ByteString,
  // 交易输入的序列号
  sequence: bigint,
  // 所有输出序列化输出金额的双 SHA256 哈希
  hashOutputs: ByteString,
  // 交易锁定时间
  locktime: bigint,
  // 此输入使用的 SIGHASH 标志
  sigHashType: SigHashType,
  // 获取整个序列化的 sighash 原像
  serialize(): SigHashPreimage,
}

export interface UTXO {
  // 锁定脚本
  script: ByteString,
  // 金额以 satoshis 为单位
  value: bigint,
  // 此 UTXO 引用的 outpoint
  outpoint: Outpoint,
}

export interface Outpoint {
  /** 持有该输出的交易的 txid */
  txid: ByteString,
  /** 特定输出的索引 */
  outputIndex: bigint,
}
```

下表显示了 `ScriptContext` 结构中每个字段的含义。

| 字段  | 描述  |
| ------------- | ------------- |
| [version](https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions#General_format_of_a_Bitcoin_transaction) | 交易版本  |
| utxo.value | 花费此输入的输出的金额  |
| utxo.script | 此 UTXO 的锁定脚本 |
| utxo.outpoint.txid | 被花费的交易的 txid |
| utxo.outpoint.outputIndex | UTXO 在输出中的索引 |
| [hashPrevouts](https://github.com/bitcoin-sv/bitcoin-sv/blob/master/doc/abc/replay-protected-sighash.md#hashprevouts) | 如果未设置 `ANYONECANPAY` [SIGHASH 类型](#sighash-type)，则为所有输入 outpoints 的序列化的双 SHA256。否则，它是一个 `uint256` 的 `0x0000......0000`。 |
| [hashSequence](https://github.com/bitcoin-sv/bitcoin-sv/blob/master/doc/abc/replay-protected-sighash.md#hashsequence) | 如果未设置 `ANYONECANPAY`、`SINGLE` 或 `NONE` [SIGHASH 类型](#sighash-type)，则为所有输入的序列化 sequence 的双 SHA256。否则，它是一个 `uint256` 的 `0x0000......0000`。 |
| [sequence](https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions#Format_of_a_Transaction_Inpu) | 输入的序列号  |
| [hashOutputs](https://github.com/bitcoin-sv/bitcoin-sv/blob/master/doc/abc/replay-protected-sighash.md#hashoutputs) | 如果 [SIGHASH 类型](#sighash-type) 不是 `SINGLE` 也不是 `NONE`，则为所有输出的序列化的双 SHA256。如果 [SIGHASH 类型](#sighash-type) 是 `SINGLE` 并且输入索引小于输出的数量，则为与输入具有相同索引的输出的双 SHA256。否则，它是一个 `uint256` 的 `0x0000......0000`。 |
| [locktime](https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions#General_format_of_a_Bitcoin_transaction) | 交易的锁定时间 |
| [sigHashType](https://wiki.bitcoinsv.io/index.php/SIGHASH_flags) | 签名的 sighash 类型 |

你可以在任何公共 `@method` 中通过 `this.ctx` 直接访问上下文。它可以被视为公共方法在调用时除了其函数参数之外的额外信息。

以下示例访问了花费交易的 [locktime](https://learnmeabitcoin.com/technical/locktime)。合约是一个时间锁，只能在成熟时间之后调用。

```ts
class TimeLock extends SmartContract {
  @prop()
  readonly matureTime: bigint // 可以是时间戳或块高。

  constructor(matureTime: bigint) {
    super(...arguments)
    this.matureTime = matureTime
  }

  @method()
  public unlock() {
    assert(this.ctx.locktime >= this.matureTime, "locktime too low")
  }
}
```

## 访问输入和输出

花费交易的输入和输出不直接包含在 `ScriptContext` 中，而是它们的哈希/摘要。要访问它们，我们可以先构建它们，然后验证哈希到预期的摘要，这确保它们实际上来自花费的交易。

以下示例确保 Alice 和 Bob 从合约中获得 1000 聪。

```ts
class DesignatedReceivers extends SmartContract {
  @prop()
  readonly alice: Addr

  @prop()
  readonly bob: Addr

  constructor(alice: Addr, bob: Addr) {
    super(...arguments)
    this.alice = alice
    this.bob = bob
  }

  @method()
  public payout() {
    const aliceOutput: ByteString = Utils.buildPublicKeyHashOutput(this.alice, 1000n)
    const bobOutput: ByteString = Utils.buildPublicKeyHashOutput(this.bob, 1000n)
    let outputs = aliceOutput + bobOutput

    // 需要一个找零输出
    outputs += this.buildChangeOutput();

    // 确保输出实际上是花费交易的一部分
    assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
  }
}
```

### 前置输出

通过 `ScriptContext` 的 `hashPrevouts` 字段，我们可以访问 Prevouts 的哈希：

> 如果未设置 `ANYONECANPAY` 标志，`hashPrevouts` 是所有输入 outpoints 的序列化的双 SHA256；
> 否则，hashPrevouts 是一个 `uint256` 的 `0x0000......0000`。

我们可以通过 `this.prevouts` 访问完整的 prevouts。

- 如果未设置 `ANYONECANPAY` 标志，`this.prevouts` 的哈希等于 `this.ctx.hashPrevouts`。
- 否则，`this.prevouts` 将为空。

### SIGHASH 类型

[SIGHASH 类型](https://wiki.bitcoinsv.io/index.php/SIGHASH_flags) 决定了哪些部分的交易包含在 `ScriptContext` 中。

![sighashtypes](/sCrypt/scriptcontext-02.png)

默认情况下，它是 `SigHash.ALL`，包括所有输入和输出。你可以通过设置 `@method()` 装饰器的参数来自定义它，如下所示：

```ts
@method(SigHash.ANYONECANPAY_ALL)
public increment() {
  ...
}

@method(SigHash.ANYONECANPAY_NONE)
public increment() {
  ...
}

@method(SigHash.ANYONECANPAY_SINGLE)
public increment() {
  ...
}

```

有 6 种 SIGHASH 类型可供选择：

| SIGHASH 类型 | 功能意义 |
| ------------- | ------------- |
| ALL | 签名所有输入和输出 |
| NONE | 签名所有输入和没有输出 |
| SINGLE | 签名所有输入和具有相同索引的输出 |
| ANYONECANPAY_ALL | 签名自己的输入和所有输出 |
| ANYONECANPAY_NONE | 签名自己的输入和没有输出 |
| ANYONECANPAY_SINGLE | 签名自己的输入和具有相同索引的输出 |

有关更多信息，请参阅 [Sighash 类型](https://docs.scrypt.io/advanced/sighash-type.md) 部分。

### 序列化

你可以选择将 `this.ctx` 转换为 `SigHashPreimage` 对象通过序列化。这可以通过调用 `this.ctx.serialize()` 方法来实现。输出对象遵循在交易签名或验证期间使用的格式。

```text
nVersion of the transaction (4-byte little endian)
hashPrevouts (32-byte hash)
hashSequence (32-byte hash)
outpoint (32-byte hash + 4-byte little endian)
scriptCode of the input (serialized as scripts inside CTxOuts)
value of the output spent by this input (8-byte little endian)
nSequence of the input (4-byte little endian)
hashOutputs (32-byte hash)
nLocktime of the transaction (4-byte little endian)
sighash type of the signature (4-byte little endian)
```

[Source](https://github.com/bitcoin-sv/bitcoin-sv/blob/master/doc/abc/replay-protected-sighash.md#digest-algorithm)

一个值得注意的应用是序列化原像在创建自定义 SigHash 标志中的应用。一个例子是 [SIGHASH_ANYPREVOUT](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/sighashAnyprevout.ts#L34)，它展示了这一过程。

### 调试

请参阅 [如何调试 ScriptContext 失败](https://docs.scrypt.io/advanced/how-to-debug-scriptcontext.md)
