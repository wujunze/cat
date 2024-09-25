---
sidebar_position: 7
---

# 如何调试合约

调试 sCrypt 合约与调试 TypeScript 一样简单，因为它只是 TypeScript。

## 使用 console.log()

你可以使用 `console.log()` 将输出打印到控制台。

```ts
export class Demo extends SmartContract {

    @prop()
    readonly x: bigint

    @prop()
    readonly y: bigint

    constructor(x: bigint, y: bigint) {
        super(...arguments)
        this.x = x
        this.y = y
    }

    @method()
    sum(a: bigint, b: bigint): bigint {
        return a + b
    }

    @method()
    public add(z: bigint) {
        console.log(`z: ${z}`) // print the value of z
        console.log(`sum: ${this.x + this.y}`) // print the value of this.x + this.y
        assert(z == this.sum(this.x, this.y), 'incorrect sum')
    }
}
```

[Try it on Replit](https://replit.com/@msinkec/scryptTS-console-logging)

运行代码后，你应该看到以下输出：

```text
z: 3
sum: 3
```

## 使用 Visual Studio Code 调试器

你可以使用 VS Code 调试 sCrypt 合约，就像调试任何其他 TypeScript 程序一样。如果你使用 [sCrypt CLI](installation.md) 创建了一个项目，你应该有一个自动生成的 [launch.json](https://github.com/sCrypt-Inc/boilerplate/blob/master/.vscode/launch.json)，其中包含调试器所需的一切。要了解更多关于 VS Code TypeScript 调试器的信息，请参阅 [官方文档](https://code.visualstudio.com/docs/TypeScript/TypeScript-debugging)。

![img](/sCrypt/how-to-debug-a-contract-01.png)

你可以设置一些断点，并从 `运行和调试` 视图（或按 **F5**）中选择 `启动演示` 来立即启动调试器。

![img](/sCrypt/how-to-debug-a-contract-02.gif)

:::tip `提示`
你需要在 [launch.json](https://github.com/sCrypt-Inc/boilerplate/blob/master/.vscode/launch.json#L13) 中更改合约文件名，如果需要的话。
:::

### 调试测试

如果你想要调试一个用 [Mocha](https://mochajs.org) 测试框架编写的单元测试，从 `运行和调试` 视图中选择 `启动演示测试`。

![img](/sCrypt/how-to-debug-a-contract-03.gif)

:::tip `提示`
你需要在 [launch.json](https://github.com/sCrypt-Inc/boilerplate/blob/master/.vscode/launch.json#L25) 中更改合约测试文件名，如果需要的话。
:::

### 调试 ScriptContext 失败

一个常见的问题是 ScriptContext 断言失败，比如

```typescript
assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
```

请参考[此指南](advanced/how-to-debug-scriptcontext.md)来调试此类失败。
