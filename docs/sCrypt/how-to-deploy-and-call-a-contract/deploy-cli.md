---
sidebar_position: 3
---

# 使用 CLI 部署

`deploy` 命令允许你将智能合约的实例部署到区块链。你可以在 `sCrypt` 项目的根目录中简单地运行以下命令：

```sh
npx scrypt-cli deploy
```

或者

```sh
npx scrypt-cli d
```

默认情况下，CLI 工具将运行位于项目根目录中的名为 `deploy.ts` 的脚本。你也可以使用 `--file` 或 `-f` 选项指定不同的部署脚本。

```sh
npx scrypt-cli d -f myCustomDeploy.ts
```

如果项目是使用 sCrypt CLI 创建的，它将已经包含一个 `deploy.ts` 文件（除非是[库](../how-to-publish-a-contract.md)项目）。如果没有，`deploy` 命令将生成一个示例 `deploy.ts` 文件。

以下是一个这样的部署文件示例：

```ts
import { Demoproject } from './src/contracts/demoproject'
import { bsv, TestWallet, DefaultProvider, sha256, toByteString, } from 'scrypt-ts'

import * as dotenv from 'dotenv'

// 加载 .env 文件
dotenv.config()

// 从 .env 文件中读取私钥。
// 默认情况下，.env 文件中的私钥用于比特币测试网。
// 参见 https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY)

// 准备签名者。
// 参见 https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = new TestWallet(privateKey, new DefaultProvider())

async function main() {
    // 编译智能合约。
    await Demoproject.loadArtifact()

    // 智能合约中锁定的聪的数量：
    const amount = 100

    // 实例化智能合约并传递构造函数参数。
    const instance = new Demoproject(
        sha256(toByteString('hello world', true))
    )

    // 连接到签名者。
    await instance.connect(signer)

    // 合约部署。
    const deployTx = await instance.deploy(amount)
    console.log('Demoproject 合约已部署: ', deployTx.id)
}

main()
```

成功执行后，你应该会看到如下输出：

```text
Demoproject 合约已部署: 15b8055cfaf9554035f8d3b866f038a04e40b45e28109f1becfe4d0af9f743cd
```

你可以使用 [WhatsOnChain 区块浏览器](https://test.whatsonchain.com/tx/15b8055cfaf9554035f8d3b866f038a04e40b45e28109f1becfe4d0af9f743cd) 查看已部署的智能合约。在我们的示例中，第一个输出包含编译后的智能合约代码。它使用脚本的哈希（双 SHA-256）进行索引：[eb2f10b8f1bd12527f07a5d05b40f06137cbebe4e9ecfb6a4e0fd8a3437e1def](https://test.whatsonchain.com/script/eb2f10b8f1bd12527f07a5d05b40f06137cbebe4e9ecfb6a4e0fd8a3437e1def)。
