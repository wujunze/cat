# 概述

sCrypt 是一种基于 TypeScript 的[嵌入式领域特定语言（eDSL）](https://zh.wikipedia.org/wiki/%E9%A2%86%E5%9F%9F%E7%89%B9%E5%AE%9A%E8%AF%AD%E8%A8%80)，用于在比特币上编写智能合约。嵌入式意味着它是存在于另一种语言中的语言。sCrypt 严格来说是 TypeScript 的一个子集，因此所有的 sCrypt 代码都是有效的 TypeScript，但反之不然。

我们选择 [TypeScript](https://www.typescriptlang.org/) 作为宿主语言，因为它提供了一种熟悉的语言（JavaScript），但具有类型安全性，使得编写安全的智能合约变得容易。如果您是 TypeScript 新手，请查看这个有用的[介绍视频](https://www.youtube.com/watch?v=ahCwqrYpIuM)。

## 比特币智能合约是如何工作的？

比特币上的智能合约基于 UTXO 模型，这与以太坊等使用的账户模型非常不同。

### 比特币交易

每个比特币交易都由一些输入和输出组成。一个比特币可以细分为 100,000,000 个聪（satoshi），类似于一美元可以细分为 100 美分或便士。

一个输出包含：

- 它包含的比特币数量（聪）。
- 字节码（`锁定脚本`）。

而一个输入包含：

- 对前一个交易输出的引用。
- 字节码（`解锁脚本`）。

### UTXO 模型

未花费交易输出（Unspent Transaction Output，UTXO）是指尚未在任何交易中被消耗的输出。底层的字节码/操作码称为比特币脚本（[Bitcoin Script](https://wiki.bitcoinsv.io/index.php/Script)），由[比特币虚拟机](https://xiaohuiliu.medium.com/introduction-to-bitcoin-smart-contracts-9c0ea37dc757)（BVM）解释执行。

![UTXO 模型示意图](/sCrypt/overview-01.png)

在上面的示例中，我们有两个交易，每个都有一个输入（绿色）和一个输出（红色）。右边的交易花费了左边的交易。锁定脚本可以被视为一个布尔函数 `f`，它指定了花费 UTXO 中比特币的条件，起到了锁的作用（因此称为“锁定”）。解锁脚本则提供了使 `f` 计算为真（`true`）的函数参数，即用于解锁的“钥匙”（也称为见证）。只有当输入中的“钥匙”匹配之前输出的“锁”时，才能花费输出中包含的比特币。

在支付到[比特币地址](https://wiki.bitcoinsv.io/index.php/Bitcoin_address)的常规比特币交易中，锁定脚本是“支付到公钥哈希”（[Pay To Pubkey Hash，P2PKH](https://learnmeabitcoin.com/technical/p2pkh)）。它检查花费者是否拥有对应于该地址的正确私钥，从而能够在解锁脚本中产生有效的签名。富有表达力的脚本（Script）使得锁定脚本可以指定比简单的 P2PKH 更复杂的花费条件，即比特币智能合约。

## `sCrypt` 是如何工作的？

`sCrypt` 是一种高级语言，编译成[比特币脚本](https://wiki.bitcoinsv.io/index.php/Script)。生成的类似汇编的脚本可以在构建交易时用作锁定脚本。

:::warning `注意`
目前，sCrypt 在比特币 SV 上完全可用。对其他链（如比特币）的完整支持正在进行中。
:::

## 学习 `sCrypt`

跳转到[安装部分](./installation)，学习如何创建一个 sCrypt 项目。

:::tip `提示`
您也可以关注这个 [Youtube 系列](https://www.youtube.com/playlist?list=PL0Kn1t30VSpGcbwN-bcbU1-x0fRAoq-GI)。
:::
