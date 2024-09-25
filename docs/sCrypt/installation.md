# 安装指南

## 先决条件

1. Node.js：请在您的机器上安装 `Node.js`（要求版本 `>=16`）和 `NPM`，按照[此处](https://nodejs.org/en/download)的说明进行安装。
2. Git：安装 [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)。

:::warning `注意`
在带有 Apple M1/M2 芯片的 Mac 电脑上，确保已安装 Rosetta。如果未安装，可以使用以下命令进行安装：
:::

```bash
softwareupdate --install-rosetta --agree-to-license
```

## sCrypt CLI 工具

[sCrypt CLI](https://github.com/sCrypt-Inc/scrypt-cli) 工具用于轻松创建、编译和发布 `sCrypt` 项目。该 CLI 提供了最佳实践的项目结构，包括依赖项，如 sCrypt、测试框架（[Mocha](https://prettier.io/)）、代码自动格式化（[Prettier](https://prettier.io/)）、代码检查（[ESLint](https://eslint.org/)）等。

您可以直接使用 `npx` 运行 CLI 工具，并通过创建一个示例项目来试用：

```bash
npx scrypt-cli project demo
```

或者在您的机器上全局安装它：

```bash
npm install -g scrypt-cli
```

:::tip `提示`

您也可以在 [Repl.it 上 fork 演示合约](https://replit.com/@msinkec/scryptTS-demo)，并在浏览器中尝试代码。
:::
