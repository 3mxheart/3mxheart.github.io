# 3mxheart.github.io

个人博客，纯静态页面，托管在 GitHub Pages 上：https://3mxheart.github.io/

没有任何构建步骤——编辑文件、提交、推送，几十秒后线上就是新的。

## 目录结构

```
index.html          首页（个人介绍 + 文章列表）
about.html          关于
404.html            找不到页面时的兜底
posts/
  hello.html        文章示例
  rea-cn.html       文章示例
assets/style.css    全站样式（含深色模式）
favicon.svg         站点图标
.nojekyll           告诉 GitHub Pages 不要用 Jekyll 处理这些文件
```

## 写一篇新文章

1. 复制 `posts/hello.html`，改个文件名，比如 `posts/my-first-post.html`；
2. 在文件里改标题（`<title>` 和 `<h1>`）、日期、正文；
3. 回到 `index.html`，在"文章"那段 `<ul class="post-list">` 里复制一个 `<li>`，
   改掉日期、标题、摘要和链接；
4. 提交并推送：

```bash
git add .
git commit -m "post: 新文章标题"
git push
```

## 本地预览

页面里的样式和图片都写在根路径上（`/assets/...`），所以直接双击 `index.html` 会变成没有样式的裸页面。
想看和线上一致的效果，在项目目录里起一个静态服务器，然后浏览器打开 http://localhost:8000 ：

```bash
python -m http.server 8000
```

本机已经装了 Python，所以不用再额外安装什么。习惯用 VS Code 的话，装个 Live Server 插件，
右键 `index.html` → Open with Live Server 也是一样的效果。

## 绑定自定义域名

买好域名后，在仓库里加一个 `CNAME` 文件，内容写域名（例如 `blog.example.com`），
然后到域名的 DNS 里加一条 CNAME 记录指向 `3mxheart.github.io`，
最后在仓库 Settings → Pages 里填上域名并开启 HTTPS。
