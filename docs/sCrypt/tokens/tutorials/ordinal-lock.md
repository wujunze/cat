---
sidebar_position: 4
---

# 教程 4: Ordinal 锁定

## 概述
在这个教程中，我们将介绍如何使用 [sCrypt](https://scrypt.io/) 在比特币上构建一个全栈 dApp，以出售 [1Sat Ordinals](https://docs.1satordinals.com/)，包括智能合约和交互式前端。

## 合约

智能合约 [OrdinalLock](https://github.com/sCrypt-Inc/scrypt-ord/blob/master/tests/contracts/ordinalLock.ts) 允许一个序号在去中心化市场上出售。任何人都可以购买这些列表，只要他们能够支付请求的价格。列表也可以由列出它们的人取消。

为了记录卖家和价格，我们需要在合约中添加两个属性。

```ts
export class OrdinalLock extends OrdinalNFT {
    @prop()
    seller: PubKey

    @prop()
    amount: bigint

    ...
}
```

### 构造函数

在构造函数中初始化所有 `@prop` 属性。

```ts
constructor(seller: PubKey, amount: bigint) {
    super()
    this.init(...arguments)
    this.seller = seller
    this.amount = amount
}
```

### 方法

公共方法 `purchase` 只需要将事务的输出限制为包含：

- 将序号转移到买家
- 支付给卖家

```ts
@method()
public purchase(receiver: Addr) {
    const outputs =
        Utils.buildAddressOutput(receiver, 1n) + // ordinal to the buyer
        Utils.buildAddressOutput(hash160(this.seller), this.amount) + // 支付给卖家
        this.buildChangeOutput()
    assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs check failed')
}
```

完整的 [最终代码](https://github.com/sCrypt-Inc/scrypt-ord/blob/master/tests/contracts/ordinalLock.ts) 如下：

```ts
import { Addr, prop, method, Utils, hash256, assert, ContractTransaction, bsv, PubKey, hash160, Sig, SigHash } from 'scrypt-ts'
import { OrdiMethodCallOptions, OrdinalNFT } from '../scrypt-ord'

export class OrdinalLock extends OrdinalNFT {
    @prop()
    seller: PubKey

    @prop()
    amount: bigint

    constructor(seller: PubKey, amount: bigint) {
        super()
        this.init(...arguments)
        this.seller = seller
        this.amount = amount
    }

    @method()
    public purchase(receiver: Addr) {
        const outputs =
            Utils.buildAddressOutput(receiver, 1n) + // ordinal 转移给买家
            Utils.buildAddressOutput(hash160(this.seller), this.amount) + // 支付给卖家
            this.buildChangeOutput()
        assert(
            this.ctx.hashOutputs == hash256(outputs),
            'hashOutputs check failed'
        )
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public cancel(sig: Sig) {
        assert(this.checkSig(sig, this.seller), 'seller signature check failed')
        const outputs = Utils.buildAddressOutput(hash160(this.seller), 1n) // ordinal 返回给卖家
        assert(
            this.ctx.hashOutputs == hash256(outputs),
            'hashOutputs check failed'
        )
    }

    static async buildTxForPurchase(
        current: OrdinalLock,
        options: OrdiMethodCallOptions<OrdinalLock>,
        receiver: Addr
    ): Promise<ContractTransaction> {
        const defaultAddress = await current.signer.getDefaultAddress()
        const tx = new bsv.Transaction()
            .addInput(current.buildContractInput())
            .addOutput(
                new bsv.Transaction.Output({
                    script: bsv.Script.fromHex(
                        Utils.buildAddressScript(receiver)
                    ),
                    satoshis: 1,
                })
            )
            .addOutput(
                new bsv.Transaction.Output({
                    script: bsv.Script.fromHex(
                        Utils.buildAddressScript(hash160(current.seller))
                    ),
                    satoshis: Number(current.amount),
                })
            )
            .change(options.changeAddress || defaultAddress)
        return {
            tx,
            atInputIndex: 0,
            nexts: [],
        }
    }

    static async buildTxForCancel(
        current: OrdinalLock,
        options: OrdiMethodCallOptions<OrdinalLock>
    ): Promise<ContractTransaction> {
        const defaultAddress = await current.signer.getDefaultAddress()
        const tx = new bsv.Transaction()
            .addInput(current.buildContractInput())
            .addOutput(
                new bsv.Transaction.Output({
                    script: bsv.Script.fromHex(
                        Utils.buildAddressScript(hash160(current.seller))
                    ),
                    satoshis: 1,
                })
            )
            .change(options.changeAddress || defaultAddress)
        return {
            tx,
            atInputIndex: 0,
            nexts: [],
        }
    }
}
```

注意自定义的调用方法 `buildTxForPurchase` 和 `buildTxForCancel` 确保 ordinal 在第一个输入中，并转移到第一个输出，这也是一个 1sat 输出。

## 前端

我们将根据这个[指南](../../how-to-integrate-a-frontend/how-to-integrate-a-frontend.md)为`OrdinalLock`智能合约添加一个前端。

### 设置项目

前端将使用 [Create React App](https://create-react-app.dev/) 创建。

```bash
npx create-react-app ordinal-lock-demo --template typescript
```

### 安装 sCrypt SDK

sCrypt SDK 使您能够轻松地编译、测试、部署和调用智能合约。

使用 `scrypt-cli` 命令行工具安装 SDK。

```bash
cd ordinal-lock-demo
npm i scrypt-ord
npx scrypt-cli init
```

该命令将在 `src/contracts` 目录下创建一个合约文件。请用[上面](#final-code)编写的合约代码替换该文件的内容。

### 编译合约

使用以下命令编译合约:

```bash
npx scrypt-cli compile
```

该命令将在 `artifacts` 目录下生成一个合约构件文件。

## 使用 `watch` 选项编译

实时监控检测错误

```sh
npx scrypt-cli compile --watch
```

该命令将在编译过程中显示 sCrypt 级别的错误。


### 加载合约构件

在编写前端代码之前，我们需要在 `src/index.tsx` 中加载合约构件。

```ts
import { OrdinalLock } from './contracts/ordinalLock'
import artifact from '../artifacts/ordinalLock.json'
OrdinalLock.loadArtifact(artifact)
```

### 连接 signer 到 `OrdiProvider`

```ts
const provider = new OrdiProvider();
const signer = new PandaSigner(provider);
```

### 集成钱包

使用 `signer` 的 `requestAuth` 方法请求访问钱包。

```ts
// 请求认证
const { isAuthenticated, error } = await signer.requestAuth();
if (!isAuthenticated) {
    // 出错了，抛出错误
    throw new Error(error);
}

// 认证成功
// ...
```

### 加载 Ordinals

在用户连接钱包后，我们可以获取他的地址。调用 [1Sat Ordinals API](https://v3.ordinals.gorillapool.io/api/docs/) 检索此地址上的 Ordinals。

```ts
useEffect(() => {
  loadCollections()
}, [connectedAddress])

function loadCollections() {
  if (connectedAddress) {
    const url = `https://v3.ordinals.gorillapool.io/api/txos/address/${connectedAddress.toString()}/unspent?bsv20=false`
    fetch(url).then(r => r.json()).then(r => r.filter(e => e.origin.data.insc.file.type !== 'application/bsv-20')).then(r => setCollections(r))   }
}
```

![](/sCrypt/ordinal-lock-01.png)

![](/sCrypt/ordinal-lock-02.png)

### 列出一个  Ordinal

对于集合列表中的每个 Ordinal，我们可以点击 `Sell` 按钮，在填写出售价格（以 satoshis 为单位）后将其列出。出售 Ordinal 意味着我们需要创建一个合约实例，然后将 Ordinal 转移到其中。之后，Ordinal 受合约控制，意味着它可以被任何人支付价格购买。

```ts
async function sell() {
    const signer = new PandaSigner(new OrdiProvider())
    const publicKey = await signer.getDefaultPubKey()

    const instance = new OrdinalLock(PubKey(toHex(publicKey)), amount)
    await instance.connect(signer)

    const inscriptionUtxo = await parseUtxo(txid, vout)
    const inscriptionP2PKH = OrdiNFTP2PKH.fromUTXO(inscriptionUtxo)
    await inscriptionP2PKH.connect(signer)

    const { tx } = await inscriptionP2PKH.methods.unlock(
        (sigResps) => findSig(sigResps, publicKey),
        PubKey(toHex(publicKey)),
        {
            transfer: instance,     // <----
            pubKeyOrAddrToSign: publicKey,
        } as OrdiMethodCallOptions<OrdiNFTP2PKH>
    )
}
```

![](/sCrypt/ordinal-lock-03.png)

![](/sCrypt/ordinal-lock-04.png)

![](/sCrypt/ordinal-lock-05.png)

### 购买一个 Ordinal

要购买正在出售的 Ordinal，我们只需调用合约的公共方法 `purchase`。

```ts
async function buy() {
    const signer = new PandaSigner(new OrdiProvider())
    const address = await signer.getDefaultAddress()
    const { tx } = await instance.methods.purchase(Addr(address.toByteString()))
}
```

![](/sCrypt/ordinal-lock-06.png)

![](/sCrypt/ordinal-lock-07.png)

![](/sCrypt/ordinal-lock-08.png)

![](/sCrypt/ordinal-lock-09.png)

![](/sCrypt/ordinal-lock-10.png)

## 使用 Yours Wallet

在 2024 年 3 月，Panda Wallet 更名为 [Yours Wallet](https://github.com/yours-org/yours-wallet/)。

[Yours Wallet](https://github.com/yours-org/yours-wallet) 是一个开源且非托管的 BSV 和 [1Sat Ordinals](https://docs.1satordinals.com/) 的 web3 钱包。这个钱包允许用户完全控制他们的资金，提供安全且独立地管理他们的资产。

要在 dApp 中支持 Yours Wallet，我们只需将所有 `PandaSigner` 替换为 `YoursSigner`，就是这样。

```ts
import { PandaSigner } from "scrypt-ts/dist/bsv/signers/panda-signer"
```

与 [signers](../../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#signer) 不同，我们可以从 `PandaSigner` 获取两个地址，用户授权连接操作后：

- `getDefaultAddress()`, 用于发送和接收 BSV、支付交易费用等的地址。与其它 signers 相同。
- `getOrdAddress()`, 仅用于接收 Ordinals 的地址。

```ts
const [connectedPayAddress, setConnectedPayAddress] = useState(undefined)
const [connectedOrdiAddress, setConnectedOrdiAddress] = useState(undefined)
...
async function connect() {
    const signer = new PandaSigner(new OrdiProvider())   // <---- use `PandaSigner`
    const { isAuthenticated, error } = await signer.requestAuth()
    if (!isAuthenticated) {
        throw new Error(`Unauthenticated: ${error}`)
    }
    setConnectedPayAddress(await signer.getDefaultAddress())  // <----
    setConnectedOrdiAddress(await signer.getOrdAddress())     // <----
}
```

### 加载 Ordinals

![](/sCrypt/ordinal-lock-11.png)

![](/sCrypt/ordinal-lock-12.png)

### 列出一个 Ordinal

![](/sCrypt/ordinal-lock-13.png)

![](/sCrypt/ordinal-lock-14.png)

### 购买一个 Ordinal

![](/sCrypt/ordinal-lock-15.png)

![](/sCrypt/ordinal-lock-16.png)

## 结论

恭喜！您已经成功完成了一个全栈 dApp，可以在比特币上出售 1Sat Ordinals。

完整的示例仓库可以在这里找到 [here](https://github.com/sCrypt-Inc/ordinal-lock-demo).
