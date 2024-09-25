---
sidebar_position: 5
---

# 如何测试合约

在生产环境中使用智能合约之前，应该仔细测试它，特别是由于任何错误都可能导致**真实经济损失**。

使用 [sCrypt CLI 工具](./installation.md#the-scrypt-cli-tool) 创建一个示例项目：

```sh
npx scrypt-cli project demo
```

这将创建一个完整的 sCrypt 项目，其中包含一个示例智能合约 `Demo`：

```ts
import {
    assert,
    ByteString,
    method,
    prop,
    sha256,
    Sha256,
    SmartContract,
} from 'scrypt-ts'

export class Demo extends SmartContract {
    @prop()
    hash: Sha256

    constructor(hash: Sha256) {
        super(...arguments)
        this.hash = hash
    }

    @method()
    public unlock(message: ByteString) {
        assert(sha256(message) == this.hash, 'Hash does not match')
    }
}
```

现在，让我们打开文件 `tests/demo.test.ts`。这个文件包含我们 `Demo` 合约的部署代码，以及对合约的后续方法调用。

## 加载工件

首先，调用函数 `SmartContract.loadArtifact()` 来加载合约工件文件，以便在测试之前初始化合约类。

```ts
Demo.loadArtifact()
```

## 实例化合约

实例化合约并连接一个 [signer](./how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#signer)。

```ts
instance = new Demo(sha256(toByteString('hello world', true)))
// 连接一个 signer
await instance.connect(getDefaultSigner())
```

## 合约部署

要部署智能合约，只需调用其 `deploy()` 方法：

```ts
const deployTx = await instance.deploy(1)
console.log('Demo contract deployed: ', deployTx.id)
```

## 调用方法

### 公共

你可以像之前一样调用合约的公共 `@method` ：

```ts
// 通过在 `methods` 对象上调用 `unlock()` 来构建和发送交易。
await instance.methods.unlock(
    toByteString('hello world', true)
)
```

### 非公共

你也可以调用非公共方法。

让我们向合约添加一个非公共方法：

```ts
@method()
hashMessage(message: ByteString): ByteString {
    return sha256(message)
}
```

你可以像下面这样调用这个方法：

```ts
const message: ByteString = toByteString('hello world', true)
const hashRes: ByteString = instance.hashMessage(message)
```

注意，与公共方法相比，没有 `.methods` 后缀。

如果方法是静态的，可以像这样调用：

```ts
@method()
static hashMessageStatic(message: ByteString): ByteString {
    return sha256(message)
}
```

```ts
const hashRes: ByteString = Demo.hashMessageStatic(message)
```

需要注意的是，非公共方法只能在链下直接调用，例如用于测试。在链上，它们只能通过公共方法调用。

## 与测试框架集成

你可以使用任何你喜欢的测试框架来为你的合约编写单元测试。例如，使用 [Mocha](https://mochajs.org/) 的测试如下所示：

```js
describe('Test SmartContract `Demo`', () => {
    let instance: Demo

    before(async () => {
        Demo.loadArtifact()
        instance = new Demo(sha256(toByteString('hello world', true)))
        await instance.connect(getDefaultSigner())
    })

    it('should pass the public method unit test successfully.', async () => {
        await instance.deploy(1)

        const call = async () => instance.methods.unlock(
            toByteString('hello world', true)
        )

        await expect(call()).not.to.be.rejected
    })

    it('should throw with wrong message.', async () => {
        await instance.deploy(1)

        const call = async () => instance.methods.unlock(toByteString('wrong message', true))
        await expect(call()).to.be.rejectedWith(/Hash does not match/)
    })
})
```

## 运行测试

与其它区块链相比，比特币上的智能合约是**纯**的。

* 给定相同的输入，它的公共方法总是返回相同的布尔输出：成功或失败。它没有内部状态。
* 公共方法调用不会产生副作用。

因此，你可以在两种不同的环境中运行测试：

1. **Local**: 在本地运行测试，不接触比特币区块链。事务是使用虚拟 UTXO 构建的。如果它在链下通过测试，我们就可以有信心它在链上也会表现相同。

在 `local` 环境中运行测试，使用以下命令：

```sh
npm run test
```

2. **Testnet**: 在比特币测试网上运行测试。事务是使用真实 UTXO 构建的。

在 `testnet` 环境中运行测试，使用以下命令：

```sh
npm run test:testnet
```

:::tip `提示`
当在 `testnet` 环境中运行测试时，你需要从[水龙头](./how-to-deploy-and-call-a-contract/faucet.md)获取一些测试币。
:::

## 测试状态合约

状态合约的测试与上述内容非常相似。唯一的不同是，你需要意识到方法调用后合约实例的变化。

如[概述](./how-to-write-a-contract/stateful-contract.md#overview)所述，对于每个方法调用，一个事务包含新的合约 UTXO(s)，其中包含最新的更新状态，即下一个实例。从当前消费事务的角度来看，合约实例的公共 `@method` 在其输入中被调用，下一个合约实例存储在其输出之一中。

现在，让我们看看如何测试 `incrementOnChain` 方法调用：

```ts
// 初始化第一个实例，即部署
let counter = new Counter(0n);
// 连接到 signer
await counter.connect(getDefaultSigner());
// 部署合约
await counter.deploy(1)

// 将当前实例设置为第一个实例
let current = counter;

// 从当前实例创建下一个实例
let nextInstance = current.next();

// 在下一个实例上应用相同的更新
nextInstance.increment();

// 调用当前实例的方法将更新应用到链上
const call = async () => current.methods.incrementOnChain(
  {
    // 在这里提供下一个实例及其余额
    next: {
      instance: nextInstance,
      balance
    }
  } as MethodCallOptions<Counter>
);

await expect(call()).not.to.be.rejected
```

一般来说，我们通过3个步骤调用状态合约的方法：

### 1. 构建 `current` 实例

`current` 实例指的是包含区块链上最新状态的合约实例。第一个实例在部署事务中。在上面的例子中，我们将 `current` 实例初始化为第一个实例，如下所示：

```ts
let current = counter;
```

### 2. 创建一个 `next` 实例并在链下应用更新

`next` 实例是方法调用事务的 UTXO 中的新实例。

要创建特定合约实例的 `next` 实例，只需在其上调用 `next()`：

```ts
let nextInstance = instance.next();
```

它会创建一个 `instance` 的所有属性和方法的深层副本，以创建一个新的实例。

然后，你应该将所有状态更新应用到 `next` 实例。请注意，这些只是本地/链下的更新，尚未应用到区块链。

```ts
nextInstance.increment();
```

这是我们在 `incrementOnChain` 中调用的同一个方法，感谢两者都是用 TypeScript 编写的。

#### 浅拷贝

有时，如果你只想对某些属性进行浅拷贝，你可以像这样传递属性名称作为可选参数：

```ts
const nextInstance = instance.next(
    {
        refCloneProps: ['prop1', 'prop2']
    }
)
```

在这个上下文中，`next` 被设计为创建指定属性的浅拷贝，允许选择性复制，而不是整个合约实例的完整复制。

### 3. 调用 `current` 实例的方法以在链上应用更新

如 [此部分](#公共) 所述，我们可以构建一个调用事务。这里唯一的区别是我们在状态合约中传递 `next` 实例及其余额作为方法调用选项。因此，方法（即 `incrementOnChain`）拥有所有必要的信息来验证对 `next` 实例的所有更新是否遵循其中的状态转换规则。

```ts
const call = async () => current.methods.incrementOnChain(
  {
    // 在这里提供下一个实例及其余额
    next: {
      instance: nextInstance,
      balance
    }
  } as MethodCallOptions<Counter>
);
await expect(call()).not.to.be.rejected
```

### 再次运行测试

与之前一样，我们可以使用以下命令：

```sh
npm run test
```

或者

```sh
npm run test:testnet
```
