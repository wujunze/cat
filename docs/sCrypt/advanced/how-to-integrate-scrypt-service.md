---
sidebar_position: 1
---

# 如何集成sCrypt服务

在与链上现有的`sCrypt`合约进行交互之前，我们必须根据链上合约的最新状态创建合约实例。可以通过调用[`fromTx`](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#create-a-smart-contract-instance-from-a-transaction)方法来创建这样的实例。然而，这意味着您的应用程序需要跟踪和记录所有与合约相关的交易，特别是对于有状态的合约。

更简单的选择是利用`sCrypt`基础设施服务，该服务跟踪这类交易，这样您就可以专注于您的应用逻辑。

## 获取 API 密钥

### 创建账户

前往 [sCrypt.io](https://scrypt.io) 创建您的免费账户。

![img](/sCrypt/how-to-integrate-scrypt-service-01.png)

### 获取 API 密钥

登录并点击 `Create` 来生成一个新的 API 密钥。点击 `Copy` 来复制它。

![img](/sCrypt/how-to-integrate-scrypt-service-02.png)

## 集成

一旦您获得了 API 密钥，您可以通过以下简单步骤轻松将 sCrypt 服务集成到您的应用程序中。

### 步骤 1：初始化客户端

您可以将 API 密钥和 `network` 一起传递给 `Scrypt.init` 函数，在您的应用程序中初始化一个 sCrypt 客户端。

```ts
import { Scrypt, bsv } from 'scrypt-ts'

Scrypt.init({
  apiKey: 'YOUR_API_KEY',
  network: bsv.Networks.testnet,
})
```

### 步骤 2：使用 `ScryptProvider` 连接signer

将signer连接到 `ScryptProvider`，这是使用 sCrypt 服务所需的[provider](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#provider)。

```ts
const signer = new TestWallet(myPrivateKey, new ScryptProvider())
const counter = new Counter(0n)
// 连接signer
await counter.connect(signer)
```

### 步骤 3：获取合约 ID

每个合约都由部署它的交易和其所在的输出唯一标识，我们将其视为其 ID。

```ts

const balance = 1
const deployTx = await counter.deploy(balance)
console.log('contract Counter deployed: ', deployTx.id)

const contractId = {
    /** 部署交易的 ID */
    txId: deployTx.id,
    /** 输出索引 */
    outputIndex: 0,
}
```

通常您可以从合约的创建者那里获取合约的ID，创建者会公开它以便其他人可以与之交互。

### 步骤 4：获取合约实例

一旦您获得了合约 ID，您可以按照以下步骤轻松创建一个合约实例。

```ts
const currentInstance = await Scrypt.contractApi.getLatestInstance(
  Counter,
  contractId
)

// 连接signer
await currentInstance.connect(signer)
```
对于无状态合约，实例指向部署交易；对于有状态合约，实例指向一系列交易中的最新交易，sCrypt 服务会自动跟踪。

## 与合约交互
在按照上述步骤获得实例后，您可以轻松地从合约中读取数据，向其写入数据，并监听它。

### 读取

您可以使用点运算符读取实例的属性，就像读取任何其他对象一样。

```ts
// 读取 @prop count
console.log(counter.count)
```

:::note
读取不会向区块链广播交易。
:::

### 写入

要更新合约实例，您调用其公共方法，如[之前](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-call)，通过广播交易写入区块链。

```ts
// 调用当前实例的方法来应用链上的更新
const { tx } = await currentInstance.methods.incrementOnChain()

console.log(`Counter contract called,  tx: ${tx.id}`)
```

### 监听事件

通常，您的应用程序需要在合约被调用和更新时收到通知。能够实时监听这些事件非常重要，可以在链上发生相关事件时提醒您的应用程序。例如，在您的前端，您可以刷新网页以向用户展示合约的最新状态，以响应事件通知。

通过 `sCrypt` 服务，您可以根据合约 ID 轻松订阅合约的事件，根据您的需求使用 Websockets（客户端）或 Webhooks（服务器端）。

#### Websockets

要使用 WebSockets 监听合约事件，只需在我们的客户端 SDK 中使用 `Scrypt.contractApi.subscribe` 专用 API，该 API 接受两个参数：

1. `options: SubscribeOptions<T>`：包括合约类、合约 ID 和一个可选的监视方法名称列表。

```ts
interface SubscribeOptions<T> {
  clazz: new (...args: any) => T;
  id: ContractId;
  methodNames?: Array<string>;
}
```

如果设置了 `methodNames`，则只有在调用列表中的公共函数时才会收到通知。否则，当调用任何公共函数时都会收到通知。

2. `callback: (event: ContractCalledEvent<T>) => void`: 在接收到通知时的回调函数。

`ContractCalledEvent<T>` 包含有关合约调用的相关信息：

- `methodName: string`，调用的公共方法

- `args: SupportedParamType[]`，调用公共方法时传入的参数

- `tx: bsv.Transaction`，合约调用所在的交易

- `nexts: Array[T]`，包括此次调用创建的新合约实例。如果调用了有状态合约，则 `nexts` 包含包含此次调用生成的新状态的合约实例。您可以从新合约实例中读取最新状态，例如，向用户展示新状态。如果调用了无状态合约，则 `nexts` 为空。

以下是在调用 `incrementOnChain` 方法时监听事件的示例。

```ts
const subscription = Scrypt.contractApi.subscribe({
  clazz: Counter, // 合约类
  id: contractId, // 合约ID
  methodNames: ['incrementOnChain']
}, (event: ContractCalledEvent<Counter>) => {
  // 在接收到通知时的回调函数
  console.log(`${event.methodName} is called with args: ${event.args}`)
});
```

:::note
在使用此 API 时，您无需拥有任何自己的后端服务；代码通常在用户的浏览器中运行。由于 API 密钥的暴露存在安全问题。因此，强烈建议仅在受信任用户的演示项目中使用。
:::

#### Webhooks

有一种更安全、更有效的方式来监听合约事件。只需使用我们的 Webhook 服务将事件数据推送到您自己的后端服务。

##### Webhook 管理

首先，在尝试接收任何事件数据之前，您需要在我们的服务中创建一个有效的 Webhook。您可以在我们仪表板的 `webhooks` 页面上管理 Webhooks。

![img](/sCrypt/how-to-integrate-scrypt-service-03.png)

创建有效的 Webhook，您需要提供以下信息：

1. **Webhook URL**

这是您的后端服务指定的 URL，用于接收相关事件数据。

2. **网络**

Webhook 只能接收来自单个网络的事件。它必须是 `testnet` 或 `mainnet` 中的一个。

3. **合约 ID**

Webhook 必须监听特定的[合约 ID](#step-3-get-contract-id)。换句话说，只有在链上调用此合约时，它才会收到通知。

请注意，只有使用我们的 SDK 或服务部署和调用的合约才能被监听。

4. **合约 Artifact**

还需要一个[合约 artifact](../how-to-integrate-a-frontend/how-to-integrate-a-frontend.md#2-load-artifact)来解码链上的调用数据。您通常可以在 sCrypt 项目的 `artifact` 文件夹中找到它。如果合约 ID 是新注册到我们服务中的，则**必需**。如果之前已经注册过，则变为可选。此外，您只能更新您首先注册的 artifact。


除了在仪表板中添加 Webhooks，您还可以**以编程方式**添加它们。

```js

const fs = require('fs').promises;
const util = require('util');

// 读取 JSON 文件的异步函数
async function readArtifactFromFile(filePath) {
  try {
    // 使用 fs.promises.readFile 读取文件并等待结果
    const data = await fs.readFile(filePath, 'utf8');

    // 解析 JSON 数据
    const jsonData = JSON.parse(data);

    // 返回解析后的 JSON 对象
    return jsonData;
  } catch (error) {
    // 处理错误，例如文件未找到
    throw new Error('Error reading JSON file: ' + error.message);
  }
}


async function main() {
  try {
    // 提供您的 JSON artifact 文件路径
    const artifactFilePath = 'path_to_your_json_file.json';

    // 从文件中获取 JSON artifact 数据
    const artifact = await readArtifactFromFile(artifactFilePath);

    const apiKey = '[您的 API 密钥]';
    const webhookUrl = 'https://api.scrypt.io/webhooks/create'; // 用于测试网，请使用 'https://testnet-api.scrypt.io'

    const requestBody = {
      url: 'http://127.0.0.1:3005/api/webhooks/test_notify',
      contractId: {
        txId: "1fa604263d2a16f6292f788e391b83ea7037fb9eb2ed0055ab5802ab2d090ef5",
        outputIndex: 0
      },
      desc: "test webhook",
      artifact: artifact // 在这里使用获取的 artifact 数据
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error('Failed to create webhook');
    }

    const responseData = await response.json();
    console.log(responseData);
  } catch (error) {
    console.error('Error:', error);
  }
}

// 调用 main 函数启动进程
main();

```

##### Webhook 请求和响应

当合约在链上被调用时，我们将通过 HTTP POST 请求将事件数据推送到您的 Webhook URL：

```json
{
	"webhookId": "wh_EyY2zEnogmK9e57Q",
	"createdAt": "2023-07-24T04:00:32.246Z",
	"events": [{
		"eventType": "utxoSpent",
		"spentUtxo": {
			"txId": "966a3fb5d46c673ceaef2a476e828b75a6e6eae28839b36c0ff42cddc7a28f5b",
			"outputIndex": 0
		},
		"contractId": {
			"txId": "966a3fb5d46c673ceaef2a476e828b75a6e6eae28839b36c0ff42cddc7a28f5b",
			"outputIndex": 0
		},
		"spentBy": {
			"txId": "c359669cef68509d8357741e57bdff29f731c28643596d2c49f12dcd633e89f7",
			"inputIndex": 0
		},
		"createdInSpentTxOutputs": [
			0
		],
		"id": "evt_6XnqNUIhoZJ6SaEg5sDGcC",
		"methodName": "vote",
		"args": [{
			"name": "name",
			"type": "bytes",
			"value": "6950686f6e65"
		}]
	}]
}
```

请求详细说明了 `events` 数据：

* `eventType`: 事件的类型名称。目前仅支持 `utxoSpent`。

* `spentUtxo`: 事件中花费的合约指定的utxo。

* `contractId`: 事件所属的合约ID。

* `spentBy`: 事件来自的合约调用交易的指定输入索引。

* `createdInSpentTxOutputs`: 如果是有状态合约，则在花费交易中新生成的合约utxo。

* `id`: 唯一事件ID。

* `methodName`: 事件的合约调用的方法名称。

* `args`: 事件的合约调用的参数列表。

成功确认需要返回 HTTP 状态码 200。在多次投递失败后，我们将自动暂停 Webhook。在我们重新开始向其推送通知之前，您需要在 `webhooks` 页面上手动重新激活它。对于单个事件，可能会向 Webhook 推送多个通知，因此请确保您已处理此情况。

##### Webhook 安全性

为了保护您的 Webhook 请求安全，我们通过使用您自己的 API 密钥对请求数据进行签名，使用 [HMAC-SHA256](https://en.wikipedia.org/wiki/HMAC) 算法添加了一个名为 `x-scrypt-signature` 的签名头。如果需要，您可以验证它。可以使用以下代码生成：

```
const signature = crypto.createHmac('sha256', apiKey).update(JSON.stringify(body)).digest('hex');
```

##### Webhook 限制

每个用户可以创建的 Webhook 数量是有限的。以下是不同计划用户可以创建的 Webhook 数量限制。


| 计划 | 在测试网上的限制    | 在主网上的限制  |
| ------------- | ------------- | ------------- |
| 初学者  | 10 | 10 |
| 专业版 | 100   | 100   |
| 商业版 | 200   | 200   |
| 企业版 | 300   | 300   |