---
sidebar_position: 2
---

# 签名哈希类型

签名哈希（sighash）标志用于指示由 ECDSA 签名签署的交易的哪部分。在比特币智能合约的上下文中，主要有两种使用方式。

## 1. 签名哈希类型

在本节中，我们将深入探讨签名哈希类型，并介绍如何在比特币签名中使用它。

### 数字签名

数字签名是一个数学方案，由两部分组成：

- 用于创建签名的算法，使用私钥对消息进行签名。

```text
sign(privateKey, message) --> signature
```

- 一个允许任何人在给定消息和公钥的情况下验证签名的算法。

```text
verify(signature, publicKey, message) --> true/false
```

私钥和公钥总是成对出现的，可以从私钥计算出公钥，但反之则不行。因此，您应该始终公开公钥，以便任何人都可以验证您的签名，并保持私钥安全，这样只有您才能提供正确的签名。

![img](/sCrypt/sighash-type-01.png)

数字签名用于表示消息的真实性和完整性，因为对消息的任何修改都会使签名无效，导致签名验证失败。它也是证明某人拥有私钥的证据，因为签名无法被伪造，并且只有在使用正确的私钥签名的情况下，才能使用相应的公钥成功验证签名。

### 比特币签名

数字签名被应用于消息验证，在比特币中，这些消息就是交易本身。签名意味着签名者对特定的交易数据做出承诺。最简单的形式是，签名适用于整个交易（不包括解锁脚本），从而承诺所有的输入、输出和其他交易字段。P2PKH 交易是使用签名的一个简单例子，在比特币中被广泛使用。

使用签名哈希标志，比特币签名指定了交易数据的哪些部分被包含在内，并因此被私钥签名。被包含的交易数据被称为[ScriptContext](../how-to-write-a-contract/scriptcontext.md)。每个签名都有一个签名哈希标志，并且每个签名的标志可以不同。

下图说明了使用`ALL`签名哈希标志时会签名哪些数据。被签名的数据以绿色高亮显示。

![img](/sCrypt/sighash-type-02.png)

有三种签名哈希标志：`ALL`、`NONE` 和 `SINGLE`。

| 签名哈希标志 | 描述                                                             |
| ------------ | ---------------------------------------------------------------- |
| ALL          | 签名适用于所有输入和输出                                         |
| NONE         | 签名适用于所有输入，但不适用于任何输出                           |
| SINGLE       | 签名适用于所有输入，但只适用于与签名输入具有相同索引号的那个输出 |

此外，还有一个修饰符标志 `ANYONECANPAY`，可以与前面的每个标志组合使用。当设置了 `ANYONECANPAY` 时，只有一个输入被签名，其余输入可以被修改。

| 签名哈希标志           | 描述                                         |
| ---------------------- | -------------------------------------------- |
| ALL \| ANYONECANPAY    | 签名适用于一个输入和所有输出                 |
| NONE \| ANYONECANPAY   | 签名适用于一个输入，但不适用于任何输出       |
| SINGLE \| ANYONECANPAY | 签名适用于一个输入和具有相同索引号的那个输出 |

所有六种标志可以在下图中总结。

![img](/sCrypt/sighash-type-03.png)

