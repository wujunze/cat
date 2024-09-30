---
sidebar_position: 9
---

# 如何将合约发布到 NPM

## 什么是智能合约库？

智能合约库可以提供可以在许多合约中重用的方法。开发者可以使用现有的库来减少开发自己合约的成本。

智能合约库与智能合约的不同之处在于：

* 智能合约库不能有任何公共/入口 `@method`，这意味着库不能通过 tx 直接部署或调用。它们只能在一个智能合约或另一个库中调用。

* 智能合约库不能有任何状态属性，即 `@prop(true)` 属性。但一个声明为 `@prop()` 的属性是可以的。

## 编写一个智能合约库

使用 `sCrypt` 我们可以创建一个智能合约库类，如下所示：

```ts
class MyLib extends SmartContractLib {

  @prop()
  readonly buf: ByteString;

  constructor(buf: ByteString) {
    super(...arguments);
    this.buf = buf;
  }

  @method()
  append(content: ByteString) {
    this.buf += content;
  }

  @method()
  static add(x: bigint, y: bigint): bigint {
    return x + y;
  }

}
```

一个智能合约库可以声明为一个扩展 `SmartContractLib` 的类。它可能具有与智能合约相同的 `@prop`s 和 `@method`，就像具有相同规则的智能合约一样。智能合约库可以在 `@method` 中使用，如下所示：

```ts
class MyContract extends SmartContract {
  @method()
  public unlock(x: ByteString) {
    let myLib = new MyLib(hexToByteString('0123'));
    myLib.append(x);
    assert(MyLib.add(1n, 2n) === 3n, 'incorrect sum');
  }
}
```

## 测试智能合约库

你可以像正常类一样测试你的智能合约库，例如，编写一些单元测试：

```ts
describe('Test SmartContractLib `MyLib`', () => {
  it('should pass unit test successfully.', () => {
    expect(MyLib.add(1n, 2n)).to.eq(3n)
  })
})
```

你也可以编写一个使用库的智能合约，然后为该合约编写一些测试，如下所示：

```ts
class TestLib extends SmartContract {
  @method
  public unlock(x: bigint) {
    assert(MyLib.add(1n, 2n) == x, 'incorrect sum')
  }
}

describe('Test SmartContractLib `Lib`', () => {
  before(async() => {
    await TestLib.loadArtifact()
  })

  it('should pass integration test successfully.', () => {
    let testLib = new TestLib()
    let result = testLib.verify(self => self.unlock(3n))
    expect(result.success, result.error).to.be.true
  }
})

```

## 使用 sCrypt CLI 创建和发布库项目

以下命令将创建一个示例 `sCrypt` 库以及测试和 scaffolding：

```sh
npx scrypt-cli project --lib <your-lib-name>
```

注意 `lib` 选项已打开。

你可以通过在项目的根目录中运行以下命令在 [NPM](https://www.npmjs.com/) 上发布库：

```sh
npm publish
```

这会构建项目并在 NPM 上发布它。发布库后，用户可以像常规 NPM 包一样在任何其他项目中导入它。

:::tip `注意`
目前不支持命名导入。你应该像这样导入：
:::

```ts
import { MyLib } from “my_package”
```

### 高级

为了使导入系统正常工作，你应该始终发布自动生成的 sCrypt 合约（包括 `scrypt.index.json` 文件）以及 javascript 输出。包的结构可能如下所示：

```text
node_modules
|__ my_package
    |__ dist
        |__ myLib.js
        |__ myLib.d.ts
    |__ artifacts
        |__ myLib.scrypt
    |__ scrypt.index.json
    …
```

`scrypt.index.json` 文件将在 TypeScript 编译时在 `tsconfig.json` 的同一目录中生成，该文件应放在根目录中。不应手动移动或修改它。自动生成的 `.scrypt` 文件的文件夹（在上层文件树中的 `artifacts`）可以通过在 `tsconfig.json` 中配置 `outDir` 选项来更改，如下所示：

```json
"compilerOptions": {
  "plugins": [
    {
      "transform": "scrypt-ts/dist/transformation/transformer",
      "transformProgram": "true",
      "outDir": "my_scrypts_dir"
    }
  ]
}
```

你应该始终与包一起发布自动生成的 sCrypt 文件。

## 相关工具

### `scrypt-ts-lib`

这是一个由我们提供的智能合约库集合。你可以在 [这里](https://github.com/sCrypt-Inc/scrypt-ts-lib) 找到一些有用的工具。欢迎你贡献。
