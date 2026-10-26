# Documentation Site Template

一个基于 Next.js、MDX 和 Pagefind 的静态文档站模板。页面语言在 `website/meta/site.json` 的 `lang` 中设置。

## 开始使用

站点代码在 `website/`。

```bash
cd website
npm install
npm run dev
```

打开 `http://localhost:3000`。站点信息位于 `website/meta/site.json`，侧边栏位于
`website/meta/sidebars.json`，文档位于仓库根目录的 `docs/`。

## 验证搜索

```bash
cd website
npm run preview:search
```

普通开发服务器不会生成 Pagefind 索引。完整用法请查看站内的
[模板使用手册](/getting-started)。

## 致谢

本站模板基于 [spaCy website](https://spacy.io/) 的开源站点架构。
