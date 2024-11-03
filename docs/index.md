---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

title: CAT Protocol 中文网

hero:
  name: "CAT Protocol 中文网"
  tagline: 全面学习了解 CAT Protocol 的最强学习社区
  actions:
    - theme: brand
      text: 开始学习
      link: /CAT-Protocol/cat-protocol
  image:
    src: /cat.png
    alt: CAT Protocol 中文网

features:
  - icon: 😻
    title: CAT Protocol 中文文档
    details: 契约认证代币（CAT）协议
    link: /CAT-Protocol/cat-protocol
  - icon: 🐉
    title: sCrypt 中文文档
    details: 适用于比特币兼容区块链的全栈 Web3 开发平台
    link: /sCrypt/overview
  - icon: ⚗️
    title: Fractal Bitcoin中文文档
    details: 是一个比特币原生扩容解决方案
    link: /fractalbitcoin/welcome
---
<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
  --vp-home-hero-image-filter: blur(44px);
}
.name {
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

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<div class="footer-content">
  <div class="social-links">
    <a href="https://x.com/Coder333_" target="_blank"><i class="fab fa-twitter"></i></a>
    <a href="https://t.me/+PWwcrZugOcllMzhh" target="_blank"><i class="fab fa-telegram"></i></a>
    <a href="https://catscan.coder3.dev/" target="_blank"><i class="fas fa-search"></i></a>
  </div>

  <div class="copyright">
    &copy; 2024 CAT Protocol 中文网. All rights reserved.
  </div>
</div>

<style>
.footer-content {
  margin-top: 8rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
}
.social-links {
  text-align: center;
  margin-bottom: 1.5rem;
}
.social-links a {
  display: inline-block;
  margin: 0 15px;
  font-size: 28px;
  color: #888;
  transition: color 0.3s ease;
}
.social-links a:hover {
  color: #41d1ff;
}
.copyright {
  text-align: center;
  font-size: 0.9rem;
  color: #888;
}
</style>
