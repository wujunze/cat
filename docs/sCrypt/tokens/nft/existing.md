---
title: "将现有 NFT 转移到智能合约"
sidebar_position: 1
---

假设你想转移一个已经铭刻的现有 NFT，这通常使用 `P2PKH` 锁定。
你可以通过使用 `fromUTXO` 或 `getLatestInstance` 来获取转移所需的所有数据。前者需要已部署 NFT 的当前 UTXO，后者需要 NFT 的 [origin](https://docs.1satordinals.com/readme/terms#origin)。

如果已部署的 NFT 使用常规的 `P2PKH` 锁定，你可以像下面这样解锁它：

```ts
const outpoint = '036718e5c603169b9981a55f276adfa7b5d024616ac95e048b05a81258ea2388_0';

// 从 UTXO 创建一个 P2PKH 对象
const utxo: UTXO = await OneSatApis.fetchUTXOByOutpoint(outpoint);
const p2pkh = OrdiNFTP2PKH.fromUTXO(utxo);
// 或者，从 origin 创建一个 P2PKH 对象
const p2pkh = await OrdiNFTP2PKH.getLatestInstance(outpoint);

// 构造接收智能合约
const message = toByteString('super secret', true);
const hash = sha256(message);
const recipient = new HashLockNFT(hash);
await recipient.connect(getDefaultSigner());

// 解锁已部署的 NFT 并将其发送到接收方的哈希锁定合约
await p2pkh.connect(getDefaultSigner());

const { tx: transferTx } = await p2pkh.methods.unlock(
  (sigResps) => findSig(sigResps, `yourPubKey`),
  PubKey(`yourPubKey`.toByteString()),
  {
    transfer: recipient,
    pubKeyOrAddrToSign: `yourPubKey`,
  } as OrdiMethodCallOptions<OrdiNFTP2PKH>
);

console.log("Transferred NFT: ", transferTx.id);
```

或者，如果 NFT 使用智能合约锁定，即 `HashLockNFT`：

```ts
HashLockNFT.loadArtifact();

// 检索持有 NFT 的 `HashLockNFT` 实例
const nft = await HashLockNFT.getLatestInstance(outpoint);
await nft.connect(getDefaultSigner());

const hash = sha256(toByteString('next super secret', true));
const recipient = new HashLockNFT(hash);
await recipient.connect(getDefaultSigner());

// 将 NFT 发送到接收方
const { tx: transferTx } = await nft.methods.unlock(
  toByteString('super secret', true),
  {
    transfer: recipient,
  }
);

console.log("Transferred NFT: ", transferTx.id);
```

# `buildStateOutputFT`

任何继承自 `OrdinalNFT` 的实例都包含 `buildStateOutputNFT` 方法。与常规的 `buildStateOutput` 方法不同，此方法还会删除锁定脚本中包含的任何铭文数据。这是必要的，因为在状态智能合约中，我们不希望下一个迭代重新铭刻序号。此外，`buildStateOutputNFT` 方法不需要 satoshi 数量参数，因为数量总是 1 个 satoshi。

下面是一个序号计数器的例子：

```ts
class CounterNFT extends OrdinalNFT {

    @prop(true)
    counter: bigint

    constructor(counter: bigint) {
        super()
        this.init(counter)
        this.counter = counter
    }

    @method()
    public incOnchain() {
        this.counter++
        
        ...

        let outputs = this.buildStateOutputNFT()  // 在下一个迭代中不包含铭文。
        outputs += this.buildChangeOutput()
        assert(
            this.ctx.hashOutputs == hash256(outputs),
            'hashOutputs check failed'
        )
    }

}
```

在 [GitHub 上查看完整代码](https://github.com/sCrypt-Inc/scrypt-ord/blob/master/tests/contracts/counterNFT.ts)。
