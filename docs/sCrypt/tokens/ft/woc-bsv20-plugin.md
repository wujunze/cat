---
title: "查看BSV20代币交易"
sidebar_position: 3
---

您可以使用 [WhatsOnChain](https://whatsonchain.com/) 查看 BSV20 代币交易，使用我们的开源 [BSV20 插件](https://github.com/sCrypt-Inc/bsv20-plugin)。


一个事务可以通过以下 url 在 WhatsOnChain 上查看：

```
https://whatsonchain.com/tx/{txid}
```
如果它是一个 [BSV20](https://docs.1satordinals.com/bsv20) 事务，比如 [这个](https://whatsonchain.com/tx/2c499c1c15924e04cc009ddc2efe2b16bb8492483b13f514f9689cd7effdd48e)，你可以点击 BSV20 插件来查看它的详细信息。
![](/sCrypt/woc-bsv20-plugin-01.png)

## 转移
在插件中，我们可以看到以下信息：

- **id:** 代币id
- **op:** 在bsv20术语中的操作
- **amount:** 代币数量
- **owner:** bsv20 代币所有者（仅适用于 P2PKH）
- **Non-BSV20 input:**: 输入不包含 BSV20 代币
- **Non-BSV20 output:**: 输出不包含 BSV20 代币

我们还可以在顶部看到代币的状态：

- **validated:** 已验证的代币
- **pending:** 待验证的代币
- **invalid:** 无效的代币

## 部署 / 铸造
如果事务是代币部署事务，我们将看到类似于：

![](/sCrypt/woc-bsv20-plugin-02.png)


事务不包含任何 BSV20 代币输入，并且它有其他字段：

- **symbol:** 代币的符号
- **decimals:** 小数精度，默认为 `0`。这与 BRC20 不同，默认值为 18。


------------------------

[1] 我们支持 [`BSV-20`](https://docs.1satordinals.com/bsv20#new-in-v2-tickerless-mode) 和 BSV20。









