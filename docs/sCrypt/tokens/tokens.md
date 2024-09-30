---
sidebar_position: 1
---

# sCrypt 官方 1Sat Ordinals SDK

sCrypt 提供其官方的 [1Sat Ordinals](https://docs.1satordinals.com/) SDK，名为 [`scrypt-ord`](https://github.com/sCrypt-Inc/scrypt-ord)。

该 SDK 提供了一个易于使用的接口，用于部署和转移 1Sat Ordinals 以及使用 sCrypt 智能合约的强大功能。

它促进了非同质化代币 (NFT) 和同质化代币 (FT) 的智能合约的开发。

你也可以在 [sCrypt](https://inscribe.scrypt.io) 上铭刻 NFT 和 BSV20，
以及一个关于如何直接铭刻的视频指南，可以在 [YouTube](https://youtu.be/IsNINX3pqKI?si=gcnhbKN-sP-7mPJ5) 上找到。

## 安装

我们建议你使用我们的 CLI 工具 [创建一个 sCrypt 项目](../installation.md#the-scrypt-cli-tool)。一旦你设置好项目，只需运行以下命令：

```
npm i scrypt-ord
```

## 基础类

`scrypt-ord` 提供了可以扩展自定义智能合约功能的基类。与通常扩展的 `SmartContract` 类不同，在这里你应该扩展这些基类，以将你的智能合约与 1Sat ordinals 功能集成。

**非同质化代币 (NFTs):**
- `OrdinalNFT`

**同质化代币 (FTs):**
- `BSV20`
- `BSV21`

还有预先制作的标准 1Sat 转移类，使用广泛采用的 `P2PKH` 机制：
- `OrdiNFTP2PKH`
- `BSV20P2PKH`
- `BSV21P2PKH`

假设你希望使用自定义哈希谜题合约锁定一个序数代币，你可以按照以下方式定义智能合约类：

```ts
class HashLockNFT extends OrdinalNFT {
    @prop()
    hash: Sha256

    constructor(hash: Sha256) {
        super()
        this.init(...arguments)
        this.hash = hash
    }

    @method()
    public unlock(message: ByteString) {
        assert(this.hash == sha256(message), 'hashes are not equal')
    }
}
```

要深入探索，请参阅以下相应的子章节：

* [非同质化代币 (NFTs)](nft/nft.md)
* [同质化代币 (FTs)](ft/ft.md)


## `OrdiProvider`

当你使用 sCrypt 1Sat Ordinals SDK 时，我们建议你使用 `OrdiProvider` 作为 [provider](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#provider)。这允许你的交易立即被索引，而不是等待它被挖掘到一个区块中。


```ts
export function getDefaultSigner(): TestWallet {
    return new TestWallet(
        myPrivateKey,
        new OrdiProvider(bsv.Networks.mainnet)
    )
}
```


## 索引器 API

### 主网

- `gorillapool`: https://ordinals.gorillapool.io/api/docs

### 测试网
  
- `gorillapool`: https://testnet.ordinals.gorillapool.io/api/docs
- `scrypt` (only bsv21): https://1sat.scrypt.io/api/docs
