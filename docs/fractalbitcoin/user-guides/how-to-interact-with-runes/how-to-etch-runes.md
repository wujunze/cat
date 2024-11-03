# 如何铭刻 Runes？

本指南将为您介绍铭刻 Runes 的详细步骤。我们将以 Fractal 上的 UniSat Runes 服务为例进行说明。

您可以访问 [https://fractal.unisat.io/runes/inscribe](https://fractal.unisat.io/runes/inscribe) 进入铭刻页面。

根据需要输入参数。

**示例**：

**Rune** 名称为 everyone.loves.nature.forever，

**Symbol**（符号）为 E，

设置为**可铸造**（Mintable），**数量**（Amount）设为 500，**上限**（Cap）为 4,000,000。

**预挖**（Premine）数量为 15,000。

**添加 Logo** 选项可选择是否为 Runes 添加标志。

其他字段保持为空。然后您可以按照上述要求输入文本，如下所示。

![](/fractalbitcoin/fractal-78.jfif)

*请注意：铭刻需要等待 5 个区块确认。*

当 Rune 被确认为有效后，铭刻者将获得 15000E everyone.loves.nature.forever。同时，其他人可以铸造 Rune everyone.loves.nature.forever。

以下是各参数的说明：

**Rune：** Runes 名称（目前可以铭刻 13-26 个字符长度，可以用中点 · 分隔，分隔符不计入字符限制）。

**Symbol：** Runes 的符号，可以是 A-Z 或留空。如果留空，将使用通用符号 ¤。

**Mintable：** 关闭此选项将禁用后续铸造。Runes 仅在创建时预挖。

**Amount：** 每次铸造交易可以获得的 Runes 数量。

**Cap：** Rune 可以铸造的次数上限。达到上限后，铸造将关闭。

**高级选项：** 设置预挖、可分割位数，以及可以铸造的起始或结束区块（可选）。

**Premine：** Rune 的铭刻者可以选择为自己分配正在铭刻的 Runes 单位。这种分配称为预挖。

**Divisibility：** Rune 的可分割性表示它可以被分割成原子单位的精细程度。表示为 Runes 数量中小数点后允许的位数。可分割性为 0 的 Rune 不可分割。可分割性为 1 的 Rune 单位可以分为十个子单位，可分割性为 2 的 Rune 可以分为一百个，以此类推。

**Absolute Height：** 绝对区块高度（基于当前区块高度）。

**Relative Height：** 相对区块高度范围（基于实际铭刻的区块）。

**Start Height：** 从给定的起始高度区块开始开放铸造。

**End Height：** 在给定的结束高度区块或之后不能铸造 Rune。