---
sidebar_position: 5
---

# 使用代码分隔符

## 代码分隔符的工作原理

在比特币签名中，签名的内容是 [序列化的 ScriptContext](../how-to-write-a-contract/scriptcontext.md#serialization)，其格式如下：

![img](/sCrypt/codeseparator-01.png)

Part 5, `scriptCode`, 通常包含整个智能合约，即锁定脚本。唯一的例外是当存在 [OP_CODESEPARATOR](https://wiki.bitcoinsv.io/index.php/OP_CODESEPARATOR) (OCS) 时。当验证签名时，`scriptCode` 是锁定脚本，但删除了从最后一个执行的 OCS 开始的所有内容。

![img](/sCrypt/codeseparator-02.png)

如果存在多个 `OP_CODESEPARATOR` 实例，后续的 `checkSig` 将仅使用锁定脚本中从 **最新的** OCS 开始的部分作为 `scriptCode`。

![img](/sCrypt/codeseparator-03.png)

## 如何插入代码分隔符

要插入 [`OP_CODESEPARATOR`](https://wiki.bitcoinsv.io/index.php/OP_CODESEPARATOR)，只需调用 [insertCodeSeparator()](../how-to-write-a-contract/built-ins.md#insertcodeseparator)。

```ts
export class CodeSeparator extends SmartContract {

    @prop()
    readonly addresses: FixedArray<Addr, 3>;

    constructor(addresses: FixedArray<Addr, 3>) {
        super(...arguments);
        this.addresses = addresses;
    }

    @method()
    public unlock(sigs: FixedArray<Sig, 3>, pubKeys: FixedArray<PubKey, 3>) {
        assert(pubKey2Addr(pubKeys[0]) == this.addresses[0]);
        this.insertCodeSeparator()
        assert(this.checkSig(sigs[0], pubKeys[0]));

        this.insertCodeSeparator()
        assert(pubKey2Addr(pubKeys[1]) == this.addresses[1]);
        assert(this.checkSig(sigs[1], pubKeys[1]));

        this.insertCodeSeparator()
        assert(pubKey2Addr(pubKeys[2]) == this.addresses[2]);
        assert(this.checkSig(sigs[2], pubKeys[2]));
    }

}
```

在上面的例子中，`unlock` 方法调用 `insertCodeSeparator`。每次调用 `checkSig` 时，都会在签名验证过程中使用 `insertCodeSeparator` 的最新调用之后的代码。可以插入多个 `OP_CODESEPARATOR`，每个都会影响紧跟在其后的 `checkSig`。

### 生成签名

当使用 `OP_CODESEPARATOR` 时，我们需要改变获取签名的方式。这是因为通常情况下，签名覆盖整个锁定脚本，而不是删除 OCS 之前的所有内容。我们可以通过传递 `insertCodeSeparator` 的索引作为方法调用参数来指定哪个 `OP_CODESEPARATOR` 划分锁定脚本。
让我们来看一个上述智能合约的示例：

```ts
// 创建一个签名选项数组，每个签名选项对应一个单独的公钥。
const pubKeyOrAddrToSign: SignaturesOption = []
for (let i = 0; i < publicKeys.length; i++) {
    const pubKey = publicKeys[i]
    pubKeyOrAddrToSign.push({
        pubKeyOrAddr: pubKey, // 要为其创建签名的公钥。
        csIdx: i              // `insertCodeSeparator` 调用的索引，从 0 开始
                              // 例如，如果 csIdx = 1，则仅对从第二个 `insertCodeSeparator` 开始的部分进行签名。
                              // 例如，如果 csIdx = 1，则仅对从第二个 `insertCodeSeparator` 开始的部分进行签名。
    })
}
const callContract = async () => await demo.methods.unlock(
    (sigResps) => {
      // 在签名响应中，我们可以观察到，
      // 哪个实例的 `insertCodeSeparator` 被签名所考虑：
      console.log(sigResps)
      return findSigs(sigResps, publicKeys)
    },
    publicKeys.map((publicKey) => PubKey(toHex(publicKey))) as FixedArray<PubKey, 3>,
    {
        pubKeyOrAddrToSign
    } as MethodCallOptions<CodeSeparator>
)
expect(callContract()).not.throw
```
