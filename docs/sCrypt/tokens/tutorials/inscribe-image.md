---
sidebar_position: 1
---

# 教程 1: 铭刻图像

## 概述

在本教程中，我们将使用合同 [HashLock](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/hashLock.ts) 作为示例，介绍如何铭刻图像，将其锁定在智能合约中。它可以通过调用合约来转移。

:::note
在铭刻图像之前，您的钱包必须有资金。
:::

首先，您在项目中安装 `scrypt-ord` 作为依赖项。

```bash
npm install scrypt-ord
```

## 合约

新的合约 `HashLockNFT` 几乎与之前的 [实现](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/hashLock.ts) 相同，只是它必须从 `OrdinalNFT` 继承，而不是从 `SmartContract` 继承，后者来自 `scrypt-ord` 包。

```ts
class HashLockNFT extends OrdinalNFT {
    ...
}
```

它还在合约中存储一个哈希值。当调用公有方法 `unlock` 并提供正确的哈希预图像时，它将成功解锁。

```ts
class HashLockNFT extends OrdinalNFT {
    @prop()
    hash: Sha256
    
    ...
    
    @method()
    public unlock(message: ByteString) {
        assert(this.hash == sha256(message), 'hashes are not equal')
    }
}
```

基类 `OrdinalNFT` 封装了处理 ordinals 的帮助函数。如果您想创建自己的控制 Ordinal NFT 的合约，您必须从它继承。

## 铭刻图像

我们首先创建合约 `HashLockNFT` 的实例。接下来，我们调用实例上的 `inscribeImage` 来铭刻图像。

```ts
// 创建合约实例
const message = toByteString('Hello sCrypt', true)
const hash = sha256(message)
const hashLock = new HashLockNFT(hash)
...
// 将图像铭刻到合约中
const image = readImage()
const mintTx = await hashLock.inscribeImage(image, 'image/png')
```

执行命令 `npx ts-node tests/examples/inscribeImage.ts` 运行此示例。

![](/sCrypt/inscribe-image-01.png)

然后，您可以在区块浏览器上检查您的铭文。

![](/sCrypt/inscribe-image-02.png)

点击 `Decode`.

![](/sCrypt/inscribe-image-03.png)

现在，铭文被锁定到合约实例中，由智能合约控制，这意味着只有在哈希锁被解锁时才能转移。

这与使用 P2PKH 地址接收铭文不同，在这种情况下，铭文由私钥控制。


## 转移铭文

合约实例持有铭文，我们将其转移到比特币地址。

### 第一步 创建接收者实例

类 `OrdiNFTP2PKH` 表示一个可以持有铭文的地址。它的构造函数接受一个参数，即接收地址。

```ts
const receiver = new OrdiNFTP2PKH(Addr(address.toByteString()))
```

### 第二步 调用合约

与 [合约调用](../../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-call) 之前一样，我们调用 `unlock` 的 `HashLockNFT` 如下。

```ts
const { tx: transferTx } = await hashLock.methods.unlock(
    message,
    {
        transfer: receiver,  // <-----
    } as OrdiMethodCallOptions<HashLockNFT>
)
```

我们传递接收者实例到 `transfer` 的结构体 `OrdiMethodCallOptions`.


## 结论

太好了！您已经完成了如何使用智能合约铭刻和转移 1Sat Ordinal 的教程。

完整的 [合约](https://github.com/sCrypt-Inc/scrypt-ord/blob/master/tests/contracts/hashLockNFT.ts) 和 [示例](https://github.com/sCrypt-Inc/scrypt-ord/blob/master/tests/examples/inscribeImage.ts) 可以在 sCrypt 的 [仓库](https://github.com/sCrypt-Inc/scrypt-ord) 中找到。
