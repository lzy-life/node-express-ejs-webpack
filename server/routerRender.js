// 默认路由处理
function common(req, res, next) {
	next();
}
//  身份验证
function authentication(req, res, next) {
	if (true) {
		next();
	} else {
		res.end("身份验证失败");
	}
}
// 首页路由处理
function index(req, res, next) {
	// 获取运行时环境配置
	//console.log(req.app.locals.envConfig, req.source.envConfig);
	res.render('index', req.source);
}
//
function testIndex(req, res, next) {
	if (!req.session.ext) {
		req.session.ext = Date.now();
		console.log(req.session.ext);
	}
	res.render('testIndex.ejs', req.source);
}

module.exports = {
	common         : common,
	authentication : authentication,
	index          : index,
	testIndex      : testIndex
};