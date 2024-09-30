---
sidebar_position: 10
---

# 如何使用Signer类仅签名P2PKH输入

在某些场景中，在sCrypt中使用交易时，可能需要仅签名P2PKH输入。本指南将指导您如何使用**`Signer`**类实现这一点。

## 先决条件

在继续之前，请确保您对sCrypt库有一个基本的了解，并设置所需的依赖项。

## 实现

### 1. 初始化P2PKH的UTXO

首先，定义一个您打算用于交易的P2PKH未花费交易输出（UTXO）：

```ts
const utxo = {
    txId: '5260b12348608a33c2ac90ed8a08e0b3eb90bbe862bcea6b21b1f29f1c2fdee0',
    outputIndex: 0,
    script: bsv.Script.fromASM('OP_DUP OP_HASH160 af838fed6517e595e6761c2b96849bec473b00f8 OP_EQUALVERIFY OP_CHECKSIG').toHex(),
    satoshis: 1000,
};
```

### 2. 将P2PKH UTXO添加到交易中

使用from()方法将P2PKH UTXO添加到您的交易中。这将标记输入为P2PKH输入：

```ts
tx.from(utxo);
```

### 3. 在签名之前验证输入脚本

在签名交易之前，确保输入脚本为空。可以使用以下代码完成：

```ts
console.log(tx.inputs[2].script.toASM()); // 空的，没有签名
```

### 4. 签名交易

使用Signer类签名交易：

```ts
const signer = getDefaultSigner();
await signer.signTransaction(tx);
```

### 5. 验证签名后的输入脚本

签名后，确认输入脚本现在包含签名和公钥：

```ts
console.log(tx.inputs[2].script.toASM()); // 应该包含签名和公钥
```

### 示例实现

以下是一个简化示例，演示了上述步骤：

```ts
const tx = new bsv.Transaction();
// 添加输入、输出和其他交易细节

// 添加P2PKH UTXO
tx.from(utxo);

// 验证输入脚本
console.log(tx.inputs[2].script.toASM()); // 空的，没有签名

// 签名交易
const signer = getDefaultSigner();
await signer.signTransaction(tx);

// 验证签名后的输入脚本
console.log(tx.inputs[2].script.toASM()); // 应该包含签名和公钥

.................................
.................................

// 完成交易
const finalizedTx = tx.build();
```

## 结论

通过这些步骤，您可以在sCrypt中使用**`Signer`**类仅签名P2PKH输入。如果您遇到任何问题或具有特定要求，请参考[sCrypt slack频道](https://app.slack.com/client/TLSHKFH5Y/CLSHPUZC3)以寻求进一步帮助。