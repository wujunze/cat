---
sidebar_position: 7
---

# 如何添加一个signer


如[本节](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#provider)所述，signer是私钥的抽象，可用于签署消息和交易。简单的signer可能是单个私钥，而复杂的signer则是钱包。    

`sCrypt` 提供了以下默认的signers：

1. `TestWallet` : 一个简单的钱包，可以持有多个私钥，具有内存中的utxo管理。仅用于测试。
1. `PandaSigner`: 一个由流行的智能合约钱包 [Yours Wallet](https://github.com/yours-org/yours-wallet/) 驱动的signer。可以用于[生产环境](https://docs.scrypt.io/tokens/tutorials/ordinal-lock.md#use-panda-wallet).

## 实现

### 基类 `Signer`

如果你想实现自己的signer，你必须继承自基类`Signer`。


```ts
/**
 * 一个`Signer`是一个直接或间接访问私钥的类，可以签署消息和交易，以授权网络执行操作。
 */
export abstract class Signer {

  provider?: Provider;
  readonly _isSigner: boolean;

  constructor(provider?: Provider) {
    this._isSigner = true;
    this.provider = provider;
  }

  // 认证

  abstract getNetwork(): Promise<bsv.Networks.Network>;

  /**
   * 检查钱包是否已认证
   * @returns {boolean} true | false
   */
  abstract isAuthenticated(): Promise<boolean>;

  /**
   * 请求钱包认证
   * @returns 一个Promise，解析为钱包是否已认证以及认证错误消息
   */
  abstract requestAuth(): Promise<{ isAuthenticated: boolean, error: string }>;

  /**
   * 设置provider
   * @param provider 目标provider
   */
  abstract setProvider(provider: Provider): void;

  /**
   *
   * @returns 一个Promise，解析为signer的默认私钥的公钥
   */
  abstract getDefaultPubKey(): Promise<bsv.PublicKey>;

  /**
   * 
   * @returns 一个Promise，解析为signer的默认私钥的地址
   */
  abstract getDefaultAddress(): Promise<bsv.Address>;

  /**
   * 
   * @param address 请求的地址，如果省略，则使用默认地址。
   * @returns 公钥结果。
   * @throws 如果地址的私钥不属于此signer。
   */
  abstract getPubKey(address?: AddressOption): Promise<bsv.PublicKey>;

  // 签名

  /**
   * 对一个原始交易十六进制字符串进行签名。
   *
   * @param rawTxHex 要签名的原始交易十六进制字符串。
   * @param options 签名的选项，见`SignTransactionOptions`的详细信息。
   * @returns 一个Promise，解析为签名的交易十六进制字符串。
   * @throws 如果交易中的任何输入不能正确签名。
   */
  async signRawTransaction(rawTxHex: string, options: SignTransactionOptions): Promise<string> {
    const signedTx = await this.signTransaction(new bsv.Transaction(rawTxHex), options);
    return signedTx.toString();
  }

  /**
   * 对一个交易对象进行签名。默认情况下，只对解锁P2PKH UTXO的输入进行签名。
   * @param tx 要签名的交易对象。
   * @param options 签名的选项，见`SignTransactionOptions`的详细信息。
   * @returns 一个Promise，解析为签名的交易对象。
   */
  async signTransaction(tx: bsv.Transaction, options?: SignTransactionOptions): Promise<bsv.Transaction> {

    ...
  }

  /**
   * 对一个消息字符串进行签名。
   * @param message 要签名的消息字符串。
   * @param address 可选的地址，其私钥将用于签名`message`，如果省略，则使用默认私钥。
   * @returns 一个Promise，解析为消息的签名。
   */
  abstract signMessage(message: string, address?: AddressOption): Promise<string>;

  /**
   * 获取原始交易的请求签名。
   * @param rawTxHex 要获取签名的原始交易十六进制字符串。
   * @param sigRequests 签名的请求信息，见`SignatureRequest`的详细信息。
   * @returns 一个Promise，解析为与`sigRequests`对应的`SignatureReponse`列表。
   */
  abstract getSignatures(rawTxHex: string, sigRequests: SignatureRequest[]): Promise<SignatureResponse[]>;

  /**
   * 获取连接的provider。
   * @returns 连接的provider。
   * @throws 如果没有provider连接到`this`。
   */
  get connectedProvider(): Provider {
    if (!this.provider) {
      throw new Error(`the provider of signer ${this.constructor.name} is not set yet!`);
    }

    return this.provider;
  }

  /**
   * 签署交易并广播。
   * @param tx 一个被签署和广播的交易
   * @param options 签名的选项，见`SignTransactionOptions`的详细信息。
   * @returns 一个Promise，解析为交易id。
   */
  async signAndsendTransaction(tx: bsv.Transaction, options?: SignTransactionOptions): Promise<TransactionResponse> {
    await tx.sealAsync();
    const signedTx = await this.signTransaction(tx, options);
    await this.connectedProvider.sendTransaction(signedTx);
    return signedTx;
  };

  /**
   * 获取P2PKH UTXOs列表。
   * @param address 返回的UTXOs所属的地址。
   * @param options 可选的查询条件，见`UtxoQueryOptions`的详细信息。
   * @returns 一个Promise，解析为UTXO列表。
   */
  listUnspent(address: AddressOption, options?: UtxoQueryOptions): Promise<UTXO[]> {
    // 使用provider的默认实现。可以被重写。
    return this.connectedProvider.listUnspent(address, options);
  }

  /**
   * 获取BSV余额。
   * @param address 查询的地址。
   * @returns 一个Promise，解析为地址的余额状态。
   */
  async getBalance(address?: AddressOption): Promise<{ confirmed: number, unconfirmed: number }> {
    // 使用provider的默认实现。可以被重写。
    address = address ? address : await this.getDefaultAddress();
    return this.connectedProvider.getBalance(address);
  }

  // 检查
  /**
   * 检查一个对象是否是`Signer`
   * @param value 目标对象
   * @returns 如果`object`是`Signer`，返回`true`。
   */
  static isSigner(value: any): value is Signer {
    return !!(value && value._isSigner);
  }

  /**
   * 在signer认证后，对provider的网络进行对齐
   */
  async alignProviderNetwork() {
    ...
  }
}
```

建议你的signer实现所有`abstract`方法。对于非`abstract`方法，默认实现通常是足够的。

### `例子: PandaSigner`

接下来，我们使用[Yours Wallet](https://github.com/yours-org/yours-wallet)作为示例，展示如何实现一个`PandaSigner`。

1. 实现`isAuthenticated`方法，检查钱包是否已认证：

```ts
private _initTarget() {
    if(this._target) {
        return;
    }

    if (typeof (window as any).panda !== 'undefined') {
        this._target = (window as any).panda;
    } else {
        throw new Error('panda is not installed')
    }
}

/**
 * 检查钱包是否已认证
 * @returns {boolean} true | false
 */
override isAuthenticated(): Promise<boolean> {
    this._initTarget();
    return this._target.isConnected();
}
```


2. 实现`requestAuth`方法，请求钱包认证：

```ts
/**
 * 请求钱包认证
 * @returns 一个Promise，解析为钱包是否已认证以及认证错误消息
 */
override async requestAuth(): Promise<{ isAuthenticated: boolean, error: string }> {
    let isAuthenticated: boolean = false
    let error: string = ''
    try {
        await this.getConnectedTarget()
        await this.alignProviderNetwork()
        isAuthenticated = true
    } catch (e) {
        error = e.toString()
    }
    return Promise.resolve({ isAuthenticated, error })
}
```


3. 在`getDefaultAddress`中返回钱包的默认私钥的地址：

```ts
/**
 * 获取一个可以直接与Panda钱包交互的对象，
 * 如果没有与钱包的连接，将请求建立连接。
 * @returns PandaAPI
 */
private async getConnectedTarget(): Promise<PandaAPI> {
    const isAuthenticated = await this.isAuthenticated()
    if (!isAuthenticated) {
        // 当未授权时，触发连接到Panda账户。
        try {

            this._initTarget();
            const res = await this._target.connect();

            if(res && res.includes("canceled")) {
                throw new Error(res);
            }

        } catch (e) {
            throw new Error(`panda requestAccount failed: ${e}`)
        }
    }
    return this._target;
}

override async getDefaultAddress(): Promise<bsv.Address> {
    const panda = await this.getConnectedTarget();
    const address = await panda.getAddresses();
    return bsv.Address.fromString(address.bsvAddress);
}
```

4. 在`getDefaultPubKey`中返回钱包的默认私钥的公钥：

```ts
override async getDefaultPubKey(): Promise<bsv.PublicKey> {
    const panda = await this.getConnectedTarget();
    const pubKey = await panda.getPubKeys();
    return Promise.resolve(new bsv.PublicKey(pubKey.bsvPubKey));
}
```

5. 由于Panda是一个单地址钱包，我们简单地忽略`getPubKey`方法：

```ts
override async getPubKey(address: AddressOption): Promise<PublicKey> {
    throw new Error(`Method ${this.constructor.name}#getPubKey not implemented.`);
}
```

6. `signTransaction`和`signRawTransaction`方法已经实现，你只需要实现`getSignatures`方法。以下代码调用Panda的`getSignatures` API来请求钱包签名。


```ts
/**
 * 使用Panda API获取签名
 * @param rawTxHex 一个交易的原始十六进制字符串
 * @param sigRequests 一个`SignatureRequest`数组，用于交易的一些输入。
 * @returns 一个`SignatureResponse`数组
 */
override async getSignatures(rawTxHex: string, sigRequests: SignatureRequest[]): Promise<SignatureResponse[]> {
    const panda = await this.getConnectedTarget();
    const network = await this.getNetwork()

    const sigRequests_ = sigRequests.map(sigReq => ({
        prevTxid: sigReq.prevTxId,
        outputIndex: sigReq.outputIndex,
        inputIndex: sigReq.inputIndex,
        satoshis: sigReq.satoshis,
        address: parseAddresses(sigReq.address, network).map(addr => addr.toString()),
        script: sigReq.scriptHex,
        sigHashType: sigReq.sigHashType,
        csIdx: sigReq.csIdx,
        data: sigReq.data,
    }));

    const sigResults = await panda.getSignatures({
        rawtx: rawTxHex,
        sigRequests: sigRequests_
    });

    return sigResults.map(sigResult => ({
        ...sigResult,
        publicKey: sigResult.pubKey,
    }));
}
```


7. Panda支持签名消息，如果你的钱包不支持，你可以在`signMessage`函数中抛出异常：

```ts
override async signMessage(message: string, address?: AddressOption): Promise<string> {
    if (address) {
        throw new Error(`${this.constructor.name}#signMessge with \`address\` param is not supported!`);
    }
    const panda = await this.getConnectedTarget();
    const res = await panda.signMessage({message});
    return res.sig;
}
```

到目前为止，我们已经实现了所有抽象方法。剩余的非抽象方法可以重用默认实现，即委托给连接的[provider](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#provider)。如果你有自定义的实现，你可以覆盖它们。例如，我们可以使用Panda api `getBalance`来获取地址的余额。

```ts
override getBalance(address?: AddressOption): Promise<{ confirmed: number, unconfirmed: number }> {
    if (address) {
        return this.connectedProvider.getBalance(address);
    }

    const panda = await this.getConnectedTarget();
    const balance = await panda.getBalance();
    return Promise.resolve({ confirmed: balance.satoshis, unconfirmed: 0 });
}
```

现在我们已经实现了`PandaSigner`。完整的代码[在这里](https://gist.github.com/zhfnjust/4448c0c10e2352d0b7f6eeb86dbd6b0f)。

## 使用你的signer

只需将你的signer连接到智能合约实例，就像任何其他signers一样：

```ts
// 声明你的signer
const your_signer = new YourSigner(new DefaultProvider());
// 将signer连接到智能合约实例
await instance.connect(your_signer);
```

这里有一个[用户自定义的signer](https://github.com/shubham78901/scryptDemo/blob/neucron/tests/utils/neucronSigner.ts).
