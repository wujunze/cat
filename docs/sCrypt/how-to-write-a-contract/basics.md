---
sidebar_position: 1
---
# 基础知识

一个智能合约是一个扩展了 `SmartContract` 基类的类。一个简单的例子如下。

```ts
import { SmartContract, method, prop, assert } from "scrypt-ts"

class Equations extends SmartContract {

  @prop()
  sum: bigint

  @prop()
  diff: bigint

  constructor(sum: bigint, diff: bigint) {
    super(...arguments)
    this.sum = sum
    this.diff = diff
  }

  @method()
  public unlock(x: bigint, y: bigint) {
    assert(x + y == this.sum, 'incorrect sum')
    assert(x - y == this.diff, 'incorrect diff')
  }

}
```

上面的智能合约要求解决两个方程，未知变量 `x` 和 `y`。

用 `@prop` 和 `@method` 装饰的类成员最终会出现在链上，因此它们必须是 TypeScript 的严格子集。用它们装饰的任何地方都可以在链上上下文中视为。用它们装饰的成员是常规的 TypeScript，并保持在链外。`sCrypt` 的显著好处是链上和链下代码都用同一种语言编写：TypeScript。

:::tip `注意`
你可以使用 [sCrypt 在 Repl.it 上的模板](https://replit.com/@msinkec/sCrypt) 和在浏览器中玩代码！
:::

## 属性

一个智能合约可以有两种属性：

1. 用 `@prop` 装饰器装饰的属性：这些属性 **仅允许使用下面指定的类型**，并且它们只能在构造函数中初始化。

2. 没有 `@prop` 装饰器的属性：这些属性是常规的 TypeScript 属性，没有任何特殊要求，这意味着它们可以使用任何类型。在用 `@method` 装饰的方法中访问这些属性是禁止的。

### `@prop` 装饰器

使用此装饰器标记任何打算存储在链上的属性。

此装饰器接受一个 `boolean` 参数。默认情况下，它设置为 `false`，这意味着属性在合约部署后无法更改。如果值为 `true`，则该属性是一个所谓的 [stateful](./stateful-contract) 属性，并且其值可以在后续的合约调用中更新。

```ts
// good, `a` 存储在链上，并且在合约部署后是只读的
@prop()
readonly a: bigint

// 有效，但不够好，`a` 在合约部署后无法更改
@prop()
a: bigint

// good, `b` 存储在链上，并且其值可以在后续合约调用中更新
@prop(true)
b: bigint

// invalid, `b` 是一个 stateful 属性，不能是只读的
@prop(true)
readonly b: bigint

// good
@prop()
static c: bigint = 1n

// invalid, static 属性必须在使用时初始化
@prop()
static c: bigint

// invalid, stateful 属性不能是 static 的
@prop(true)
static c: bigint = 1n

// good, `UINT_MAX` 是一个编译时常量 (CTC)，不需要显式类型
static readonly UINT_MAX = 0xffffffffn

// valid, but not good enough, `@prop()` 对于 CTC 不是必须的
@prop()
static readonly UINT_MAX = 0xffffffffn

// invalid
@prop(true)
static readonly UINT_MAX = 0xffffffffn
```

## 构造函数

一个智能合约必须有一个显式的 `constructor()` 如果它至少有一个 `@prop` 不是 `static` 的。

`super` 方法 **必须** 在构造函数中调用，并且构造函数的所有参数都应该传递给 `super`
在相同的顺序中，作为它们传递到构造函数中。例如，

```ts
class A extends SmartContract {
  readonly p0: bigint

  @prop()
  readonly p1: bigint

  @prop()
  readonly p2: boolean

  constructor(p0: bigint, p1: bigint, p2: boolean) {
    super(...arguments) // same as super(p0, p1, p2)
    this.p0 = p0
    this.p1 = p1
    this.p2 = p2
  }
}

```

[`arguments`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments) 是一个包含传递给该函数的参数值的数组。`...` 是 [展开语法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Spread_syntax)。

## 方法

与属性一样，智能合约还可以有两种方法：

1. 用 `@method` 装饰器装饰的方法：这些方法只能调用 **通过 `@method` 装饰的方法或下面指定的函数**。此外，**只能访问用 `@prop` 装饰的属性**。

2. 没有 `@method` 装饰器的方法：这些方法只是常规的 TypeScript 类方法。

### `@method` 装饰器

1. 使用此装饰器标记任何打算在链上运行的方法。
2. 它接受一个 [sighash 标志](./scriptcontext.md#sighash-type) 作为参数。

### 公开 `@method`

每个合约 **必须** 至少有一个公开 `@method`。它用 `public` 修饰符表示，不返回任何值。它在合约之外可见，并作为合约的主要方法（类似于 C 和 Java 中的 `main`）。

一个公开 `@method` 可以从外部事务中调用。如果它在没有违反任何条件的情况下运行完成，则调用成功 [assert()](./built-ins.md#assert). 一个例子如下。

```ts
@method()
public unlock(x: bigint, y: bigint) {
  assert(x + y == this.sum, 'incorrect sum')
  assert(x - y == this.diff, 'incorrect diff')
}
```

#### 结束规则

一个公开 `@method` 方法 **必须** 在所有可达的代码路径中以 `assert()` 结束。`console.log()` 调用将在验证上述规则时被忽略。

一个详细的例子如下。

```ts
class PublicMethodDemo extends SmartContract {

  @method()
  public foo() {
    // 有效，最后一条语句是 `assert()` 语句
    assert(true);
  }

  @method()
  public foo() {
    // 有效，`console.log` 调用将在验证最后一条 `assert()` 语句时被忽略
    assert(true); //
    console.log();
    console.log();
  }

  @method()
  public foo() {
    // 有效，最后一条语句是 `for` 语句
    for (let index = 0; index < 3; index++) {
        assert(true);
    }
  }

  @method()
  public foo(z: bigint) {
    // 有效，最后一条语句是 `if-else` 语句
    if(z > 3n) {
        assert(true)
    } else {
        assert(true)
    }
  }

  @method()
  public foo() {
    // 无效，每个公开方法的最后一条语句应该是一个 `assert()` 语句
  }

  @method()
  public foo() {
    assert(true);
    return 1n;  // 无效，因为公开方法不能返回任何值
  }

  @method()
  public foo() {
    // 无效，`for` 语句体中的最后一条语句没有以 `assert()` 结束
    for (let index = 0; index < 3; index++) {
        assert(true);
        z + 3n;
    }
  }

  @method()
  public foo() {
    // 无效，因为每个条件分支都没有以 `assert()` 结束
    if(z > 3n) {
      assert(true)
    } else {

    }
  }

  @method()
  public foo() {
    // 无效，因为每个条件分支都没有以 `assert()` 结束
    if(z > 3n) {
      assert(true)
    }
  }
}
```

### 非公开 `@method`

没有 `public` 修饰符，一个 `@method` 是内部的，并且不能直接从外部事务中调用。

```ts
@method()
xyDiff(): bigint {
  return this.x - this.y
}

// static method
@method()
static add(a: bigint, b: bigint): bigint {
  return a + b;
}
```

:::tip `注意`
**递归是不允许的**。一个 `@method`，无论是公开的还是非公开的，都不能直接在其自身的主体中调用自身，也不能间接调用另一个方法，该方法会转而调用自身。
:::

一个更详细的例子如下。

```ts
class MethodsDemo extends SmartContract {
  @prop()
  readonly x: bigint;
  @prop()
  readonly y: bigint;

  constructor(x: bigint, y: bigint) {
    super(...arguments);
    this.x = x;
    this.y = y;
  }

  // 有效，非公开的静态方法，不访问 `@prop` 属性
  @method()
  static add(a: bigint, b: bigint): bigint {
    return a + b;
  }

  // 有效，非公开的方法
  @method()
  xyDiff(): bigint {
    return this.x - this.y
  }

  // 有效，公开的方法
  @method()
  public checkSum(z: bigint) {
    // 有效，使用类名调用 `sum`
    assert(z == MethodsDemo.add(this.x, this.y), 'check sum failed');
  }

  // 有效，另一个公开的方法
  @method()
  public sub(z: bigint) {
    // 有效，使用类实例调用 `xyDiff`
    assert(z == this.xyDiff(), 'sub check failed');
  }

  // 有效，但不好，公开的静态方法
  @method()
  public static alwaysPass() {
    assert(true)
  }
}
```

## 数据类型

在 `@prop` 和 `@method` 中使用的类型限制为这些类型：

### 基本类型

#### `boolean`

一个简单的值 `true` 或 `false`.

```ts
let isDone: boolean = false
```

#### `bigint`

`bigint` 可以表示任意大的整数。一个 [bigint 字面量](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) 是一个带有后缀 `n` 的数字：

```ts
11n
0x33FEn
const previouslyMaxSafeInteger = 9007199254740991n
const alsoHuge = BigInt(9007199254740991)
// 9007199254740991n
const hugeHex: bigint = BigInt("0x1fffffffffffff")
// 9007199254740991n
```

#### `ByteString`

在智能合约上下文中（即在 `@method` 或 `@prop`s 中），一个 `ByteString` 表示一个字节数组。

一个字面量 `string` 可以转换为 `ByteString` 使用函数 `toByteString(literal: string, isUtf8: boolean = false): ByteString`:

* 如果没有传递 `isUtf8` 或 `isUtf8` 是 `false`，那么 `literal` 应该是十六进制字面量，可以用正则表达式表示：`/^([0-9a-fA-F]{2})*$/`
* 否则，`literal` 应该是 utf8 字面量，例如 `hello world`.

:::tip `注意`
`toByteString` **仅** 接受字符串字面量作为其第一个参数，并接受布尔字面量作为第二个参数。
:::

```ts
let a = toByteString('0011') // 有效，`0011` 是一个有效的十六进制字面量
// 0011
let b = toByteString('hello world', true) // 有效
// 68656c6c6f20776f726c64

toByteString('0011', false) // 有效
// 30303131

toByteString(b, true) // 无效，没有将字符串字面量传递给第一个参数

toByteString('001') // 无效，`001` 不是一个有效的十六进制字面量
toByteString('hello', false) // 无效，`hello` 不是一个有效的十六进制字面量

toByteString('hello', 1 === 1) // 无效，没有将布尔字面量传递给第二个参数

let c = true
toByteString('world', c) // 无效，没有将布尔字面量传递给第二个参数
```

`ByteString` 具有以下运算符和方法：

* `==` / `===`: 比较

* `+`: 连接

```ts
const str0 = toByteString('01ab23ef68')
const str1 = toByteString('656c6c6f20776f726c64')

// 比较
str0 == str1
str0 === str1
// false

// 连接
str0 + str1
// '01ab23ef68656c6c6f20776f726c64'
```

#### `number`

类型 `number` 不允许在 `@prop`s 和 `@method` 中使用，除非在以下情况下。我们可以使用 `Number()` 函数将 `bigint` 转换为 `number`。

* 数组索引

```ts
let arr: FixedArray<bigint, 3> = [1n, 3n, 3n]
let idx: bigint = 2n
let item = arr[Number(idx)]
```

* 循环变量

``` ts
for (let i: number = 0 i < 10 i++) {
  let j: bigint = BigInt(i) // convert number to bigint
}
```

它也可以在定义 [编译时常量](#compile-time-constant) 时使用。

### 固定大小数组

所有数组 **必须** 是固定大小的，并声明为类型 `FixedArray<T, SIZE>`，其 `SIZE` 必须是一个 [CTC](#compile-time-constant) 描述后面。

TypeScript 中声明的常见数组 `T[]` 或 `Array<T>` 不允许在 `@prop`s 和 `@method` 中使用，因为它们是动态大小的。

```ts
let aaa: FixedArray<bigint, 3> = [1n, 3n, 3n]

// 设置为所有 0
const N = 20
let aab: FixedArray<bigint, N> = fill(0n, N)

// 二维数组
let abb: FixedArray<FixedArray<bigint, 2>, 3> = [[1n, 3n], [1n, 3n], [1n, 3n]]
```

:::tip `注意`
一个 `FixedArray` 在链上和链下行为不同，当作为函数参数传递时。它在链下 *按引用传递*，作为常规的 TypeScript/JavaScript 数组，而在链上 *按值传递*。因此，强烈建议不要在函数中修改 `FixedArray` 参数的元素。
:::

```ts
class DemoContract extends SmartContract {

    @prop(true)
    readonly a: FixedArray<bigint, 3>

    constructor(a: FixedArray<bigint, 3>) {
        super(...arguments)
        this.a = a
    }

    @method()
    onchainChange(a: FixedArray<bigint, 3>) {
        a[0] = 0
    }

    offchainChange(a: FixedArray<bigint, 3>) {
        a[0] = 0
    }

    @method()
    public main(a: FixedArray<bigint, 3>) {
      this.onchainChange(this.a)
      // 注意：a[0] 在链上没有改变
      assert(this.a[0] == 1n)
    }
}

const arrayA: FixedArray<bigint, 3> = [1n, 2n, 3n]
const instance = new DemoContract(arrayA);

instance.offchainChange(arrayA)
// 注意：arrayA[0] 在链下被改变
assert(arrayA[0] = 0n)
```

:::tip `注意`
一个 `FixedArray` 在链上和链下行为不同，当作为函数参数传递时。它在链下 *按引用传递*，作为常规的 TypeScript/JavaScript 数组，而在链上 *按值传递*。因此，强烈建议不要在函数中修改 `FixedArray` 参数的元素。
:::

### 用户定义的类型

#### `type` or `interface`

用户可以使用 `type` 或 `interface` 来最好地定义自定义类型，这些类型由基本类型组成。一个用户定义的类型在链上按值传递，在链下按引用传递，与 `FixedArray` 相同。因此，强烈建议不要在函数中修改参数的 `field`，该参数是用户定义的类型。

```ts
type ST = {
  a: bigint
  b: boolean
}

interface ST1 {
  x: ST
  y: ByteString
}

type Point = {
  x: number
  y: number
}

function printCoord(pt: Point) {
  console.log("The coordinate's x value is " + pt.x)
  console.log("The coordinate's y value is " + pt.y)
}

interface Point2 {
  x: number
  y: number
}

// 与前面的例子完全相同
function printCoord(pt: Point2) {
  console.log("The coordinate's x value is " + pt.x)
  console.log("The coordinate's y value is " + pt.y)
}

```

#### `enum`

sCrypt 支持枚举，它们对于建模选择和跟踪状态非常有用。

用户可以在合约之外定义枚举。

#### 声明和使用枚举

```ts

// 枚举状态
// 待处理 - 0
// 已发货 - 1
// 已接受 - 2
// 已拒绝 - 3
// 已取消 - 4
export enum Status {
    Pending,
    Shipped,
    Accepted,
    Rejected,
    Canceled,
}


export class Enum extends SmartContract {
    @prop(true)
    status: Status

    constructor() {
        super(...arguments)
        this.status = Status.Pending
    }

    @method()
    get(): Status {
        return this.status
    }

    // 通过将 Int 传递给输入来更新状态
    @method()
    set(status: Status): void {
        this.status = status
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public unlock() {
        let s = this.get()
        assert(s == Status.Pending, 'invalid status')

        this.set(Status.Accepted)

        s = this.get()

        assert(s == Status.Accepted, 'invalid status')

        assert(this.ctx.hashOutputs == hash256(this.buildStateOutput(this.ctx.utxo.value)),
                'hashOutputs check failed')
    }
}
```

:::tip `注意`
`Enum` 成员只能用字面量数字初始化，不能用字符串初始化。
:::

```ts
export enum Status {
    Pending, // 有效
    Shipped = 3, // 有效
    Accepted, // 有效
    Rejected = "Rejected", // 无效
    Canceled,
}
```

### 域类型

有几种特定于比特币上下文的类型，用于进一步提高类型安全性。它们都是 `ByteString` 的子类型。也就是说，它们可以在需要 `ByteString` 的地方使用，但反之则不行。

* `PubKey` - 一个公钥

* `Sig` - 一个签名类型，在 [DER 格式](https://academy.bit2me.com/en/que-son-firmas-estrictas-der) 中，包括最后的 sighash 标志

* `Ripemd160` - 一个 RIPEMD-160 哈希

* `Addr` - 一个 `Ripemd160` 的别名，通常表示一个比特币地址。

* `PubKeyHash` - 另一个 `Ripemd160` 的别名

* `Sha1` - 一个 SHA-1 哈希

* `Sha256` - 一个 SHA-256 哈希

* `SigHashType` - 一个 sighash

* `SigHashPreimage` - 一个 sighash preimage

* `OpCodeType` - 一个 Script [opcode](https://wiki.bitcoinsv.io/index.php/Opcodes_used_in_Bitcoin_Script)

```ts
@method()
public unlock(sig: Sig, pubkey: PubKey) {
    // 函数 pubKey2Addr() 接受一个 'pubkey'，它是 PubKey 类型。
    assert(pubKey2Addr(pubkey) == this.pubKeyHash)
    assert(this.checkSig(sig, pubkey), 'signature check failed')
}
```

### 导入类型

所有类型都可以从 `scrypt-ts` 包中导入：

```ts
import {
    ByteString,
    Pubkey,
    FixedArray,
    Sig,
    Addr
} from 'scrypt-ts'
```

当启用 [`isolatedModules`](https://www.typescriptlang.org/tsconfig#isolatedModules) 时，这可能不起作用。此时，您需要使用 [Type-Only Imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export):

```ts
import type {
    ByteString,
    FixedArray
} from 'scrypt-ts'
```

## 语句

在 `@method` 中，除了 [变量声明](#variable-declarations) 之外，还有一些约束。

### 变量声明

变量可以在 `@method` 中通过关键字 `const` / `var` / `let` 声明，就像在普通的 TypeScript 中一样。

```ts
let a : bigint = 1n
var b: boolean = false
const byte: ByteString = toByteString("ff")
```

### `for`

比特币不允许无界循环，出于安全原因（例如防止 DoS 攻击）。所有循环都必须编译时绑定。因此，如果您想在 `@method` 中循环，您必须严格使用以下格式：

```ts
for (let $i = 0; $i < $maxLoopCount; $i++) {
  ...
}
```

:::tip `注意`

* 初始值必须是 `0` 或 `0n`，运算符 `<`（没有 `<=`），并且增量 `$i++`（没有预增量 `++$i`）。
* `$maxLoopCount` 必须是 [CTC](#compile-time-constant) 或 CTC 表达式，例如：

```ts
const N = 4

// 有效，`N` 是一个 CTC
for (let i = 0; i < N; i++) { ... }

// 有效，`2 * N - 1` 是一个 CTC 表达式
for (let i = 0; i < 2 * N - 1; i++) { ... }

const M = N + 1

// 有效，`M` 是一个 CTC 表达式
for (let i = 0; i < M; i++) { ... }
```

* `$i` 可以是任意名称，例如 `i`, `j`, 或 `k`。它可以是 `number` 或 `bigint` 类型。
* `break` 和 `continue` 目前不允许，但可以像下面这样模拟

:::

```ts
// 模拟 break
let x = 3n
let done = false
for (let i = 0; i < 3; i++) {
    if (!done) {
        x = x * 2n
        if (x >= 8n) {
            done = true
        }
    }
}
```

### `return`

由于比特币脚本不支持原生返回语义，目前非公开函数必须以 `return` 语句结束，并且它是唯一有效的 `return` 语句。将来可能会放松此要求。

```ts
@method() m(x: bigint): bigint {
   if (x > 2n) return x  // 无效
   return x + 1n         // 有效
}
```

这通常不是问题，因为它可以如下绕过：

```ts
@method()
abs(a: bigint): bigint {
    if (a > 0) {
        return a
    } else {
        return -a
    }
}
```

可以重写为：

```ts
@method()
abs(a: bigint): bigint {
    let ret : bigint = 0

    if (a > 0) {
        ret = a
    } else {
        ret = -a
    }
    return ret
}
```

## 编译时常量

一个编译时常量，简称 CTC，是一个特殊变量，其值可以在编译时确定。CTC 必须以以下方式之一定义：

* 一个数字字面量，例如：

```ts
3
```

* 一个 `const` 变量，其值必须是一个数字字面量。目前不支持表达式。

```ts
const N1 = 3 // 有效
const N2: number = 3 // 无效，不允许显式类型 `number`
const N3 = 3 + 3 // 无效，不允许表达式
```

* 一个 `static` `readonly` 属性：

```ts
class X {
  static readonly M1 = 3 // 有效
  static readonly M2: number = 3 // 无效
  static readonly M3 = 3 + 3 // 无效
}
```

* 一个 `number` 参数，仅当它在 `@method` 中时才允许：

```ts
export class MyLib extends SmartContractLib {

    constructor() {
        super(...arguments)
    }

    @method()
    static sum(x: number) : bigint {
        let sum = 0n;
        // 注意：这里 `x` 是一个变量 <--------
        for (let i = 0n; i < x; i++) {
            sum += i
        }

        return sum;
    }

}

const N = 10

export class Demo extends SmartContract {

    constructor() {
        super(...arguments)
    }

    @method()
    public unlock() {
        assert(MyLib.sum(10) == 45n, 'incorrect sum')
        assert(MyLib.sum(20) == 190n, 'incorrect sum')
        assert(MyLib.sum(N) == 45n, 'incorrect sum')
    }
}
```

* 所有 `enum` 成员都是 CTC：

```ts
export enum Status {
    Pending,
    Shipped,
    Accepted,
    Rejected,
    Canceled,
}
```

在以下情况下需要 CTC：

* 数组大小

```ts
let arr1: FixedArray<bigint, 3> = [1n, 2n, 3n]
// 需要 `typeof`，因为 FixedArray 将类型作为数组大小，而不是值
let arr1: FixedArray<bigint, typeof N1> = [1n, 2n, 3n]
let arr2: FixedArray<bigint, typeof X.M1> = [1n, 2n, 3n]
```

* `for` 语句中的循环计数

```ts
for(let i=0; i< 3; i++) {}
for(let i=0; i< N1; i++) {}
for(let i=0; i< X.M1; i++) {}
```

* 返回一个 `FixedArray`

```ts
export class MyLib extends SmartContractLib {

    constructor() {
        super(...arguments)
    }

    @method()
    // 注意：必须使用 `typeof n | any`
    static createFixedArray(n: number) : FixedArray<bigint, typeof n | any> {
        const fa: FixedArray<bigint, typeof n | any> = fill(1n, n);
        return fa;
    }
}
```

## 函数

### 内置函数

你可以参考 [Built-ins](./built-ins.md) 查看 `sCrypt` 内置的函数和库的完整列表。

### 白名单函数

默认情况下，所有 Javascript/TypeScript 内置函数和全局变量都不允许在 `@method` 中使用，除了以下几种。

#### `console.log`

`console.log` 可以用于调试目的。

```ts
@method()
static add(a: bigint, b: bigint): bigint {
  console.log(a)
  return a + b;
}
```

## 运算符

**sCrypt** 是 TypeScript 的子集。只有以下运算符可以直接使用。

| 运算符 | 描述 |
| :-----| :----: |
| `+` | 加法 |
| `-` | 减法 |
| `*` | 乘法 |
| `/` | 除法 |
| `%` | 余数 |
| `++` | 增量 |
| `--` | 减量 |
| `==` | 等于 |
| `!=` | 不等于 |
| `===` | 与 `==` 相同 |
| `!==` | 与 `!=` 不同 |
| `>` | 大于 |
| `>=` | 大于等于 |
| `<` | 小于 |
| `<=` | 小于或等于 |
| `&&` | 逻辑与 |
| `\|\|` | 逻辑或 |
| `!` | 逻辑非 |
| `cond ? expr1 : expr2` | 三元运算符 |
| `+=` | 加并赋值 |
| `-=` | 减并赋值 |
| `*=` | 乘并赋值 |
| `/=` | 除并赋值 |
| `%=` | 取余并赋值 |

:::tip `注意`
`**` 目前不支持。
:::
