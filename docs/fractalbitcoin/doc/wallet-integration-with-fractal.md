# Fractal 钱包集成指南

本文档面向已经集成了比特币主网的钱包应用程序提供商，旨在帮助他们将 Fractal 测试网集成到其应用程序中。

## 节点

Fractal Bitcoin 与比特币在节点方面有以下差异和注意事项：

* 单独挖矿使用与比特币相同的机制
* 合并挖矿的运作方式类似于域名币（Namecoin）
* 来自合并挖矿的区块包含 BTC 区块头数据，数据结构已更改。详见[合并挖矿规范](https://en.bitcoin.it/wiki/Merged_mining_specification)
* 但为了保持与现有应用程序的兼容性，在 RPC 接口的 getblock 和 getblockheader 方法中将移除区块数据。不过，分析本地区块文件时仍可以看到这些数据

## 协议

我们对不同协议的竞争保持中立态度。

### Ordinals（序数）
* Ordinals 索引的激活高度为 21000

### BRC-20
* 在此公共测试网上，代币标识符（Ticker）将限制为 **6-12 字节**。不允许使用 4 或 5 个字符的标识符，因为这些已在比特币主网上使用
* Fractal 上的 BRC-20 标识符可以包含字母（大小写均可：**a-z/A-Z**）、数字（**0-9**）和下划线（**_**），总计可使用 63 种不同字符
* Fractal 上所有长度的 BRC-20 都可以启用 self_mint 字段

### Runes 协议
* Runes 的激活高度为 84000
* 更多规则将在后续公布

## RPC 和 API

### Mempool API
* 推荐费用查询：`https://mempool-testnet.fractalbitcoin.io/v1/fees/recommended`
* 可使用最新官方版本的 Mempool 进行部署和运营

### Ord
* 访问地址：`https://ordinals-testnet.fractalbitcoin.io`
* 使用最新官方版本的 Ord，将 ordinals 配置为激活高度 21000

### UniSat 开放 API
* API 文档：`https://open-api-fractal.unisat.io/swagger.html`
* 获取 API-KEY：`https://developer.unisat.io/dashboard/fractal/testnet`
* 接口地址：`https://open-api-fractal-testnet.unisat.io` 