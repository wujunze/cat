---
sidebar_position: 4
---

# 教程 4: 井字游戏

## 概述
在本教程中，我们将介绍如何使用 sCrypt 在比特币上构建一个井字游戏智能合约。

它初始化为两个玩家（Alice 和 Bob 分别）的比特币公钥。他们各自下注相同的金额，并将其锁定到合约中。获胜者将获得合约中所有比特币的锁定金额。如果没有获胜者并且有平局，两个玩家可以各自提取一半的资金。

## 合约属性

使用 `@prop` 装饰器标记任何打算存储在链上的属性。这个装饰器接受一个布尔参数。默认情况下，它设置为 `false`，这意味着在合约部署后无法更改属性。如果设置为 `true`，属性是一个所谓的 [stateful](../how-to-write-a-contract/stateful-contract.md) 属性，并且可以在后续合约调用中更新其值。

井字游戏合约支持两个玩家，并且需要保存他们的公钥。它包含以下合约属性：

- 两个无状态属性 `alice` 和 `bob`，两者都是 `PubKey` 类型。
- 两个状态属性：
    * `is_alice_turn`: 一个 `boolean`。它表示是否是 Alice 的回合。
    * `board`: 一个固定大小的数组 `FixedArray<bigint, 9>`，大小为 `9`。它表示棋盘上每个方格的状态。
- 三个常量：
    * `EMPTY`, `bigint` 类型, `0n` 值. 表示棋盘上某个方格为空。
    * `ALICE`, `bigint` 类型, `1n` 值. Alice 在某个方格上放置符号 `X`。
    * `BOB`, `bigint` 类型, `2n` 值. Bob 在某个方格上放置符号 `O`。

```ts
@prop()
alice: PubKey; // Alice 的公钥
@prop()
bob: PubKey; // Bob 的公钥

@prop(true)
is_alice_turn: boolean; // 状态属性, 表示是否是 Alice 的回合.

@prop(true)
board: FixedArray<bigint, 9>; // 状态属性, 表示棋盘上每个方格的状态.

@prop()
static readonly EMPTY: bigint = 0n; // 静态属性, 表示棋盘上某个方格为空.
@prop()
static readonly ALICE: bigint = 1n; // 静态属性, 表示 Alice 在某个方格上放置符号 `X`.
@prop()
static readonly BOB: bigint = 2n; // 静态属性, 表示 Bob 在某个方格上放置符号 `O`.
```

## 构造函数

在构造函数中初始化所有非静态属性。具体来说，棋盘最初是空的。

```ts
constructor(alice: PubKey, bob: PubKey) {
    super(...arguments);
    this.alice = alice;
    this.bob = bob;
    this.is_alice_turn = true;
    this.board = fill(TicTacToe.EMPTY, 9);
}
```

## 公共方法

一个公共的 `@method` 可以从外部事务中调用。如果它在 `assert()` 中没有违反任何条件，调用就会成功。

`TicTacToe` 合约有一个公共的 `@method` 叫做 `move()`，它有两个参数：

```ts
/**
 * 通过调用 move() 来玩游戏
 * @param n 要放置符号的方格
 * @param sig 一个玩家的签名
 */
@method()
public move(n: bigint, sig: Sig) {
    assert(n >= 0n && n < 9n);
}
```

Alice 和 Bob 各自在包含合约 `TicTacToe` 的 UTXO 中锁定 X 个比特币。接下来，他们交替调用 `move()` 来玩游戏。

### 签名验证

一旦游戏合约被部署，任何人都可以查看和潜在地与之交互。我们需要一个认证机制，以确保只有想要的玩家才能在轮到他们时更新合约。这通过数字签名实现。

`this.checkSig()` 用于验证签名。使用它来验证 `sig` 参数，以检查是否是正确的玩家在 `move()` 中调用。

```ts
// 检查签名 `sig`
let player: PubKey = this.is_alice_turn ? this.alice : this.bob;
assert(this.checkSig(sig, player), `checkSig failed, pubkey: ${player}`);
```

