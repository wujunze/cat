---
sidebar_position: 16
---

# FAQ

## 智能合约调用失败

如果你在广播交易时收到 `mandatory-script-verify-flag-failed` 错误，这意味着一个或多个调用合约的输入失败。

失败的原因有几种可能性。

`Script evaluated without error but finished with a false/empty top stack element` 是最常见的一种。这意味着一个或多个 [assert](./how-to-write-a-contract/built-ins.md#assert) 失败。

![](/sCrypt/faq-01.png)

另一个常见错误是 `Signature must be zero for failed CHECK(MULTI)SIG operation`，这意味着在 [checkSig](./how-to-write-a-contract/built-ins.md#checksig) 或 [checkMultiSig](./how-to-write-a-contract/built-ins.md#checkmultisig) 中签名无效。

![](/sCrypt/faq-02.png)

你需要 [调试合约](./how-to-debug-a-contract.md)。

## 广播双花交易

你可能会在广播双花交易时遇到两种不同的错误，具体取决于你尝试双花交易的状况。

- 如果你尝试双花的事务仍然是未确认的，并且仍在内存池中，错误将是 `txn-mempool-conflict`。

![](/sCrypt/faq-03.png)

- 如果事务已挖入区块并确认，错误将是 `Missing inputs`。

![](/sCrypt/faq-04.png)

控制台可能会显示如下消息：

`{"status":400,"code":27,"error":"Transaction invalid: missing-inputs"}`

### 1) 对于开发者
如果你在运行代码时遇到这些错误，例如在测试网上测试，可能是因为你正在使用的 [provider](./how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#provider) 未能及时更新你的 UTXO，并返回已被花费的 UTXO。使用这些已被花费的 UTXO 构建事务将导致双花。这种情况是暂时的，并且是由 provider 未能及时更新 UTXO 集引起的，例如，由于区块链流量过大，provider 的服务器过载。

要解决此问题，你通常只需等待几秒钟并重试。如果仍然存在，你还可以增加发送连续事务之间的时间间隔，例如，在发送事务后 `sleep` 一段时间，然后再请求 UTXO 再次，以便 provider 有足够的时间更新 UTXO 集：

```ts
// ... 合约调用 #1

await sleep(2000) // 睡眠 2 秒

// ... 合约调用 #2
```

### 2) 对于 dApp 用户
如果你在 [使用 dApp](./how-to-integrate-a-frontend/how-to-integrate-a-frontend.md) 时遇到这些错误，可能是因为 dApp 的合约状态已被另一个用户更改，该用户正在同一时间与 dApp 交互。你正在与过时的合约实例进行交互，导致双花。

要解决此问题，你通常只需等待几秒钟，如果你的 dApp 已 [订阅合约事件](./advanced/how-to-integrate-scrypt-service.md#listen-to-events)；否则，你必须手动刷新浏览器并重试。

## Input string too short

如果你在部署合约之前没有在 `.env` 文件中设置 `PRIVATE_KEY` 环境变量，你会收到 `Input string too short` 错误。

![](/sCrypt/faq-05.png)

请按照 [此指南](./how-to-deploy-and-call-a-contract/faucet.md) 生成一个新的私钥或从你的 Sensilet 钱包导出私钥，然后使用我们的 [水龙头](https://scrypt.io/faucet/) 为私钥的地址提供资金。

## No sufficient utxos

如果你在部署合约之前没有为你的私钥的地址提供资金，你会收到 `No sufficient utxos` 错误。

![](/sCrypt/faq-06.png)

请先使用我们的 [水龙头](https://scrypt.io/faucet/) 为你的地址提供资金。


## Bad CPU type in executable
这可能发生在 Mac（ARM 处理器）上，因为 sCrypt 编译器基于 Intel 处理器。使用以下命令安装 [Rosetta](https://support.apple.com/en-us/102527)。

```bash
softwareupdate --install-rosetta --agree-to-license
```