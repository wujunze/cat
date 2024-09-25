# 如何集成 DotWallet

[DotWallet](https://www.dotWallet.com/en) 是一个轻量级的钱包，旨在帮助用户轻松安全地管理他们的数字资产。我们将展示如何将其与 sCrypt 驱动的应用程序集成。

## OAuth 2.0

OAuth 2.0 是一个行业标准的授权框架，允许第三方应用程序访问用户在网络服务（如 Facebook、Google 和 Twitter）上的资源，而无需直接将用户的凭据与应用程序共享。它提供了一种安全且标准化的方式，使用户能够将其受保护的资源（如他们的个人信息或照片）授予其他应用程序有限的访问权限。它通过在用户、应用程序和托管用户数据的服务之间引入授权层来实现这一点。用户无需与应用程序共享他们的用户名和密码，而是被重定向到服务器的认证服务器。用户在服务上进行身份验证，成功后，服务会向应用程序颁发访问令牌。此访问令牌表示用户对特定资源的访问授权。

如果你是 OAuth 2.0 的新手，请查看这些有用的教程：

- [An Illustrated Guide to OAuth and OpenID Connect](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc)
- [The Simplest Guide To OAuth 2.0](https://darutk.medium.com/the-simplest-guide-to-oauth-2-0-8c71bd9a15bb)
- [An Introduction to OAuth 2](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2)

## DotWallet 的用户授权

DotWallet 使用 OAuth 2.0 允许第三方应用程序安全地访问 DotWallet 用户授权的某些功能。更具体地说，它使用 Oauth2 的授权码授权类型，如下图所示。有关详细信息，请参阅 [RFC6749](https://tools.ietf.org/html/rfc6749#section-4.1)。

![img](/sCrypt/how-to-integrate-dotwallet-01.png)

[Credit: Vihanga Liyanage](https://medium.com/@vihanga_liyanage/iam-for-dummies-oauth-2-grant-types-397197a26024)

按照 [这些步骤](https://developers.dotwallet.com/documents/en/#user-authorization) 进行用户授权。

1. 构造 URI。

    Example URI: `https://api.ddpurse.com/v1/oauth2/authorize?client_id=YOUR-CLIENT-ID&redirect_uri=http%3A%2F%2FYOUR-REDIRECT-URL&response_type=code&state=YOUR-STATE&scope=user.info`

    URL Parameters:

    | 参数    | 描述 |
    | -------- | ------- |
    | client_id  | 开发者 dapp client_id    |
    | redirect_uri  | 授权后重定向的 URL。需要进行 url_encoded   |
    | state    | 建议使用超过 32 位的随机字符串（例如 UUID）。状态用于验证请求和回调的一致性。这可以防止 CSRF 攻击。  |
    | response_type | 填入固定值：`code` |
    | scope | 授权范围。用户同意授权的权限列表。这些权限是某些 API 端点所必需的。需要进行 url_encoded。使用空格分隔多个权限。有关当前支持的权限范围列表，请参阅 [此处](https://developers.dotwallet.com/documents/en/#user-authorization) |

2. 将用户重定向到步骤 1 中构造的 URI

    点击链接后，用户将被重定向到 DotWallet 授权页面。DotWallet 会要求用户登录，然后询问他们是否同意授权应用程序以列出的权限范围。

3. 通过回调 URI 接收 `code`。

    在用户在步骤 2 中同意授权后，DotWallet 会将客户端重定向到应用程序指定的 `redirect_uri`。授权代码 `code` 和提供的 `state` 将包含在查询参数中。

4. 交换 `code` 以获取 `access_token`。`access_token` 是用于访问受保护资源的凭据，由授权服务器颁发。

:::danger `警告`
为避免安全问题，任何用于或获取 `access_token` 的请求必须从后端服务器发出。不要在客户端暴露您的 `access_token` 和 `client_secret`<sup>1</sup>。
:::

### DotWallet 开发者平台

1. 在 [DotWallet 开发者平台](https://developers.dotwallet.com/en) 注册并创建一个应用程序。

![img](/sCrypt/how-to-integrate-dotwallet-02.png)

2. 创建应用程序后，您将收到一封包含 `app_id` 和 `secret` 的电子邮件。

![img](/sCrypt/how-to-integrate-dotwallet-03.png)

1. 接下来，您需要设置 [重定向 URI](https://www.oauth.com/oauth2-servers/redirect-uris)。
重定向 URI 是 OAuth 流程中的关键部分。在用户成功授权应用程序后，授权服务器会将用户重定向回应用程序。例如，在下图中 `http://localhost:3000/callback/` 是重定向。

![img](/sCrypt/how-to-integrate-dotwallet-04.png)

:::tip `注意`
*Callback domain* 在表单中是 OAuth 的重定向 URI。
:::

## 示例实现

以下是一个在 [Nextjs](https://nextjs.org/) 中集成 DotWallet 的示例，这是一个流行的 React 开发框架。

1. 构造 URI。

```ts
export default async function Home() {
    const client_id = process.env.CLIENT_ID;
    const redirect_uri = encodeURIComponent(process.env.REDIRECT_URI || '');
    const scope = encodeURIComponent("user.info autopay.bsv");
    const state = crypto.randomUUID();
    const loginUrl = `https://api.ddpurse.com/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&state=${state}`;

    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="m-4 p-4 bg-blue-200 font-bold rounded-lg">
          <a href={loginUrl}>DotWallet Login</a>
        </div>
      </main>
    );
}
```

<center>src/app/page.tsx</center>

如果用户点击 **DotWallet Login** 链接，页面将重定向到钱包授权页面。

![img](/sCrypt/how-to-integrate-dotwallet-05.png)

2. 用户点击 **Agree to authorize** 登录后，授权服务器将用户重定向到重定向 URI。以下代码通过回调 URI 接收 `code`，交换 `code` 为 `access_token` 并保存。

在 `app` 目录中，文件夹用于在 nextjs 中 [定义路由](https://nextjs.org/docs/app/building-your-application/routing/defining-routes#creating-routes)。我们创建 `src/app/callback/route.ts` 来处理重定向请求。

```ts
import { redirect, notFound } from 'next/navigation';

import token from "../token"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    // 交换 code 以获取 access_token
    const res = await fetch(`https://api.ddpurse.com/v1/oauth2/get_access_token`, {
      body: JSON.stringify({
        code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: process.env.CLIENT_SECRET,
        client_id: process.env.CLIENT_ID,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST'
    });
    const { code: apiCode, data, msg } = await res.json();

    if (apiCode === 0) {
      const { access_token } = data;
      // 保存 access_token
      token.access_token = access_token;
      // 重定向到 balance 页面。
      redirect('/balance');
    }

  }

  notFound();
}
```

<center>src/app/callback/route.ts</center>

### DotWalletSigner

sCrypt SDK 提供了 `DotWalletSigner` 用于快速集成 DotWallet。

在重定向到 `/balance` 页面后，我们可以使用 OAuth access token 创建一个 `DotWalletSigner`，该 token 作为第一个参数传递。

```ts
import { DotwalletSigner, DefaultProvider } from "scrypt-ts";
import token from "../token";

async function getData() {
  const provider = new DefaultProvider();
  const signer = new DotwalletSigner(token.access_token, provider);

  const balance = await signer.getBalance();

  return { balance: balance.confirmed + balance.unconfirmed };
}

export default async function Balance() {
  const data = await getData();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="m-4 p-4 bg-blue-200 font-bold rounded-lg">
        <label>balance</label> {data.balance}
      </div>
    </main>
  );
}
```

<center>src/app/balance/page.tsx</center>

创建 `DotWalletSigner` 后，您可以调用 `DotWalletSigner` 的所有接口，如其他 [signers](../how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract.md#signer)。
例如，示例使用 signer 检查用户的余额。

恭喜！您已经完成了 DotWallet 的集成。完整代码 [here](https://github.com/zhfnjust/dotwallet-example).

---

[1] `client_secret` 存储在后台。它用于交换授权代码以获取访问令牌。
