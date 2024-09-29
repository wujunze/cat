---
title: "将现有的 FT 转移到智能合约"
sidebar_position: 1
---

假设你想解锁一个现有的 UTXO，它携带一个 FT 到智能合约。

如果你想解锁一个特定的 UTXO，你可以这样做：

```ts
HashLockFT.loadArtifact();
...
// 初始化接收合约。
const message = toByteString('super secret', true);
const hash = sha256(message);
const recipient = new HashLockFT(tick, max, lim, dec, hash);
await recipient.connect(getDefaultSigner());

// 从 UTXO 创建 P2PKH 对象
// 注意：你不能使用 BSV21P2PKH.getLatestInstance 用于 BSV-20，它只适用于 NFT。
const utxo: UTXO = ...
const p2pkh = BSV21P2PKH.fromUTXO(utxo);
await p2pkh.connect(getDefaultSigner());

// 解锁它并转移它携带的 FT。
const { tx: transferTx } = await p2pkh.methods.unlock(
  (sigResps) => findSig(sigResps, `yourPubKey`),
  PubKey(`yourPubKey`.toByteString()),
  {
    transfer: recipient,
    pubKeyOrAddrToSign: `yourPubKey`,
  } as OrdiMethodCallOptions<BSV21P2PKH>
);

console.log("Transferred FT: ", transferTx.id);
```

或者，你可以解锁多个 FT UTXO 并将它们发送到智能合约。使用 `getBSV20` 函数，你可以轻松获取给定 Ordinal 钱包地址的 FT UTXO。

```ts
// ... 初始化接收合约

// 获取给定 Ordinal 地址的 FT UTXO。
// 注意：你不能使用 BSV21P2PKH.getLatestInstance 用于 BSV-21，它只适用于 NFT。
const bsv20P2PKHs = await BSV21P2PKH.getBSV20(tokenId, `your ordinal address`);

await Promise.all(bsv20P2PKHs.map((p) => p.connect(signer)));

// 构造接收合约
const recipients: Array<FTReceiver> = [
  {
    instance: new HashLockFTV2(tokenId, amount, dec, sha256(message)),
    amt: 6n,
  },
];

// 转移
const { tx, nexts } = await BSV20V2P2PKH.transfer(
  bsv20P2PKHs,
  signer,
  recipients
);

console.log("Transferred FT: ", transferTx.id);
```

## 处理找零

注意，上述机制与常规比特币转账非常相似。如果输入的 FT 数量超过接收者数量，剩余的将作为找零转移回 Ordinal 地址。

你可以使用方法调用选项 `tokenChangeAddress` 自定义地址：

```ts
const { tx: transferTx } = await p2pkh.methods.unlock(
  (sigResps) => findSig(sigResps, `yourPubKey`),
  PubKey(`yourPubKey`.toByteString()),
  {
    transfer: recipient,
    pubKeyOrAddrToSign: `yourPubKey`,
    tokenChangeAddress: yourOrdinalAddress
  } as OrdiMethodCallOptions<BSV21P2PKH>
)
```

你可以通过使用 `skipTokenChange` 选项完全跳过找零。但请小心！任何剩余的代币在这种情况下都将被视为 **销毁**：
```ts
const { tx: transferTx } = await p2pkh.methods.unlock(
  (sigResps) => findSig(sigResps, `yourPubKey`),
  PubKey(`yourPubKey`.toByteString()),
  {
    transfer: recipient,
    pubKeyOrAddrToSign: `yourPubKey`,
    skipTokenChange: true
  } as OrdiMethodCallOptions<BSV21P2PKH>
)
```

# `buildStateOutputFT`

任何 `BSV20` 或 `BSV21` 实例都包含 `buildStateOutputFT` 方法。与常规的 `buildStateOutput` 方法不同，此方法在后续输出中铭刻了适当的 [BSV-20 转移铭文](https://docs.1satordinals.com/bsv20#transfer-all-modes)。该方法以要转移的代币数量作为参数。

以下是一个 FT 计数器合约的示例：

```ts
class CounterFTV2 extends BSV21 {

    @prop(true)
    counter: bigint

    constructor(id: ByteString, sym: ByteString, max: bigint, dec: bigint, counter: bigint) {
        super(id, sym, max, dec)
        this.init(...arguments)
        this.counter = counter
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public inc(tokenAmt: bigint) {
        this.counter++

        const outputs = this.buildStateOutputFT(tokenAmt)

        assert(
            this.ctx.hashOutputs == hash256(outputs),
            'hashOutputs check failed'
        )
    }

}
```

每次迭代将包含通过 `tokenAmt` 传递的代币数量。请注意，这个数量不能大于前一次迭代中的数量。如果数量小于前一次迭代中的数量，剩余的代币将作为找零返回。