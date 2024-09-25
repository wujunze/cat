---
sidebar_position: 8
---

# 如何与前端集成

本节将展示如何将您的智能合约集成到前端，以便用户可以与之交互。
我们假设您已经具备前端开发的基础知识，因此我们将不会花费太多时间介绍这部分代码，而是主要关注如何在前端项目中与智能合约进行交互。

## 创建项目

使用 React、Next、Vue、Angular 或 Svelte 创建您的项目。

### React

运行以下命令来创建一个名为 `helloworld` 的 [React](https://react.dev/) 项目。

```bash
npx create-react-app helloworld --template typescript
```

![img](/sCrypt/how-to-integrate-a-frontend-01.png)

我们将在 `src` 目录下进行大部分工作。

### Next.js

运行以下命令来创建一个 [Next.js](https://nextjs.org/) 项目。

```bash
npx create-next-app helloworld --typescript --use-npm
```

![img](/sCrypt/how-to-integrate-a-frontend-02.png)

### Vue.js

#### Vite

运行以下命令来创建一个 [Vue](https://vuejs.org/) 3.x 项目，并使用 [Vite](https://vitejs.dev/) 打包。

```bash
npm create vue@3
```

![img](/sCrypt/how-to-integrate-a-frontend-03.png)

如果想要使用 Vue 2.x，运行以下命令来初始化项目结构。

```bash
npm create vue@2
```

![img](/sCrypt/how-to-integrate-a-frontend-04.png)

#### Webpack

运行以下命令来创建一个 [Vue](https://vuejs.org/) 项目，并使用 [Webpack](https://webpack.js.org/) 打包。

```bash
npx @vue/cli create helloworld
```

:::tip `提示`
Vue 3.x 和 2.x 都支持使用 Webpack 打包。
:::

在设置项目时，选择 `Manually select features` 并启用 TypeScript。

![img](/sCrypt/how-to-integrate-a-frontend-05.png)

![img](/sCrypt/how-to-integrate-a-frontend-06.png)

### Angular

运行以下命令来创建一个 [Angular](https://angular.io/) 项目。

```bash
npx @angular/cli new helloworld
```

![img](/sCrypt/how-to-integrate-a-frontend-07.png)

### Svelte

运行以下命令来创建一个 [Svelte](https://svelte.dev/) 项目。

```bash
npm create svelte@latest helloworld
```

![img](/sCrypt/how-to-integrate-a-frontend-08.png)

:::tip `提示`
目前，我们支持的前端框架有 [React](https://react.dev)、[Next.js](https://nextjs.org/)、[Vue](https://vuejs.org/)、[Angular](https://angular.io/) 和 [Svelte](https://svelte.dev/)。我们计划在未来添加对其他框架的支持。
:::

## 安装 sCrypt CLI

运行 [CLI](../installation#the-scrypt-cli-tool) 的 `init` 命令，将 `sCrypt` 支持添加到您的项目中。

```bash
cd helloworld
npx scrypt-cli init
```

此命令安装依赖项并配置合约开发环境。
完成此操作后，我们就可以开始编写合约了！

## 加载合约

在通过前端与智能合约交互之前，我们需要分两步加载合约类。

我们首先看看如何生成自己的工件。

### 1. 编译合约

在开始之前，您需要获取合约源文件，作为前端开发人员。

让我们以 [Helloworld 合约](https://docs.scrypt.io/tutorials/hello-world.md) 为例。将 `helloworld.ts` 复制并粘贴到 `src/contracts` 目录中。

![img](/sCrypt/how-to-integrate-a-frontend-09.png)

运行以下命令来编译合约。

```bash
npx scrypt-cli compile
```

![img](/sCrypt/how-to-integrate-a-frontend-10.png)

编译完成后，您将在 `artifacts/helloworld.json` 中获得一个 JSON 工件文件。

![img](/sCrypt/how-to-integrate-a-frontend-11.png)

### 2. 加载工件

现在，您可以直接在 `index.tsx` 文件中加载工件文件。

```ts
import { Helloworld } from './contracts/helloworld';
import artifact from '../artifacts/helloworld.json';
Helloworld.loadArtifact(artifact);
```

现在，您可以像以前一样从合约类创建一个实例。

```ts
const message = toByteString('hello world', true)
const instance = new Helloworld(sha256(message))
```

:::tip `提示`
您不能在前端简单地调用 `Helloworld.compile()`，因为它只在 NodeJS 中有效，而不在浏览器中有效。
:::

## 集成钱包

您将把 [Yours Wallet](https://chromewebstore.google.com/detail/panda-wallet/mlbnicldlpdimbjdcncnklfempedeipj)，一个浏览器扩展钱包，类似于 [MetaMask](https://metamask.io/)，集成到项目中。

:::tip `提示`
您可以参考此 [指南](https://docs.scrypt.io/advanced/how-to-add-a-signer.md) 来添加对其他钱包的支持。
:::

要请求访问钱包，您可以使用它的 `requestAuth` 方法。

```ts
const provider = new DefaultProvider({
    network: bsv.Networks.testnet
});

const signer = new PandaSigner(provider);

// 请求认证
const { isAuthenticated, error } = await signer.requestAuth();
if (!isAuthenticated) {
    // 出错了，抛出一个带有 `error` 消息的 Error
    throw new Error(error);
}

// 认证
// 你可以显示用户的默认地址
const userAddress = await signer.getDefaultAddress();
// ...
```

现在，你可以像以前一样将钱包连接到合约实例。

```ts
await instance.connect(signer);
```

之后，你可以像以前一样从前端与合约进行交互。

[This repo](https://github.com/sCrypt-Inc/counter-demos) 包含一个计数器示例，集成了所有支持的框架。

前往 [sCrypt 学院](https://academy.scrypt.io) 查看如何在链上构建井字游戏的分步指南。
