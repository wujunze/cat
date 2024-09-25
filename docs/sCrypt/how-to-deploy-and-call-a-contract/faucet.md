---
sidebar_position: 4
---

# 水龙头

强烈建议在通过本地测试后，在 [testnet](https://test.whatsonchain.com/) 上测试你的合约。这确保了合约可以在区块链上成功部署和调用。

在部署和调用合约之前，你需要一个有资金的地址：

1. 创建一个新项目。如果你已经创建了一个项目，请跳过此步骤：

```sh
npx scrypt-cli project demo
cd demo
```

2. 使用以下命令从项目的根目录生成一个私钥：

```sh
npm install
npm run genprivkey
```

该命令生成一个私钥并将其存储在项目的根目录中的 `.env` 文件中。它还输出与私钥对应的 [比特币地址](https://wiki.bitcoinsv.io/index.php/Bitcoin_address)。

3. 使用 [水龙头](https://scrypt.io/faucet) 为私钥的地址提供一些测试币。

![faucet](/sCrypt/faucet-01.gif)

## 使用 Yours Wallet

2024年3月，Panda Wallet 更名为 [Yours Wallet](https://github.com/yours-org/yours-wallet/)。

如果你已经安装了 [Yours Wallet](https://chromewebstore.google.com/detail/panda-wallet/mlbnicldlpdimbjdcncnklfempedeipj)，你可以轻松地使用以下方法使用测试网私钥：
![img](/sCrypt/faucet-02.gif)

### 使用 Sensilet 钱包

或者，如果你已经安装了 [Sensilet](https://sensilet.com/)，你可以按照以下方法提取并使用测试网私钥。

![img](/sCrypt/faucet-03.gif)
