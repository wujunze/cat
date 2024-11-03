# 如何在 UniSat CAT 市场买卖 CAT？

本文来自 UniSat，仅供参考。我们建议在进行任何交易前进行自己的研究。

---

CAT 市场兼容 UniSat 的 **原生隔离见证（P2WPKH）** 和 **Taproot（P2TR）** 地址。请确保您的钱包配置使用这些地址格式之一。

交易费用以 FB 支付

服务费：0.3%

### 1. 访问 UniSat CAT 市场

* 访问 Fractal 上的 UniSat 市场：[https://fractal.unisat.io/dex/cat20](https://fractal.unisat.io/dex/cat20)
* 点击 **Connect** 按钮将您的钱包连接到市场。

![](/fractalbitcoin/fractal-91.avif)

CAT 市场界面采用 DEX 风格的布局，以适应大多数用户的交易偏好。点击您想交易的特定代币标识符，您就能看到其**价格**、**价格图表**、**交易量**和**市值**，以便更好地了解您的资产。

![](/fractalbitcoin/fractal-92.avif)    

---

### 2. 如何购买 CAT

使用市场界面右侧的搜索栏查找您想交易的代币标识符，或直接滚动查找。

![](/fractalbitcoin/fractal-93.avif)

**购买方式 1：接受订单**

这是从现有订单簿快速购买的方式。

a) 从订单簿（买方）中点击符合您的价格和数量要求的买单，确认详情（价格和数量），然后点击页面底部的 **Buy** 按钮。

b) 检查**输入**和**输出**信息，如果一切正确，签名交易。

![](/fractalbitcoin/fractal-94.jfif)

![](/fractalbitcoin/fractal-95.avif)

交易签名并确认后，购买将被处理。您可以在页面底部的 **My Activities** 部分查看您的购买历史。

![](/fractalbitcoin/fractal-96.avif)

**购买方式 2：创建订单**

如果您不想从现有订单簿购买，而是想下自定义订单，请按以下步骤操作：

a) 选择 **Make Order**，然后点击 **Buy**。

b) 输入您理想的买入价格和数量，确认详情后点击 **Make Order**。

_注意：总价值应大于 0.1 FB。_

c) 如同第一种方式，检查交易详情（输入、输出），并签名确认订单。

![](/fractalbitcoin/fractal-97.jfif)

**批量购买**

您可以选择多个订单进行批量购买：

* 在市场上点击 **Take Order - Buy**，从订单簿中选择多个订单。
* 选择完成后，点击 **Buy** 并签名交易以完成购买。

![](/fractalbitcoin/fractal-98.jfif)    

---

### 3. 如何出售 CAT

使用搜索栏或滚动浏览市场来找到您想出售的代币标识符。

**出售方式 1：接受订单**

这是通过接受订单簿中现有买单的快速出售方式。

a) 从订单簿中点击符合您的价格和数量要求的卖单（卖方）。

b) 确认价格和数量，然后点击页面底部的 **Sell**。

c) 检查输入和输出信息，然后签名交易。

**注意：** 您最多可以批量下 3 个订单。

![](/fractalbitcoin/fractal-99.jfif)

**出售方式 2：创建订单**

您一次最多可以出售 **3 个 UTXO**。如果您想一次性出售更多 CAT20，需要在钱包中合并 UTXO。

有关如何操作的详细步骤，请参阅[操作指南](/fractalbitcoin/user-guides/understanding-cat-protocol/how-to-send-receive-cat20.md#如何合并-cat20-utxo)。

如果您不想接受现有订单簿中的订单，而是想创建卖单：

a) 选择 **Make Order**，然后点击 **Sell**。

b) 输入您想出售的数量和价格，确认详情后点击 **Make Sell**。

_注意：总价值应大于 0.1 FB。_

c) 如同之前的步骤，检查交易信息（输入、输出），并签名确认订单。

![](/fractalbitcoin/fractal-100.jfif)   

**批量出售**

您也可以一次性出售多个 UTXO：

* 点击 **Take Order - Sell**。
* 选择您想完成的订单，点击 **Sell**，并签名交易以完成。
* 注意：您一次最多可以出售 3 个 UTXO。

![](/fractalbitcoin/fractal-101.jfif)

---

### 4. 如何查看和取消订单

下单后，您可以在主页的 **My Activities** 下查看您的订单历史。

要取消未完成的订单，点击您想删除的订单旁边的 **Cancel** 按钮。

![](/fractalbitcoin/fractal-102.avif)

**请注意：**

CAT20 交易需要已确认的 UTXO。如果您的订单中有多个未确认的 UTXO，您将无法再次使用相同的 UTXO。在这种情况下，页面将显示以下提示。请点击"确认"继续下一步。 

![](/fractalbitcoin/fractal-103.avif)