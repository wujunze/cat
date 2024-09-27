---
sidebar_position: 11
---

# 如何构建预言机服务

正如在[这个教程](https://docs.scrypt.io/tutorials/oracle.md)中描述的那样，区块链预言机是向区块链网络提供外部数据的第三方服务或代理。它是区块链和外部世界之间的桥梁，使智能合约能够访问、验证并整合来自区块链外部的数据。具体来说，预言机服务提供外部数据及其[Rabin签名](https://en.wikipedia.org/wiki/Rabin_signature_algorithm)，智能合约使用这些数据并验证签名后使用它们。

## Rabin签名
[Rabin签名](https://en.wikipedia.org/wiki/Rabin_signature_algorithm)是另一种数字签名算法（[DSA](https://en.wikipedia.org/wiki/Digital_Signature_Algorithm)），用于比特币。它有一个美丽的**不对称性**，即**签名生成计算成本高，但签名验证成本低**。因此，我们选择使用Rabin签名以确保预言机提供的外部数据完整性。当预言机提供数据时，它将使用其私钥在链下对数据进行签名。当数据被智能合约使用时，其签名在链上进行验证，这成本低廉。我们在这里不使用内置的`checkSig` [操作码](https://wiki.bitcoinsv.io/index.php/OP_CHECKSIG)，因为它只能检查交易数据的签名，而不能检查任意数据。

![img](/sCrypt/how-to-build-an-oracle-service-01.png)

在本节中，我们将介绍如何构建自己的预言机服务。对于后端框架，我们使用[NestJS](https://nestjs.com/)来演示，但您可以自由使用任何熟悉的框架来构建服务。对于Rabin签名部分，我们已经实现了一个库[`rabinsig`](https://github.com/sCrypt-Inc/rabin)，可以直接导入和使用。

这个演示的完整完整代码可以在我们的[GitHub仓库](https://github.com/sCrypt-Inc/oracle-demo)中找到。您还可以参考[WitnessOnChain](https://api.witnessonchain.com)的开源预言机服务的[代码](https://github.com/gitzhou/api-witnessonchain)，了解更多细节。

## 1. 搭建项目

运行以下命令来创建一个`NestJS`项目。

```bash
npx @nestjs/cli new oracle-demo
```

然后安装依赖。

```bash
cd oracle-demo
npm install
npm install rabinsig
```

## 2. 生成签名

一个预言机可能会提供多个数据，每个数据都需要一个签名。我们实现一个公共服务，以便在不同的地方重用和调用。

类`SigService`将从一个环境变量中加载和初始化一个私钥。我们在这个类中添加一个方法`sign`，它接受一个参数`dataBuffer`，表示要签名的二进制数据。

```ts
import { Rabin, serialize } from 'rabinsig';

export class SigService {
  private rabin = new Rabin();
  // 从环境变量中加载和初始化Rabin私钥
  ...
  sign(dataBuffer: Buffer) {
    const dataHex = dataBuffer.toString('hex');
    const sig = this.rabin.sign(dataHex, this.privKey);
    return { data: dataHex, signature: serialize(sig) };
  }
}
```

## 3. 添加API

### 添加一个时间戳API

为了了解它是如何工作的，我们实现一个简单的时间戳API。我们首先获取当前时间戳，然后将其转换为4字节的*Buffer*，并以小端格式进行签名。

```ts
export function getTimestamp() {
  return Math.trunc(Date.now() / 1000);
}

@Get('/timestamp')
getTimestamp() {
  const timestamp = getTimestamp();
  const data = Buffer.concat([
    toBufferLE(V1Controller.MARKER.TIMESTAMP, 1), // api marker, 1 byte
    toBufferLE(timestamp, 4), // timestamp, 4 bytes LE
  ]);
  const sigResponse = this.rabinService.sign(data);
  return { timestamp, ...sigResponse };
}
```

这个API的响应如下。

```json
{
  "timestamp":1700596603,
  "data":"017b0b5d65",
  "signature":{
    "s":"4fe8bbcdf26...",
    "padding":"0000"
  }
}
```

对于智能合约，它只需要关注两个部分：`data`和`signature`。只有在`signature`验证通过时，它才应该使用和信任`data`。

#### API 标记

注意，`data`中的第一个字节是一个标识符标记，它不仅表示签名的数据是如何序列化的，而且还具有更重要的角色，即区分来自不同接口的数据。

如果没有这个标记，智能合约将无法区分通过`data`实际来自哪个接口。当预言机有两个接口返回相同长度的签名数据时，攻击者可以将来自另一个接口的数据传递给合约，从而可能导致问题。因此，不同的API应该使用不同的标记值。

### 添加一个货币价格API

这里我们使用[OKX API](https://www.okx.com/docs-v5/en)来获取货币的价格。

首先，包装OKX API。注意如何处理价格值。由于在智能合约中处理*浮点*数不方便，引入了一个变量`decimal`，将价格值转换为整数。

```ts
/**
 * @param tradingPair 例如 `BSV-USDT`、`BTC-USDC` 等
 * @param decimal 返回价格的小数位数
 * @returns 一个整数，表示交易对的单价，例如返回1234，小数位数为2，表示12.34
 */
async getOkxPrice(tradingPair: string, decimal: number) {
  return axios
    .get(`https://www.okx.com/api/v5/market/ticker?instId=${tradingPair}`)
    .then((r) => Math.trunc(r.data.data[0].last * 10 ** decimal));
}
```

然后按照**获取数据、序列化数据和签名数据**的顺序实现预言机API。

```ts
@Get('price/:base/:query')
async getPrice(@Param('base') base: string, @Param('query') query: string) {
  // 获取数据
  const tradingPair = `${query.toUpperCase()}-${base.toUpperCase()}`;
  const decimal = 4;
  const price = await this.v1Service.getOkxPrice(tradingPair, decimal);
  // 序列化数据
  const timestamp = getTimestamp();
  const data = Buffer.concat([
    toBufferLE(V1Controller.MARKER.PRICE, 1), // api 标记, 1 字节
    toBufferLE(timestamp, 4), // timestamp, 4 字节 LE
    toBufferLE(price, 8), // price, 8 字节 LE
    toBufferLE(decimal, 1), // decimal, 1 字节
    Buffer.from(tradingPair), // trading pair
  ]);
  // 签名数据
  const sigResponse = this.rabinService.sign(data);
  return { timestamp, tradingPair, price, decimal, ...sigResponse };
}
```

### 添加更多API

根据前面的介绍，您可以根据需要为您的预言机添加更多API，例如获取BSV链信息等，这里不再赘述。

## 4. 在智能合约中使用预言机数据

在[这个教程](https://docs.scrypt.io/tutorials/oracle.md)中，我们介绍了如何验证和使用智能合约中的预言机数据。

要验证智能合约中的签名，我们需要安装`scrypt-ts-lib`库。

```bash
npm install scrypt-ts-lib
```
  
然后在 `/src/contracts` 文件夹下添加合约。这里我们同样使用 [PriceBet](https://github.com/sCrypt-Inc/oracle-demo/blob/master/src/contracts/priceBet.ts) 合约。您可以参考 [priceBet.e2e-spec.ts](https://github.com/sCrypt-Inc/oracle-demo/blob/master/src/contracts/priceBet.ts) 文件获取完整的测试代码。
