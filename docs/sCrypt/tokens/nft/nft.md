---
sidebar_position: 2
---

# 非同质化代币 - NFTs


要创建一个智能合约来承载 NFT，请让你的智能合约继承 `OrdinalNFT` 类：

```ts
import { method, prop, assert, ByteString, sha256, Sha256 } from "scrypt-ts";
import { OrdinalNFT } from "scrypt-ord";

export class HashLockNFT extends OrdinalNFT {
  @prop()
  hash: Sha256;

  constructor(hash: Sha256) {
    super();
    // 重要：在 `super()` 语句之后调用 `init` 方法。
    this.init(...arguments);
    this.hash = hash;
  }

  @method()
  public unlock(message: ByteString) {
    assert(this.hash === sha256(message), "hashes are not equal");
  }
}
```

上面的合约表示一个 NFT，可以通过提供哈希值的秘密前图像来解锁 / 转移。
每个继承 `OrdinalNFT` 类的构造函数也必须调用实例的 `init` 方法并传递构造函数的参数。重要的是在 `super` 调用之后调用这个函数。


## 铭刻

以下代码演示了如何部署/铭刻 NFT 合约：

```ts
HashLockNFT.loadArtifact();

const text = "Hello sCrypt and 1Sat Ordinals";

const message = toByteString('secret string', true);
const hash = sha256(message);

const instance = new HashLockNFT(hash);

const signer = getDefaultSigner();
await instance.connect(signer);

const inscriptionTx = await instance.inscribeText(text);
console.log("Inscribed NFT: ", inscriptionTx.id);
```

The `inscribeText` first inscribes the locking script with the specified text and then deploys the contract.

Among text the inscription can contain many other types of data. Here's how you can conveniently inscribe an image:

```ts
// ...

const bb = readFileSync(join(__dirname, "..", "..", "logo.png")).toString("base64");

const tx = await instance.inscribeImage(bb, ContentType.PNG);
console.log("Inscribed NFT: ", tx.id);
```

In fact the data type can be arbitrary. It only depends on the Ordinals wallet you're using to support that data type.

```ts
const tx = await instance.inscribe({
  content: `your content in hex`,
  contentType: `your contentType`,
});
console.log("Inscribed NFT: ", tx.id);
```

The value `contentType` 必须是一个 MIME-type 字符串。[`ContentType`](https://github.com/sCrypt-Inc/scrypt-ord/blob/master/src/contentType.ts) 对象包含常见的 MIME-type。

## 转移

你可以通过方法调用参数传递一个 `transfer` 值，轻松地将已部署的 NFT 转移到 Ordinals 地址。

`OrdiNFTP2PKH` 是一个用于持有 ordinals NFT 的 [P2PKH](https://learnmeabitcoin.com/guide/p2pkh) 合约。像一个普通的 P2PKH 合约一样，你需要一个地址来实例化它。

```ts
// ... 从上面的代码中部署

const { tx: transferTx } = await instance.methods.unlock(
    message, 
    {
        transfer: new OrdiNFTP2PKH(
                Addr(recipientAddress.toByteString())
            ),
    }
);

console.log("Transferred NFT: ", transferTx.id);
```

`transfer` 参数可以是任何继承自 `OrdinalNFT` 的合约的单个实例。
