---
sidebar_position: 3
---

# 同质化代币 - FTs

与 NFTs 一样，`scrypt-ord` 也支持同质化代币。底层利用了 [`bsv-20` 协议](https://docs.1satordinals.com/bsv20)。

BSV-20 是比特币 SV 区块链上创建同质化代币的协议。同质化代币是可互换的，可以代表各种资产，例如货币、证券和游戏内物品。

`scrypt-ord` 支持 `BSV-20` 和 `BSV-21` 两种同质化代币协议。


## `BSV-20`

使用 `bsv-20` 的第一个版本创建的代币必须通过 **铭刻** 铭文进行初始化，指定代币的符号、数量和铸币限制。更多信息，请参阅 [1Sat 文档](https://docs.1satordinals.com/bsv20#v1-mint-first-is-first-mode)。


要创建一个 v1 代币智能合约，请让它继承 `BSV20` 类：

```ts
class HashLockFT extends BSV20 {
    @prop()
    hash: Sha256

    constructor(tick: ByteString, max: bigint, lim: bigint, dec: bigint, hash: Sha256) {
        super(tick, max, lim, dec)
        this.init(...arguments)
        this.hash = hash
    }

    @method()
    public unlock(message: ByteString) {
        assert(this.hash == sha256(message), 'hashes are not equal')
    }
}
```

如上所示，继承 `BSV20` 的合约构造函数需要所有代币部署所需的信息，后跟您要用于合约的参数（在这个特定的例子中是 `hash`）。
每个继承 `BSV20V1` 类的构造函数也必须调用实例的 `init` 方法并传递构造函数的参数。重要的是在 `super` 调用之后调用这个函数。


### 部署

以下代码演示了如何部署新的代币：

```ts
HashLockFT.loadArtifact();

const tick = toByteString("DOGE", true);
const max = 100000n;
const lim = max / 10n;
const dec = 0n

const hashLock = new HashLockFT(
  tick,
  max,
  lim,
  dec,
  sha256(toByteString("secret0", true))
);
await hashLock.connect(getDefaultSigner());
await hashLock.deployToken();
```

### 铸造和转移

一旦部署交易成功广播，代币就可以进行铸造。

以下代码演示了如何铸造一些代币：

```ts
// Minting
const amt = 1000n;
const mintTx = await hashLock.mint(amt);
console.log("Minted tx: ", mintTx.id);
```

注意，如果铸造的数量超过了上述限制，或者代币已经被完全铸造，1Sat 索引器将不会认为交易有效。

铸造的代币可以像 [常规 sCrypt 合约](../../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-call) 一样通过调用合约进行转移：

```ts
// 转移
for (let i = 0; i < 3; i++) {
  // 接收合约。
  // 因为这个特定的合约不强制后续输出，
  // 它可以是任何其他合约或只是一个 P2PKH。
  const receiver = new HashLockFT(
    tick,
    max,
    lim,
    dec,
    sha256(toByteString(`secret${i + 1}`, true))
  );
  const recipients: Array<FTReceiver> = [
    {
      instance: receiver,
      amt: 10n,
    },
  ];

  // 解锁并转移。
  const { tx } = await hashLock.methods.unlock(
    toByteString(`secret:${i}`, true),
    {
      transfer: recipients,
    }
  );
  console.log("Transfer tx: ", tx.id);
  
  // 更新实例以进行下一次迭代。
  hashLock = recipients[0].instance as HashLockFT;
}
```

注意，新的接收合约实例作为名为 `transfer` 的参数传递给部署实例的调用。 `transfer` 参数是继承 `BSV20` 的合约实例数组。


## `BSV-21`

`BSV-21` 代币协议的第二版简化了铸造新的可替代代币的过程。在这个版本中，部署和铸造在单个交易中完成。与 `BSV-20` 不同，`BSV-21` 没有代币代号字段。代币通过 `id` 字段来识别，该字段是代币铸造时的交易 ID 和输出索引，格式为 `<txid>_<vout>`。

更多信息，请参阅 [1Sat 文档](https://docs.1satordinals.com/bsv20#new-in-v2-tickerless-mode)。

要创建一个 `BSV-21` 代币智能合约，让它继承 `BSV21` 类：

```ts
class HashLockFTV2 extends BSV21 {
    @prop()
    hash: Sha256

    constructor(id: ByteString, sym: ByteString, max: bigint, dec: bigint, hash: Sha256) {
        super(id, sym, max, dec)
        this.init(...arguments)
        this.hash = hash
    }

    @method()
    public unlock(message: ByteString) {
        assert(this.hash == sha256(message), 'hashes are not equal')
    }
}
```

### 部署+铸造

在 `BSV-20` 中，代币在单独的交易中部署和铸造，但在 `BSV-21` 中，所有代币都在一个交易中部署和铸造。以下代码演示了如何部署新的 `BSV-21` 代币：

```ts
HashLockFTV2.loadArtifact()

const sym = toByteString('sCrypt', true)
const max = 10000n  // 代币总量。
const dec = 0n      // 小数精度。

// 由于我们无法在部署时知道代币部署交易的事务 ID，因此它是空的。
const hashLock = new HashLockFTV2(
    toByteString(''),
    sym,
    max,
    dec,
    sha256(toByteString('super secret', true))
)
await hashLock.connect(getDefaultSigner())

const tokenId = await hashLock.deployToken()
console.log('token id: ', tokenId)
```

v2 支持在部署代币时添加额外的元信息，例如：

```ts
const tokenId = await hashLock.deployToken({
  icon: "/content/<Inscription Origin OR B protocol outpoint>"
})
console.log('token id: ', tokenId)
```


整个代币供应量在第一个交易中铸造，谁可以解锁部署 UTXO 将获得整个供应量的控制权。此外，智能合约本身可以强制执行代币分配的规则。

### 转移

铸造的代币可以像 [常规 sCrypt 合约](../../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-call) 一样通过调用合约进行转移：

```ts
// 转移
for (let i = 0; i < 3; i++) {
  // 接收合约。
  // 因为这个特定的合约不强制后续输出，
  // 它可以是任何其他合约或只是一个 P2PKH。
  const receiver = new HashLockFTV2(
    toByteString(tokenId, true),
    sym,
    max,
    dec,
    sha256(toByteString(`secret${i + 1}`, true))
  );
  const recipients: Array<FTReceiver> = [
    {
      instance: receiver,
      amt: 10n,
    },
  ];

  // 解锁并转移。
  const { tx } = await hashLock.methods.unlock(
    toByteString(`secret:${i}`, true),
    {
      transfer: recipients,
    }
  );
  console.log("Transfer tx: ", tx.id);
  
  // 更新实例以进行下一次迭代。
  hashLock = recipients[0].instance as HashLockFTV2;
}
```

新的接收合约实例作为 `transfer` 参数传递给部署实例的调用。 `transfer` 参数由继承 `BSV21` 的合约实例数组组成。

---
