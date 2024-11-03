# 如何挖矿

要挖掘 Fractal Bitcoin，您需要具备相关专业知识、专业设备和挖矿软件。我们建议在开始之前确保您已具备必要的技术知识和工具。

## 了解挖矿过程

挖矿涉及解决复杂的数学问题以验证区块链上的交易。但仅运行节点并不足以成功挖矿。以下是基本说明：

* **运行节点 ≠ 挖矿**：运行节点允许您参与网络，但不能进行区块挖矿
* 您可以使用传统程序如 CPU 矿工或 GPU 矿工连接节点并开始挖矿。但这些程序通常只在低难度时有效；在正常难度下，挖矿几乎不可能
* **专业挖矿硬件**：最有效的挖矿方法是使用 ASIC 矿机连接到矿池。矿池从节点获取工作任务 -> 分配给矿工 -> 矿工提交工作到矿池 -> 矿池将有效工作发送到节点。最后，矿池根据矿工的贡献分配挖矿奖励

## 如何挖掘 Fractal Bitcoin？

按照以下步骤开始挖矿：

1️⃣ 设置 Fractal Bitcoin 节点并更新 `bitcoin.conf` 文件：

```conf
rpcport=8332
rpcuser=fractal
rpcpassword=fractal_1234567
```

2️⃣ 使用 UniSat 钱包生成比特币地址（例如：`bc1qrcxxxxxxxxxxxxxxxxxxxxn772gm`）

3️⃣ 使用各种挖矿程序开始挖矿，Fractal 的挖矿算法是 SHA256d。以下是使用 cpuminer 的示例：

```bash
./miner -o http://172.0.0.1:10332 -u fractal -p fractal_1234567 --coinbase-addr=bc1qrcxxxxxxxxxxxxxxxxxxxxn772gm -a sha256d -t 1 --no-longpoll
```

> **注意**：由于难度较高，使用这种设置直接挖矿不太可能成功。加入矿池是进行有效挖矿的必要选择。

## 什么是矿池？它是如何工作的？

矿池是一个矿工网络，矿工们组合他们的算力来挖掘资产。您将客户端连接到矿池，矿池根据其标准分配工作给您，您根据矿机提交给矿池的工作获得报酬。

## 如何在矿池中开始 Fractal 挖矿？

通常，矿池软件只需要配置节点 RPC 的 IP 和端口、授权账号和密码，以及接收资产的地址。让我们以 ViaBTC 矿池软件为例：

对于**合并挖矿**，节点提供 `createauxblock` 和 `submitauxblock` RPC 用于合并挖矿，但不支持旧的 `getauxblock` RPC。集成机制与连接域名币相同，`ChainID` 设置为 `0x2024`。软件配置如下：

```json
    "main_coin": {
        "name": "BTC",
        "host": "192.168.1.10",
        "port": 8332,
        "user": "btc",
        "pass": "btc_xxxxxx"
    },
    "aux_coin": [
        {
            "name": "FB",
            "host": "192.168.1.11",
            "port": 8332,
            "user": "fractal",
            "pass": "fractal_1234567",
            "address": "bc1q1wxxxxxxxxxxxxx9mukymc"
        }
    ],
    "aux_merkle_nonce": 0,
    "aux_merkle_size": 16,
    "aux_job_timeout": 10,
```

对于**无许可挖矿**，配置如下：

```json
"main_coin": {
    "name": "FB",
    "host": "192.168.1.11",
    "port": 8332,
    "user": "fractal",
    "pass": "fractal_1234567"
},
"aux_coin": [
],
```

## 资源

* **节点软件**：可从 FractalBitcoin GitHub 仓库下载最新版本，当前版本为 0.2.1
* **区块浏览器**：
  * Fractal Mempool 浏览器
  * Fractal Bitcoin 浏览器
