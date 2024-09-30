---
sidebar_position: 8
---

# 在单个 tx 中调用多个合约

到目前为止，我们只展示了如何在单个 tx 中调用一个智能合约。也就是说，只有一个输入花费了一个智能合约 UTXO，其他输入（如果有）花费了 Pay-to-Public-Key-Hash ([P2PKH](https://learnmeabitcoin.com/guide/p2pkh)) UTXO，这些 UTXO 通常不被视为智能合约。

有时，我们希望在一个 tx 中花费多个智能合约 UTXO。

与[调用单个合约](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#contract-call)的主要区别是：

1. 在`MethodCallOptions`中设置`multiContractCall = true`
2. 每个调用只能返回一个部分/不完整的交易，而不是一个完整的交易
3. 一个部分的交易必须作为一个`ContractTransaction`在后续的调用中传递
4. 最后调用`SmartContract.multiContractCall(partialContractTx: ContractTransaction, signer: Signer)`来签名和广播完整的交易

以下是一个[示例代码](https://github.com/sCrypt-Inc/boilerplate/blob/master/tests/multi_contracts_call.test.ts)，展示了如何在同一时间调用两个合约：

```ts
import { Counter } from "../../src/contracts/counter";
import { getDefaultSigner } from "../utils/helper";
import { HashPuzzle } from "../../src/contracts/hashPuzzle";

async function main() {
  await Counter.loadArtifact();
  await HashPuzzle.loadArtifact();

  const signer = getDefaultSigner();
  let counter = new Counter(1n);

  // 连接到signer
  await counter.connect(signer);

  // 合约部署
  const deployTx = await counter.deploy(1);
  console.log("Counter contract deployed: ", deployTx.id);

  counter.bindTxBuilder(
    "incrementOnChain",
    (
      current: Counter,
      options: MethodCallOptions<Counter>,
      ...args: any
    ): Promise<ContractTransaction> => {
      // 从当前合约创建下一个合约实例
      const nextInstance = current.next();
      // 在本地合约实例上应用更新
      nextInstance.count++;

      const tx = new bsv.Transaction();
      tx.addInput(current.buildContractInput()).addOutput(
        new bsv.Transaction.Output({
          script: nextInstance.lockingScript,
          satoshis: current.balance,
        })
      );

      return Promise.resolve({
        tx: tx,
        atInputIndex: 0,
        nexts: [
          {
            instance: nextInstance,
            balance: current.balance,
            atOutputIndex: 0,
          },
        ],
      });
    }
  );

  const plainText = "abc";
  const byteString = toByteString(plainText, true);
  const sha256Data = sha256(byteString);

  const hashPuzzle = new HashPuzzle(sha256Data);

  // 连接到signer
  await hashPuzzle.connect(signer);

  const deployTx1 = await hashPuzzle.deploy(1);
  console.log("HashPuzzle contract deployed: ", deployTx1.id);

  hashPuzzle.bindTxBuilder(
    "unlock",
    (
      current: HashPuzzle,
      options: MethodCallOptions<HashPuzzle>,
      ...args: any
    ): Promise<ContractTransaction> => {
      if (options.partialContractTx) {
        const unSignedTx = options.partialContractTx.tx;
        unSignedTx.addInput(current.buildContractInput());

        if (options.changeAddress) {
          unSignedTx.change(options.changeAddress);
        }

        return Promise.resolve({
          tx: unSignedTx,
          atInputIndex: 1,
          nexts: [],
        });
      }

      throw new Error("no partialContractTx found");
    }
  );

  const partialTx = await counter.methods.incrementOnChain({
    multiContractCall: true,
  } as MethodCallOptions<Counter>);

  const finalTx = await hashPuzzle.methods.unlock(byteString, {
    multiContractCall: true,
    partialContractTx: partialTx,
    changeAddress: await signer.getDefaultAddress(),
  } as MethodCallOptions<HashPuzzle>);

  const { tx: callTx, nexts } = await SmartContract.multiContractCall(
    finalTx,
    signer
  );

  console.log("Counter, HashPuzzle contract `unlock` called: ", callTx.id);

  // hashPuzzle 已终止，但 counter 仍然可以被调用
  counter = nexts[0].instance;
}

await main();
```

:::tip `注意`

- 你必须为每个合约实例绑定一个[transaction builder](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#tx-builders)，因为[默认的](../how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx.md#customize-1)只花费一个合约 UTXO。
- 如果被调用的合约需要来自不同私钥的签名，则传递给`multiContractCall`的 signer 必须拥有所有私钥。
  :::
