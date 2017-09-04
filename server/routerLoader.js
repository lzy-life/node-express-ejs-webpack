var http = require("http");
var url = require("url");

function log() {
	console.log(arguments);
}
// Base Request
function request(options, success, failure) {
	failure = failure && typeof failure == "function" ? failure : log;
	if (!options || typeof success !== "function") return failure("缺少必要参数"), false;
	var urlObj = url.parse(options.path+"", true);
	//
	var req = http.request(options, function(res) {
		var data = "";
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', () => {
			try {
				success(JSON.parse(data));
			} catch(e) {
				failure("JSON格式错误");
			}
		});
	});
	// req.on('response', function(e) {});
	req.on('error', function (err) {
		if (typeof failure == "function") {
			failure(err);
		}
		console.log('Http Request Error: ' + err.message);
	});
	// POST请求转发处理
	if (options.method == "POST" && urlObj.pathname == "/Artsky/api/v3" && urlObj.query.cmd) {
		// req.write("cmd=" + urlObj.query.cmd);
		req.write(urlObj.search.substr(1));
	}
	req.end();
}
function ajaxProxy(envConfig, args, method, success, failure) {
	method = method || "POST";
	var headers = {
		"X-Requested-With": "XMLHttpRequest"
	};
	if (method == "POST") {
		headers = {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			"X-Requested-With": "XMLHttpRequest",
			'Content-Length': Buffer.byteLength(args)
		}
	}
	if (envConfig && envConfig.apiHost && args && typeof success == "function") {
		request({
			hostname: envConfig.apiHost,
			port: envConfig.apiPort,
			path: envConfig.apiPath + "?" + args,
			method: method,
			headers: headers
		}, success, failure);
	}
}
//
function common(req, res, next) {
	next();
}
//
function authentication(req, res, next) {
	next();
}
//
function index(req, res, next) {
	request({
		hostname: 'api.douban.com',
		port: 80,
		path: '/v2/movie/top250',
		method: 'GET'
	}, function(data) {
		req.source = data;
		next();
	});
}
//
function testIndex(req, res, next) {
	var args = "cmd=" + JSON.stringify({
		"common":{"channel":"10","deviceToken":"","language":"zh","os":"5.0","plat":"ios","version":"4.0"},
		"data":{},
		"route":"getHomeExhibitionList"
	});
	ajaxProxy(req.app.locals.envConfig, args, req.method, function(data) {
		req.source = req.source || {};
		if (data && data.result) {
			req.source.exhibitionList = data.result;
			next();
		} else {
			res.render("common404");
		}
	}, function(error) {
		res.sendStatus(500);
	});
}
//
module.exports = {
	common                      : common,
	authentication              : authentication,
	index                       : index,
	testIndex                   : testIndex
};