# BSV 子模块

sCrypt 导出了一个名为 `bsv` 的子模块，这是一个接口，帮助你管理比特币区块链的底层事务，例如创建密钥对、构建、签名和序列化比特币交易等。

在 sCrypt 的上下文中，`bsv` 子模块主要用于管理密钥对和定义自定义交易构建器，正如在[如何编写合约](https://docs.scrypt.io/how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx)一节中所演示的那样。

本节的目标是引导你了解使用 `bsv` 子模块的基础知识。

## 导入

你可以这样导入 bsv 子模块：

```typescript
import { bsv } from 'scrypt-ts'
```

## 私钥

PrivateKey 对象基本上是一个 256 位整数的包装器。

你可以通过随机值生成一个比特币私钥（针对 mainnet）：

```typescript
const privKey = bsv.PrivateKey.fromRandom()
// 等同于：const privKey = bsv.PrivateKey.fromRandom(bsv.Network.mainnet)
```

要为测试网络（也称为 testnet）创建私钥，可以这样做：

```typescript
const privKey = bsv.PrivateKey.fromRandom(bsv.Networks.testnet)
```

主网和测试网密钥的主要区别在于它们的序列化方式。查看这个 [BitcoinSV 维基页面关于 WIFs](https://wiki.bitcoinsv.io/index.php/Wallet_Import_Format_(WIF))，以获取更多细节。

你也可以通过序列化的密钥创建 `PrivateKey` 对象：

```typescript
const privKey = bsv.PrivateKey.fromWIF('cVDFHtcTU1wn92AkvTyDbtVqyUJ1SFQTEEanAWJ288xvA7TEPDcZ')
const privKey2 = bsv.PrivateKey.fromString('e3a9863f4c43576cdc316986ba0343826c1e0140b0156263ba6f464260456fe8')
```

如下方式查看私钥的十进制值：

```typescript
console.log(privKey.bn.toString())
```

:::danger `注意`
私钥应谨慎存储，且绝不应公开披露。否则可能导致资金损失。
:::

## 公钥

公钥是从私钥派生的，可以公开共享。在数学上，公钥是比特币使用的默认椭圆曲线 [`SECP256K1`](https://wiki.bitcoinsv.io/index.php/Secp256k1) 上的一个点。它是基点乘以私钥的值。

你可以通过以下方式获取对应于私钥的公钥：

```typescript
const privKey = bsv.PrivateKey.fromRandom(bsv.Networks.testnet)
const pubKey = privKey.toPublicKey()
```

与私钥类似，你可以序列化和反序列化公钥：

```typescript
const pubKey = bsv.PublicKey.fromHex('03a687b08533e37d5a6ff5c8b54a9869d4def9bdc2a4bf8c3a5b3b34d8934ccd17')
console.log(pubKey.toHex())
// 03a687b08533e37d5a6ff5c8b54a9869d4def9bdc2a4bf8c3a5b3b34d8934ccd17
```

## 地址

你可以从私钥或公钥获取比特币地址：

```typescript
const privKey = bsv.PrivateKey.fromRandom(bsv.Networks.testnet)
const pubKey = privKey.toPublicKey()

console.log(privKey.toAddress().toString())
// mxRjX2uxHHmS4rdSYcmCcp2G91eseb5PpF
console.log(pubKey.toAddress().toString())
// mxRjX2uxHHmS4rdSYcmCcp2G91eseb5PpF
```

阅读此 [BitcoinSV 维基页面](https://wiki.bitcoinsv.io/index.php/Bitcoin_address) 以获取有关比特币地址构建方式的更多信息。

## 哈希函数

`bsv` 子模块提供了比特币中常用的各种哈希函数。你可以这样使用它们：

```typescript
const hashString = bsv.crypto.Hash.sha256(Buffer.from('this is the data I want to hash')).toString('hex')
console.log(hashString)
// f88eec7ecabf88f9a64c4100cac1e0c0c4581100492137d1b656ea626cad63e3
```

bsv 子模块中可用的哈希函数如下：

| 哈希函数 | 描述 | 输出大小 (字节) |
|---------|------|----------------|
| sha256  | SHA-256 哈希算法 | 32 |
| sha256sha256 | 两次sha256哈希,用于用于区块和交易| 32 |
| sha512  | SHA-512 哈希算法 | 64 |
| sha1    | SHA-1 哈希算法 | 20 |
| ripemd160 | RIPEMD-160 哈希算法 | 20 |
| sha256ripemd160 | SHA256 哈希的 RIPEMD160 哈希。用于比特币地址 | 32 |

但是请注意，这些 [bsv.js 哈希函数](https://github.com/moneybutton/bsv/blob/master/lib/hash.js) 不应与 [sCrypt 的原生哈希函数](ttps://docs.scrypt.io/reference/#hashing-functions) 混淆。这些函数不能在智能合约方法中使用。

## 构建交易

bsv 子模块提供了一个灵活的系统来构建比特币交易。用户可以定义脚本、交易输入和输出，以及包括其元数据的完整交易。有关比特币交易格式的完整描述，请阅读 [BitcoinSV 维基页面](https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions)。

作为练习，让我们从头开始构建一个简单的 [P2PKH](https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions#Pay_to_Public_Key_Hash_.28P2PKH.29) 交易并对其进行签名。

:::tip `提示`
正如你将在这些文档中进一步看到的，在常规的智能合约开发工作流程中，大多数这些步骤都不需要，因为 sCrypt 已经为你完成了大量繁重的工作。本节更多地是深入了解底层发生的事情。
:::

你可以这样创建一个空交易：

```typescript
let tx = new bsv.Transaction()
```

因为交易需要一个提供资金的输入，我们可以使用 `from` 函数添加一个，解锁指定的 [UTXO](https://wiki.bitcoinsv.io/index.php/UTXO)：

```typescript
tx.from({
    // 你想要解锁的输出所在的交易 ID：
    txId: 'f50b8c6dedea6a4371d17040a9e8d2ea73d369177737fb9f47177fbda7d4d387',
    // UTXO 的索引：
    outputIndex: 0,
    // UTXO 的脚本。在本例中，它是一个常规的 P2PKH 脚本：
    script: bsv.Script.fromASM('OP_DUP OP_HASH160 fde69facc20be6eee5ebf5f0ae96444106a0053f OP_EQUALVERIFY OP_CHECKSIG').toHex(),
    // UTXO 中锁定的金额（聪）：
    satoshis: 99904
})
```

现在，交易需要一个输出，在我们的示例中，将支付到地址 `mxXPxaRvFE3178Cr6KK7nrQ76gxjvBQ4UQ：`

```typescript
tx.addOutput(
    new bsv.Transaction.Output({
        script: bsv.Script.buildPublicKeyHashOut('mxXPxaRvFE3178Cr6KK7nrQ76gxjvBQ4UQ'),
        satoshis: 99804,
    })
)
```

注意，输出值比我们正在解锁的 UTXO 的值少 100 聪。这个差额是[交易费](https://wiki.bitcoinsv.io/index.php/Transaction_fees)（有时也称为“矿工费”）。当矿工挖掘区块时，交易费由矿工收取，因此添加交易费基本上起到了激励矿工将你的交易包含在区块中的作用。

你应该支付的交易费用取决于费率和交易的字节数。通过向交易添加额外的输出，我们可以控制实际支付的交易费用。这个输出称为找零输出。通过调整找零输出的金额，我们可以在满足矿工需求的同时尽可能少地支付交易费用。

你可以直接调用 `change` 函数，将找零输出添加到交易中，而无需自己计算找零金额。这个函数非常智能，当所有输入和输出之间的差额超过所需的交易费时，它才会添加找零输出。

```typescript
tx.change('n4fTXc2kaKXHyaxmuH5FTKiJ8Tr4fCPHFy')
```

对于费率，你也可以调用 `feePerKb` 进行更改。

```typescript
tx.feePerKb(50)
```

### 签名

现在我们已经构建了交易，是时候签名了。首先，我们需要封装交易，使其准备好签名。然后我们调用 `sign` 函数，它接受能够解锁我们传递给 `from` 函数的 UTXO 的私钥。在我们的示例中，这是对应于地址 `n4fTXc2kaKXHyaxmuH5FTKiJ8Tr4fCPHFy` 的私钥：

```typescript
tx = tx.seal().sign('cNSb8V7pRt6r5HrPTETq2Li2EWYEjA7EcQ1E8V2aGdd6UzN9EuMw')
```

完成了！这将向交易的输入脚本添加必要的数据：我们的签名密钥的签名和公钥。现在，我们的交易已准备好发布到区块链。

你可以这样序列化交易：

```typescript
console.log(tx.serialize())
```

要广播交易，你可以使用任何你喜欢的提供商。出于演示和测试目的，你可以将序列化的交易粘贴到[这里](https://test.whatsonchain.com/broadcast)。

### OP_RETURN 脚本

如果你想在链上发布一些任意数据，而没有任何锁定逻辑，你可以使用包含 [OP_RETURN](https://wiki.bitcoinsv.io/index.php/OP_RETURN) 脚本的交易输出。

一个以 ASM 格式编写的 OP_RETURN 脚本示例如下：

```text
OP_FALSE OP_RETURN 734372797074
```

操作码 `OP_FALSE OP_RETURN` 将使脚本无法被花费。在它们之后，我们可以插入任意的数据块。
`734372797074` 实际上是字符串 `sCrypt` 编码为 `utf-8` 十六进制字符串。

```typescript
console.log(Buffer.from('sCrypt').toString('hex'))
// 734372797074
```

一个 OP_RETURN 脚本也可以包含多个数据块：

```text
OP_FALSE OP_RETURN 48656c6c6f 66726f6d 734372797074
```

`bsv` 子模块提供了一个方便的函数来构建此类脚本：

```typescript
const opRetScript: bsv.Script = bsv.Script.buildSafeDataOut(['Hello', 'from', 'sCrypt'])
```

我们可以将生成的 `bsv.Script` 对象添加到输出，如上文构建交易[所示](#构建交易)。

## ECIES

ECIES（椭圆曲线集成加密方案）是一种混合加密方案，结合了公钥密码学和对称加密的优点。它允许两个各自拥有椭圆曲线密钥对的参与者交换加密消息。bsv 子模块提供了 `ECIES` 类，以便在你的 sCrypt 项目中轻松实现此加密方案。

以下是使用方法：

### 加密

要使用 ECIES 加密消息：

1. 首先，创建一个 `ECIES` 类的实例。
2. 使用 `publicKey` 方法指定接收者的公钥。
3. 调用 `encrypt` 方法，传入你想要加密的消息。

```typescript
const msg = 'Hello sCrypt!'
const encryption = new bsv.ECIES()
encryption.publicKey(recipientPublicKey)
const ciphertext = encryption.encrypt(msg)
```

在此示例中，`recipientPublicKey` 是接收者的私钥（对应于用于加密的公钥）。

### 解密

要解密使用 ECIES 加密的消息：

1. 创建一个 `ECIES` 类的实例。
2. 使用 `privateKey` 方法指定接收者的私钥。
3. 调用 `decrypt` 方法，传入你想要解密的消息。

```typescript
const decryption = new bsv.ECIES()
decryption.privateKey(recipientPrivateKey)
const msg = decryption.decrypt(ciphertext)
console.log(msg)
// "Hello sCrypt!"
```

在此示例中，`recipientPrivateKey` 是接收者的私钥。

## 参考资料

- 查看完整的 [`bsv` 子模块参考](https://docs.scrypt.io/reference/modules/bsv)，获取其提供的函数列表。
- 由于 `bsv` 子模块基于 MoneyButton 的库实现，请观看他们的[视频教程系列](https://www.youtube.com/watch?v=bkGiCjYBpJE&list=PLwj1dNv7vWsMrjrWeiQEelbKTI3Lrmvqp&index=1)。请注意，某些内容可能略有不同，因为这些视频现在至少已有 5 年历史。