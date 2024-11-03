# 参与公共测试

欢迎来到 Fractal Bitcoin 测试网！请按照以下步骤指南开始您的测试之旅。

1️⃣ **设置 Fractal Bitcoin 钱包**

*请仅使用 UniSat 钱包进行测试。我们建议专门为测试创建一个新的 UniSat 钱包。*

* 打开 UniSat 钱包扩展程序
* 点击右上角的网络下拉菜单，切换到 **Fractal Bitcoin Testnet**
* 复制页面上显示的钱包地址

![](/fractalbitcoin/fractal-104.png)

---

2️⃣ **领取测试网资产**

* 访问水龙头页面：[https://explorer-testnet.fractalbitcoin.io/faucet](https://explorer-testnet.fractalbitcoin.io/faucet) 并通过验证（*这是唯一的官方测试网 URL*）
* 在**接收地址**字段中粘贴您的 Fractal 钱包地址
* 点击**领取**获取测试网资产

![](/fractalbitcoin/fractal-105.avif)

---

3️⃣ **了解 Fractal 上的 BRC-20 规则**

🔸 在此公共测试网上，代币标识符（Ticker）将限制为 **6-12 字节**。不允许使用 4 或 5 个字符的标识符，因为这些已在比特币主网上使用。

🔸 Fractal 上的 BRC-20 标识符可以包含：
* 字母（大小写均可：**a-z/A-Z**）
* 数字（**0-9**）
* 下划线（**_**）

总计可使用 63 种不同字符。标识符不区分大小写，例如，"Aaaaaaaaaaaaaa" 和 "aaaaaaaaaaaaaa" 被视为相同标识符。

🔸 Fractal 上的所有 BRC-20 资产支持公平发行和自主发行。

"自主发行"意味着这些资产只能由部署铭文的持有者铸造。由于部署铭文可以转移，因此谁持有部署铭文就拥有该代币的铸造权。

---

4️⃣ **开始测试**

测试操作与 Ordinals 上的操作类似：

* 访问官方测试网站：[https://fractal-testnet.unisat.io/](https://fractal-testnet.unisat.io/)
* 点击右上角的 **Connect** 并使用您用于领取资产的钱包地址登录

通过顶部导航栏导航到 **Inscribe** 页面或点击 [https://fractal-testnet.unisat.io/inscribe](https://fractal-testnet.unisat.io/inscribe)。您可以铭刻 BRC-20、文件、文本，并体验 BRC-20 部署过程。

![](/fractalbitcoin/fractal-106.avif)

**铭刻步骤：**

1. 输入您想铭刻的代币标识符名称、数量和批量铭刻数量（重复铭刻）。填写完这些详细信息后，点击"Next"继续。

![](/fractalbitcoin/fractal-107.avif)

2. 检查铭刻详情，如果一切正确，点击"Next"，然后阅读并确认"风险提示"。

![](/fractalbitcoin/fractal-108.avif)   

3. 输入您的接收地址。您可以使用已连接的钱包地址或手动输入其他地址。
   * 设置费率。您可以使用建议费率或输入自定义费率
   * 确认所有信息正确后，点击"Submit & Pay Invoice"。请注意，点击此按钮即表示您已阅读并同意风险提示声明

![](/fractalbitcoin/fractal-109.avif)

4. 确认您的支付方式。默认选项是"Pay with Wallet"，但如有必要，您可以手动选择其他支付方式。

![](/fractalbitcoin/fractal-110.avif)

5. 确认支付方式后，将出现签名详情页面。在点击"Sign & Pay"之前，仔细检查输入、输出和其他交易详情。确保一切准确无误，然后点击"Sign & Pay"完成交易。

![](/fractalbitcoin/fractal-111.avif)   

6. 此时，您的铭刻订单已创建并开始处理。
   * 状态显示"Inscribing"表示铭刻正在进行中并等待确认。流程完成后，状态将变为"Inscribed"
   * 请注意，如果 mempool 费用较高或代币标识符特别受欢迎，您的交易可能会被抢先。这意味着如果在您的交易确认之前代币供应已耗尽，您的订单可能仍显示为"Inscribed"，但由于被抢先，您将无法收到资产

![](/fractalbitcoin/fractal-112.avif)

**Fractal 上的 BRC-20 完整列表**

* 访问 [https://fractal.unisat.io/brc20](https://fractal.unisat.io/brc20)，向下滚动查看 BRC-20 资产的完整列表，您还可以通过在搜索框中输入想要铭刻的代币标识符名称直接进行铭刻。

![](/fractalbitcoin/fractal-113.avif)

---

📌**补充说明：**

* 这是测试网环境，测试网资产没有实际价值
* 始终使用官方测试网站并仔细遵循这些说明以避免任何问题

祝您测试愉快，享受 Fractal Bitcoin 之旅！ 