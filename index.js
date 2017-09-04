var http = require('http');
var https = require('https');
var fs = require("fs");
var path = require('path');
// SSL，可通过OpenSSL生成
// var privateKey = fs.readFileSync('./server/demo_key.pem', 'utf8'); // 私钥key文件
// var certificate = fs.readFileSync('./server/demo_cert.pem', 'utf8'); // 证书文件
// var credentials = {key: privateKey, cert: certificate};
// 加载express框架
var express = require('express');
// 日志
var logger = require('morgan');
var accessLogStream = fs.createWriteStream(path.join(__dirname, '/server/logs/access.log'), {flags: 'a'});
var errorLogStream = fs.createWriteStream(path.join(__dirname, '/server/logs/error.log'), {flags: 'a'});
// 创建一个express实例
var app = express();
// 创建express的路由功能
var router = express.Router();
//
var favicon = require('serve-favicon')
// Cookie解析模块
var cookieParser = require('cookie-parser')
// Session
var session = require('express-session');
// 请求体(JSON, Raw, Text 和 URL编码的数据)解析模块
var bodyParser = require('body-parser');
// 文件上传表单解析模块
var multer = require('multer');
// 加载路由配置
var routerSettings = require("./server/routerSettings");
//
var ejs = require('ejs');
// 旧版本的自定义分隔符
// ejs.open = "<?"; ejs.close = "?>"; // app.set('view options', {"open":'<?',"close":'?>'});
// 新版本的自定义分隔符
ejs.delimiter = '?';
// 指定模板引擎,让ejs能够识别后缀为’.ejs’的文件
app.engine('ejs', ejs.renderFile); // app.engine('ejs', ejs.__express);
// 调用render函数时自动加上’.ejs’ 后缀
app.set("view engine", "ejs");
// 指定模板位置
app.set('views', "./dist/html");// process.cwd() + '/dist/html' // path.join(__dirname, 'dist/html')
// 静态资源服务器
app.use('/dist', express.static('dist', {redirect: true}));
app.use('/static', express.static('static', {redirect: true}));
// 使用日志/Cookie等中间件
app.use(favicon(path.join(__dirname, 'dist', 'favicon.ico')));
app.use(logger('combined', {stream: accessLogStream}));
app.use(cookieParser());
app.use(session({
	secret: "WebSiteServer",
	name: "_nodesessionid",
	cookie: {maxAge: 60000},
	resave: false,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: './static/images/uploads/'}).array('image'));
// 运行环境
var env = process.env.NODE_ENV || 'dev';
var envConfig = require("./server/env")(app.locals.env);
// 将运行时环境数据赋值给“主路由”的locals属性
app.locals.env = env;
app.locals.envConfig = envConfig;
//
app.use(function(req, res, next) {
	console.log("请求地址：%s", req.url);
	// res.header("Access-Control-Allow-Origin", "*");
	// res.header("Access-Control-Allow-Headers", "X-Requested-With");
	// res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	// res.header("Content-Type", "application/json;charset=utf-8");
	next();
});
//
function debuggerCtrl(req, res, next) {
	// 输出调试数据
	if (app.locals.env == "dev") {
		// 请求对象中含有source对象并将envConfig挂载上去
		if (req.source) {
			req.source.envConfig = app.locals.envConfig;
		}
		//
		if (req.query.debug != undefined && req.source) {
			res.json(req.source);
		} else {
			next();
		}
	} else {
		next();
	}
}
//
createRouter(routerSettings.routerMap);
// 根据配置动态创建路由系统
function createRouter(cfg, refRouter) {
	var router = refRouter || app, config, routeInstance, method;
	for (var i = 0; i < cfg.length; i++) {
		config = cfg[i];
		// 没有路径 或 回调和子路径不存在 则继续下一个处理
		if (!config.path || (!config.render && !config.children)) continue;
		// 请求方法，默认为GET
		method = (config.method || "").toLowerCase() || "get";
		// 有children就使用新Router配置下级路径
		if (config.children) {
			routeInstance = express();
			// “子路由”设置
			routeInstance.engine('ejs', ejs.renderFile);
			routeInstance.set("view engine", "ejs");
			routeInstance.set('views', "./dist/html");
			// 将运行时环境数据赋值给“子路由”的locals属性
			routeInstance.locals.env = env;
			routeInstance.locals.envConfig = envConfig;
			// if (config.args) {
			// 	routeInstance.param(config.args, function(req, res, next) { next(); });
			// }
			router.use(config.path, routeInstance);
			createRouter(config.children, routeInstance);
		} else {
			if (config.loader) {
				router[method](config.path, config.loader, debuggerCtrl, config.render);
			} else {
				router[method](config.path, debuggerCtrl, config.render);
			}
		}
	}
}
// 404
app.get('*', function(req, res){
	res.render("404");
	console.log("404: Page Not Found\nPath: " + req.url);
	// res.end("404: Page Not Found\nPath: " + req.url);
});
// 错误处理
app.use(function(err, req, res, next){
	var now = new Date();
	var meta = '[' + now.toLocaleString() + '] ' + req.method + req.url + '\n';
	errorLogStream.write(meta + err.stack + '\n');
	next();
});
// console.log(app.mountpath)
// Node进程错误处理
// process.on("uncaughtException", function(err) {
// 	var meta = '[' + new Date().toLocaleFormat() + '] 未捕获异常: \n';
// 	errorLogStream.write(meta + err.stack + '\r\n\r\n\r\n');
// 	// process.exit(1);
// 	process.exitCode = 1;
// });
// HTTP
var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log("访问地址为 http://%s:%s", host, port);
});
// HTTP & HTTPS / Client Env
// var httpServer = http.createServer(app), httpPort = 80;
// var httpsServer = https.createServer(credentials, app), httpsPort = 443;
// httpServer.listen(httpPort, function() {
// 	console.log('HTTP Server is running on: http://localhost:%s', httpPort);
// });
// httpsServer.listen(httpsPort, function() {
// 	console.log('HTTPS Server is running on: https://localhost:%s', httpsPort);
// });