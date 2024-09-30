---
sidebar_position: 4
---

# 如何调试 ScriptContext 失败


[ScriptContext](../how-to-write-a-contract/scriptcontext.md) 使合约的逻辑能够按照协议正确执行，并确保合约的状态能够正确传播。

当它运行不正确时,你需要掌握以下方法来更高效地定位错误。


## hashOutputs 断言失败

`ScriptContext` 的 `hashOutputs` 字段是所有输出金额（8字节小端序）与 scriptPubKey 序列化后的双重 SHA256。通过它，我们可以就如何构造调用合约的交易输出达成一致。

如果交易的输出没有按照合约要求构造，那么 `ScriptContext` 的 `hashOutputs` 字段将与合约运行时代码中产生的 `outputs` 的双重 SHA256 不匹配。以下断言将失败：

```ts
assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
```

我们都知道，如果哈希的原像不一致，哈希值就不会匹配。当断言失败发生时，我们只能看到两个不匹配的哈希值，无法直观地看到两个哈希值原像之间的差异（即合约中的 `outputs` 和交易的输出）。


DebugFunctions 接口中提供了一个 `diffOutputs` 函数，用于直接比较 outputs 参数与绑定到 `this.to` 的交易的所有输出之间的差异。这些输出经过序列化和哈希处理后生成 `ScriptContext` 的 `hashOutputs` 字段。

只需在合约中调用 `this.debug.diffOutputs(outputs)`：

```ts
this.debug.diffOutputs(outputs) // 比较并打印差异结果
assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
```

你将看到比较结果：

![diffoutputs](/sCrypt/how-to-debug-scriptcontext-01.png)


如果交易的输出与合约预期的输出不一致:

1. 交易的输出标记为绿色。
2. 合约预期的输出标记为红色。
3. 相同的部分标记为灰色。
   
通过打印的比较结果,我们可以直观地看到合约中计算的输出中包含的聪数与构建交易时实际添加的输出中包含的聪数不同。现在,我们已经找到了错误的来源。
