import { defineConfig, DefaultTheme } from "vitepress";
function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: "CAT Protocol中文文档",
      items: [
        {
          text: "简介",
          link: "/CAT-Protocol/cat-protocol",
          activeMatch: "/CAT-Protocol/cat-protocol",
        },
        {
          text: "方法概述",
          link: "/CAT-Protocol/overview",
          activeMatch: "/CAT-Protocol/overview",
        },
        {
          text: "CAT20",
          link: "/CAT-Protocol/cat20",
          activeMatch: "/CAT-Protocol/cat20",
        },
        {
          text: "CAT721",
          link: "/CAT-Protocol/cat721",
          activeMatch: "/CAT-Protocol/cat721",
        },
        {
          text: "Dapps",
          link: "/CAT-Protocol/dapps",
          activeMatch: "/CAT-Protocol/dapps",
        },
        {
          text: "参考实现",
          link: "/CAT-Protocol/impl",
          activeMatch: "/CAT-Protocol/impl",
        },
      ],
    },
    {
      text: "sCrypt中文文档",
      link: "/sCrypt/overview",
      activeMatch: "/sCrypt",
    },
    {
      text: "Fractal Bitcoin中文文档",
      link: "/fractalbitcoin/welcome",
      activeMatch: "/fractalbitcoin",
    },
  ];
}

function sidebarFractal(): DefaultTheme.SidebarItem[] {
  return [
    { text: "欢迎来到 Fractal 文档", link: "welcome" },
    {
      text: "开发者指南",
      collapsed: false,
      items: [
        { text: "开发者首页", link: "doc/developer-home" },
        { text: "Fractal 上的 BRC-20 协议", link: "doc/brc-20-on-fractal" },
        { text: "Fractal 上的 Runes 协议", link: "doc/runes-on-fractal" },
        {
          text: "Fractal 钱包集成指南",
          link: "doc/wallet-integration-with-fractal",
        },
      ],
    },
    {
      text: "挖矿指南",
      collapsed: false,
      items: [
        { text: "概述", link: "mining/overview" },
        { text: "如何挖矿", link: "mining/how-to-mine" },
      ],
    },
    {
      text: "用户指南",
      collapsed: false,
      items: [
        {
          text: "如何使用自托管钱包收发 FB",
          link: "user-guides/how-to-send-receive-fb-with-self-custody-wallets",
        },
        {
          text: "如何铭刻 Ordinals",
          link: "user-guides/how-to-inscribe-ordinals",
        },
        {
          text: "如何交易 Ordinals",
          link: "user-guides/how-to-trade-ordinals",
        },
        {
          text: "如何使用 PizzaSwap",
          link: "user-guides/how-to-interact-with-pizzaswap",
        },
        {
          text: "如何使用 Simple Bridge",
          link: "user-guides/how-to-use-the-simple-bridge",
        },
        {
          text: "如何使用 Bool Bridge",
          link: "user-guides/how-to-use-the-bool-bridge",
        },
        {
          text: "如何与符文(Runes)交互",
          link: "user-guides/how-to-interact-with-runes/how-to-interact-with-runes",
          items: [
            {
              text: "如何铭刻符文(Runes)",
              link: "user-guides/how-to-interact-with-runes/how-to-etch-runes",
            },
            {
              text: "如何铸造符文(Runes)",
              link: "user-guides/how-to-interact-with-runes/how-to-mint-runes",
            },
          ],
        },
        {
          text: "理解 CAT 协议",
          link: "user-guides/understanding-cat-protocol/understanding-cat-protocol",
          items: [
            {
              text: "如何收发 CAT20",
              link: "user-guides/understanding-cat-protocol/how-to-send-receive-cat20",
            },
            {
              text: "如何在 UniSat CAT 市场买卖 CAT",
              link: "user-guides/understanding-cat-protocol/how-to-buy-and-sell-cat-on-unisat-cat-market",
            },
          ],
        },
      ],
    },
    {
      text: "测试网指南",
      collapsed: false,
      items: [{ text: "参与公共测试", link: "testnet/participate-in-public-testing" }],
    },
    {
      text: "常见问题",
      collapsed: false,
      items: [{ text: "Fractal 社区问答总结 - 2024 年 9 月 22 日", link: "faq/fractal-community-q-and-a-summary-sept.-22" }],
    },
  ];
}

function sidebarCAT(): DefaultTheme.SidebarItem[] {
  return [
    { text: "简介", link: "cat-protocol" },
    { text: "方法概述", link: "overview" },
    { text: "CAT20", link: "cat20" },
    { text: "CAT721", link: "cat721" },
    { text: "Dapps", link: "dapps" },
    { text: "参考实现", link: "impl" },
  ];
}

