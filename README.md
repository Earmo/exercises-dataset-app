# 健身动作库 Android App

基于 `hasaneyldrm/exercises-dataset` 的健身动作库 Android 应用。应用不使用数据库，动作数据和中文步骤打包在 APK 本地 assets 中，GIF 动作图按需从网络加载并缓存到 App 私有缓存目录。

## 已包含内容

- 1,324 个健身动作
- 本地数据文件：`app/src/main/assets/data/exercises.json`
- WebView 界面：搜索、部位/器械/目标肌肉筛选、随机动作、详情步骤
- GIF 网络加载 + 本地缓存：首次查看下载，后续优先读取本地缓存
- Release APK：`app/build/outputs/apk/release/app-release.apk`

## 运行方式

打开项目后直接安装 release APK，或用 Android Studio 导入项目构建。应用首次显示某个动作 GIF 时需要联网；图片下载后会缓存到 App 私有缓存目录，后续优先走本地缓存。

## 构建

```powershell
$sdk=(Resolve-Path '.android-sdk').Path
$env:ANDROID_HOME=$sdk
$env:ANDROID_SDK_ROOT=$sdk
.\gradlew.bat :app:assembleRelease
```

## 重新生成本地资源

```powershell
node scripts\prepare-assets.mjs
```

该脚本会把 JSON 生成为 WebView 可直接加载的 `data/exercises.js`。GIF 不再打包进 APK。

## 数据来源

元数据来自 [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset)。原仓库说明媒体资源不随仓库分发；本项目按每条记录的 `media_id` 从官方 CDN 按需加载 GIF，并在本机缓存。
