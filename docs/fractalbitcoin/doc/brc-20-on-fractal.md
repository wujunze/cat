# Fractal 上的 BRC-20 协议

为了避免与比特币主网上现有资产发生冲突，Fractal 对 BRC-20 协议制定了特定的规则。

## 代币标识符规则

1. **标识符长度**：在 Fractal 主网上，代币标识符（Ticker）必须是 **6-12 字节**长度。为避免与比特币主网上已有资产冲突，不允许使用 4 或 5 个字符的标识符。

2. **字符要求**：Fractal 上的 BRC-20 代币标识符可以包含：
   - 字母（大小写均可：**a-z/A-Z**）
   - 数字（**0-9**）
   - 下划线（**_**）
   
   总计可使用 63 种不同字符。

   > 注意：标识符不区分大小写。例如，"Aaaaaaaaaaaaaa" 和 "aaaaaaaaaaaaaa" 被视为相同标识符。

## 发行机制

3. Fractal 上的所有 BRC-20 资产支持两种发行方式：
   - **公平发行**（Fair Launch）
   - **自主发行**（Self-issuance）

   自主发行模式中，只有部署铭文（Deploy Inscription）的持有者才能铸造该代币。由于部署铭文可以转移，因此whoever持有部署铭文就拥有该代币的铸造权。

## 其他规则

除上述三条特定规则外，Fractal 上的 BRC-20 协议与比特币主网上的 BRC-20 规则保持一致。更多详细信息可参考 [BRC-20 标准协议文档](https://layer1.gitbook.io/layer1-foundation/protocols/brc-20/indexing)。
