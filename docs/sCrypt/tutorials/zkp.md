---
sidebar_position: 5
---

# 教程 5: 零知识证明

## 概述

在本教程中，我们将介绍如何创建零知识证明 (ZKP) 并在比特币上使用 sCrypt 验证它。

### 什么是 zk-SNARKS？

SNARK（零知识简洁非交互知识论证）是一种 ZKP，适用于区块链。生成的证明是“简洁”和“非交互”的：证明只有几百字节，可以在恒定时间内和几毫秒内验证，而无需向证明者提出额外问题。这些属性使 zk-SNARK 特别适合区块链，其中链上存储和计算可能很昂贵，发送者经常在发送交易后离线。

一个证明由一个证明者构造，使用一个秘密输入（通常称为“见证”）和一个公共输入。然后，证明者可以使用这个证明作为 sCrypt 智能合约的输入，智能合约可以使用验证密钥和公共输入验证证明的有效性。

![](/sCrypt/zkp-01.png)

[Credit: altoros](https://www.altoros.com/blog/securing-a-blockchain-with-a-noninteractive-zero-knowledge-proof/)


有许多工具可以创建这样的证明，[ZoKrates](https://github.com/sCrypt-Inc/zokrates) 和 [SnarkJS](https://github.com/sCrypt-Inc/snarkjs) 是最受欢迎的。

在这个例子中，我们将使用 ZoKrates。它为开发人员提供了一种类似于 Python 的高级语言，用于编写他们想要证明的计算问题。

我们推荐阅读 [这篇博客文章](https://xiaohuiliu.medium.com/zk-snarks-on-bitcoin-239d96d182bd) 以获得更全面的解释。

## 安装 ZoKrates

运行以下命令安装 [已发布的二进制文件](https://github.com/sCrypt-Inc/zokrates/releases):

```sh
curl -Ls https://scrypt.io/scripts/setup-zokrates.sh | sh -s -
```

或者从源代码构建：

```sh
git clone https://github.com/sCrypt-Inc/zokrates
cd ZoKrates
cargo +nightly build -p zokrates_cli --release
cd target/release
```

## ZoKrates 工作流程

### 1. 设计一个环路

创建一个名为 `factor.zok` 的新 ZoKrates 文件，内容如下：

```python
// p, q 是 n 的因子
def main(private field p, private field q, field n) {
    assert(p * q == n);
    assert(p > 1);
    assert(q > 1);
    return;
}
```

这个简单的电路/程序证明一个人知道一个整数 `n` 的因式分解，而不透露因子。电路有两个私有输入，名为 `p` 和 `q`，一个公共输入，名为 `n`。


### 2. 编译环路

使用以下命令编译环路：

```sh
zokrates compile -i factor.zok
```

这会生成两个文件，分别以二进制和人类可读格式编码环路。

### 3. Setup

这会生成一个证明密钥和一个验证密钥。

```sh
zokrates setup
```

### 4. 计算见证

证明者知道一些满足原始程序的秘密/私有信息。这个秘密信息被称为见证。在以下示例中，`7` 和 `13` 是见证，因为它们是 `91` 的因子。

```sh
zokrates compute-witness -a 7 13 91
```

会生成一个名为 `witness` 的文件。

### 5. 创建证明

以下命令使用证明密钥和见证生成证明：

```sh
zokrates generate-proof
```

生成的文件 `proof.json` 如下所示：

```json
{
  "scheme": "g16",
  "curve": "bn128",
  "proof": {
    "a": [
      "0x0a7ea3ca37865347396645d017c7623431d13103e9107c937d722e5da15f352b",
      "0x040c202ba8fa153f84af8dabc2ca40ff534f54efeb3271acc04a70c41afd079b"
    ],
    "b": [
      [
        "0x0ec1e4faea792762de35dcfd0da0e6859ce491cafad455c334d2c72cb8b24550",
        "0x0985ef1d036b41d44376c1d42ff803b7cab9f9d4cf5bd75298e0fab2d109f096"
      ],
      [
        "0x265151afd8626b4c72dfefb86bac2b63489423d6cf895ed9fa186548b0b9e3f3",
        "0x301f2b356621408e037649d0f5b4ad5f4b2333f58453791cc24f07d5673349bf"
      ]
    ],
    "c": [
      "0x2b75a257d68763100ca11afb3beae511732c1cd1d3f1ce1804cbc0c26043cb6b",
      "0x2f80c706b58482eec9e759fce805585595a76c27e37b67af3463414246fbabbd"
    ]
  },
  "inputs": [
    "0x000000000000000000000000000000000000000000000000000000000000005b"
  ]
}
```

### 6. 导出 sCrypt 验证器

使用我们版本的 ZoKrates，我们可以导出一个项目模板，其中包含我们的环路的验证器。只需运行以下命令：

```sh
zokrates export-verifier-scrypt
``` 

这将创建一个名为 `verifier` 的目录，其中包含项目。让我们设置它。运行以下命令：

```sh
cd verifier && git init && npm i
```

现在验证器已准备好使用。在接下来的部分中，我们将介绍代码并展示如何使用它。


### 7. 运行 sCrypt 验证器

在生成的项目中，让我们打开文件 `src/contracts/verifier.ts`。这个文件包含一个名为 `Verifier` 的 sCrypt 智能合约，可以通过提供有效的 ZK 证明来解锁。

在底层，它使用 `src/contracts/snark.ts` 中的 `SNARK` 库。这个文件包括一个椭圆曲线实现以及一个实现该椭圆曲线的配对库，最后是证明验证算法的实现。在我们的例子中，使用的是 [`BN-256` 椭圆曲线](https://hackmd.io/@jpw/bn254) 和 [`Groth-16` 证明系统](https://eprint.iacr.org/2016/260.pdf)..

让我们看看 `Verifier` 的实现：

```ts
export class Verifier extends SmartContract {
    
    @prop()
    vk: VerifyingKey

    @prop()
    publicInputs: FixedArray<bigint, typeof N_PUB_INPUTS>,

    constructor(
      vk: VerifyingKey,
      publicInputs: FixedArray<bigint, typeof N_PUB_INPUTS>,
      ) {
        super(...arguments)
        this.vk = vk
        this.publicInputs = publicInputs
    }
    
    @method()
    public verifyProof(
        proof: Proof
    ) {
        assert(SNARK.verify(this.vk, this.publicInputs, proof))
    }

}
```

正如我们所见，合约有两个属性，即验证密钥和我们的 ZK 程序的公共输入的值。

合约还有一个名为 `verifyProof` 的公共方法。顾名思义，它验证一个 ZK 证明并可以被一个有效的证明解锁。证明作为参数传递。该方法调用证明验证函数：

```ts
SNARK.verify(this.vk, this.publicInputs, proof)
```

该函数将验证密钥、公共输入和证明作为参数。重要的是要注意，证明与验证密钥是加密关联的，因此必须是关于正确的 ZoKrates 程序（`factor.zok`）的证明。

生成的项目还将包含一个部署脚本 `deploy.ts`。让我们看看代码：

```ts
async function main() {
    await Verifier.loadArtifact()
    
    // TODO: 调整智能合约中锁定的 satoshis 数量：
    const amount = 100

    // TODO: 在这里插入公共输入值：
    const publicInputs: FixedArray<bigint, typeof N_PUB_INPUTS> = [ 0n ]

    let verifier = new Verifier(
        prepareVerifyingKey(VERIFYING_KEY_DATA),
        publicInputs
    )

    // 连接到签名者。
    await verifier.connect(getDefaultSigner())

    // 部署：
    const deployTx = await verifier.deploy(amount)
    console.log('Verifier contract deployed: ', deployTx.id)
}

main()
```

我们可以观察到我们需要调整两件事。首先，我们需要设置我们将锁定到已部署智能合约的 satoshis 数量。第二件事是公共输入值，即秘密因子的乘积。让我们将其设置为值 `91`：

```ts
const publicInputs: FixedArray<bigint, typeof N_PUB_INPUTS> = [ 91n ]
```

注意，ZoKrates 已经为我们提供了验证密钥的值，我们在设置阶段创建了它。

现在，我们可以构建和部署智能合约。只需运行：

```sh
npm run deploy
```

第一次运行命令时，它会要求您为测试网地址提供资金。您可以使用 [我们的水龙头](https://scrypt.io/faucet/) 为其提供资金。

成功运行后，您应该会看到如下内容：

```
Verifier contract deployed:  2396a4e52555cdc29795db281d17de423697bd5cbabbcb756cb14cea8e947235
```

智能合约已成功部署，可以使用有效的证明解锁，该证明证明知道整数 `91` 的因子。您可以使用 [区块浏览器](https://test.whatsonchain.com/tx/2396a4e52555cdc29795db281d17de423697bd5cbabbcb756cb14cea8e947235) 查看交易。

让我们调用已部署的智能合约。让我们创建一个名为 `call.ts` 的文件，内容如下：

```ts
import { DefaultProvider } from 'scrypt-ts'
import { parseProofFile } from './src/util'
import { Verifier } from './src/contracts/verifier'
import { Proof } from './src/contracts/snark'
import { getDefaultSigner } from './tests/utils/helper'
import { PathLike } from 'fs'

export async function call(txId: string, proofPath: PathLike) {
    await Verifier.loadArtifact()

    // 通过提供者获取交易并重建合约实例
    const provider = new DefaultProvider()
    const tx = await provider.getTransaction(txId)
    const verifier = Verifier.fromTx(tx, 0)
    
    // 连接 signer
    await verifier.connect(getDefaultSigner())

    // 解析 proof.json
    const proof: Proof = parseProofFile(proofPath)

    // 调用 verifyProof()
    const { tx: callTx } = await verifier.methods.verifyProof(
        proof
    )
    console.log('Verifier contract unlocked: ', callTx.id)
}

(async () => {
  await call('2396a4e52555cdc29795db281d17de423697bd5cbabbcb756cb14cea8e947235', '../proof.json')
})()
```

函数 `call` 将从传递的 [TXID](https://wiki.bitcoinsv.io/index.php/TXID) 创建合约实例，并调用其 `verifyProof` 方法。证明从 `proof.json` 中解析，我们在上面创建了它。

让我们通过运行以下命令来解锁我们的合约：
```
npx ts-node call.ts
```

如果一切顺利，我们现在已解锁验证器智能合约。您将看到类似于以下内容的输出：

```
Verifier contract unlocked:  30127e0c340878d3fb7c165e2d082267eef2c8df79b5cf750896ef565ca7651d
```

使用 [区块浏览器](https://test.whatsonchain.com/tx/30127e0c340878d3fb7c165e2d082267eef2c8df79b5cf750896ef565ca7651d) 查看它。

## 结论

恭喜！您已成功创建一个 zk-SNARK 并在链上验证它！

如果您想了解如何将 zk-SNARK 集成到全栈比特币 Web 应用程序中，请查看我们的免费 [课程](https://academy.scrypt.io/en/courses/Build-a-zkSNARK-based-Battleship-Game-on-Bitcoin-64187ae0d1a6cb859d18d72a)，它将教您如何创建一个 ZK 战舰游戏。
此外，它还教您使用 [snarkjs/circom](https://github.com/sCrypt-Inc/snarkjs)。

要了解更多关于零知识证明的信息，您可以参考[这个优秀的列表](https://github.com/sCrypt-Inc/awesome-zero-knowledge-proofs)。
