# 项目简介

项目由 `yarn3` 包管理、 `lerna`版本发布。是一个 `monorepo` 。用于分析包产物，提供包优化建议。该项目用的是 `lerna`的 `lock 模式`。意味着每一个包的 `version` 是绑定在一起的。包的 `version` 定义在 `lerna.json` 内的 `version` 字段。

## 开发

开发时如果依赖本地的其他包，那么执行 `yarn build` 之后，就能访问到其他包的最新内容。

## 构建

执行 `yarn build` 进行整个项目的构建。

因为本项目是 `复合 composite` 模式，构建完成后，会生成 `tsconfig.buildinfo`文件。该文件是用于做增量构建的。在代码没有改变的情况下，不会重复构建。

所以如果要全量构建，先执行 `yarn clean`

## 部署

先执行 `yarn version` 来自动生成包版本。

然后执行 `yarn publish` 发布多个包。
