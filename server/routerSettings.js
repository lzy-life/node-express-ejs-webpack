var routerLoader = require("./routerLoader");
var routerRender = require("./routerRender");

var routerMap = [
	{
		"path": "*",
		"loader": routerLoader.common,
		"render": routerRender.common
	}, {
		"path": /^\/(index\/?)?$/,
		"loader": routerLoader.index,
		"render": routerRender.index
	}
];
//
module.exports = {
	"routerMap": routerMap
};