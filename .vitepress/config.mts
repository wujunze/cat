import { defineConfig, DefaultTheme } from 'vitepress'
function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: "CAT Protocol中文文档",
      items: [
        {
          text: "简介",
          link: "/CAT-Procotol/cat-procotol",
          activeMatch: "/CAT-Procotol/cat-procotol",
        },
        {
          text: "方法概述",
          link: "/CAT-Procotol/overview",
          activeMatch: "/CAT-Procotol/overview",
        },
        {
          text: "CAT20",
          link: "/CAT-Procotol/cat20",
          activeMatch: "/CAT-Procotol/cat20",
        },
        {
          text: "CAT721",
          link: "/CAT-Procotol/cat721",
          activeMatch: "/CAT-Procotol/cat721",
        },
        {
          text: "参考实现",
          link: "/CAT-Procotol/impl",
          activeMatch: "/CAT-Procotol/impl",
        },
      ],
    },
    {
      text: "sCrypt中文文档",
      items: [
        {
          text: "概述",
          link: "/sCrypt/overview",
          activeMatch: "/sCrypt/overview",
        },
      ],
    }
  ];
}

function sidebarCAT(): DefaultTheme.SidebarItem[] {
  return [
    { text: "简介", link: "cat-procotol" },
    { text: "方法概述", link: "overview" },
    { text: "CAT20", link: "cat20" },
    { text: "CAT721", link: "cat721" },
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
      items: [
        { text: "BSV 子模块", link: "bitcoin-basics/bsv" }
      ]
    },
  ];
}
// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "zh-CN",
  title: "CAT Procotol 中文网",
  description: "全面学习了解CAT Protocol的最强学习社区",
  srcDir: "docs",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: nav(),
    sidebar: {
      "/CAT-Procotol/": {
        base: "/CAT-Procotol/",
        items: sidebarCAT(),
      },
      "/sCrypt/": {
        base: "/sCrypt/",
        items: sidebarSCrypt(),
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
      pattern:
        "https://github.com/wujunze/cat/edit/main/docs/:path",
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wujunze/cat' }
    ]
  }
})