正如之前在[文档](../how-to-write-a-contract/scriptcontext.md#sighash-type)中所描述的，不同的签名哈希类型决定了花费交易的哪些部分被包含在`ScriptContext`中。具体来说，它会影响四个字段的值：`hashPrevouts`、`hashSequence`、`hashOutputs`和`sigHashType`。

| 字段         | 描述                                                                                                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hashPrevouts | 如果没有设置`ANYONECANPAY`修饰符，它是所有输入 outpoints 序列化后的双重 SHA256。否则，它是一个`uint256`的`0x0000......0000`。                                                                                         |
| hashSequence | 如果没有设置`ANYONECANPAY`、`SINGLE`、`NONE`中的任何一个，它是所有输入序列序列化后的双重 SHA256。否则，它是一个`uint256`的`0x0000......0000`。                                                                        |
| hashOutputs  | 如果签名哈希类型既不是`SINGLE`也不是`NONE`，它是所有输出序列化后的双重 SHA256。如果签名哈希类型是`SINGLE`且输入索引小于输出数量，它是与输入索引相同的输出的双重 SHA256。否则，它是一个`uint256`的`0x0000......0000`。 |
| sigHashType  | 签名的签名哈希类型                                                                                                                                                                                                    |

### 使用场景

对于使用默认签名哈希`ALL`签名的交易，它不能以任何方式被修改。这是因为签名承诺了交易的所有输入和输出，如果任何部分发生变化，签名和交易就会变得无效。在大多数情况下是合理的，因为发送者不希望其他人篡改已签名的交易。

让我们看一些使用非默认签名哈希类型的例子。

#### 众筹

试图筹集资金的人可以构建一个只有一个输出的交易。这个单一输出向筹款人支付目标金额。这样的交易显然是无效的，因为它没有输入。其他人可以通过添加自己的输入作为捐赠来修改它。他们使用`ALL|ANYONECANPAY`签名自己的输入，并将部分签名的交易传递给下一个捐赠者。`ALL`确保输出以及目标和筹款人不能被修改。`ANYONECANPAY`确保任何人都可以通过添加新的输入来支付，而不会使现有捐赠者的签名无效。每个捐赠都是一个"承诺"，在筹集到整个目标金额之前，筹款人无法收集。

#### 空白支票

试图开具空白支票的人可以构建一个有几个输入但没有输出的交易，并用`NONE`签名所有输入。签名只承诺交易的输入。这允许任何人向交易添加他们想要的输出，以任何方式花费资金。

### 如何生成具有特定签名哈希的签名

对于那些需要一个或多个签名作为输入参数的合约公共方法，我们可以在调用它时为签名指定不同的签名哈希类型。

以[P2PKH 合约](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#method-with-signatures)为例，它需要一个单一签名来`unlock`。

```ts
@method()
public unlock(sig: Sig, pubkey: PubKey) {
    // 检查传入的公钥是否属于指定地址。
    assert(pubKey2Addr(pubkey) == this.address, '公钥与地址不对应')
    // 检查签名有效性。
    assert(this.checkSig(sig, pubkey), '签名验证失败')
}
```

要指定签名哈希类型，需要进行两处更改，如果不明确指定，默认为 `ALL`。

1. 向 `pubKeyOrAddrToSign` 传递一个 `SignatureOption` 对象来指定签名哈希类型。
2. 将签名哈希作为 `findSig()` 的第三个参数传递。

让我们来看一个使用示例。假设我们已经部署了上述 `P2PKH` 合约，现在想要调用或解锁它。
然而，我们遇到了一个问题：我们没有足够的资金来支付新的合约调用交易的网络费用。幸运的是，一位慷慨的朋友愿意为我们支付这些费用。
在这种情况下，我们可以在签名中使用 `ANYONECANPAY | ALL` 标志来解锁已部署的 `P2PKH` 合约。这允许我们的朋友向我们的交易添加另一个输入，贡献资金来支付网络费用。

为了说明这一点，我们可以按如下方式构建合约调用：

```ts
const sighashType = SignatureHashType.ANYONECANPAY_ALL;
const { tx } = await p2pkh.methods.unlock(
  // 将第一个参数（签名）传递给 `unlock`。
  // 一旦交易被签名，签名将以 `SignatureResponse[]` 的形式返回。
  // 使用公钥、地址和指定的签名哈希类型来识别所需的签名。
  (sigResps) => findSig(sigResps, publicKey, sighashType),
  PubKey(toHex(publicKey)),
  {
    // 指示签名者使用与 `publicKey` 关联的私钥和指定的签名哈希类型来签署此交易。
    pubKeyOrAddrToSign: {
      pubKeyOrAddr: publicKey,
      sigHashType: sighashType,
    },
    // 此标志确保调用交易仅在本地创建而不广播。
    partiallySigned: true,
    // 防止自动添加手续费输入。
    autoPayFee: false,
  } as MethodCallOptions<P2PKH>
);
```

执行上述代码将生成完整的合约调用交易，但不会广播它。随后我们可以将这个交易传递给我们的朋友。由于我们应用了`ANYONECANPAY`签名哈希标志，添加额外的输入不会使我们的签名失效。这是因为网络节点将只使用第一个输入来验证我们的签名。

进一步说明，我们也可以使用`ANYONECANPAY | SINGLE`标志。这将赋予我们的朋友向我们的交易添加额外输出的能力。这可能会很有用，例如，如果他希望收回部分贡献资金作为找零，特别是当他使用了一个锁定资金过多的 UTXO 时。

你可以在我们的项目[boilerplate](https://github.com/sCrypt-Inc/boilerplate/blob/master/tests/p2pkh-anyonecanpay.test.ts)中找到完整的代码示例。

## 2. `@method()` 参数中的签名哈希类型

在本节中，我们将介绍如何在 `@method()` 装饰器中指定不同的签名哈希类型。

:::tip `注意`
这里的签名哈希只影响在其公共方法中访问 `ScriptContext` 的合约。
:::

### 计数器

让我们以 [计数器](../how-to-write-a-contract/stateful-contract.md) 合约为例。它简单地记录自部署以来被调用的次数。

请注意，`@method` [装饰器](../how-to-write-a-contract/basics#method-decorator) 接受一个签名哈希类型作为参数，其默认值为 `ALL`。根据 [文档](../how-to-write-a-contract/scriptcontext.md#sighash-type)，当签名哈希类型为 `ALL` 时，`hashOutputs` 是**所有输出**序列化的双重 SHA256。[默认的调用交易构建器](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md#default-1) 在必要时会添加一个找零输出。这就是为什么我们在公共方法中构建花费交易的输出时需要添加一个找零输出：我们需要构建包含在 `hashOutputs` 中的所有输出。否则，合约调用将失败。

以下 [交易](https://test.whatsonchain.com/tx/845f22b728deb23acacbc6f58f23ffde9c3e2be976e08c57f2bdcb417e3eacc5) 是 `Counter` 的一个合约调用交易。如你所见，它包含两个输出：一个用于新状态，另一个用于找零。

![img](/sCrypt/sighash-type-04.png)

### 高级计数器

请注意，在`Counter`的状态转换中，始终只有一个 UTXO 包含最新的合约状态。当合约被调用时，它会花费当前状态的 UTXO 并创建一个新状态的 UTXO。此外，花费交易的合约输入索引和合约输出索引是相同的。

实际上，在调用 Counter 时，我们只关心交易输入和输出中与合约相关的 UTXO，而不关心其他输入和输出。因此，我们可以使用`SINGLE | ANYONECANPAY`来简化合约。
`SINGLE`让我们专注于合约输出本身。
`ANYONECANPAY`允许任何人为这个合约调用交易添加输入，例如，用于支付费用。

我们对原始 Counter 进行了两处修改。

1. 使用`@method(SigHash.ANYONECANPAY_SINGLE)`
2. 构建一个只包含合约新状态的`output`，不包括找零输出。

```ts
export class AdvancedCounter extends SmartContract {
    ...

    // 1) 添加 ANYONECANPAY_SINGLE
    @method(SigHash.ANYONECANPAY_SINGLE)
    public incrementOnChain() {
        ...

        const amount: bigint = this.ctx.utxo.value
        // 2) 移除找零输出
        const output: ByteString = this.buildStateOutput(amount)
        assert(this.ctx.hashOutputs == hash256(output), 'hashOutputs mismatch')
    }

    ...
}
```

您可以在[这里查看完整代码](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/advancedCounter.ts)。

以下[交易](https://test.whatsonchain.com/tx/e06d86f8d8b867c503eca799bb542b5f1d1f81aa75ad00ab4377d65764bef68c)是`AdvancedCounter`的一个合约调用交易。您可以看到它也包含两个输出，但由于我们使用了`SINGLE`，在公共方法中检查是否哈希到`hashOutputs`时，我们只使用了一个输出。

![img](/sCrypt/sighash-type-05.png)

### 更多示例

在 `@method()` 装饰器中使用不同的签名哈希类型会改变 `ScriptContext` 的值。这在许多情况下都很有用。

- 如果您的合约需要限制花费交易的所有输入和输出，请使用 `ALL`。
- 如果您的合约是有状态的，并且状态始终在单个输出中，可以使用 `SINGLE` 来简化它。
- 如果您希望在交易封装后允许其他人添加输入，例如用于支付交易费用，请应用 `ANYONECANPAY` 修饰符。

您可以在我们的 [boilerplate](https://github.com/sCrypt-Inc/boilerplate) 中找到这些示例。

- [AnyoneCanSpend](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/acs.ts)
- [Clone](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/clone.ts)
- [ERC20](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/erc20.ts)
- [ERC721](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/erc721.ts)
- [OrdinalLock](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/ordinalLock.ts)
