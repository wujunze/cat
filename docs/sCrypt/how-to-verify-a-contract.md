---
sidebar_position: 11
---

# 如何验证合约

你将学习如何在 [WhatsOnChain](https://whatsonchain.com/) 上验证智能合约，这是一个区块链浏览器。
通过在 WoC 上验证你的智能合约，任何人都可以查看其源代码并放心地与之交互。让我们开始吧！

要开始验证过程，我们首先需要部署一个智能合约。让我们使用 ["Hello World" 教程](https://docs.scrypt.io/tutorials/hello-world.md) 作为示例。
完成教程后，你应该得到部署交易的 TXID，例如 [`a34d4e45a9108b5b9da4faf4f086e9ef36b79466383bd7a22ff2c7f6a562546c`](https://test.whatsonchain.com/tx/a34d4e45a9108b5b9da4faf4f086e9ef36b79466383bd7a22ff2c7f6a562546c)。

如果你在 WoC 上查看交易，你会看到第一个输出包含一个由哈希 `eb2f10b8f1bd12527f07a5d05b40f06137cbebe4e9ecfb6a4e0fd8a3437e1def` 标识的脚本，其中包含你的合约，以脚本格式表示。

![img](/sCrypt/how-to-verify-a-contract-01.png)

这个哈希被称为 `scriptHash`。脚本哈希是部署合约的锁定脚本的 `sha256` 哈希值，以小端十六进制格式编码。它通常用作区块浏览器中的索引。你也可以通过合约实例的 `scriptHash` 属性获取此值：

```ts
console.log(instance.scriptHash)
// eb2f10b8f1bd12527f07a5d05b40f06137cbebe4e9ecfb6a4e0fd8a3437e1def
```

:::tip `注意`
脚本哈希值可能因当前属性值和合约更新的次数而有所不同，导致其值不一致。
:::

你可以提交并验证属于特定脚本哈希的 sCrypt 源代码。

![img](/sCrypt/how-to-verify-a-contract-02.png)

有两种方法可以验证它。

## 1. 使用 WoC sCrypt 插件

在 WoC 上查看部署的交易时，点击第一个输出的 `ScriptHash`。
它将打开一个如下页面：

![img](/sCrypt/how-to-verify-a-contract-03.png)

你会看到一个 `sCrypt` 标签。
点击它，你会看到一个简单的表单，允许你验证 sCrypt 合约的代码：

![img](/sCrypt/how-to-verify-a-contract-04.png)

在表单中，你可以选择用于编译和部署合约的 sCrypt 版本，以及一个文本框，在其中你需要粘贴源代码。

![img](/sCrypt/how-to-verify-a-contract-05.png)

现在点击 `Submit`。如果代码正确，你应该在几秒钟内看到如下内容：

![img](/sCrypt/how-to-verify-a-contract-06.png)

恭喜，你已经验证了你的第一个智能合约！

现在，每当有人打开 [脚本哈希页面](https://test.whatsonchain.com/script/eb2f10b8f1bd12527f07a5d05b40f06137cbebe4e9ecfb6a4e0fd8a3437e1def) 上的 `sCrypt` 标签时，他们将看到已验证的智能合约源代码，以及在部署时构造函数参数。

## 2. 使用 CLI

你可以使用 [sCrypt CLI](https://www.npmjs.com/package/scrypt-cli) 完成相同的验证过程。
你可以使用 `verify` 命令验证已部署的智能合约脚本：

```sh
npx scrypt-cli verify <scriptHash> <contractPath>
```

第一个位置参数是已部署合约的脚本哈希，第二个参数是包含 sCrypt 智能合约的文件的路径。
请注意，文件还必须包含所有依赖的代码，即第三方库。

使用 `network` 选项，你可以指定在哪个网络上部署了合约。这默认为 `test`，表示比特币测试网：

```sh
npx scrypt-cli verify --network main <scriptHash> <contractPath>
```

你可以指定在验证期间使用的 sCrypt 版本。默认情况下，命令将使用 `package.json` 中指定的版本：

```sh
npx scrypt-cli verify -V 0.2.0-beta.9 <scriptHash> <contractPath>
```

例如，如果我们想验证与上面相同的已部署合约，我们只需运行以下命令：

```sh
npx scrypt-cli verify eb2f10b8f1bd12527f07a5d05b40f06137cbebe4e9ecfb6a4e0fd8a3437e1def src/contracts/demoproject.ts
```

执行时，指定的合约代码在 sCrypt 的服务器上进行验证。如果成功，结果将显示在 WoC 上，就像上面一样，在 "sCrypt" 标签下。
