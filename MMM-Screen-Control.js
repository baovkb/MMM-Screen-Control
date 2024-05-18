Module.register("MMM-Screen-Control", {
	isHiding: false,
	modules: [],
	locking: false,
	animationTime: 500,
	currentPage: 0,
	totalPage: 0,

	defaults: {
	},

	start: function(){
	},

	notificationReceived: function(notification, payload, sender) {
		if(!sender && notification=== 'ALL_MODULES_STARTED'){
			this.sendSocketNotification("CONFIG",this.config);	
			this.setAnimationTime();
		}
		else {
			if (notification === "MMM-Screen-Control") {
				if (payload.type === "HIDE_SCREEN") {
					this.hideScreen();
				} else if (payload.type === "DISPLAY_SCREEN") {
					this.displayScreen();
				} else if (payload.type === "HIDE_SCREEN_SCHEDULE") {
					
				}else if (payload.type === "DISPLAY_SCREEN_SCHEDULE") {
					
				} else if (payload.type === "CHANGE_PAGE" && this.isHiding === false) {
					if (payload.cmd !== undefined) {
						this.changePage(payload.cmd);
					}
				} else if (payload.type === "CHANGE_MODULES") {
					data = payload.data;
					modulesRequest = data["modules"];
					if (!Array.isArray(modulesRequest)) {
						modulesRequest = Array.from(modulesRequest);
					}
					
					hide_identifers = [];
					display_identifers = [];
					
					modulesRequest.forEach((module) => {
						if (module.hidden === true) {
							hide_identifers.push(module.identifier);
						} else {
							display_identifers.push(module.identifier);
						}
					});
					
					this.hideModule(hide_identifers, data["page"]);
					this.displayModule(display_identifers, data["page"]);
							
					this.sendNotification("MMM-WS-Control",{
						type: "MODULES_UPDATED",
						page: data["page"],
						total_page: this.totalPage,
						page_modules: this.modules[data["page"]]
					});	

				} else {
					
				}
			} else if (notification == "EXT_PAGES-NUMBER_IS") {
				this.currentPage = payload.Actual;
				this.totalPage = payload.Total;
				
				this.handleModulesByPage();
					
				this.sendNotification("MMM-WS-Control",{
					type: "PAGE_CHANGED",
					page: this.currentPage,
					total_page: this.totalPage,
					page_modules: this.modules[this.currentPage]
				});	
			
			} else if (notification == "DOM_OBJECTS_CREATED") {
				this.getAllVisibleModule();
				this.sendNotification("EXT_PAGES-NUMBER");
			}
		}
	},

	socketNotificationReceived: function(notification, payload) {
		Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		if(notification === "message_from_helper"){
			this.config.message = payload;
		}

	},

	hideScreen: function() {
		//vcgencmd display_power 0 
		if (this.isHiding == false && this.locking === false) {
			MM.getModules().forEach(module => {
				module.hide(this.animationTime, { lockString: "MMM-Screen-Control-lock-all" });
			});
			
			this.isHiding = true;
			this.locking = true;
			
			setTimeout(() => {
				this.locking = false;
			}, this.animationTime);
		}
	},

	displayScreen: function() {
		//vcgencmd display_power 1
		if (this.isHiding == true && this.locking === false) {
			MM.getModules().forEach(module => {
				module.show(this.animationTime, { lockString: "MMM-Screen-Control-lock-all" });
			});
			
			this.isHiding = false;
			this.locking = true;
			
			setTimeout(() => {
				this.locking = false;
			}, this.animationTime);
		}
	},

	hideModule: function(identifiers, page) {
		if (!Array.isArray(identifiers)) {
			identifiers = Array.from(identifiers);
		}
		
		
		MM.getModules().forEach(module => {
			existInModules = this.moduleInPage(module.identifier, page);
			if (identifiers.includes(module.identifier) && existInModules !== -1) {
				//if (module.hidden == false) {
					module.hide(this.animationTime, { lockString: "MMM-Screen-Control" });
					this.modules[page][existInModules].hidden = true;
				//}
				
			}
		});
	},
	
	moduleInPage: function(identifier, page) {
		for (ind in this.modules[page]) {
			if (this.modules[page][ind].identifier === identifier) {
				return ind;
			}
		}
		
		return -1;
	},

	displayModule: function(identifiers, page) {		
		if (!Array.isArray(identifiers)) {
			identifiers = Array.from(identifiers);
		}
		
		MM.getModules().forEach(module => {
			existInModules = this.moduleInPage(module.identifier, page);
			if (identifiers.includes(module.identifier) && existInModules !== -1) {
				//if (module.hidden == true) {
					module.show(this.animationTime, { lockString: "MMM-Screen-Control" });
					this.modules[page][existInModules].hidden = false;
				//}
				
			}
		});
	},
	
	changePage: function(cmd) {
		console.log("change page: " + cmd);
		if (this.locking === false) {
			this.locking = true;
			this.sendNotification(cmd);
			
			setTimeout(() => {
				
				this.locking = false;
			}, this.animationTime);
		}
	},
	
	handleModulesByPage: function() {
		identiferArr = this.modules[this.currentPage].map((module) => module.identifier);
		console.log(this.modules);
		
		hide_identifers = [];
		display_identifers = [];
		MM.getModules().forEach(module => {
			desInd = identiferArr.indexOf(module.identifier);
			if (desInd !== -1) {
				if (this.modules[this.currentPage][desInd].hidden === true){
					hide_identifers.push(this.modules[this.currentPage][desInd].identifier);
				} else {
					display_identifers.push(this.modules[this.currentPage][desInd].identifier);
				}
			}
		});
		
		console.log("cac module se bi an");
		console.log(hide_identifers);
		console.log("cac module se hien thi");
		console.log(display_identifers);
		
		this.hideModule(hide_identifers, this.currentPage);
		this.displayModule(display_identifers, this.currentPage);
	},
	
	setAnimationTime: function() {
		MM.getModules().forEach(module => {
			if (module.name == "EXT-Pages") {
				this.animationTime = module.config.animationTime;
				return;
			}
		});
	},
	
	getAllVisibleModule: function() {
		this.modules = [];
  
		MM.getModules().forEach(module => {
			if (module.name === "EXT-Pages") {
				pagesObj = module.config.pages;
				extPageFixed = module.config.fixed;
				
				pagesArr = Object.values(pagesObj);
				
				pagesArr.forEach(page => {
					classStr = page.join(' ') + ' ' + extPageFixed.join(' ');
					classStr = classStr.trim();
        
					tmp = [];
					MM.getModules().forEach(module => {
						let classList = module.data.classes.split(' ');
						classList.forEach(cls => {
							if (classStr.includes(cls)) {
								let name = this.modifyName(module.data.name);				
								tmp.push({
									"name": name,
									"hidden": false,
									"identifier": module.identifier,
								});
							}	
						});
    
					});
					this.modules.push(tmp);
        
				});		
				return;
			}
		});
	},

	modifyName: function(name) {
		name = name.replace("MMM", '');
		name = name.replace('-', ' ');
		name = name.trim();

		return name;
	},
	
})
