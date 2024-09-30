---
sidebar_position: 4
---

# 在 sCrypt 中使用脚本

脚本是一种低级语言，可以看作是比特币虚拟机的汇编语言。通常，开发人员不必直接处理它，可以使用高级语言如 sCrypt。然而，有时使用脚本是有益的。例如，定制的脚本经过优化，因此比 sCrypt 生成的脚本更小和更高效。或者脚本是由外部工具如[Baguette](https://replit-docs.frenchfrog42.repl.co)生成的，需要集成到 sCrypt 中。

要实现这一点，您必须编辑项目`artifacts`目录下的自动生成的`.scrypt`文件。

首先，您创建一个名为`P2PKH`的项目：

```bash
npx scrypt-cli project P2PKH --asm
```

注意，必须启用`--asm`选项，这意味着您将使用脚本的行内汇编格式。

您的合约位于`src/contracts/p2pkh.ts`：

```ts
export class P2PKH extends SmartContract {
  @prop()
  readonly address: Addr;

  constructor(address: Addr) {
    super(...arguments);
    this.address = address;
  }

  @method()
  public unlock(sig: Sig, pubkey: PubKey) {
    assert(
      pubKey2Addr(pubkey) == this.address,
      "public key does not correspond to address"
    );
    assert(this.checkSig(sig, pubkey), "signature check failed");
  }
}
```

假设您想用手动脚本替换`unlock`函数，编辑文件`.asm/asm.json`。

```json
{
  "P2PKH": {
    "unlock": "OP_DUP OP_HASH160 $pubKeyHash OP_EQUALVERIFY OP_CHECKSIG"
  }
}
```

汇编变量可以由前缀`$`定义，如`$pubKeyHash`。

我们也可以为多个方法定义多个替换，如果需要的话。

现在，您可以使用`--asm`选项编译合约：

```sh
npx scrypt-cli compile --asm
```

编译后，函数体将用脚本替换，如在`artifacts/P2PKH.scrypt`中所示。

![img](/sCrypt/inline-asm-01.png)

## 设置行内汇编变量

可以使用`setAsmVars()`将汇编变量替换为文字脚本。每个变量由其唯一的范围标识，即合约和它所在的函数。

```ts
p2pkh = new P2PKH(Addr(myAddress.toByteString()));

// 设置汇编变量
// 注意，这些不是构造函数参数，必须单独设置。
asmVarValues = {
  "P2PKH.unlock.address": myAddress.toByteString(),
};
p2pkh.setAsmVars(asmVarValues);
```

完整的代码可以在[GitHub](https://github.com/sCrypt-Inc/boilerplate/blob/master/src/contracts/asmDemo.ts)上找到。
有关行内脚本/汇编的更多信息，请参阅[这里](https://scryptdoc.readthedocs.io/en/latest/asm.html)。

:::tip `注意`
行内脚本绕过了 sCrypt 的许多功能，如类型检查。使用此高级功能时必须极其小心。
:::
