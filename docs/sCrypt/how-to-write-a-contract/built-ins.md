---
sidebar_position: 2
---

# 内置函数

## 全局函数

以下函数随 sCrypt 一起提供：

### 断言

- `assert(condition: boolean, errorMsg?: string)` 如果 `condition` 为 `false`，则抛出带有可选错误消息的 `Error`。否则，什么都不会发生。

```ts
assert(1n === 1n)        // 什么都不会发生
assert(1n === 2n)        // 抛出 Error('Execution failed')
assert(false, 'hello')   // 抛出 Error('Execution failed, hello')
```

### 填充

- `fill(value: T, length: number): T[length]` 返回一个 `FixedArray`，其中所有 `size` 元素都设置为 `value`，其中 `value` 可以是任何类型。

:::tip `注意`
`length` 必须是一个 [编译时常量](./basics#compile-time-constant).
:::

```ts
// 好的
fill(1n, 3) // 数字字面量 3
fill(1n, M) // const M = 3
fill(1n, Demo.N) // `N` 是类 `Demo` 的静态只读属性
```

### 数学

- `abs(a: bigint): bigint` 返回 `a` 的绝对值。

```ts
abs(1n)  // 1n
abs(0n)  // 0n
abs(-1n) // 1n
```

- `min(a: bigint, b: bigint): bigint` 返回 `a` 和 `b` 的最小值。

```ts
min(1n, 2n) // 1n
```

- `max(a: bigint, b: bigint): bigint` 返回 `a` 和 `b` 的最大值。

```ts
max(1n, 2n) // 2n
```

- `within(x: bigint, min: bigint, max: bigint): boolean` 如果 `x` 在指定的范围内（左闭右开），返回 `true`，否则返回 `false`。

```ts
within(0n, 0n, 2n) // true
within(1n, 0n, 2n) // true
within(2n, 0n, 2n) // false
```

### 哈希

- `ripemd160(a: ByteString): Ripemd160` 返回 `a` 的 [RIPEMD160](https://en.wikipedia.org/wiki/RIPEMD) 哈希结果。
- `sha1(a: ByteString): Sha1` 返回 `a` 的 [SHA1](https://en.wikipedia.org/wiki/SHA-1) 哈希结果。
- `sha256(a: ByteString): Sha256` 返回 `a` 的 [SHA256](https://www.movable-type.co.uk/scripts/sha256.html) 哈希结果。
- `hash160(a: ByteString): Ripemd160` Actually returns `ripemd160(sha256(a))`.
- `pubKey2Addr(pk: PubKey): Addr` Wrapper function of `hash160`.
- `hash256(a: ByteString): Sha256` Actually returns `sha256(sha256(a))`.

### ByteString 操作

在 `@props` 和 `@methods` 中允许使用的基本类型是 `boolean` 和 `bigint`，以及它们的包装类型 `Boolean` 和 `BigInt`。

一个 `string` 字面量不能直接使用，必须先转换为 `ByteString`。

```ts
@method()
public example(x: bigint, y: ByteString, z: boolean) {

    assert(x == 5n)

    assert(z)

    // 字符串必须先转换为 ByteString 才能在智能合约中使用
    assert(y == toByteString("hello world!", true))

    // 我们也可以解析十六进制字符串：
    assert(x == byteString2Int(toByteString('05')))

    // 反之，我们可以将整数转换为 ByteString：
    assert(int2ByteString(x) == toByteString('05'))

    // 使用小端有符号表示法：
    assert(int2ByteString(-x) == toByteString('85'))
    assert(int2ByteString(-x * 1000n) == toByteString('8893'))

}

```

- `int2ByteString(n: bigint, size?: bigint): ByteString` 如果省略 `size`，将 `n` 转换为 `ByteString`，在小端有符号表示法中，使用尽可能少的字节（即，最小编码）。否则，将数字 `n` 转换为指定大小的 `ByteString`，包括符号位；如果数字无法容纳，则失败。

```ts
// 尽可能少的字节
int2ByteString(128n)   // '8000', little endian
int2ByteString(127n)   // '7f'
int2ByteString(0n)     // ''
int2ByteString(-1n)    // '81'
int2ByteString(-129n)  // '8180', little endian

// 指定大小
int2ByteString(1n, 3n)        // '010000', 3 bytes
int2ByteString(-129n, 3n)     // '810080', 3 bytes

// 错误：-129 无法适应 1 个字节
int2ByteString(-129n, 1n)
```

- `byteString2Int(a: ByteString): bigint` 将小端有符号表示法中的 `ByteString` 转换为 `bigint`。

```ts
byteString2Int(toByteString('8000'))    // 128n
byteString2Int(toByteString(''))        // 0n
byteString2Int(toByteString('00'))      // 0n
byteString2Int(toByteString('81'))      // -1n

byteString2Int(toByteString('010000'))  // 1n
byteString2Int(toByteString('810080'))  // -129n
```

- `len(a: ByteString): number` 返回 `a` 的字节长度。

```ts
const s1 = toByteString('0011', false) // '0011', 2 bytes
len(s1) // 2

const s2 = toByteString('hello', true) // '68656c6c6f', 5 bytes
len(s2) // 5
```

- `reverseByteString(b: ByteString, size: number): ByteString` 返回 `b` 的 `size` 字节反转字节。当在 `little-endian` 和 `big-endian` 之间转换数字时，它通常很有用。

:::tip `注意`
`size` 必须是一个 [编译时常量](./basics#compile-time-constant).
:::

```ts
const s1 = toByteString('793ff39de7e1dce2d853e24256099d25fa1b1598ee24069f24511d7a2deafe6c')
reverseByteString(s1, 32) // 6cfeea2d7a1d51249f0624ee98151bfa259d095642e253d8e2dce1e79df33f79
```

- `slice(byteString: ByteString, start: BigInt, end?: BigInt): ByteString` 从 `start` 到 `end` 返回一个子字节串，但不包括 `end`。如果未指定 `end`，则子字节串继续到最后一个字节。

```ts
const message = toByteString('001122')
slice(message, 1n) // '1122'
slice(message, 1n, 2n) // '11'
```

### 位运算符

Bigint 在比特币中以 [符号-幅度格式](https://en.wikipedia.org/wiki/Signed_number_representations#Sign%E2%80%93magnitude) 存储，而不是常用的 [二进制补码格式](https://en.wikipedia.org/wiki/Signed_number_representations#Two's_complement)。如果操作数都是非负的，则操作的结果与 TypeScript 的位运算符一致，除了 `~`。否则，操作结果可能不一致，因此未定义。强烈建议**永远不要**对负数应用位运算。

- `and(x: bigint, y: bigint): bigint` 位与

```ts
and(13n, 5n) // 5n
and(0x0a32c845n, 0x149f72n) // 0x00108840n, 1083456n
```

- `or(x: bigint, y: bigint): bigint` 位或

```ts
or(13n, 5n) // 13n
or(0x0a32c845n, 0x149f72n) // 0xa36df77n, 171368311n
```

- `xor(x: bigint, y: bigint): bigint` 位异或

```ts
xor(13n, 5n) // 8n
xor(0x0a32c845n, 0x149f72n) // 0x0a265737n, 170284855n
```

- `invert(x: bigint): bigint` 位非

```ts
invert(13n)  // -114n
```

- `lshift(x: bigint, n: bigint): bigint` 算术左移，返回 `x * 2^n`.

```ts
lshift(2n, 3n)   // 16n
```

- `rshift(x: bigint, n: bigint): bigint` 算术右移，返回 `x / 2^n`.

```ts
rshift(21n, 3n)    // 2n
rshift(1024n, 11n) // 0n
```

### 退出

- `exit(status: boolean): void` 调用此函数将终止合约执行。如果 `status` 为 `true`，则合约成功；否则，合约失败。

## `SmartContract` 方法

以下 `@method` 来自 `SmartContract` 基类。

### `compile`

Function `static async compile(): Promise<TranspileError[]>` 编译合约并返回编译错误（如果编译失败）。

```ts
// returns transpile errors if compiling fails
const transpileErrors = await Demo.compile()
```

### `scriptSize`

Function `get scriptSize(): number` 返回合约锁定脚本的字节长度。

```ts
const demo = new Demo()
const size = demo.scriptSize
```

### `loadArtifact`

Function `static loadArtifact(artifactFile: Artifact | string | undefined = undefined)` 从你传递的路径加载合约工件文件以初始化合约类。

如果调用时没有传递参数，函数将从默认目录加载工件文件。这通常在 [测试](../how-to-test-a-contract.md#load-artifact) 期间使用。

你也可以直接传递工件路径。这通常在 [与前端合约交互](../how-to-integrate-a-frontend/how-to-integrate-a-frontend.md) 时使用。

```ts
import { TicTacToe } from './contracts/tictactoe';
import artifact from '../artifacts/tictactoe.json';
TicTacToe.loadArtifact(artifact);
```

### `checkSig`

Function `checkSig(signature: Sig, publicKey: PubKey): boolean` 验证 ECDSA 签名。它接受两个输入：一个 ECDSA 签名和一个公钥。

如果签名与公钥匹配，则返回 `true`。

:::danger `注意`
所有签名检查函数 (`checkSig` 和 `checkMultiSig`) 遵循 [**NULLFAIL** 规则](https://github.com/bitcoin/bips/blob/master/bip-0146.mediawiki#NULLFAIL): 如果签名无效，整个合约立即失败，除非签名是一个空的 ByteString，在这种情况下，这些函数返回 `false`。
:::

例如，Pay-to-Public-Key-Hash ([P2PKH](https://learnmeabitcoin.com/guide/p2pkh)) 可以实现如下。

```ts
class P2PKH extends SmartContract {
  // 收款地址
  @prop()
  readonly address: Addr

  constructor(address: Addr) {
    super(...arguments)
    this.address = address
  }

  @method()
  public unlock(sig: Sig, pubkey: PubKey) {
    // 检查公钥是否属于指定的公钥哈希
    assert(pubKey2Addr(pubkey) == this.address, 'address does not correspond to address')
    // 检查签名有效性
    assert(this.checkSig(sig, pubkey), 'signature check failed')
  }
}
```

### `checkMultiSig`

Function `checkMultiSig(signatures: Sig[], publickeys: PubKey[]): boolean` 验证一组 ECDSA 签名。它接受两个输入：一组 ECDSA 签名和一组公钥。

该函数将第一个签名与每个公钥进行比较，直到找到一个 ECDSA 匹配。从后续的公钥开始，它将第二个签名与每个剩余的公钥进行比较，直到找到一个 ECDSA 匹配。重复该过程，直到所有签名都被检查或没有足够的公钥来产生成功结果。所有签名必须与公钥匹配。因为如果某个公钥在签名比较中失败，则不会再次检查该公钥，因此签名必须按与它们对应的公钥在 `publickeys` 数组中的相同顺序放置。如果所有签名都有效，则返回 `true`，否则返回 `false`。

```ts
class MultiSigPayment extends SmartContract {
  // 3 个收款地址
  @prop()
  readonly addresses: FixedArray<Addr, 3>

  constructor(addresses: FixedArray<Addr, 3>) {
    super(...arguments)
    this.addresses = addresses
  }

  @method()
  public unlock(
      signatures: FixedArray<Sig, 3>,
      publicKeys: FixedArray<PubKey, 3>
    ) {
    // 检查传递的公钥是否属于指定的地址
    for (let i = 0; i < 3; i++) {
      assert(pubKey2Addr(publicKeys[i]) == this.addresses[i], 'address mismatch')
    }
    // 验证签名
    assert(this.checkMultiSig(signatures, publicKeys), 'checkMultiSig failed')
  }
}
```

### `buildStateOutput`

Function `buildStateOutput(amount: bigint): ByteString` 创建一个包含最新状态的输出。它接受一个输入：输出的数量。

```ts
class Counter extends SmartContract {
  // ...

  @method(SigHash.ANYONECANPAY_SINGLE)
  public incOnChain() {
    // ... 更新状态

    // 构造新的状态输出
    const output: ByteString = this.buildStateOutput(this.ctx.utxo.value)

    // ... 验证当前交易的输出
  }
}
```

### `buildChangeOutput`

Function `buildChangeOutput(): ByteString` 创建一个 P2PKH 找零输出。它会自动计算找零金额 (`this.changeAmount`)，并默认使用签名者的地址，除非在 `MethodCallOptions` 中显式设置了 `changeAddress` 字段。

```ts
class Auction extends SmartContract {

  // ...

  @method()
  public bid(bidder: Addr, bid: bigint) {

    // 添加拍卖输出

    // 拍卖继续有更高的出价者。
    const auctionOutput: ByteString = this.buildStateOutput(bid)

    // 退还以前最高出价者。
    const refundOutput: ByteString = Utils.buildPublicKeyHashOutput(
        highestBidder,
        highestBid
    )
    let outputs: ByteString = auctionOutput + refundOutput

    // 添加找零输出。
    outputs += this.buildChangeOutput()

    assert(hash256(outputs) == this.ctx.hashOutputs, 'hashOutputs check failed')
  }
}
```

使用自定义的找零地址调用 `Auction` 合约。

```ts

const { tx: callTx, atInputIndex } = await auction.methods.bid(
  Addr(addressNewBidder.toByteString()),
  BigInt(balance + 1),
  {
    changeAddress: addressNewBidder, // 显式指定方法调用交易的找零地址
  } as MethodCallOptions<Auction>
)
```

:::tip `提示`
`this.changeAmount` 和 `this.buildChangeOutput` 可以直接在 [默认的调用交易构建器](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md#default-1) 中访问，但如果使用 [自定义的调用交易构建器](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md#customize-1)，则需要在使用前在构建器中显式 [设置交易找零输出](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md#customize-1)。
:::

```ts
const unsignedTx: bsv.Transaction = new bsv.Transaction()
  // 添加输入和输出
  // ...
  // 显式添加找零输出
  // 否则无法在合约中调用 `this.changeAmount` 和 `this.buildChangeOutput`
  .change(options.changeAddress);
```

### `timeLock`

Function `timeLock(locktime: bigint): boolean` 返回调用交易是否将其 [`nLocktime`](https://wiki.bitcoinsv.io/index.php/NLocktime_and_nSequence) 值设置为传递的 `locktime` 值之后的时间点。此值可以是 UNIX 时间戳或块高度。此外，它确保 `nSequence` 的值设置为小于 `0xFFFFFFFF`。

如果我们将返回值断言为 `true`，则实际上确保了智能合约的公共方法在指定时间之前无法成功调用。

```ts
class TimeLock extends SmartContract {

  @prop()
  locktime: bigint

  // ...

  @method()
  public unlock() {
    assert(this.timeLock(this.locktime), 'time lock not yet expired')
  }

}
```

:::tip `提示`
此机制仅用于确保方法可以在特定时间点之后调用。相反，它不能用于确保方法在特定时间点之前调用。
:::

要了解更多关于时间锁定的信息，请参阅 [专门文档部分](https://docs.scrypt.io/advanced/timeLock.md)。

### `insertCodeSeparator`

Method `insertCodeSeparator(): void` 在调用时插入 [`OP_CODESEPARATOR`](https://docs.scrypt.io/advanced/codeseparator.md)。

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

### `fromTx`

Function `static fromTx(tx: bsv.Transaction, atOutputIndex: number, offchainValues?: Record<string, any>)` 创建一个实例，其状态与给定的交易输出同步，由 `tx` 交易和 `atOutputIndex` 输出索引标识。需要 [创建一个合约实例](./../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#create-a-smart-contract-instance-from-a-transaction)。

```ts
// 从交易输出创建一个实例
const instance = ContractName.fromTx(tx, atOutputIndex)

// 这里没问题，实例与链上交易状态同步
```

如果合约包含 `@prop` 类型为 `HashedMap` 或 `HashedSet` 的属性，则这些属性的所有值在当前交易中必须通过第三个参数传递。

```ts
// 例如，合约有两个类型为 `HashedMap` 或 `HashedSet` 的状态属性
// @prop(true) mySet: HashedSet<bigint>
// @prop() myMap: HashedMap<bigint, bigint>
const instance = ContractName.fromTx(tx, atOutputIndex, {
    // 传递当前交易时刻所有这些属性的值
    'mySet': currentSet,
    'myMap': currentMap,
})
```

### `buildDeployTransaction`

Function `async buildDeployTransaction(utxos: UTXO[], amount: number, changeAddress?: bsv.Address | string): Promise<bsv.Transaction>` 创建一个部署合约的交易。第一个参数 `utxos` 表示一个或多个 [P2PKH](https://learnmeabitcoin.com/technical/p2pkh) 输入，用于支付交易费用。第二个参数 `amount` 是合约输出的余额。最后一个参数 `changeAddress` 是可选的，表示一个找零地址。用户覆盖它以 [自定义部署交易](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md#customize) 如下。

```ts
override async buildDeployTransaction(utxos: UTXO[], amount: number, changeAddress?: bsv.Address | string): Promise<bsv.Transaction> {
    const deployTx = new bsv.Transaction()
      // 添加 P2PKH 输入以支付交易费用
      .from(utxos)
      // 添加合约输出
      .addOutput(new bsv.Transaction.Output({
        script: this.lockingScript,
        satoshis: amount,
      }))
    // 如果传递了 `changeAddress`，则添加找零输出
    if (changeAddress) {
      deployTx.change(changeAddress);
      if (this._provider) {
        deployTx.feePerKb(await this.provider.getFeePerKb());
      }
    }

    return deployTx;
  }
```

### `bindTxBuilder`

Function `bindTxBuilder(methodName: string, txBuilder: MethodCallTxBuilder<SmartContract>):void` 将自定义的交易构建器 `MethodCallTxBuilder` 绑定到由 `methodName` 标识的合约公共 `@method`。

```ts

/**
 * 一个交易构建器。
 * 默认的交易构建器仅支持固定格式的调用交易。
 * 某些复杂的合约需要自定义的交易构建器来成功调用合约。
 */
export interface MethodCallTxBuilder<T extends SmartContract> {
  (current: T, options: MethodCallOptions<T>, ...args: any): Promise<ContractTransaction>
}

// 为公共方法 `instance.unlock()` 绑定一个自定义的交易构建器
instance.bindTxBuilder("unlock", (options: MethodCallOptions<T>, ...args: any) => {
  // ...
})
```

你可以访问 [这里](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md#customize-1) 查看有关如何自定义交易构建器的更多详细信息。

### `multiContractCall`

当在一个交易中调用多个合约的 `@method` 时，每个合约的 `ContractTransation` 交易构建器共同构造交易。函数 `static async multiContractCall(partialContractTx: ContractTransaction, signer: Signer): Promise<MultiContractTransaction>` 对最终交易进行签名并广播。

```ts
const partialContractTx1 = await counter1.methods.incrementOnChain(
    {
        multiContractCall: true,
    } as MethodCallOptions<Counter>
)

const partialContractTx2 = await counter2.methods.incrementOnChain(
    {
        multiContractCall: true,
        partialContractTx: partialContractTx1
    } as MethodCallOptions<Counter>
);

const {tx: callTx, nexts} = await SmartContract.multiContractCall(partialContractTx2, signer)

console.log('Counter contract counter1, counter2 called: ', callTx.id)
```

## 标准库

`sCrypt` 提供了许多常用函数的标准库。

### `Utils`

`Utils` 库提供了一组常用的实用函数。

- `static toLEUnsigned(n: bigint, l: bigint): ByteString` 将有符号整数 `n` 转换为 `l` 字节的无符号整数，以符号-幅度小端格式表示。

```ts
Utils.toLEUnsigned(10n, 3n)   // '0a0000'
Utils.toLEUnsigned(-10n, 2n)  // '0a00'
```

- `static fromLEUnsigned(bytes: ByteString): bigint` 将 `ByteString` 转换为无符号整数。

```ts
Utils.fromLEUnsigned(toByteString('0a00'))  // 10n
Utils.fromLEUnsigned(toByteString('8a'))    // 138n, actually converts 8a00 to unsigned integer
```

- `static readVarint(buf: ByteString): ByteString` 从 `buf` 读取 [VarInt](https://learnmeabitcoin.com/technical/varint) 字段。

```ts
Utils.readVarint(toByteString('0401020304')) // '01020304'
```

- `static writeVarint(buf: ByteString): ByteString` 将 `buf` 转换为 [VarInt](https://learnmeabitcoin.com/technical/varint) 字段，包括前面的长度。

```ts
Utils.writeVarint(toByteString('010203')) // '03010203'
```

- `static buildOutput(outputScript: ByteString, outputSatoshis: bigint): ByteString` 用指定的脚本和萨托希金额构建一个交易输出。

```ts
const lockingScript = toByteString('01020304')
Utils.buildOutput(lockingScript, 1n) // '01000000000000000401020304'
```

- `static buildPublicKeyHashScript(pubKeyHash: PubKeyHash ): ByteString` 从公钥哈希 / 地址构建一个 [Pay to Public Key Hash (P2PKH)](https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions#Pay_to_Public_Key_Hash_.28P2PKH.29) 脚本。

```ts
const address = Addr(toByteString('0011223344556677889900112233445566778899'))
Utils.buildPublicKeyHashScript(address) // '76a914001122334455667788990011223344556677889988ac'
```

- `static buildPublicKeyHashOutput(pubKeyHash: PubKeyHash, amount: bigint): ByteString` 从公钥哈希构建一个 P2PKH 输出。

```ts
const address = Addr(toByteString('0011223344556677889900112233445566778899'))
Utils.buildPublicKeyHashOutput(address, 1n) // '01000000000000001976a914001122334455667788990011223344556677889988ac'
```

- `static buildOpreturnScript(data: ByteString): ByteString` Build a data-carrying [FALSE OP_RETURN](https://wiki.bitcoinsv.io/index.php/OP_RETURN) script from `data` payload.

```ts
const data = toByteString('hello world', true)
Utils.buildOpreturnScript(data) // '006a0b68656c6c6f20776f726c64'
```

### `HashedMap`

`HashedMap` 提供了一个类似映射/哈希表的数据结构。它在链上和链下上下文中的使用方式不同。

#### On-chain

与我们在 [之前介绍的](./basics#data-types) 其他数据类型相比，`HashedMap` 的主要区别在于它不存储原始数据（即键和值）在链上的合约中。它存储它们的哈希值，以最小化链上存储，因为链上存储是昂贵的。

这些规则必须在使用 `HashedMap` 时遵循，即在合约的 `@method` 中，即链上上下文。

- 只有以下方法可以调用。
  - `set(key: K, val: V): HashedMap`: 添加一个具有指定键和值的新元素。如果已经存在具有相同键的元素，则元素将更新。
  - `canGet(key: K, val: V): boolean`: 如果指定的 **键和值对** 存在，则返回 `true`，否则返回 `false`。
  - `has(key: K): boolean`: 如果指定的键存在，则返回 `true`，否则返回 `false`。
  - `delete(key: K): boolean`: 如果键存在并且已被删除，则返回 `true`，否则返回 `false`。
  - `clear(): void`: 删除所有键和值对。
  - `size: number`: 返回元素的数量。

:::tip `提示`
`get()` 未列出，因为值本身未存储，因此必须通过 `canGet()` 传递和验证。
:::

- 上述方法只能在公共 `@method` 中使用，不能在非公共 `@method` 中使用，包括构造函数。

- `HashedMap` 可以用作 `@prop`，无论是状态化的还是非状态化的：

```ts
@prop() map: HashedMap<KeyType, ValueType>; // 有效
@prop(true) map: HashedMap<KeyType, ValueType> // 也有效
```

- 它不能用作 `@method` 参数，无论是否为公共：

```ts
@method public unlock(map: HashedMap<KeyType, ValueType>) // 无效作为参数类型
@method foo(map: HashedMap<KeyType, ValueType>) // 无效作为参数类型
```

- 不允许嵌套。也就是说，键和值不能包含 `HashedMap`。

```ts
type Map1 = HashedMap<KeyType1, ValueType1>
HashedMap<KeyType2, Map1> // 无效
HashedMap<Map1, ValueType2> // 无效

type KeyType = {
  key1: KeyType1
  key2: KeyType2
}
HashedMap<KeyType, ValueType> // 有效
```

一个完整的例子可能如下所示：

```ts
class MyContract extends SmartContract {
  @prop(true)
  myMap: HashedMap<bigint, bigint>;

  // HashedMap 可以作为构造函数中的参数
  constructor(map: HashedMap<bigint, bigint>) {
        super(...arguments)
    // 赋值是有效的，但不能调用方法
    this.myMap = map;
  }

  @method()
  public unlock(key: bigint, val: bigint) {
    this.myMap.set(key, val);
    assert(this.myMap.has(key));
    assert(this.myMap.canGet(key, val));
    assert(this.myMap.delete(key));
    assert(!this.myMap.has(key));
  }
}
```

#### Off-chain

`HashedMap` 在链下代码（即不在合约的 `@method` 中）中使用时，就像 JavaScript/TypeScript 的 [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) 一样。例如，你可以这样创建一个实例：

```ts
// create an empty map
let hashedMap = new HashedMap<bigint, ByteString>();

// create from (key,value) pairs
let hashedMap1 = new HashedMap([['key1', 'value1'], ['key2', 'value2']]);
```

此外，你可以像这样调用它的函数：

```ts
hashedMap.set(key, value);
const v = hashedMap.get(key);   // <----
hashedMap.has(key);
hashedMap.delete(key);
```

:::tip `提示`
`get()` 可以调用，因为 HashedMap 在链下存储原始键和值。
:::

只有当键是对象时，`HashedMap` 与 `Map` 不同。`HashedMap` 将两个键视为相同，如果它们具有相同的值，而 `Map` 仅当它们引用相同的对象时才视为相同。例如：

```ts
interface ST {
  a: bigint;
}

let map = new Map<ST, bigint>();
map.set({a: 1n}, 1n);
map.set({a: 1n}, 2n);
console.log(map.size); // output ‘2’ cause two keys {a: 1n} reference differently
console.log(map.get({a: 1n})); // output ‘undefined’


let hashedMap = new HashedMap<ST, bigint>();
hashedMap.set({a: 1n}, 1n);
hashedMap.set({a: 1n}, 2n);
console.log(hashedMap.size); // output ‘1’
console.log(hashedMap.get({a: 1n})); // output ‘2n’
```

### `HashedSet`

`HashedSet` 库提供了一个类似集合的数据结构。它可以被视为一个特殊的 `HashedMap`，其中值与它的键相同，因此被省略。值在存储在链上的合约之前被哈希，就像 `HashedMap` 一样。

当在公共 `@method` 中使用时，`HashedSet` 也几乎具有与 `HashedMap` 相同的限制。除了以下可以在 `@method` 中调用的方法：

- `add(value: T): HashedSet`: 在集合中插入一个具有指定值的新元素，如果集合中没有具有相同值的元素。

- `has(value: T): boolean`: 如果集合中存在具有指定值的元素，则返回 `true`，否则返回 `false`。

- `delete(value: T): boolean`: 如果集合中存在元素并且已被删除，则返回 `true`，否则返回 `false`。

- `clear(): void`: 删除集合的所有条目。

- `size: number`: 返回集合的大小，即它包含的条目数。

`HashedSet` 可以在链下代码中像 JavaScript `Set` 一样使用。

```ts
let hashedSet = new HashedSet<bigint>()
hashedSet.add(1n);
hashedSet.has(1n);
hashedSet.delete(1n);
...
```

与 `HashedMap` 类似，`HashedSet` 将两个对象视为相同，如果它们的值相等，而不是要求它们引用同一个对象。

```ts
interface ST {
  a: bigint;
}

let set = new Set<ST>();
set.add({a: 1n});
set.add({a: 1n});
console.log(set.size); // output ‘2’
console.log(set.has({a: 1n})); // output ‘false’


let hashedSet = new HashedSet<ST, bigint>();
hashedSet.add({a: 1n});
hashedSet.add({a: 1n});
console.log(hashedSet.size); // output ‘1’
console.log(hashedSet.has({a: 1n})); // output ‘true’
```

### `Constants`

`Constants` 定义了一些常用的常量值。

```ts
class Constants {
    // 表示输入序列的字符串数
    static readonly InputSeqLen: bigint = BigInt(4);
    // 表示输出值的字符串数
    static readonly OutputValueLen: bigint = BigInt(8);
    // 表示公钥（压缩）的字符串数
    static readonly PubKeyLen: bigint = BigInt(33);
    // 表示公钥哈希的字符串数
    static readonly PubKeyHashLen: bigint = BigInt(20);
    // 表示交易 id 的字符串数
    static readonly TxIdLen: bigint = BigInt(32);
    // 表示输出点的字符串数
    static readonly OutpointLen: bigint = BigInt(36);
}
```

## 标准合约

以下流行的智能合约随 `sCrypt` 一起提供，因此用户不必从头开始编写 [如我们之前所做的](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#method-with-signatures)。

- `P2PKH`: [Pay To PubKey Hash (P2PKH)](https://learnmeabitcoin.com/technical/p2pkh)
- `P2PK`: [Pay To PubKey (P2PK)](https://learnmeabitcoin.com/technical/p2pk)

它们编译为与使用原始脚本创建的标准交易相同的比特币脚本。

你可以像任何其他用户定义的智能合约一样使用它们，如下所示。

```ts
import { P2PKH } from 'scrypt-ts'

const privateKey = bsv.PrivateKey.fromRandom(bsv.Networks.testnet)
const publicKey = privateKey.toPublicKey()
const pubKey = PubKey(toHex(publicKey))
// 创建一个 P2PKH 实例
const instance = new P2PKH(pubKey2Addr(pubKey))
// 将合约实例连接到签名者
await instance.connect(getDefaultSigner(privateKey))
// 部署合约
await instance.deploy()
// 调用 P2PKH 合约
await instance.methods.unlock(
    (sigResps) => findSig(sigResps, publicKey),
    pubKey,
    {
        pubKeyOrAddrToSign: publicKey,
    } as MethodCallOptions<P2PKH>
)
```