function sidebarSCrypt(): DefaultTheme.SidebarItem[] {
  return [
    { text: "概述", link: "overview" },
    { text: "安装指南", link: "installation" },
    {
      text: "比特币基础",
      link: "bitcoin-basics/bitcoin-basics",
      collapsed: false,
      items: [{ text: "BSV 子模块", link: "bitcoin-basics/bsv" }],
    },
    {
      text: "怎样编写合约",
      collapsed: false,
      items: [
        { text: "基础知识", link: "how-to-write-a-contract/basics" },
        { text: "内置函数", link: "how-to-write-a-contract/built-ins" },
        { text: "脚本语境", link: "how-to-write-a-contract/scriptcontext" },
        { text: "状态合约", link: "how-to-write-a-contract/stateful-contract" },
      ],
    },
    {
      text: "怎样部署和调用合约",
      collapsed: false,
      link: "how-to-deploy-and-call-a-contract/how-to-deploy-and-call-a-contract",
      items: [
        {
          text: "如何自定义合约事务",
          link: "how-to-deploy-and-call-a-contract/how-to-customize-a-contract-tx",
        },
        {
          text: "使用 CLI 部署",
          link: "how-to-deploy-and-call-a-contract/deploy-cli",
        },
        { text: "水龙头", link: "how-to-deploy-and-call-a-contract/faucet" },
        {
          text: "与已部署的合约交互",
          link: "how-to-deploy-and-call-a-contract/call-deployed",
        },
      ],
    },
    { text: "如何测试合约", link: "how-to-test-a-contract" },
    { text: "如何调试合约", link: "how-to-debug-a-contract" },
    {
      text: "如何集成前端",
      link: "how-to-integrate-a-frontend/how-to-integrate-a-frontend",
      collapsed: false,
      items: [
        {
          text: "如何集成 DotWallet",
          link: "how-to-integrate-a-frontend/how-to-integrate-dotwallet",
        },
      ],
    },
    { text: "如何将合约发布到 NPM", link: "how-to-publish-a-contract" },
    { text: "如何验证合约", link: "how-to-verify-a-contract" },
    { text: "以太坊开发者的sCrypt", link: "ethereum-devs" },
    {
      text: "高级",
      collapsed: false,
      items: [
        {
          text: "如何集成sCrypt服务",
          link: "advanced/how-to-integrate-scrypt-service",
        },
        { text: "签名哈希类型", link: "advanced/sighash-type" },
        { text: "在sCrypt中使用脚本", link: "advanced/inline-asm" },
        { text: "使用代码分隔符", link: "advanced/codeseparator" },
        {
          text: "如何添加一个provider",
          link: "advanced/how-to-add-a-provider",
        },
        { text: "如何添加一个signer", link: "advanced/how-to-add-a-signer" },
        {
          text: "在单个tx中调用多个合约",
          link: "advanced/how-to-call-multiple-contracts",
        },
        { text: "时间锁", link: "advanced/timeLock" },
        {
          text: "如何使用Signer类仅签名P2PKH输入",
          link: "advanced/How to only sign p2pkh inputs",
        },
        {
          text: "如何构建预言机服务",
          link: "advanced/how-to-build-an-oracle-service",
        },
        {
          text: "如何调试 ScriptContext 失败",
          link: "advanced/how-to-debug-scriptcontext",
        },
      ],
    },
  ];
}
// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "zh-CN",
  title: "CAT Protocol 中文网",
  description: "全面学习了解CAT Protocol的最强学习社区",
  srcDir: "docs",
  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-01F1KEBQBY",
      },
    ],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-01F1KEBQBY');`,
    ],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: nav(),
    sidebar: {
      "/CAT-Protocol/": {
        base: "/CAT-Protocol/",
        items: sidebarCAT(),
      },
      "/sCrypt/": {
        base: "/sCrypt/",
        items: sidebarSCrypt(),
      },
      "/fractalbitcoin/": {
        base: "/fractalbitcoin/",
        items: sidebarFractal(),
      },
    },
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    outline: {
      label: "页面导航",
    },
    editLink: {
      pattern: "https://github.com/wujunze/cat/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页面",
    },
    lastUpdated: {
      text: "最后更新于",
      formatOptions: {
        dateStyle: "short",
        timeStyle: "medium",
      },
    },
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
            },
          },
        },
      },
    },

    socialLinks: [{ icon: "github", link: "https://github.com/wujunze/cat" }],
  },
});
