---
title: "使用不同合约的多个输入"
sidebar_position: 2
---

假设我们希望在一个交易中解锁位于不同智能合约中的FT。我们可以利用在[调用多个合约实例的章节](../../advanced/how-to-call-multiple-contracts.md)中展示的相同技术。

```ts
// 一个发送者是常规的bsv-20 P2PKH。
const sender0 = BSV21P2PKH.fromUTXO(utxo)
await sender0.connect(signer)

// 第二个发送者是一个哈希锁合约。
const sender1 = HashLockFTV2.fromUTXO(utxo)
await sender1.connect(signer)

// 接收者将是一个单一的哈希锁合约。
const recipientAmt = 6n
const recipients: Array<FTReceiver> = [
    {
        instance: new HashLockFTV2(
            tokenId,
            amount,
            dec,
            sha256(toByteString('next super secret', true))
        ),
        amt: recipientAmt,
    },
];

const totalTokenAmt = sender0.getAmt() + sender1.getAmt()
const tokenChangeAmt = totalTokenAmt - recipientAmt

const ordPubKey = await signer.getDefaultPubKey()

sender0.bindTxBuilder(
    'unlock',
    async (
        current: BSV21P2PKH,
        options: OrdiMethodCallOptions<BSV21P2PKH>
    ): Promise<ContractTransaction> => {
        const tx = new bsv.Transaction()
        const nexts: StatefulNext<SmartContract>[] = []

        for (let i = 0; i < recipients.length; i++) {
            const receiver = recipients[i]

            if (receiver.instance instanceof BSV21) {
                receiver.instance.setAmt(receiver.amt)
            } else {
                throw new Error('Unsupported receiver, only BSV-20!')
            }

            tx.addOutput(
                new bsv.Transaction.Output({
                    script: receiver.instance.lockingScript,
                    satoshis: 1,
                })
            )

            nexts.push({
                instance: receiver.instance,
                balance: 1,
                atOutputIndex: i,
            })
        }

        if (tokenChangeAmt > 0n) {
            const p2pkh = new BSV21P2PKH(
                tokenId,
                amount,
                dec,
                Addr(ordPubKey.toAddress().toByteString())
            )

            p2pkh.setAmt(tokenChangeAmt)

            tx.addOutput(
                new bsv.Transaction.Output({
                    script: p2pkh.lockingScript,
                    satoshis: 1,
                })
            )

            nexts.push({
                instance: p2pkh,
                balance: 1,
                atOutputIndex: nexts.length,
            })
        }

        tx.change(ordPubKey.toAddress())

        tx.addInput(current.buildContractInput())

        return Promise.resolve({
            tx: tx,
            atInputIndex: 0,
            nexts,
        })
    }
)

let partialContractTx = await sender0.methods.unlock(
    (sigResps) => findSig(sigResps, ordPubKey),
    PubKey(ordPubKey.toByteString()),
    {
        pubKeyOrAddrToSign: ordPubKey,
        multiContractCall: true,
    } as OrdiMethodCallOptions<BSV21P2PKH>
)

sender1.bindTxBuilder(
    'unlock',
    async (
        current: HashLockFTV2,
        options: MethodCallOptions<HashLockFTV2>
    ): Promise<ContractTransaction> => {
        if (options.partialContractTx) {
            const tx = options.partialContractTx.tx
            tx.addInput(current.buildContractInput())

            return Promise.resolve({
                tx: tx,
                atInputIndex: 1,
                nexts: partialContractTx.nexts,
            })
        }

        throw new Error('no partialContractTx')
    }
)

partialContractTx = await sender1.methods.unlock(message1, {
    partialContractTx,
    transfer: recipients,
    pubKeyOrAddrToSign: ordPubKey,
    multiContractCall: true,
} as OrdiMethodCallOptions<BSV21P2PKH>)

const { tx } = await SmartContract.multiContractCall(
    partialContractTx,
    signer
)

console.log('Transfer tx:', tx.id)
```

在上面的代码中，构造了一个部分事务，该事务解锁了包含 `BSV21P2PKH` 实例的第一个UTXO。实际的合约调用尚未执行，因为我们已经在方法调用参数中设置了 `multiContractCall` 标志。

然后，我们通过第二次合约调用传递该部分构造的事务，该调用将解锁 `HashLockFTV2` 实例。就像第一次调用一样，这个调用也有 `multiContractCall` 标志设置。

一旦事务完全构建，我们可以使用 `SmartContract.multiContractCall` 函数进行签名和广播。

上面的代码是基于 `BSV-21` 的示例，但同样可以利用 `BSV-20` 实现。