## 非公共方法

没有 `public` 修饰符，一个 `@method` 是内部的，不能直接从外部事务中调用。

`TicTacToe` 合约有两个 **非公共** 方法：

- `won()` : 遍历 `lines` 数组，检查是否有一个玩家赢了游戏。返回 `boolean` 类型。
- `full()` : 遍历棋盘上的所有方格，检查是否所有方格都有符号。返回 `boolean` 类型。


```ts
@method()
won(play: bigint) : boolean {
    let lines: FixedArray<FixedArray<bigint, 3>, 8> = [
        [0n, 1n, 2n],
        [3n, 4n, 5n],
        [6n, 7n, 8n],
        [0n, 3n, 6n],
        [1n, 4n, 7n],
        [2n, 5n, 8n],
        [0n, 4n, 8n],
        [2n, 4n, 6n]
    ];

    let anyLine = false;

    for (let i = 0; i < 8; i++) {
        let line = true;
        for (let j = 0; j < 3; j++) {
            line = line && this.board[Number(lines[i][j])] === play;
        }

        anyLine = anyLine || line;
    }

    return anyLine;
}

@method()
full() : boolean {
    let full = true;
    for (let i = 0; i < 9; i++) {
        full = full && this.board[i] !== TicTacToe.EMPTY;
    }
    return full;
}
```

## 维护游戏状态

我们可以在公共 `@method` `move()` 中直接访问 [ScriptContext](../how-to-write-a-contract/scriptcontext.md) 通过 `this.ctx` 来维护游戏状态。这可以被认为是公共方法在调用时除了其函数参数之外的额外信息。

合约维护状态包括以下三个步骤：

### 第一步

在公共 `@method` 中更新状态属性。

一个玩家调用 `move()` 在棋盘上放置符号。我们应该在 `move()` `@method` 中更新状态属性 `board` 和 `is_alice_turn`：

```ts
assert(this.board[Number(n)] === TicTacToe.EMPTY, `board at position ${n} is not empty: ${this.board[Number(n)]}`);
let play = this.is_alice_turn ? TicTacToe.ALICE : TicTacToe.BOB;
// 更新状态属性以完成移动
this.board[Number(n)] = play;   // Number() 将 bigint 转换为 number
this.is_alice_turn = !this.is_alice_turn;
```

### 第二步

当您准备好将新状态传递到当前交易中的输出时，只需调用内置函数 `this.buildStateOutput()` 来创建一个包含新状态的输出。它接受一个输入：输出的 satoshis 数量。我们在示例中保持 satoshis 不变。

```ts
let output = this.buildStateOutput(this.ctx.utxo.value);
```



#### 在公共 `@method` 中构建输出

`TicTacToe` 可以在执行期间包含以下三种类型的输出：

1. 游戏未结束：一个包含新状态和变更输出的输出。
2. 一个玩家赢了游戏：一个 `P2PKH` 输出，支付给获胜者，以及一个变更输出。
3. 平局：两个 `P2PKH` 输出，将合约锁定的赌注在玩家之间平分，以及一个变更输出。

`P2PKH` 输出可以使用 `Utils.buildPublicKeyHashOutput(pkh: PubKeyHash, amount: bigint)` 构建。变更输出可以使用 `this.buildChangeOutput()` 构建。


```ts
// 构建交易输出
let outputs = toByteString('');
if (this.won(play)) {
    outputs = Utils.buildPublicKeyHashOutput(pubKey2Addr(player), this.ctx.utxo.value);
}
else if (this.full()) {
    const halfAmount = this.ctx.utxo.value / 2n;
    const aliceOutput = Utils.buildPublicKeyHashOutput(pubKey2Addr(this.alice), halfAmount);
    const bobOutput = Utils.buildPublicKeyHashOutput(pubKey2Addr(this.bob), halfAmount);
    outputs = aliceOutput + bobOutput;
}
else {
    // 构建一个包含最新合约状态的输出。
    outputs = this.buildStateOutput(this.ctx.utxo.value);
}

outputs += this.buildChangeOutput();

```

