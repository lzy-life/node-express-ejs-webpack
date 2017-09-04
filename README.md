[TOC]

# node-express-ejs-webpack

## 简介
    学习Webpack练手之作

## 目录结构
    Project
      |-dist                                             # 存放Webpack打包生成文件的目录
          |-css
          |-html
          |-js
      |-src                                              # 项目源码目录
          |-module                                       # 项目模块目录
              |-view                                     # 模块页面目录
                |-view.css                               # 页面的CSS
                |-view.html                              # 页面
                |-view.js                                # 页面的JS
      |-static                                           # 公用的静态资源
          |-scripts                                      # JS目录，存放公用JS文件，如util/common/plugin
              |-lib                                      # JS框架
          |-css                                          # ……
          |-images
          |-fonts
      |-server
          |-routerLoader.js                              # 渲染页面所需数据处理的方法
          |-routerRender.js                              # 页面渲染方法
          |-routerSetting.js                             # 路由配置：请求地址和请求处理的映射配置
          |-env.js                                       # 运行时环境配置
          |-logs
              |-access.log                               # 访问日志
              |-error.log                                # 错误日志

## 所用框架或工具
    Server: Express + EJS + Webpack + PM2
    Client: jQuery + [Vue + ] Core.css

## 运行
    1、Clone项目
        git clone https://github.com/lzy-life/node-express-ejs-webpack
    2、安装项目依赖
        // npm为国外镜像速度较慢，建议安装cnpm（淘宝NPM镜像） https://npm.taobao.org/
        npm install -g cnpm --registry=https://registry.npm.taobao.org
        // 打包
        cnpm install -g webpack
        // Node进程管理工具
        cnpm install -g pm2
        // 项目依赖
        cnpm install
    3、打包项目文件(没有针对运行时环境的打包配置)
        // 手动打包，测试或生产环境可用（会对代码进行压缩）
        npm run build
        // 自动打包，开发时可用（无代码压缩）
        npm run autobuild
    4、运行项目
        // 使用PM2启动项目，并传递参数NODE_ENV=dev，读取env.js中的dev配置
        npm run dev
        // 使用PM2启动项目，并传递参数NODE_ENV=prd，读取env.js中的prd配置
        npm run prd

## 开发
    1、Client
        1.1、启动自动打包和开发两个命令
            npm run autobuild
            npm run dev
        1.2、修改所需代码保存，回到浏览器刷新即可
    2、Server
        2.1、添加路由
            将路径和处理方法写入 routerSetting.js 文件中
                {
                    // 请求路径
                    path: '/test',
                    // 页面渲染所需数据，多个处理可写成数组形式
                    loader: routerLoader.test,
                    //loader: [routerLoader.test, routerLoader.testA, routerLoader.testB],
                    // 渲染指定EJS模板
                    render: routerRender.test
                }
            在 routerLoader.js 中添加 routerSetting.js 中配置的处理方法
                // 
                function test(req, res, next) {
                    // 将需要渲染的数据赋值给 req 对象的 source 属性，无数据则空对象
                    req.source = {};
                    // 调用 next
                    next();
                }
            在 routerRender.js 中添加 routerSetting.js 中配置的处理方法
                function test(req, res, next) {
                    // 将 req.source 渲染到 'viewName' 模板中
                    // 可通过 req.source.envConfig 或 req.app.locals.envConfig 获取到运行时环境配置
                    res.render('viewName', req.source);
                }
            测试新添加的路由
                在浏览器中访问改路由查看渲染出来的内容
                    localhost:3000/test
                在访问该路由的时候添加参数 debug=true 可查看该路由所加载的数据
                    localhost:3000/test/?debug=true

## 问题
    1、开发时需执行两条命令才能实现即时打包且有路由配置
        1.1、webpack-dev-server可即时打包但无路由功能，且打包生成的内容在内存中不是写入文件
            未尝试强制webpack-dev-server写入文件(https://github.com/gajus/write-file-webpack-plugin)
        1.2、使用webpack中间件：Express + WebpackDevMiddleware + WebpackHotMiddleware
    2、打包时EJS模板分隔符%会引起HtmlWebpackPlugin报错
