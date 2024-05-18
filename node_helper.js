var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	socketNotificationReceived(notification, payload) {
		if (notification === "CONFIG") {
			this.config=payload;
		}
	},

});
