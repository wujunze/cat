---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "CAT Procotol 中文网"
  tagline: 全面学习了解 CAT Protocol 的最强学习社区
  actions:
    - theme: brand
      text: 开始学习
      link: /CAT-Procotol/cat-procotol
  image:
    src: /assets/cat.png
    alt: CAT Procotol 中文网

features:
  - title: CAT Procotol中文文档
    details: 契约认证代币（CAT）协议
    link: /CAT-Procotol/cat-procotol
  - title: Feature B
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature C
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---


<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
