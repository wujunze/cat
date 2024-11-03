# 如何使用 Bool Bridge？

## 什么是 Bool Bridge？

Bool Bridge 允许在主链和 Fractal 之间以 BRC-20 代币的形式转移 BTC。这增强了互操作性，为去中心化应用创造了机会。

可转移的资产包括：
* BTC <> bBTC
* ordi <> bORDI
* sats <> bSATS

请自行研究。本指南仅作为用户参考。

### 连接 UniSat 钱包

**第一步**：访问 [https://fractal.boolbridge.com/](https://fractal.boolbridge.com/)。

**第二步**：点击"Connect wallet"。

![](/fractalbitcoin/fractal-56.avif)

**第三步**：确保您的浏览器已安装 UniSat 钱包。您可以通过 [https://unisat.io/download](https://unisat.io/download) 或 Chrome 网上应用店下载。

*请确保：*
🔶 *使用最新版本的扩展程序*
🔶 *使用 Taproot 钱包。在[这里](wallet-addresses-link)了解不同类型的钱包地址。*

![](/fractalbitcoin/fractal-57.avif)

### 将比特币桥接到 Fractal 资产（如 bBTC）

**第一步**：选择您想从比特币主网桥接到 Fractal 的资产。

![](/fractalbitcoin/fractal-58.avif)

**第二步**：输入您想桥接到 Fractal 的金额。

![](/fractalbitcoin/fractal-59.avif)

**第三步**：准备就绪后点击"Deposit"。

![](/fractalbitcoin/fractal-60.avif)

**第四步**：在弹出窗口中，检查输入和输出地址是否与您的目标地址相符。如果详细信息正确，点击"Sign"确认交易。

![](/fractalbitcoin/fractal-61.avif)

**第五步**：交易已发送。您可以点击"View on explorer"在 mempool 浏览器上追踪您的交易。

![](/fractalbitcoin/fractal-62.png) 

### 将 Fractal 资产（如 bBTC）桥接到比特币

**第一步**：点击箭头切换到从 Fractal Bitcoin 主网转账。

![](/fractalbitcoin/fractal-63.avif)

**第二步**：
a. 点击"Refresh"转移您的铭文。
b. 弹出窗口将出现，允许您选择所需的输出值和费率。在网络拥堵期间，您可以启用"Replace-By-Fee (RBF)"选项来优先处理您的交易，这允许您修改交易费用以加快处理速度。配置完设置后，点击"Next"继续。

![](/fractalbitcoin/fractal-64.avif)

**第三步**：检查您的转账详情是否正确。点击"Next"。

![](/fractalbitcoin/fractal-65.avif)

**第四步**：铭文处理成功后，可能需要几分钟时间进行索引并在界面上显示。

![](/fractalbitcoin/fractal-66.avif)

**第五步**：铭文索引完成后，它们将在界面中显示为可选选项。如下图所示，点击您想转移的铭文确认您的选择。

![](/fractalbitcoin/fractal-67.avif)

**第六步**：点击"Withdraw"确认您的账。

![](/fractalbitcoin/fractal-68.avif)

**第七步**：在弹出窗口中，检查详情并签名交易。

![](/fractalbitcoin/fractal-69.avif)

![](/fractalbitcoin/fractal-70.avif)

**第八步**：交易已发送。您可以点击"View on explorer"在 mempool 浏览器上追踪您的交易。

![](/fractalbitcoin/fractal-71.avif)

### 在浏览器上查看您的交易

**方式 A：** 点击交易确认页面上的链接

![](/fractalbitcoin/fractal-72.png)

**方式 B：** 点击"History"。

![](/fractalbitcoin/fractal-73.avif)

a. 要在比特币 mempool 浏览器中查看交易，点击 BTC 金额下方的链接。
b. 要在 Fractal mempool 浏览器中查看交易，点击 Fractal 资产下方的链接。

![](/fractalbitcoin/fractal-74.avif)

#### 区块确认时间

请注意，Fractal Bool Bridge 需要比特币上的四个确认区块才能在您的 Fractal 余额中显示。这是为了确保资产的安全性。通常，您需要等待 30-40 分钟才能在 Fractal 上收到您的 bBTC。

### 在 UniSat 钱包中查看 bBTC 资产

查看所有 bBTC 地址，访问此链接：[https://explorer.unisat.io/fractal-mainnet/brc20/bBTC___](https://explorer.unisat.io/fractal-mainnet/brc20/bBTC___)

![](/fractalbitcoin/fractal-75.avif)

查看您的 bBTC 资产，访问此链接：[https://fractal.unisat.io/address/account?tab=brc20](https://fractal.unisat.io/address/account?tab=brc20)。

**第一步**：连接您的钱包。

![](/fractalbitcoin/fractal-76.avif)

**第二步**：如果您的钱包持有任何 bBTC，它将在界面的 BRC-20 部分显示，显示可用和可转账金额。 

![](/fractalbitcoin/fractal-77.avif)