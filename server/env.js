var envConfig = {
	dev: {
		domain: "",
		apiHost: "api.douban.com",
		apiPort: 80,
		apiPath: "/v2/movie/top250",
		enableProxy: true,
		getApiPath: function() {
			if (this.enableProxy) {
				return this.api;
			} else {
				return this.domain + this.api;
			}
		}
	},
	prd: {
		domain: "",
		apiHost: "api.douban.com",
		apiPort: 80,
		apiPath: "/v2/movie/top250",
		enableProxy: true,
		getApiPath: function() {
			if (this.enableProxy) {
				return this.api;
			} else {
				return this.domain + this.api;
			}
		}
	}
};
module.exports = function(env) {
	return envConfig[env] || envConfig.dev;
}