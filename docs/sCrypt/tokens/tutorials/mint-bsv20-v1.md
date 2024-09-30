---
sidebar_position: 3
---

# 教程 3: 铸造 BSV20 代币

## 概述

在本教程中，我们将使用合约 [HashLock](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/hashLock.ts) 作为示例，介绍如何使用 [sCrypt](https://scrypt.io/) 铸造 BSV20 代币（**版本 1**），并使用智能合约转移它。

要启用所有这些功能，您应该在项目中安装 `scrypt-ord` 作为依赖项。

```bash
npm install scrypt-ord
```

## 合约

新的合约 `HashLockFT` 几乎与之前的 [实现](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/hashLock.ts) 相同，除了两个区别。

1. 它必须从 `BSV20V1` 而不是 `SmartContract` 继承。

```ts
class HashLockFT extends BSV20 {
    ...
}
```

2. 构造函数有额外的参数 - `tick`, `max`, `lim`, 和 `dec` - 表示 [BSV20 字段](https://docs.1satordinals.com/bsv20#v1-deploy-first-is-first-mode-only)。

```ts
constructor(tick: ByteString, max: bigint, lim: bigint, dec: bigint, hash: Sha256) {
    super(tick, max, lim, dec)
    this.init(...arguments)
    this.hash = hash
}
```

合约还存储一个哈希值，当调用公共方法 `unlock` 并使用正确的消息时，它将成功解锁。

```ts
class HashLockFT extends BSV20 {
    @prop()
    hash: Sha256
    
    ...
    
    @method()
    public unlock(message: ByteString) {
        assert(this.hash == sha256(message), 'hashes are not equal')
    }
}
```

基类 `BSV20` 封装了处理 BSV20（版本 1）代币的帮助函数。如果您想创建自己的合约，可以从中继承。

## 部署和铸造

对于 BSV20 版本 1，代币必须在铸造之前部署。我们首先创建合约 `HashLockFT` 的实例，然后调用函数 `deployToken` 部署新代币，最后调用 `mint` 将代币铸造到合约实例中。

```ts
// BSV20 字段
const tick = toByteString('HELLO', true)
const max = 100n
const lim = 10n
const dec = 0n
// 创建合约实例
const message = toByteString('Hello sCrypt', true)
const hash = sha256(message)
const hashLock = new HashLockFT(tick, max, lim, dec, hash)
...
// 部署新的 BSV20 代币 $HELLO
await hashLock.deployToken()
// 铸造 10 $HELLO 到合约实例
const mintTx = await hashLock.mint(10n)
```

通常，我们使用 P2PKH 地址接收代币，然后代币由与普通 P2PKH 相同的私钥控制。

在这个例子中，代币被铸造到合约实例中，它由智能合约控制，这意味着只有在哈希锁被解锁时才能转移。

## 转移代币

目前，合约实例持有代币，我们尝试将其转移到一个 P2PKH 地址。

### 第一步：创建接收者实例

类 `BSV20P2PKH` 表示一个可以持有 BSV20 版本 1 代币的 P2PKH 地址。它的构造函数接受 BSV20 字段和一个接收地址作为参数。

```ts
const alice = new BSV20V1P2PKH(tick, max, lim, dec, addressAlice)
const bob = new BSV20V1P2PKH(tick, max, lim, dec, addressBob)
```

### 第二步：调用合约

就像我们之前介绍的 [合约调用](../../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-call) 方法一样，我们调用 `HashLockFT` 的公共方法 `unlock` 如下。

```ts
// 调用合约
const { tx: transferTx } = await hashLock.methods.unlock(message, {
    transfer: [
        {
            instance: alice,
            amt: 2n,
        },
        {
            instance: bob,
            amt: 5n,
        },
    ],
} as OrdiMethodCallOptions<HashLockFT>)
```

这段代码将创建一个转移 2 个代币到 `alice` 和 5 个代币到 `bob` 的事务。

默认的事务生成器将自动在事务中添加代币变更输出。在这个例子中，它将自动添加一个代币变更输出，支付给连接的签名者实例的默认地址。您还可以通过传递值到 struct `OrdiMethodCallOptions` 的键 `tokenChangeAddress` 来指定代币变更地址。

执行命令 `npx ts-node tests/examples/mintBSV20.ts` 来运行这个例子。

![](/sCrypt/mint-bsv20-v1-01.png)

然后，您可以在区块浏览器上检查您的代币转移详情。

![](/sCrypt/mint-bsv20-v1-02.png)

![](/sCrypt/mint-bsv20-v1-03.png)

UTXO 模型是 BSV20 的一个强大特性，我们可以在单个事务中将代币发送给多个接收者，允许我们创建复杂且高效的代币转移。

## 结论

太好了！您已经完成了如何使用智能合约铸造和转移 BSV20 代币的教程。

完整的 [合约](https://github.com/sCrypt-Inc/scrypt-ord/blob/master/tests/contracts/hashLockFT.ts) 和 [示例](https://github.com/sCrypt-Inc/scrypt-ord/blob/master/tests/examples/mintBSV20.ts) 可以在 sCrypt 的 [仓库](https://github.com/sCrypt-Inc/scrypt-ord) 中找到。
