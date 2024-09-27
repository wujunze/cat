---
sidebar_position: 10
---

# 如何将合约实例重放到最新状态

使用[sCrypt Service](./how-to-integrate-scrypt-service.md)和[sCrypt client](./how-to-integrate-scrypt-service.md#step-1-initialize-client)，我们可以轻松创建一个反映最新状态的合约实例，如下所示：

```ts
const currentInstance = await Scrypt.contractApi.getLatestInstance(
    Counter,
    contractId
)
```

然而，这种方法对于具有[HashedMap](../how-to-write-a-contract/built-ins.md#hashedmap)或[HashedSet](../how-to-write-a-contract/built-ins.md#hashedset)类型的状态的智能合约无效。这是因为每个实例仅包含哈希值，而不是原始值。

在本节中，我们将使用位于`src/contracts/crowdfundReplay.ts`的[contract CrowdfundReplay](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/crowdfundReplay.ts)作为参考，解释如何将这些合约实例重放到其最新状态。

这个众筹合约包含一个`donators`类型的HashedMap，记录了捐赠者的公钥及其相应的捐赠数量。

```ts
export type Donators = HashedMap<PubKey, bigint>

export class CrowdfundReplay extends SmartContract {
	
	@prop(true)
	donators: Donators
	
	...
}
```

这个合约有三个公共方法：

- `donate` 将一个条目添加到HashedMap。
- `refund` 从map中删除一个特定的捐赠者。
- `collect` 销毁合约而不更新任何状态属性。

```ts
export type Donators = HashedMap<PubKey, bigint>

export class CrowdfundReplay extends SmartContract {
	...

	@method()
    public donate(donator: PubKey, amount: bigint) {
        ...
        assert(!this.donators.has(donator), 'donator already exists')
		this.donators.set(donator, amount)
        ...
    }

    @method()
    public refund(donator: PubKey, amount: bigint, sig: Sig) {
        ...
        assert(this.donators.canGet(donator, amount), 'not donated before')
        assert(this.donators.delete(donator), 'failed to remove donator')
        ...
    }

    @method()
    public collect(sig: Sig) {
        ...
    }
}
```

要重放合约实例到最新状态，请按照以下三个步骤操作：

## 第一步. 离线辅助函数

首先，添加辅助函数，以与公共方法**相同**的方式更新状态属性。

这些函数在`offchainUpdates`对象中定义：

```ts
class CrowdfundReplay extends SmartContract {

    ...

    offchainUpdates: OffchainUpdates<CrowdfundReplay> = {
        'donate': (next: CrowdfundReplay, donator: PubKey, amount: bigint) => {
            next.donators.set(donator, amount)
        },
        'refund': (next: CrowdfundReplay, donator: PubKey) => {
            next.donators.delete(donator)
        },
    }

   ...
}
```

:::note
对象的键必须与公共方法名称完全匹配。
:::

在我们的例子中，我们只需要两个辅助函数，因为`collect`方法不会更改任何状态属性。

## 第二步. 从部署交易创建实例

使用合约ID检索部署交易，然后从部署交易中[恢复](../how-to-write-a-contract/built-ins.md#fromtx)合约实例。

```ts
// 从部署交易中恢复合约实例
const tx = await provider.getTx(contractId.txId)
const instance = CrowdfundReplay.fromTx(
    tx,
    contractId.outputIndex,
    {
        donators: new HashedMap<PubKey, bigint>(),
    }
)
```

**注意**: 有关`fromTx()`和`getTransaction()`函数工作原理的更多详细信息，请参阅[此处](../how-to-write-a-contract/built-ins.md#fromtx)的文档。

## 第三步. 将实例重放到最新状态

调用`replayToLatest`函数以获取最新的合约实例。

```ts
import { replayToLatest } from 'scrypt-ts'

...

const latestInstance = await replayToLatest(instance, contractId)

if (latestInstance) {
    // 最新的实例现在可以使用了。
    ...
}
```

**注意**: 如果`replayToLatest()`函数返回`null`，则表示自合约部署以来没有状态变化。这种情况发生在合约自部署以来没有被交互，或者所有状态修改都被回滚了。

---
