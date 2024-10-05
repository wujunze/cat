---
sidebar_position: 6
---

# 教程 6：投票

## 概述

在本教程中，我们将介绍如何使用 sCrypt 在 Bitcoin 上构建一个全栈投票 dApp，包括智能合约和交互式前端。

![](/sCrypt/voting-01.gif)

在网页上，您可以看到候选人列表。点击点赞按钮将为您选择的候选人投一票。这将提示钱包请求用户批准。在她的批准后，将发送一个调用合约的交易。

首先，我们将逐步编写和部署智能合约。之后，我们将构建一个前端，允许用户投票并与合约互动。

## 智能合约

### 属性

对于每个候选人，我们需要在合约中存储两个属性：她的名字和她迄今为止收到的投票数。

我们定义一个 `ByteString` 的类型别名来表示候选人的名字。

```ts
export type Name = ByteString
```

我们定义一个结构体来表示候选人。

```ts
export type Candidate = {
  name: Name
  votesReceived: bigint
}
```

我们使用 `FixedArray` 来存储候选人列表，我们将其类型别名为 `Candidates`。
由于候选人的投票数可以更新，我们通过设置 `@prop(true)` 将它们标记为[状态属性](../how-to-write-a-contract/stateful-contract.md#stateful-properties)。

```ts
export const N = 2
export type Candidates = FixedArray<Candidate, typeof N>

export class Voting extends SmartContract {
  @prop(true)
  candidates: Candidates
  // ...
}
```

### 构造函数

在构造函数中初始化所有 `@prop` 属性。请注意，我们只需要在参数中传递候选人的名字，因为她们的投票数在开始时都是 0。

```ts
constructor(names: FixedArray<Name, typeof N>) {
  super(...arguments)
  // 初始化固定数组
  this.candidates = fill({
      name: toByteString(''),
      votesReceived: 0n
  }, N)
  // 设置名字并将她们的投票数设置为 0
  for (let i = 0; i < N; i++) {
    this.candidates[i] = { name: names[i], votesReceived: 0n }
  }
}
```

### 方法

与这个合约互动的唯一方式是投票给列表中的一个候选人，所以我们只会有一 **public** 方法 `vote`。它只接受一个参数：你想要投票的候选人的名字。

```ts
@method()
public vote(name: Name) {
  // 1) 改变合约状态：在列表中为 `candidate` 添加一票
  // 2) 传播状态
}
```

我们可以简单地使用一个 `for` 循环来实现这个功能：通过名字在列表中找到相应的候选人，然后将其投票数加一。我们在一个辅助方法 `increaseVotesReceived` 中实现这一点。

```ts
// 为候选人投票
@method()
increaseVotesReceived(name: Name): void {
  for (let i = 0; i < N; i++) {
    if (this.candidates[i].name === name) {
      this.candidates[i].votesReceived++
    }
  }
}
```

在我们增加候选人的投票数并更新合约状态后，我们确保新的状态在交易输出中得到维护 [如通常所做的那样](../how-to-write-a-contract/stateful-contract.md#update-states)。如果需要更改，则添加另一个输出。

```ts
let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)
outputs += this.buildChangeOutput()
assert(this.ctx.hashOutputs === hash256(outputs), 'hashOutputs mismatch')
```

现在，公共函数 `vote` 已经完成。

```ts
@method()
public vote(name: Name) {
  // 改变合约状态：在列表中为 `candidate` 添加一票
  this.increaseVotesReceived(name)

  // 限制交易输出
  // 包含最新的状态和相同的余额
  let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)
  // 当需要时包含更改输出
  outputs += this.buildChangeOutput()

  assert(this.ctx.hashOutputs === hash256(outputs), 'hashOutputs mismatch')
}
```

### 最终代码

你已经完成了 `Voting` 合约！以下是 [最终完整代码](https://github.com/sCrypt-Inc/voting/blob/master/src/contracts/voting.ts)：

```ts
import { assert, ByteString, hash256, method, prop, SmartContract, FixedArray, fill, toByteString } from 'scrypt-ts'

export type Name = ByteString

export type Candidate = {
    name: Name
    votesReceived: bigint
}

export const N = 2

export type Candidates = FixedArray<Candidate, typeof N>

export class Voting extends SmartContract {
    @prop(true)
    candidates: Candidates

    constructor(names: FixedArray<Name, typeof N>) {
        super(...arguments)
        // 初始化固定数组
        this.candidates = fill({
            name: toByteString(''),
            votesReceived: 0n,
        }, N)
        // 设置名字并将她们的投票数设置为 0
        for (let i = 0; i < N; i++) {
            this.candidates[i] = {
                name: names[i],
                votesReceived: 0n,
            }
        }
    }

    /**
     * 为候选人投票
     * @param name 候选人的名字
     */
    @method()
    public vote(name: Name) {
        // 更改合约状态：在列表中为 `candidate` 增加一票
        this.increaseVotesReceived(name)
        // 包含最新的状态和相同的余额的输出
        let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)
        outputs += this.buildChangeOutput()
        assert(this.ctx.hashOutputs === hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    increaseVotesReceived(name: Name): void {
        for (let i = 0; i < N; i++) {
            if (this.candidates[i].name === name) {
                this.candidates[i].votesReceived++
            }
        }
    }
}
```

## 前端

我们将根据 [这个指南](../how-to-integrate-a-frontend/how-to-integrate-a-frontend.md) 为投票智能合约添加前端。

### 设置项目

前端将使用 [Create React App](https://create-react-app.dev/) 创建。

```bash
npx create-react-app voting --template typescript
```

### 安装 sCrypt SDK

sCrypt SDK 使您可以轻松地编译、测试、部署和调用合约。

使用 `scrypt-cli` 命令行安装 SDK。

```bash
cd voting
npx scrypt-cli init
```

此命令将在 `src\contracts\voting.ts` 中创建一个合约文件，并用 [上面](#final-code) 的合约替换文件内容。

### 编译合约

使用以下命令编译合约：

```bash
npx scrypt-cli compile
```

此命令将在 `artifacts\voting.json` 中生成一个合约工件文件。

### 部署合约

在 [安装 sCrypt SDK](#install-the-scrypt-sdk) 之后，您将在项目目录中拥有一个脚本 `deploy.ts`，可以对其进行一些小的修改以部署我们的 `Voting` 合约。

```ts
import { Name, Voting, N } from './src/contracts/voting'
import { bsv, TestWallet, DefaultProvider, toByteString, FixedArray } from 'scrypt-ts'

import * as dotenv from 'dotenv'

// 加载 .env 文件
dotenv.config()

// 从 .env 文件中读取私钥。
// 默认私钥在 .env 文件中用于比特币测试网。
// 参见 https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')

// 准备签名者。
// 参见 https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = new TestWallet(privateKey, new DefaultProvider({
    network: bsv.Networks.testnet
}))

async function main() {
    await Voting.loadArtifact()

    const candidateNames: FixedArray<Name, typeof N> = [
        toByteString('iPhone', true),
        toByteString('Android', true)
    ]

    const instance = new Voting(
        candidateNames
    )

    // 连接一个 signer
    await instance.connect(signer)

    // 部署合约
    const amount = 1
    const deployTx = await instance.deploy(amount)
    console.log('Voting contract deployed: ', deployTx.id)
}

main()
```

在部署合约之前，我们需要创建一个 `.env` 文件，并将您的私钥保存在 `PRIVATE_KEY` 环境变量中。

```
PRIVATE_KEY=xxxxx
```

如果您没有私钥，可以按照 [这个指南](../../how-to-deploy-and-call-a-contract/faucet) 使用 Yours Wallet 生成一个，然后使用我们的 [水龙头](https://scrypt.io/faucet/) 为私钥的地址提供资金。

运行以下命令部署合约。

```bash
npm run deploy:contract
```

成功后，您将看到类似于以下内容的输出：

![](/sCrypt/voting-02.png)

#### 合约 ID

您可以获取已部署合约的 ID：TXID 和合约所在输出索引。

```js
const contract_id = {
  /** 部署交易的 ID */
  txId: "6751b645e1579e8e6201e3c59b900ad58e59868aa5e4ee89359d3f8ca1d66c8a",
  /** 合约所在输出索引 */
  outputIndex: 0,
};
```

### 验证合约

成功部署智能合约后，您可以验证已部署合约的脚本：

```sh
npm run verify:contract
```

执行后，指定的合约代码将在 sCrypt 的服务器上进行验证。如果成功，结果将 [在 WoC 上显示](https://test.whatsonchain.com/script/cecb4f8799913df3e5af50bc81a24e3fef3216a92452d27cd97dcd7ccbce1f1b)，在 "sCrypt" 标签下。有关更多详细信息，请参见 ["如何验证合约"](../how-to-verify-a-contract.md) 页面。

### 加载合约工件

在编写前端代码之前，我们需要在 `src\index.tsx` 中加载合约工件。

```ts
import { Voting } from './contracts/voting';
import artifact from '../artifacts/voting.json';
Voting.loadArtifact(artifact);
```

### 集成钱包

使用 `signer` 的 `requestAuth` 方法请求访问钱包。

```ts
// 请求认证
const { isAuthenticated, error } = await signer.requestAuth();
if (!isAuthenticated) {
    // 出错了，抛出一个带有 `error` 消息的 Error
    throw new Error(error);
}

// 认证成功
// ...
```

### 集成 sCrypt 服务

为了与投票合约互动，我们需要创建一个合约实例，表示链上合约的最新状态。当 Alice 和 Bob 在网页上投票时，我们需要确保它们的合约实例始终是最新的。在 Alice 投票后，我们必须通知 Bob 合约的状态已更改，并将其本地合约实例同步到链上的最新状态。

幸运的是，`sCrypt` 提供了这样的基础设施服务，它抽象了与区块链通信的所有常见复杂性，因此我们不必跟踪合约状态，这可能需要大量的计算，因为区块链在增长。我们可以专注于我们应用程序的业务逻辑。

要使用它，我们首先必须根据 [这个指南](../advanced/how-to-integrate-scrypt-service.md) 进行初始化。

```ts
Scrypt.init({
  apiKey: 'YOUR_API_KEY',
  network: bsv.Networks.testnet
})
```

### 将 signer 连接到 `ScryptProvider`

使用 sCrypt 服务时，必须将 signer 连接到 `ScryptProvider`。

```ts
const provider = new ScryptProvider();
const signer = new PandaSigner(provider);

signerRef.current = signer;
```

### 获取最新合约实例

我们可以通过调用 `Scrypt.contractApi.getLatestInstance()` 使用其 [合约 ID](#contract-id) 来获取合约的最新实例。使用此实例，我们可以轻松读取合约的属性以在网页上向用户显示，或通过调用其公共方法来更新合约状态，如 [之前](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-call) 当用户为候选人投票时。

```ts
function App() {
  const [votingContract, setContract] = useState<Voting>();
  const [error, setError] = React.useState("");

  // ...

  async function fetchContract() {
    try {
      const instance = await Scrypt.contractApi.getLatestInstance(
        Voting,
        contract_id
      );
      setContract(instance);
    } catch (error: any) {
      console.error("fetchContract error: ", error);
      setError(error.message);
    }
  }

  // ...
}
```

### 读取合约状态

使用合约实例，我们可以读取其最新状态并渲染它。

```ts
function byteString2utf8(b: ByteString) {
  return Buffer.from(b, "hex").toString("utf8");
}

function App() {
  // ...

  return (
    <div className="App">
      <header className="App-header">
        <h2>What's your favorite phone?</h2>
      </header>
      <TableContainer
        component={Paper}
        variant="outlined"
        style={{ width: 1200, height: "80vh", margin: "auto" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Iphone</TableCell>
              <TableCell align="center">Android</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center">
                <Box>
                  <Box
                    sx={{
                      height: 200,
                    }}
                    component="img"
                    alt={"iphone"}
                    src={`${process.env.PUBLIC_URL}/${"iphone"}.png`}
                  />
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box>
                  <Box
                    sx={{
                      height: 200,
                    }}
                    component="img"
                    alt={"android"}
                    src={`${process.env.PUBLIC_URL}/${"android"}.png`}
                  />
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center">
                <Box>
                  <Typography variant={"h1"} >
                    {votingContract?.candidates[0].votesReceived.toString()}
                  </Typography>
                  <Button
                    variant="text"
                    onClick={voting}
                    name={votingContract?.candidates[0].name}
                  >
                    👍
                  </Button>
                </Box>
              </TableCell>

              <TableCell align="center">
              <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant={"h1"}>
                    {votingContract?.candidates[1].votesReceived.toString()}
                  </Typography>
                  <Button
                    variant="text"
                    onClick={voting}
                    name={votingContract?.candidates[1].name}
                  >
                    👍
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Footer />
      <Snackbar
        open={error !== ""}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      <Snackbar
        open={success.candidate !== "" && success.txId !== ""}
        autoHideDuration={6000}
        onClose={handleSuccessClose}
      >
        <Alert severity="success">
          {" "}
          <Link
            href={`https://test.whatsonchain.com/tx/${success.txId}`}
            target="_blank"
            rel="noreferrer"
          >
            {`"${byteString2utf8(success.candidate)}" got one vote,  tx: ${
              success.txId
            }`}
          </Link>
        </Alert>
      </Snackbar>
    </div>
  );
}
```

### 更新合约状态

要更新合约的状态，我们需要调用其公共方法。我们创建一个函数 `voting()` 来处理用户触发的投票事件。

调用合约公共方法与 [之前](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-call) 相同。

```ts
async function voting(e: any) {
  // ...

  const signer = signerRef.current as PandaSigner;

  if (votingContract && signer) {
    const { isAuthenticated, error } = await signer.requestAuth();
    if (!isAuthenticated) {
      throw new Error(error);
    }

    await votingContract.connect(signer);

    // 从当前合约创建下一个实例
    const nextInstance = votingContract.next();

    const candidateName = e.target.name;

    // 更新状态
    nextInstance.increaseVotesReceived(candidateName);

    // 调用当前实例的方法以在链上应用更新
    votingContract.methods
      .vote(candidateName, {
        next: {
          instance: nextInstance,
          balance: votingContract.balance,
        },
      })
      .then((result) => {
        console.log(`Voting call tx: ${result.tx.id}`);
      })
      .catch((e) => {
        setError(e.message);
        fetchContract();
        console.error("call error: ", e);
      });
  }
}
```

如果成功，您将在 `console` 中看到以下日志：

```
Voting call tx: fc8b3d03b8fa7469d66a165b017fe941fa8ab59c0979457cef2b6415d659e3f7
```

### 订阅合约事件

到目前为止，我们有一个完全工作的应用程序。然而，有一个小问题。当 Alice 在她的浏览器中单击某个候选人的点赞按钮时，Bob 的浏览器中该候选人的点赞数不会增加，除非他手动刷新。
我们需要一种方法来监听合约事件。

我们调用 `Scrypt.contractApi.subscribe(options: SubscribeOptions<T>, cb: (e: ContractCalledEvent<T>) => void): SubScription` 来订阅合约被调用的事件。当合约被调用和更新时，我们实时刷新 UI，重新渲染页面上的所有内容并显示更新的点赞数。

订阅函数接受 2 个参数：

1. `options: SubscribeOptions<T>`: 它包括一个合约类、一个合约 ID 和一个可选的方法名列表。

```ts
interface SubscribeOptions<T> {
  clazz: new (...args: any) => T;
  id: ContractId;
  methodNames?: Array<string>;
}
```

如果设置了 `methodNames`，您只会收到列表中公共函数被调用时的通知。否则，当任何公共函数被调用时，您都会收到通知。

2. `callback: (event: ContractCalledEvent<T>) => void`: 接收通知时的回调函数。

`ContractCalledEvent<T>` 包含合约被调用时的相关信息，例如公共函数名称和调用时传递的参数。

```ts
export interface ContractCalledEvent<T> {
  /** 公共函数的名称 */
  methodName: string;
  /** 公共函数参数 */
  args: SupportedParamType[];
  /** 合约被调用的交易 */
  tx: bsv.Transaction;
  /**
   * 如果调用的是有状态合约，`nexts` 包含由该调用生成的新状态的合约实例。
   * 如果调用的是无状态合约，`nexts` 为空。
   */
  nexts: Array<T>;
}
```

订阅合约事件的代码如下。

```ts
useEffect(() => {
  const provider = new ScryptProvider();
  const signer = new PandaSigner(provider);

  signerRef.current = signer;

  fetchContract();

  // 通过合约 ID 订阅
  const subscription = Scrypt.contractApi.subscribe({
    clazz: Voting,
    id: contract_id
  }, (event: ContractCalledEvent<Voting>) => {
    // 更新合约实例
    setSuccess({
      txId: event.tx.id,
      candidate: event.args[0] as ByteString,
    });
    setContract(event.nexts[0]);
  });

  return () => {
    // 取消订阅
    subscription.unsubscribe();
  };
}, []);
```

### 部署到 GitHub Pages

将前端项目推送到您的 GitHub 帐户后，可以轻松[使用 GitHub Pages 发布网站](https://create-react-app.dev/docs/deployment/#github-pages)，这样用户就可以使用浏览器与您的 dApp 进行交互。

#### 第一步。在 `package.json` 中添加 `homepage`

打开您的 `package.json` 并为您项目添加一个 `homepage` 字段。

```json
{
  "name": "voting",
  "homepage": "https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO-NAME"
  ...
}
```

![](/sCrypt/voting-03.png)

例如，我们的演示仓库是 https://github.com/sCrypt-Inc/voting，所以我们将

```
https://sCrypt-Inc.github.io/voting
```

作为我们的主页，其中 `sCrypt-Inc` 是我们的 GitHub 用户名，`voting` 是仓库名称。

#### 第二步。安装 `gh-pages` 并添加 `scripts` 到 `package.json`

运行以下命令来安装依赖项。

```sh
npm install --save gh-pages
```

然后添加两个脚本到 `package.json`。

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build",
  ...
},
```

![](/sCrypt/voting-04.png)

:::note
`predeploy` 脚本将在运行 `deploy` 之前自动运行。
:::

#### 第三步。部署网站

运行以下命令来部署网站。

```sh
npm run deploy
```

#### 第四步。更新 GitHub 项目设置

运行 `deploy` 脚本后，不要忘记更新您的 GitHub 项目设置以使用 `gh-pages` 分支。转到 `Settings --> Code and automation/Pages`，并将 GitHub Pages 站点使用的分支设置为 `gh-pages`。

![](/sCrypt/voting-05.png)

### 结论

恭喜！您已经成功完成了一个全栈投票 dApp，完全在比特币上。

该仓库是 [这里](https://github.com/sCrypt-Inc/voting)。在线示例是 [这里](http://classic.scrypt.io/voting)。


## 使用 Webhook 在服务器端

Webhooks 也是服务器端使用的一种可行选项，并且可以提供一种替代使用 websockets 在客户端监听智能合约更新的方法。

### 使用 Webhook 的优势

Webhooks 比 websockets 有几个优势，特别是对于服务器端应用程序。它们更高效，使用无状态的 HTTP 请求而不是维护持久连接，从而减少服务器负载。这使得它们更容易扩展和与现有的 Web 基础设施集成。Webhooks 在数据处理方面也更高效，因为它们仅在特定事件发生时传输信息。当订阅 sCrypt 合约事件时，一个显著的优势是不需要在客户端存储 API 密钥或敏感信息。

然而，一个显著的缺点是需要一个面向公众的服务器，增加了复杂性和安全考虑。您应该使用 webhooks 还是 websockets 取决于您的应用程序需求。

### 设置 Webhook 服务器

Webhooks 涉及设置一个服务器，每当发生某些事件时接收 HTTP 请求（例如用户投票）。让我们设置一个简单的 Express 服务器来监听这些 webhook 事件。

```ts
const express = require("express");
const app = express();
const port = process.env.port || 3000;

app.use(express.json())

app.post("/webhook", (req, res) => {
  console.log("Received a webhook");
  console.log(req.body);
  res.status(200).send("OK");
});

app.listen(port, () => {
    console.log(`Webhook server is listening on port ${port}`);
});
```

### 订阅合约事件

在服务器启动并运行后，有必要在服务中创建一个 webhook，以尝试获取任何事件信息。Webhooks 可以在我们的仪表板上的 `webhooks` 部分进行配置和维护。

![](/sCrypt/voting-06.png)

更多信息，请参阅 [主 webhook 文档](https://docs.scrypt.io/advanced/how-to-integrate-scrypt-service#webhooks)。

### 处理 webhook 事件

一旦您的 webhook 服务器收到 POST 请求，它可以按照应用程序的要求进行处理。在我们的投票 dApp 中，我们可以每次投票时更新合约实例。

```ts
app.post("/webhook", (req, res) => {
  console.log("Received a webhook event");

  const events = req.body.events;

  if (events && events.length > 0) {
    const utxoSpentEvent = events.find(
        (event) => event.eventType === 'utxoSpent'
    )

    if (utxoSpentEvent && utxoSpentEvent.spentBy) {
        // 从请求负载中解析出方法调用的交易ID。
        const txId = utxoSpentEvent.spentBy.txId

        // 使用提供者检索完整序列化的交易。
        const provider = new DefaultProvider({
            network: bsv.Networks.testnet,
        })
        await provider.connect()
        const tx = await provider.getTransaction(txId)

        // 从序列化的交易中重建最新的合约实例。
        latestInstance = Voting.fromTx(tx, 0)

        res.status(200).send("Webhook processed");
    }
  }
});
```

### 向客户端提供最新数据
由于我们的服务器现在总是有最新的合约实例，它可以向客户端提供有关它的信息。让我们添加一个 GET 端点，为我们的客户端提供最新的投票信息：

```ts
app.get("/votes/:index", (req, res) => {
  const { index } = req.params;

  // 将索引转换为整数并检查它是否是一个有效的数组索引
  const arrayIndex = parseInt(index, 10);
  if (isNaN(arrayIndex) || arrayIndex < 0 || arrayIndex >= items.length) {
    return res.status(404).send("Item not found");
  }

  // 从最新的合约实例中检索候选者。
  const candidate = latestInstance.candidates[arrayIndex];

  // 将投票数作为响应发送
  res.status(200).json(candidates.votesReceived);
});
```

现在，客户端可以简单地查询我们的服务器以获取最新的投票统计信息：

```ts
async function fetchVotes(candidateIdx: number) {
  try {
    const response = await fetch(`${serverURL}/votes/${candidateIndex}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const votesReceived = parseInt(text, 10);

    console.log(votesReceived)

    // ...

  } catch (e) {
    setError(e.message);
    setItem(null);
  }
}
```

### 结论

当使用 webhooks 时，您在响应来自 sCrypt 服务的 HTTP 请求时处理合约事件。这样，您可以立即处理相关更新并在您的 dApp 中反映这些更改，而无需客户端维护持久连接，并且是处理事件的绝佳替代方案。
