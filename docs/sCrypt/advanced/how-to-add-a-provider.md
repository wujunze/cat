---
sidebar_position: 6
---

# 如何添加一个provider


在[合约测试部分](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#provider)，我们学习了sCrypt中的Provider类。这个类充当比特币节点的抽象，允许您的应用程序与比特币网络进行通信。

`sCrypt` 提供了以下默认provider：

* `DummyProvider`: 一个mockup provider，旨在用于本地测试。它不连接到比特币区块链，因此无法发送交易。

* `DefaultProvider`: 默认provider是最安全和最容易的方式开始在比特币上开发，并且对于在生产环境中使用来说也是足够健壮的。它可以在testnet和mainnet中使用。

* 有关provider的完整列表，请参见[这里](https://docs.scrypt.io/reference/classes/Provider.md#hierarchy).

## 实现

### 基类 `Provider`

要实现自己的provider，必须扩展基类`Provider`。以下是这个类的定义：

```ts
/**
 * Provider 是一个区块链上非账户操作的抽象，通常不直接参与交易或数据的签名。
 */ 
export abstract class Provider extends EventEmitter  {

  constructor() {
    super()
    this._isProvider = true;
  }

  /**
   * 检查provider是否已准备好
   */
  abstract isConnected(): boolean;

  /**
   * 在构造函数中调用此函数以初始化连接
   */
  protected _initializeConnection() {
    new Promise((resolve, reject) => {
      setTimeout(() => {
        this.connect().then((self) => {
          resolve(self);
        }, (error) => {
          reject(error);
        });
      }, 0);
    });
  }

  /**
   * 检查连接是否已准备好
   */
  protected async _ready(): Promise<void> {
    if (!this.isConnected()) {
      try {
        await this.connect();
      } catch (error) { throw error }
    }
  }


  /**
   * 实现provider的连接，例如，在连接过程中验证api key。
   * @returns 一个已连接的provider。如果连接失败，则抛出异常。
   */
  abstract connect(): Promise<this>;

  /**
   * 更新provider网络
   * @param network 要更新的网络类型
   */
  abstract updateNetwork(network: bsv.Networks.Network): Promise<void>;

  /**
   * @returns 返回provider连接到的网络。
   */
  abstract getNetwork(): Promise<bsv.Networks.Network>;

  /**
   * @returns 返回发送交易的费用。
   */
  abstract getFeePerKb(): Promise<number>;

  /**
   * 获取交易的最佳估计费用。
   * @param tx 要估计的交易对象。
   * @returns 估计的费用。
   */
  async getEstimateFee(tx: bsv.Transaction): Promise<number> {
    const copy = new bsv.Transaction(tx.uncheckedSerialize());
    // 使用副本，因为`feePerKb`会重置所有输入的签名。
    copy.feePerKb(await this.getFeePerKb());
    return copy.getEstimateFee();
  }

  // 执行

  /**
   * 发送一个原始交易十六进制字符串。
   * @param rawTxHex 要发送的原始交易十六进制字符串。
   * @returns 一个promise，解析为已发送交易的哈希值。
   */
  abstract sendRawTransaction(rawTxHex: string): Promise<TxHash>;

  /**
   * 发送一个交易对象。
   * @param tx 要发送的交易对象。
   * @returns 一个promise，解析为已发送交易的哈希值。
   * @throws 如果序列化期间出现问题。
   */
  sendTransaction(tx: bsv.Transaction): Promise<TxHash> {
    // TODO: fix tx.serialize issue 
    return this.sendRawTransaction(tx.serialize({ disableIsFullySigned: true }));
  }

  // Queries

  /**
   * 从网络获取一个交易。
   * @param txHash 交易的哈希值。
   * @returns 查询结果，包含交易信息。
   */
  abstract getTransaction(txHash: TxHash): Promise<TransactionResponse>

  /**
   * 获取P2PKH UTXO列表。
   * @param address 返回的UTXO所属的地址。
   * @param options 可选的查询条件，详情见 `UtxoQueryOptions`。
   * @returns 一个promise，解析为UTXO列表。
   */
  abstract listUnspent(address: AddressOption, options?: UtxoQueryOptions): Promise<UTXO[]>;

  /**
   * 获取BSV余额。
   * @param address 查询的地址。
   * @returns 一个promise，解析为地址余额状态。
   */
  abstract getBalance(address: AddressOption): Promise<{ confirmed: number, unconfirmed: number }>;

  // 检查

  readonly _isProvider: boolean;

  /**
   * 检查一个对象是否是 `Provider`
   * @param value 目标对象
   * @returns 如果 `object` 是 `Provider`，则返回 `true`。
   */
  static isProvider(value: any): value is Provider {
    return !!(value && value._isProvider);
  }
}
```

建议您的provider实现所有`abstract`方法。对于非`abstract`方法，默认实现通常足够。


### `Example: WhatsonchainProvider`

让我们通过实现我们自己的provider来走一遍过程。在这个例子中，我们将为[WhatsOnChain](https://whatsonchain.com)（WoC）实现一个provider。


1. 首先让我们实现 `isConnected()` 和 `connect()` 函数。因为WoC不需要维护一个打开的连接，也不需要默认的认证。我们只需要检查API是否响应正确。如果您的选择provider需要，这里可能是实现连接逻辑的地方。

```ts

private _network: bsv.Networks.Network;
private _isConnected: boolean = false;

constructor(network: bsv.Networks.Network) {
    super();
    this._network = network;
    this._initializeConnection();
}

override isConnected(): boolean {
    return this._isConnected;
}

override async connect(): Promise<this> {
    try {
      const res = await superagent.get(`${this.apiPrefix}/woc`)
        .timeout(3000);
      if (res.ok && res.text === "Whats On Chain") {
        this._isConnected = true;
        this.emit(ProviderEvent.Connected, true);
      } else {
        throw new Error(`${res.body.msg ? res.body.msg : res.text}`);
      }
    } catch (error) {
      this._isConnected = false;
      this.emit(ProviderEvent.Connected, false);
      throw new Error(`connect failed: ${error.message?? "unknown error"}`);
    }

    return Promise.resolve(this)
}
```

2. 接下来，我们将实现网络函数。在这里，您的providers选择的网络可以被切换。WoC支持比特币主网和testnet，所以我们不需要进一步检查：

```ts
override updateNetwork(network: bsv.Networks.Network): void {
  this._network = network;
  this.emit(ProviderEvent.NetworkChange, network);
}

override getNetwork(): bsv.Networks.Network {
  return Promise.resolve(this._network);
}
```

如果您的provider只用于testnet，您可以这样做：
```ts
override updateNetwork(network: bsv.Networks.Network): void {
  if (network != bsv.Networks.testnet) {
    throw new Error('Network not supported.')
  }
  this._network = network;
  this.emit(ProviderEvent.NetworkChange, network);
}
```

3. 现在让我们设置交易费用率。在我们的例子中，我们硬编码值为每kb 50 satoshis：

```ts
override async getFeePerKb(): Promise<number> {
  return Promise.resolve(1);
}
```

4. 让我们实现将交易数据发送到我们的provider的函数：

```ts
override async sendRawTransaction(rawTxHex: string): Promise<TxHash> {
  await this._ready();
  // 每KB 1秒 
  const size = Math.max(1, rawTxHex.length / 2 / 1024); //KB
  const timeout = Math.max(10000, 1000 * size);
  try {
    const res = await superagent.post(
      `${this.apiPrefix}/tx/raw`
    )
      .timeout({
        response: timeout,  // 等待服务器开始发送的时间为5秒,
        deadline: 60000, // 但允许1分钟时间完成文件加载。
      })
      .set('Content-Type', 'application/json')
      .send({ txhex: rawTxHex })
    return res.body;
  } catch (error) {
    if (error.response && error.response.text) {
      throw new Error(`WhatsonchainProvider ERROR: ${error.response.text}`)
    }
    throw new Error(`WhatsonchainProvider ERROR: ${error.message}`)
  }
}
```

在这个函数中,我们使用[`superagent`](https://www.npmjs.com/package/superagent)向WoC的HTTP端点发送请求。查看他们的[文档](https://docs.taal.com/core-products/whatsonchain)以了解他们提供的端点描述。

5. 现在我们需要实现一些查询。首先让我们实现一个函数来获取某个地址的[UTXO](https://wiki.bitcoinsv.io/index.php/UTXO)列表：

```ts
override async listUnspent(
    address: AddressOption, 
    options?: UtxoQueryOptions
    ): Promise<UTXO[]> {
  await this._ready();
  const res = await superagent.get(`${this.apiPrefix}/address/${address}/unspent`);
  const utxos: UTXO[] =
    res.body.map(item => ({
      txId: item.tx_hash,
      outputIndex: item.tx_pos,
      satoshis: item.value,
      script: bsv.Script.buildPublicKeyHashOut(address).toHex(),
    }));

  if (options?.minSatoshis && utxos.reduce((s, u) => s + u.satoshis, 0) < options.minSatoshis) {
    throw new Error(`WhatsonchainProvider ERROR: not enough utxos for the request amount of ${options.minSatoshis} on address ${address.toString()}`);
  }

  return utxos;
}
```

接下来，我们将实现`getBalance`函数，从UTXO中解析出地址的余额：

```ts
override async getBalance(
    address?: AddressOption
    ): Promise<{ confirmed: number, unconfirmed: number }> {

  return this.listUnspent(address, { minSatoshis: 0 }).then(utxos => {
    return {
      confirmed: utxos.reduce((acc, utxo) => {
        acc += utxo.satoshis;
        return acc;
      }, 0),
      unconfirmed: 0
    }
  })

}
```

我们还需要实现一个函数来使用交易ID查询原始交易：
```ts
override async getTransaction(txHash: string): Promise<TransactionResponse> {
  try {
    const res = await superagent.get(`${this.apiPrefix}/tx/${txHash}/hex`);
    return new bsv.Transaction(res.text)
  } catch (e) {
    throw new Error(`WhatsonchainProvider ERROR: failed fetching raw transaction data: ${e.message}`);
  }
}
```


## 使用provider

通常，providers由一个`Signer`使用：

```ts
const provider = new WhatsonchainProvider(bsv.Networks.mainnet)
const signer = new TestWallet(privateKey, provider)

await contractInstance.connect(signer);
```

在这里，signer将使用我们的`WhatsonchainProvider`来执行每个比特币网络操作。下一节描述signers和如何实现一个自定义的signer。
