var path = require("path");
var glob = require("glob");
var webpack = require('webpack');
// 提取样式到单独的css文件里
var ExtractTextPlugin = require('extract-text-webpack-plugin');
// 生成HTML的插件
var HtmlWebpackPlugin = require('html-webpack-plugin');
//
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
//
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
//
var CopyWebpackPlugin = require('copy-webpack-plugin');
//
const env = process.env.NODE_ENV || "dev";
//
var entries = getEntry('src/**/**/*.js', 'src/').entries;
// {
// 	"read/list/list": ["./src/about/about/about.js"],
// 	"read-list": ["./src/about/about/about.js"]
// }
//
var chunks = Object.keys(entries);
// Webpack config
var config = {
	devtool: "",
	entry: Object.assign(entries, {
		// 将jQuery/Bootstrap打包成一个vendors文件
		vendors: ["./static/scripts/lib/jquery.min.js"],
		"vues": ["./static/scripts/lib/vue.js", "./static/scripts/lib/vue-router.js"]
	}),
	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: '/dist/',
		filename: 'js/[name].js'
	},
	module: {
		loaders: [
			{
				// 得到jQuery模块的绝对路径
				test: require.resolve('./static/scripts/lib/jquery.min.js'),
				// 将jQuery绑定为window.jQuery
				loader: 'expose-loader?$!expose-loader?jQuery'
			}, {
				test: require.resolve('./static/scripts/lib/vue.js'),
				loader: 'expose-loader?Vue'
			}, {
				test: require.resolve('./static/scripts/lib/vue-router.js'),
				loader: 'expose-loader?VueRouter'
			}, {
				test: /\.css$/,
				loader: ExtractTextPlugin.extract({fallback: 'style-loader', use: 'css-loader'})
			}, {
				test: /\.less$/,
				loader: ExtractTextPlugin.extract('style-loader!css-loader!less-loader')
			}, {
				test: /\.sass$/,
				loader: ExtractTextPlugin.extract('style-loader!css-loader!sass-loader')
			}, {
			// 	test: /\.js$/,
			// 	loader: 'babel-loader',
			// 	exclude: ['node_modules'],
			// 	query: {
			// 		compact: false,
			// 		presets: ["es2015"]
			// 	}
			// }, {
				test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: 'file-loader?name=./fonts/[name].[ext]'
			}, {
				test: /\.(png|jpg|gif)$/,
				loader: 'url-loader?limit=8192&name=./img/[hash].[ext]'
			}, {
				test: /\.ejs$/,
				loader: 'ejs-loader'
			}
		]
	},
	plugins: [
		// 提取JS
		new CommonsChunkPlugin({
			name: 'vendors',
			// chunks: chunks,
			// minChunks: chunks.length
			minChunks: Infinity
		}),
		// 提取CSS
		new ExtractTextPlugin('css/[name].css')
	],
	resolve: {
		alias: {
			xQuery: path.resolve(__dirname, "static/scripts/lib/jquery.min.js")
		}
	},
	externals: {
		jquery: "jQuery"
	},
	devServer: {
		// contentBase: path.join(__dirname, 'dist'),
		contentBase: "./",
		host: '0.0.0.0',
		port: 3000,
		inline: true
		// hot: true
	}
};
// 正式环境压缩JS代码
if (env == "prd") {
	config.plugins.push(new UglifyJsPlugin({
		compress: {
			warnings: false
		},
		output: {
			comments: false
		},
		mangle: {
			except: ['$', 'exports', 'require', 'avalon']
		}
	}));
}
// HtmlWebpackPlugin
var viewes = getEntry('src/**/**/*.ejs', 'src/');
var pages = Object.keys(viewes.entries);
var paths = viewes.realPath, copyes = [];
pages.forEach(function (pathname) {
	// 过滤掉模板
	if (["header", "footer"].indexOf(pathname) == -1) {
		var conf = {
			filename: "./html/" + pathname + ".ejs",
			template: "src/" + paths[pathname].replace(/(\w+)-(\w+)-(\w+)/, "$1/$2/$3") + ".ejs"
		};
		conf.favicon = path.resolve(__dirname, 'static/images/favicon.ico')
		conf.inject = 'body'
		if (pathname in config.entry) {
			//
			if (pathname == "index") {
				conf.chunks = ['vendors', 'vues', pathname];
			} else {
				conf.chunks = ['vendors', pathname]
			}
			// 对每个页面的(Chunk)JS文件载入顺序进行排序
			conf.chunksSortMode = function(chunk1, chunk2) {
				var chunks = ['vendors', 'vues', pathname];
				var i1 = chunks.indexOf(chunk1.names[0]), i2 = chunks.indexOf(chunk2.names[0]);
				return i1 - i2;
			};
		} else {
			conf.chunks = [];
		}
		// 正式环境压缩HTML
		if (env == "prd") {
			// https://github.com/kangax/html-minifier
			conf.minify = {
				"collapseWhitespace"            : true, // 压缩HTML
				"conservativeCollapse"          : true, // 始终折叠到1个空格
				// "collapseBooleanAttributes"     : true, // 省略布尔属性的值
				// "removeRedundantAttributes"     : true, // 
				"removeComments"                : true, // 移除注释
				// "removeAttributeQuotes"         : true, // 尽可能的移除属性值的引号
				"removeEmptyAttributes"         : true, // 移除空属性
				"removeScriptTypeAttributes"    : true, // 移除Script标签的type属性
				"removeStyleLinkTypeAttributes" : true, // 移除Style和Link标签的type属性
				"minifyJS"                      : true, // 压缩Script标签及行内脚本内容
				"minifyCSS"                     : true, // 压缩Style标签及行内样式内容
				"minifyURLs"                    : true  // 
			}
		}
		conf.hash = true;
		config.plugins.push(new HtmlWebpackPlugin(conf));
	} else {
		copyes.push({
			from: "src/" + paths[pathname].replace(/(\w+)-(\w+)-(\w+)/, "$1/$2/$3") + ".ejs",
			to: "./html/" + pathname + ".ejs"
		});
	}
});
if (copyes.length) {
	config.plugins.push(new CopyWebpackPlugin(copyes));
}
//
module.exports = config;
//
function getEntry (globPath, pathDir) {
	var files = glob.sync(globPath);
	var entries = {}, entry, realPath = {}, key;
	for (var i = 0; i < files.length; i++) {
		entry = files[i];
		// 按文件类型分类，等到的key格式为 module-view.js
		units = entry.replace(/\.(css|less|sass|js|jsx|html|ejs|vue)$/i, "").split("/");
		if (units && units.length === 4) {
			console.log(units);
			if (units[1] == units[3] || units[1] == "common") {
				key = units[3];
			} else {
				key = units[1] + "" + units[2].replace(/^(\w)/, function(arg) { return arg.toUpperCase() });
			}
			entries[key] = ['./' + entry];
			realPath[key] = units[1] + "-" + units[2] + "-" + units[3];
		} else {
			console.log("<<File Path Error:>>", entry);
		}
	}
	return {
		entries: entries,
		realPath: realPath
	}
}