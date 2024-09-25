---
sidebar_position: 1
---

# 如何部署和调用合约

## 核心概念

在编写完合约后，你可以部署和调用它。但首先，你应该了解智能合约如何与区块链交互。在本节中，我们将详细介绍一些基本概念。

![img](/sCrypt/how-to-deploy-and-call-a-contract-01.png)
[Credit: moonbeam](https://docs.moonbeam.network/tutorials/eth-api/how-to-build-a-dapp)

### 编译和加载合约

首先，使用 CLI 编译合约：

```ts
npx scrypt-cli compile
```

这将在 `/artifacts` 文件夹中创建一个合约的工件 json 文件。

接下来，调用 [loadArtifact](../how-to-write-a-contract/built-ins.md#loadartifact) 加载 json 文件，以便你可以实例化一个智能合约。

```ts
import artifact from '../artifacts/mycontract.json'

await MyContract.loadArtifact(artifact)
```

### 合约实例

如 [概述部分](../overview.md) 所述，`sCrypt` 合约基于比特币 UTXO 模型。一个 **合约实例** 是一个抽象，表示部署在链上的特定合约，因此你可以使用它像一个普通的 TypeScript 对象一样与合约交互。

```ts
// 构造一个新的 `MyContract` 实例
let instance = new MyContract(...initArgs);
```

### Provider

一个 `Provider` 是比特币网络的标准节点的抽象，提供对区块链的读写访问。

sCrypt 已经有一些内置的提供者：

* `DummyProvider`: 一个仅用于本地测试的模拟提供者。它不连接到比特币区块链，因此无法发送交易。

* `DefaultProvider`: 默认提供者是最安全、最简单的方法开始在比特币上开发，并且它也足够强大，可以在生产环境中使用。它可以在测试网和主网中使用。

* 查看 [可用提供者](https://docs.scrypt.io/reference/classes/Provider.md#hierarchy).

你可以像这样初始化这些提供者：

```ts
let dummyProvider = new DummyProvider();

// mainnet
let provider = new DefaultProvider();

// testnet
let provider = new DefaultProvider(bsv.Networks.testnet);
```

### Signer

A `Signer` 是一个私钥的抽象，可以用来签名消息和交易。一个简单的签名者就是一个私钥，而一个复杂的签名者就是一个钱包。

#### TestWallet

对于测试目的，我们有一个内置的钱包叫做 `TestWallet`。它可以像这样创建：

```ts
const signer = new TestWallet(privateKey, provider);
```

`privateKey` 可以是一个私钥或一个私钥数组，钱包可以用它们来签名交易。钱包发送交易的能力被分配给 `provider`。换句话说，一个 `TestWallet` 既是一个签名者又是一个提供者。

### Tx Builders

要部署或与合约交互，我们必须构建交易并将其广播到比特币。我们有一些内置的 tx 构建器，用于与合约交互的最常见方式，所以通常你不必实现它们。如果默认的 tx 构建器不满足你的特定要求，例如在你的交易中有额外的输入或输出，你可以 [自定义它](./how-to-customize-a-contract-tx.md)。

#### 部署合约的交易

部署合约到区块链时需要一个比特币交易。该交易应该有一个输出，其脚本是从合约编译而来的。这个输出被称为合约 UTXO，合约实例来自这个 UTXO。

一个实例的 `from` 可以被访问。

```ts
// 包含实例的交易
instance.from.tx
// 包含实例的tx输出的索引
instance.from.outputIndex
```

#### 合约调用交易

当你在一个 UTXO 上调用合约实例的公共方法时，需要一个调用交易。该交易有一个输入，引用合约 UTXO 并包含方法的参数。我们认为合约实例进入这个交易输入。

一个实例的 `to` 可以被访问。

```ts
// 包含实例的交易
instance.to.tx
// 包含实例的tx输入的索引
instance.to.inputIndex
```

这可以总结为下图：

![img](/sCrypt/how-to-deploy-and-call-a-contract-02.png)

## 准备一个签名者和提供者

在部署和调用合约之前，必须将签名者和提供者连接到合约实例。当我们准备好将合约部署到测试网/主网时，我们需要一个真正的提供者，如 [DefaultProvider](#provider)。

```ts
const network = bsv.Networks.testnet; // or bsv.Networks.mainnet
const signer = new TestWallet(privateKey, new DefaultProvider(network));
```

`privateKey` 必须有足够的硬币。学习如何使用 [水龙头](./faucet) 在测试网上为它提供资金。

然后，像这样将其连接到你的合约实例：

```ts
await instance.connect(signer);
```

:::tip `注意`
`TestWallet` 是一个由 sCrypt 提供的 `Signer` 用于测试。在实际的生产环境中（主网），你应该使用 `PandaSigner`, `SensiletSigner`, `DotwalletSigner`, `TAALSigner`.
查看 [这里](../how-to-integrate-a-frontend/how-to-integrate-a-frontend.md) 如何使用它们。
:::

## 合约部署

要部署一个智能合约，调用它的 `deploy` 方法，如下所示：

```ts
// 构造一个新的 `MyContract` 实例
let instance = new MyContract(...initArgs);

// 将签名者连接到实例
await instance.connect(signer);

// 合约 UTXO 的聪
const initBalance = 1234;

// 构建并发送部署交易
const deployTx = await instance.deploy(initBalance);
console.log(`Smart contract successfully deployed with txid ${deployTx.id}`);
```

## 合约调用

为了方便调用合约的公共 `@method`，我们在合约类中注入了一个名为 `methods` 的运行时对象。对于合约的每个公共 `@method`（例如 `contract.foo`），都会将一个具有相同名称和签名的函数（包括参数列表和返回类型，即 `void`）添加到 `methods`（例如 `contract.methods.foo`）。此外，还有一个 `options` 作为最后一个参数附加。

假设你有一个这样的合约：

```ts
Class MyContract extends SmartContract {
  ...
  @method()
  public foo(arg1, arg2) {...}
}
```

你可以像这样检查它：

```ts
let instance = new MyContract();
console.log(typeof instance.methods.foo) // output `function`
```

这个函数被设计为在链上调用相应的 `@method`，这意味着：调用它将在新事务中花费前一个合约 UTXO。你可以像这样调用它：

```ts
// 注意：`instance.methods.foo` 应该以与 `instance.foo` 相同的顺序传递所有参数。

// 此外，它可以接受一个可选的 "options" 参数来控制函数的行为。

const { tx, atInputIndex } = await instance.methods.foo(arg1, arg2, options);
```

在调用期间实际发生的事情如下：

1. 通过调用 tx 构建器来构建一个未签名的交易，该构建器可以是一个默认的或自定义的 tx 构建器，如 [本节](./how-to-customize-a-contract-tx.md) 中所介绍的，用于一个公共的 `@method`。
1. 使用实例的签名者来签名交易。注意，`instance.foo` 可能会在这个过程中被调用，以获得一个有效的解锁脚本。
1. 使用实例的连接 `provider` 来发送交易。

### MethodCallOptions

`options` 参数的类型是 `MethodCallOptions`:

```ts
/**
 * 一个选项类型，用于调用合约的公共 `@method` 函数。
 * 用于指定签名者和交易构建器的行为。
 * 例如，指定一个交易构建器使用特定的找零地址，或者指定一个签名者使用特定的公钥进行签名。
 */
export interface MethodCallOptions<T> {
  /**
   * 与这些地址或公钥关联的私钥(s)
   * 必须用于签署合约输入，
   * 并且回调函数将接收签名结果作为名为 `sigResponses` 的参数
   */
  readonly pubKeyOrAddrToSign?: PublicKeysOrAddressesOption | SignaturesOption;
  /** 在有状态合约中，方法调用交易输出中产生的后续合约实例(s) */
  readonly next?: StatefulNext<T>[] | StatefulNext<T>,
  /** 方法调用交易的 `lockTime` */
  readonly lockTime?: number;
  /** 方法调用交易中花费的前一个合约 UTXO 的 `sequence` */
  readonly sequence?: number;
  /** P2PKH 找零输出地址 */
  readonly changeAddress?: AddressOption;
  /** 在发送交易之前验证输入脚本 */
  readonly verify?: boolean;
  /** 是否在同一交易中同时调用多个合约 */
  readonly multiContractCall?: true;
  /** 将前一个调用的 `ContractTransaction` 作为参数传递给下一个调用，仅当 `multiContractCall = true` 时使用。 */
  readonly partialContractTx?: ContractTransaction;
}
```

与 [本地测试](../how-to-test-a-contract.md#run-tests) 的主要区别在于：

1. 合约需要先部署
1. 合约实例连接到一个真正的提供者，它将交易广播到区块链。

### next

在 sCrypt 中，`MethodCallOptions` 接口中的 `next` 属性用于指定在有状态合约中，方法调用交易输出中产生的后续合约实例(s)。此属性允许在单个交易中链接有状态合约的调用。

交易构建器使用传递的实例(s) 来构造合约调用交易输出。

当编写一个 [自定义交易构建器](./how-to-customize-a-contract-tx.md#call-tx) 时，我们可以像这样访问实例：

```ts
static unlockTxBuilder(
      current: Demo,
      options: MethodCallOptions<Demo>,
      ...
  ): Promise<ContractTransaction> {
      const next = options.next as StatefulNext<Demo>

      ...
}
```

### 从交易创建一个智能合约实例

要与已部署的智能合约（即调用其公共方法）进行交互，我们需要其合同实例，对应于链上的最新状态，无论是有状态还是无状态。在测试网上测试时，我们通常将合约的部署及其调用（注意，如果合约是有状态的，则可能会有多个调用）放在同一个过程中，以便我们不需要手动管理实例的内部状态，因为它总是与链上的交易一致。

在生产环境中，一个合约的部署和它的调用，以及有状态合约的不同调用，可能是在不同的过程中。例如，部署方不同于调用方，或者多个方调用它。如果是这样，我们需要从表示其最新状态的链上交易中创建一个合约实例，然后才能调用它的方法。

通常，我们只知道包含实例的[TXID](https://wiki.bitcoinsv.io/index.php/TXID)。我们可以通过以下两个步骤创建一个实例：

1. 使用 TXID，我们通过调用签名者的[connected provider](https://docs.scrypt.io/reference/classes/Signer.md#connectedprovider)的[getTransaction](https://docs.scrypt.io/reference/classes/Provider.md#gettransaction)来检索完整的交易。
1. 我们可以通过调用 [fromTx()](../how-to-write-a-contract/built-ins.md#fromtx) 从交易中创建一个合约实例。

```ts
// 1) 从 TXID 检索完整交易
const tx = await signer.connectedProvider.getTransaction(txId)
// 2) 从交易中创建合约实例
const instance = Counter.fromTx(tx, atOutputIndex)

// 从现在开始，`instance` 与链上的交易同步
// 我们可以使用它与合约进行交互
```

一个完整的例子可以在这里找到 [here](./call-deployed).

### 带有签名的方法

一个合约的公共 `@method` 通常需要一个签名参数进行身份验证。以下是一个 [Pay To PubKey Hash (P2PKH)](https://learnmeabitcoin.com/technical/p2pkh) 合约的例子：

```ts
export class P2PKH extends SmartContract {
    @prop()
    readonly address: Addr

    constructor(address: Addr) {
        super(..arguments)
        this.address = address
    }

    @method()
    public unlock(sig: Sig, pubkey: PubKey) {
        // 确保 `pubkey` 是使用其地址构造的
        assert(pubKey2Addr(pubkey) == this.address, 'address check failed')

        // 确保 `sig` 是由 `pubkey` 的私钥签名的
        assert(this.checkSig(sig, pubkey), 'signature check failed')
    }
}
```

我们可以像这样调用 `unlock` 方法：

```ts
// 调用
const { tx: callTx } = await p2pkh.methods.unlock(
    // 第一个参数 `sig` 被一个回调函数替换，该函数将返回所需的签名
    (sigResps) => findSig(sigResps, publicKey),

    // 第二个参数仍然是 `pubkey` 的值
    PubKey(toHex(publicKey)),

    // 方法调用选项
    {
        // 请求签名者使用对应的私钥签名
        pubKeyOrAddrToSign: publicKey
    } as MethodCallOptions<P2PKH>
);

console.log('contract called: ', callTx.id);
```

当 `p2pkh.method.unlock` 被调用时，选项包含 `pubKeyOrAddrToSign`，请求对 `publicKey` 进行签名。

第一个参数是一个签名，可以在回调函数中获得。该函数从 `pubKeyOrAddrToSign` 中获取请求的签名列表，并找到正确的 `Sig`。

一般来说，如果你的 `@method` 需要 `Sig` 类型的参数，你可以像这样获得它们：

1. 确保 `pubKeyOrAddrToSign` 包含所有对应这些 `Sig` 的公钥/地址；
1. 将每个 `Sig` 参数替换为从 `sigResps` 中过滤出正确 `Sig` 的回调函数。

## 示例

以下是 P2PKH 合约的部署和调用的完整示例代码。

```ts
import { privateKey } from '../../utils/privateKey';

// 加载合约
await P2PKH.loadArtifact()

// `privateKey` 的公钥
const publicKey = privateKey.publicKey

// 设置签名者
const signer = new TestWallet(privateKey, new DefaultProvider());

// 用 `pkh` 初始化一个实例
let p2pkh = new P2PKH(Addr(publicKey.toAddress().toByteString()))

// 将签名者连接到实例
await p2pkh.connect(signer);

// 部署合约，锁定 1 聪
const deployTx = await p2pkh.deploy(1);
console.log('contract deployed: ', deployTx.id);

// 调用
const { tx: callTx } = await p2pkh.methods.unlock(
    (sigResps) => findSig(sigResps, publicKey),
    PubKey(toHex(publicKey)),
    {
        pubKeyOrAddrToSign: publicKey
    } as MethodCallOptions<P2PKH>
);

console.log('contract called: ', callTx.id);
```

更多示例可以在这里找到 [here](https://github.com/sCrypt-Inc/boilerplate/tree/master/tests/).

### 运行代码

部署和调用代码被包装到一个简单的 NPM 命令中：

```sh
npm run testnet
```

确保在运行此命令之前为你的地址提供资金。
成功运行后，你应该会看到如下内容：

```text
P2PKH contract deployed:  f3f372aa25f159efa93db8c51a4eabbb15935358417ffbe91bfb78f4f0b1d2a3
P2PKH contract called:  dc53da3e80aadcdefdedbeb6367bb8552e381e92b226ab1dc3dc9b3325d8a8ee
```

这些是部署智能合约和调用其方法的事务的 TXIDs。你可以使用 [block explorer](https://test.whatsonchain.com/tx/f3f372aa25f159efa93db8c51a4eabbb15935358417ffbe91bfb78f4f0b1d2a3) 查看这些事务。

### 自定义事务

部署和调用合约构建具有特定格式的事务，这在许多情况下都足够了。在某些情况下，事务格式不符合你的需求，你需要自定义它，请继续 [下一节](./how-to-customize-a-contract-tx.md)。
