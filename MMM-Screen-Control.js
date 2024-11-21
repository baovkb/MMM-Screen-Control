Module.register("MMM-Screen-Control", {
    isLocking: false,
    profileData: null,
    indexProfile: 0,

	defaults: {
		profiles: [],
        animationTime: 500,
        useLockString: true
	},

	init: function() {
	},

	start: function() {
        
	},

	getScripts: function() {
	    return	[]
	}, 

	getStyles: function() {
		return ['modules/MMM-Screen-Control/style.css']
	},

    initData: function () {
        this.profileData = Array(this.config.profiles.length).fill(null).map(() => ({}));

        this.profileData.forEach((profile, indexProfile) => {            
            profile.name = this.config.profiles[indexProfile].name
            profile.currentPage = 0
            
            profile.pages = this.config.profiles[indexProfile].pages.map(page => 
                page.map((className) => {
                    module = MM.getModules().find(module => module.data.classes.includes(className))
                    
                    if (module === undefined) return
                    return {
                        name: className,
                        identifier: module.identifier,
                        hidden: false
                    }
            }
            ))
            
        })

        console.log(this.profileData)
    },

	notificationReceived: function(notification, payload, sender) {
        switch (notification) {
            case "ALL_MODULES_STARTED":
                this.initData()
                break
            case "DOM_OBJECTS_CREATED":
                this.updatePageDom()
                break
            case "MMM-Screen-Control": 
                currentPage = this.profileData[this.indexProfile].currentPage
                modulesByPage = this.profileData[this.indexProfile].pages[currentPage]
                pageLength = this.profileData[this.indexProfile].pages.length

                if (payload.type == "NEXT_PAGE") {
                    tmp = currentPage == pageLength - 1 ? 0 : currentPage + 1
                    this.selectPage(tmp)
                } else if (payload.type == "PREVIOUS_PAGE") {
                    tmp = currentPage == 0 ? pageLength - 1 : currentPage - 1
                    this.selectPage(tmp)
                }
                else if (payload.type == "CHANGE_MODULES") {
                    modulesRequest = payload.data;
			
					if (!Array.isArray(modulesRequest)) {
						modulesRequest = Array.from(modulesRequest);
					}

                    modulesByPage.forEach(module => {
                        foundModule = modulesRequest.find(m => m.identifier == module.identifier);
                        if (foundModule != null) {
                            module.hidden = foundModule.hidden
                        }
                    })

                    this.updatePageDom()
                } else if (payload.type == "CHANGE_PROFILE") {
                    firstInd = this.profileData.findIndex(profile => profile.name == payload.data)
                    if (firstInd == -1) return;

                    this.indexProfile = firstInd;
                    this.updateDom()
                    this.updatePageDom()
                
                } else if (payload.type == "ENABLE_TMP_DISPLAY"){
                    identifier = payload.data
                    callback = payload.callback
                    lockPage = typeof payload.lockPage !== 'boolean' ? false : payload.lockPage

                    MM.getModules().forEach(module => {
                        if (module.identifier == identifier) {
                            this.isLocking = lockPage ? true : this.isLocking
                            if (this.config.useLockString) module.show(0, () => null, { lockString: "MMM-Screen-Control" })
                            else module.show(0)
                            callback()
                        }
                    })
                    
                } else if (payload.type == "DISABLE_TMP_DISPLAY") {
                    identifier = payload.data
                    callback = payload.callback

                    //check if module present in current page
                    isPresent = false
                    modulesByPage.forEach(module => {
                        if (module.identifier == identifier) isPresent = true
                    })

                    if (isPresent) {
                        this.isLocking = false;
                        callback()
                        return;
                    }

                    MM.getModules().forEach(module => {
                        if (module.identifier == identifier) {
                            this.isLocking = false
                            if (this.config.useLockString) module.hide(0, () => null, { lockString: "MMM-Screen-Control" })
                            else module.hide(0)
                            callback()
                        }
                    })
                }
            default: break

        }
	},

	socketNotificationReceived: function(notification, payload) {
	},

	suspend: function(){

	},

	resume: function(){

	},

	getDom: function() {
        self = this
		var wrapper = document.createElement("div")
        wrapper.classList.add('container')
        wrapper.classList.add('mmm-screen-control')

        currentProfile = this.profileData[this.indexProfile]

        for (let i = 0; i < currentProfile.pages.length; ++i) {
            //build indicator
            const circle = document.createElement('div');
            circle.classList.add('circle');
            circle.classList.add('mmm-screen-control')
            if (i == this.profileData[this.indexProfile].currentPage) {
                circle.classList.add('active');
            }

            circle.addEventListener('click', () => {
                if (i == this.profileData[this.indexProfile].currentPage) return;

                self.selectPage(i)
            });

            wrapper.appendChild(circle);
        }

		return wrapper;
	},

    selectPage: function(newPage) {
        if (this.isLocking == true) return;

        let circles = document.querySelectorAll('.circle.mmm-screen-control');
        circles.forEach(c => c.classList.remove('active'))
        circles[newPage].classList.add('active');

        this.profileData[this.indexProfile].currentPage = newPage;

        this.updatePageDom();
    },

    updatePageDom: function() {
        if (this.isLocking == true) return;

        this.isLocking = true;
        displayModules = []

        MM.getModules().forEach(module => {
            page = this.profileData[this.indexProfile].currentPage
            currentPage = this.profileData[this.indexProfile].pages[page]

            currentPage.forEach(pageModule => {
                if (pageModule == undefined) return;
                if (module.identifier == pageModule.identifier && pageModule.hidden == false) 
                    displayModules.push(module.identifier)
            })
        })

        MM.getModules().forEach(module => {
            if (module.data.classes.includes(this.data.classes)) return;
            let found = displayModules.findIndex(m => m == module.identifier);
            if (found != -1) {
                if (this.config.useLockString) module.show(this.config.animationTime, () => null, { lockString: "MMM-Screen-Control" })
                else module.show(this.config.animationTime)
                
            } else {
                if (this.config.useLockString) module.hide(this.config.animationTime, () => null, { lockString: "MMM-Screen-Control" })
                else module.hide(this.config.animationTime)
            }
            
        })

        setTimeout(() => {
            this.isLocking = false;
        }, this.animationTime);

        currentPage = this.profileData[this.indexProfile].currentPage

        this.sendNotification('PAGE_CHANGED', {
            profile: this.profileData[this.indexProfile].name,
            currentPage: currentPage,
            totalPage: this.profileData[this.indexProfile].pages.length,
            pageModules: this.profileData[this.indexProfile].pages[currentPage]
        })
    },
})
