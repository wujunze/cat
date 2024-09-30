---
sidebar_position: 5
---

# 教程 5: Ordinals 预言机

## 概述

比特币智能合约可以决定 UTXO 中的 satoshis 是否有效，但不能直接确定 UTXO 中的[1SatOrdinals](https://docs.1satordinals.com/)代币是否有效。通过检查 UTXO，合约可以知道其中有多少 satoshis，因为它们是由矿工在链上验证的。然而，合约无法确定其中有多少 Ordinals 代币或是否包含特定的 NFT，因为它们是由链外的外部索引器验证的，而不是矿工。在许多实际应用中，验证交易输入中携带的 Ordinals 代币是必要的，例如代币交换和代币销售。必须引入[预言机](https://docs.sctypt.io/tutorials/oracle.md)来为调用合约时所需的 Ordinals 代币的真实性和完整性提供额外的验证。

本教程将介绍如何使用[WitnessOnChain](https://api.witnessonchain.com)预言机来验证引用包含 Ordinals NFT 和 BSV20 代币的 UTXO 的交易输入。

## WitnessOnChain API

WitnessOnChain 提供了一个[API](https://api.witnessonchain.com/#/v1/V1Controller_getInscription)来从一个 outpoint 获取 inscription 详情。

```
https://api.witnessonchain.com/v1/inscription/bsv/{network}/outpoint/{txid}/{vout}
```

响应中签名的消息结构如下：

| 名称      | 类型       | 字节数 | 描述                                         |
| --------- | ---------- | ------ | -------------------------------------------- |
| marker    | bigint     | 1      | api marker, always be 4n                     |
| timestamp | bigint     | 4      | timestamp, little-endian                     |
| network   | bigint     | 1      | network type, 1n for mainnet, 0n for testnet |
| outpoint  | ByteString | 36     | txid + output index, both in little-endian   |
| fungible  | bigint     | 1      | token type, 1n for BSV20, 0n for NFT         |
| amt       | bigint     | 8      | token amount, little endian                  |
| id        | ByteString | >=66   | inscription id                               |

根据这个结构，我们可以定义一个自定义类型 `Msg` 和一个辅助解析函数。

```ts
type Msg = {
    marker: bigint // 1 字节, api marker
    timestamp: bigint // 4 字节 LE
    network: bigint // 1 字节, 1 为 mainnet, 0 为 testnet
    outpoint: ByteString // 36 字节, txid 32 字节 LE + vout 4 字节 LE
    fungible: bigint // 1 字节, token type, 1 for BSV20, 0 for NFT
    amt: bigint // 8 字节 LE
    id: ByteString
}

@method()
static parseMsg(msg: ByteString): Msg {
    return {
        marker: Utils.fromLEUnsigned(slice(msg, 0n, 1n)),
        timestamp: Utils.fromLEUnsigned(slice(msg, 1n, 5n)),
        network: Utils.fromLEUnsigned(slice(msg, 5n, 6n)),
        outpoint: slice(msg, 6n, 42n),
        fungible: Utils.fromLEUnsigned(slice(msg, 42n, 43n)),
        amt: Utils.fromLEUnsigned(slice(msg, 43n, 51n)),
        id: slice(msg, 51n),
    }
}
```

## 在合约中使用

在这个例子中，我们实现了一个合约，当交易中的第二个输入（即输入 #1）包含特定数量的特定 BSV20 代币时，只能成功调用。

![](/sCrypt/ordi-oracle-01.png)

为了验证预言机签名的消息，我们应该将预言机的公钥添加到合约中。为了记录特定的 BSV20 代币和数量，我们还需要添加另外两个属性。

```ts
export class OracleDemoBsv20 extends SmartContract {
    @prop()
    oraclePubKey: RabinPubKey

    @prop()
    inscriptionId: ByteString
    @prop()
    amt: bigint

    ...
}
```

### 方法

公共方法 `unlock` 需要三个参数：

- `msg`, 预言机签名的消息，
- `sig`, 预言机的签名
- `tokenInputIndex`, 标记哪个输入是代币输入

```ts
@method()
public unlock(msg: ByteString, sig: RabinSig, tokenInputIndex: bigint) {
    // 从 prevouts 中检索代币 outpoint
    const outpoint = slice(this.prevouts, tokenInputIndex * 36n, (tokenInputIndex + 1n) * 36n)
    // 验证预言机签名
    assert(
        WitnessOnChainVerifier.verifySig(msg, sig, this.oraclePubKey),
        'Oracle sig verify failed.'
    )
    // 解码预言机数据
    const message = OracleDemoBsv20.parseMsg(msg)
    // 验证数据
    assert(message.marker == 4n, 'incorrect oracle message type')
    assert(message.network == 0n, 'incorrect network')
    assert(message.outpoint == outpoint, 'incorrect token outpoint')
    assert(message.fungible == 1n, 'incorrect token type')
    assert(message.amt >= this.amt, 'incorrect token amount')
    assert(message.id == this.inscriptionId, 'incorrect inscription id')

    // 其他验证 ...
}
```

我们首先从 `this.prevouts` 中检索代币 outpoint。我们解析预言机签名的消息并验证它与 outpoint。现在我们可以自信地在剩余的合约代码中使用代币信息，例如数量和 id。

## 结论

恭喜！您已经成功完成了一个教程，关于如何使用预言机验证 1SatOrdinals 输入。

完整的示例 [合约](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/oracleDemoBsv20.ts) 及其对应的 [测试](https://github.com/sCrypt-Inc/boilerplate/blob/master/tests/oracleDemoBsv20.test.ts) 可以在我们的 [boilerplate 仓库](https://github.com/sCrypt-Inc/boilerplate) 中找到。
