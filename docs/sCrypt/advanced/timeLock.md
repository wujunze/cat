---
sidebar_position: 9
---

# 时间锁

## 概述

在本节中，我们将介绍如何创建一个智能合约，该合约具有一个公共方法，该方法只能在特定时间点之后解锁。

### 什么是时间锁？

在智能合约的上下文中，时间锁是一种功能，它限制特定比特币的支出，直到达到指定的未来时间或块高度。sCrypt 提供了在智能合约中实现这些类型的时间锁的机制，提供了一种机制，确保交易不会在达到特定时间点或块高度之前包含在区块链中。换句话说，智能合约的方法不能在特定时间点之后成功调用。

例如，这种机制可以用于向智能合约添加提款方法。在其他各方不合作的情况下，个人可以在一定时间后从智能合约中提取其锁定资金。这种方法在[跨链原子交换](https://xiaohuiliu.medium.com/cross-chain-atomic-swaps-f13e874fcaa7)中得到了应用。

![](/sCrypt/timeLock-01.png)
![](/sCrypt/timeLock-02.png)
*Image Credit: [bcoin](https://bcoin.io/guides/swaps.html)*

### 实现

在 sCrypt 中,可以通过限制[脚本执行上下文](../how-to-write-a-contract/scriptcontext)的 `locktime` 和 `sequence` 值来实施时间锁。这个上下文与交易的执行有关,包括对智能合约公共方法的调用。因此,如果对值进行了限制 - 例如,`locktime` 需要大于 `1690236000`(一个 Unix 时间戳) - 那么这个交易在达到该时间点之前就无法被包含到区块链中。

注意,`locktime` 的值可以是 Unix 时间戳或块高度。为了实施这个值,`sequence` 也需要设置为小于 `0xffffffff` 的值。

sCrypt 提供了一个方便的内置函数 `timeLock` 来实施这个约束。

```ts
// 公共方法可以被调用的时间。
@prop()
readonly matureTime: bigint // 可以是时间戳或块高度。

// ...

@method()
public unlock() {
    // 以下断言确保在 `matureTime` 通过之前，`unlock` 方法不能成功调用。
    assert(this.timeLock(this.matureTime), 'time lock not yet expired')
}
```

重要的是要注意，这种机制只能用于确保在特定时间点之后调用方法。相反，它不能用于确保在特定时间点之前调用方法。


#### 调用

在调用上面定义的 `unlock` 方法时，我们需要设置将调用公共方法的事务的 `locktime` 值。我们可以通过简单地设置 `MethodCallOptions` 的 `locktime` 参数来实现这一点。

```ts
timeLock.methods.unlock(
    {
        lockTime: 1673523720
    } as MethodCallOptions<TimeLock>
)
```

内部，这还将输入的 `sequence` 设置为小于 `0xffffffff` 的值。我们也可以显式地设置这个值。


```ts
timeLock.methods.unlock(
    {
        lockTime: 1673523720,
        sequence: 0
    } as MethodCallOptions<TimeLock>
)
```

最后，如果我们使用的是 [自定义交易构建器](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md)，我们需要为我们在那里构建的未签名事务设置这些值。

```ts
instance.bindTxBuilder('unlock',
  async (
    current: TimeLock,
    options: MethodCallOptions<TimeLock>
  ) => {

    // ...

    if (options.lockTime) {
      unsignedTx.setLockTime(options.lockTime)
    }
    unsignedTx.setInputSequence(0, 0)
    
    // ...
  }
)
```


## 它是如何工作的？

在底层，`timeLock` 函数断言我们的调用事务的 `sequence` 值小于 `UINT_MAX`。这确保了比特币网络将强制执行 `locktime` 值。

接下来，它检查我们的目标时间锁值是否表示块高度或 Unix 时间戳。如果它使用的是块高度，即时间锁值小于 500,000,000，方法还确保调用事务的 `locktime` 值对应于块高度。

最后，方法验证 `locktime` 的值大于或等于我们作为参数传递的时间锁。

有关 `locktime` 和 `sequence` 值如何工作的更多信息，请阅读 [BSV wiki 页面](https://wiki.bitcoinsv.io/index.php/NLocktime_and_nSequence)。