### 第三步

确保当前事务的输出必须包含这个递增的新状态。如果我们在合约中创建的所有输出（只有一个输出）哈希到 `ScriptContext` 中的 `hashOutputs`，我们可以确定它们是当前事务的输出。因此，更新的状态被传播。

```ts
// 验证当前事务只有一个输出
assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
```

## 结论

恭喜，您已经完成了 `TicTacToe` 合约！

完整的 [代码](https://github.com/sCrypt-Inc/tic-tac-toe/blob/main/src/contracts/tictactoe.ts) 如下：

```ts
export class TicTacToe extends SmartContract {
    @prop()
    alice: PubKey;
    @prop()
    bob: PubKey;

    @prop(true)
    is_alice_turn: boolean;

    @prop(true)
    board: FixedArray<bigint, 9>;

    @prop()
    static readonly EMPTY: bigint = 0n;
    @prop()
    static readonly ALICE: bigint = 1n;
    @prop()
    static readonly BOB: bigint = 2n;

    constructor(alice: PubKey, bob: PubKey) {
        super(...arguments)
        this.alice = alice;
        this.bob = bob;
        this.is_alice_turn = true;
        this.board = fill(TicTacToe.EMPTY, 9);
    }

    @method()
    public move(n: bigint, sig: Sig) {
        // 检查位置 `n`
        assert(n >= 0n && n < 9n);
        // 检查签名 `sig`
        let player: PubKey = this.is_alice_turn ? this.alice : this.bob;
        assert(this.checkSig(sig, player), `checkSig failed, pubkey: ${player}`);
        // 更新状态属性以完成移动
        assert(this.board[Number(n)] === TicTacToe.EMPTY, `board at position ${n} is not empty: ${this.board[Number(n)]}`);
        let play = this.is_alice_turn ? TicTacToe.ALICE : TicTacToe.BOB;
        this.board[Number(n)] = play;
        this.is_alice_turn = !this.is_alice_turn;

        // 构建交易输出
        let outputs = toByteString('');
        if (this.won(play)) {
            outputs = Utils.buildPublicKeyHashOutput(pubKey2Addr(player), this.ctx.utxo.value);
        }
        else if (this.full()) {
            const halfAmount = this.ctx.utxo.value / 2n;
            const aliceOutput = Utils.buildPublicKeyHashOutput(pubKey2Addr(this.alice), halfAmount);
            const bobOutput = Utils.buildPublicKeyHashOutput(pubKey2Addr(this.bob), halfAmount);
            outputs = aliceOutput + bobOutput;
        }
        else {
            // 构建一个包含最新合约状态的输出。
            outputs = this.buildStateOutput(this.ctx.utxo.value);
        }

        outputs += this.buildChangeOutput();

        // 确保当前事务包含上面构建的输出
        assert(this.ctx.hashOutputs === hash256(outputs), "check hashOutputs failed");
    }

    @method()
    won(play: bigint): boolean {
        let lines: FixedArray<FixedArray<bigint, 3>, 8> = [
            [0n, 1n, 2n],
            [3n, 4n, 5n],
            [6n, 7n, 8n],
            [0n, 3n, 6n],
            [1n, 4n, 7n],
            [2n, 5n, 8n],
            [0n, 4n, 8n],
            [2n, 4n, 6n]
        ];

        let anyLine = false;

        for (let i = 0; i < 8; i++) {
            let line = true;
            for (let j = 0; j < 3; j++) {
                line = line && this.board[Number(lines[i][j])] === play;
            }

            anyLine = anyLine || line;
        }

        return anyLine;
    }

    @method()
    full(): boolean {
        let full = true;
        for (let i = 0; i < 9; i++) {
            full = full && this.board[i] !== TicTacToe.EMPTY;
        }
        return full;
    }

}

```

但是，如果没有用户与之交互，一个 dApp 是不完整的。请参阅 [这里](../how-to-integrate-a-frontend/how-to-integrate-a-frontend.md) 了解如何添加前端。
