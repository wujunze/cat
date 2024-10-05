---
sidebar_position: 1
---

# 教程 1: Hello World


## 概述

在本教程中，我们将介绍如何创建一个“Hello World”智能合约，部署它并调用它。

在开始之前，请确保已安装所有[先决条件工具](../../installation)。

## 创建一个新项目

运行以下命令以创建一个新项目：

```sh
npx scrypt-cli project helloworld
cd helloworld
npm install
```

生成的项目将包含一个示例智能合约 `/src/contracts/helloworld.ts`，以及所有必要的脚手架。

对于这个例子，让我们修改它为以下代码：


```ts
import { assert, ByteString, method, prop, sha256, Sha256, SmartContract } from 'scrypt-ts'

export class Helloworld extends SmartContract {

    @prop()
    hash: Sha256;

    constructor(hash: Sha256){
        super(...arguments);
        this.hash = hash;
    }

    @method()
    public unlock(message: ByteString) {
        assert(sha256(message) == this.hash, 'Hash does not match')
    }
}
```

这个 `Helloworld` 智能合约在合约属性 `hash` 中存储消息的 sha256 哈希值。只有哈希值与 `this.hash` 中设置的值匹配的消息才能解锁合约。

现在让我们看看智能合约中有什么。

- `SmartContract`: 所有智能合约必须扩展 `SmartContract` 基类。
- `@prop`: 的 [`@prop` 装饰器](../how-to-write-a-contract/basics#properties) 标记合约属性。
- `@method`: 的 [`@method` 装饰器](../how-to-write-a-contract/basics#method-decorator) 标记合约方法。一个 [公共方法](../how-to-write-a-contract/basics#public-methods) 是合约的入口点。
- `assert`: 如果其第一个参数为 `false`，则抛出错误并使方法调用失败。在这里，它确保传递的消息哈希到预期的摘要。

## 编译合约

1. 运行以下命令以编译 `Helloworld` 合约：

```sh
npx scrypt-cli compile
```

此命令将在 `/artifacts/helloworld.json` 生成一个合约工件文件。

2. 然后在代码中调用 `loadArtifact()` 函数：


```ts
await Helloworld.loadArtifact()
```

## 使用 `watch` 选项编译

实时错误检测

```sh
npx scrypt-cli compile --watch
```

提供的命令中的 `watch` 选项在 sCrypt 编译过程中连续监控错误。
Watch 模式允许用户观察与 sCrypt 相关的任何错误，这些错误与 TypeScript 错误不同。

![](../../static/img/watch.gif)

## Contract Deployment & Call

在部署合约之前，您需要生成一个比特币密钥。

```bash
npm run genprivkey
```

then follow the [faucet instructions](../../how-to-deploy-and-call-a-contract/faucet) to fund the key.

接下来，开始部署和调用合约：

1. 要 [部署智能合约](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-deployment)，只需调用其 `deploy` 方法。
2. 要 [调用智能合约](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-call)，调用其中一个公共方法。

对于这个例子，覆盖项目根目录中的 `deploy.ts` 文件，如下代码以部署和调用 `Helloworld` 合约：

```ts
import { Helloworld } from './src/contracts/helloworld'
import { getDefaultSigner } from './tests/utils/txHelper'
import { toByteString, sha256 } from 'scrypt-ts'

(async () => {

    // 设置网络环境
    process.env.NETWORK = 'testnet'
    // 或者在 .env 文件中设置 `NETWORK=testnet`

    const message = toByteString('hello world', true)

    await Helloworld.loadArtifact()
    const instance = new Helloworld(sha256(message))

    // 连接到signer
    await instance.connect(getDefaultSigner())

    // 部署合约并锁定 42 聪
    const deployTx = await instance.deploy(42)
    console.log('Helloworld contract deployed: ', deployTx.id)

    // 调用合约
    const { tx: callTx } = await instance.methods.unlock(message)
    console.log('Helloworld contract `unlock` called: ', callTx.id)
})()
```

运行以下命令以部署和调用示例合约。

```
npx ts-node deploy.ts
```

您将看到如下输出：

![](../../static/img/hello-world-deploy-and-call-output.png)


您可以使用 WhatsOnChain 区块链浏览器查看 [部署交易](https://test.whatsonchain.com/tx/b10744292358eda2cfae3baae5cd486e30136b086011f7953aed9098f62f4245)：

![](../../static/img/hello-world-contract-deploy-tx.png)


您还可以查看 [调用交易](https://test.whatsonchain.com/tx/f28175616b6dd0ebe2aad41505aabb5bf2864e2e6d1157168183f51b6194d3e6)：

![](../../static/img/hello-world-contract-call-tx.png)

恭喜！您已经成功部署并调用了您的第一个比特币智能合约。