Module.register("MMM-Screen-Control", {
    isLocking: false,
    profileData: null,
    indexProfile: 0,

	defaults: {
		profiles: [],
        animationTime: 500,
	},

	init: function() {
	},

	start: function() {
        
	},

	getScripts: function() {
	    return	[]
	}, 

	getStyles: function() {
		return ['style.css']
	},

    initData: function () {
        this.profileData = Array(this.config.profiles.length).fill(null).map(() => ({}));

        this.profileData.forEach((profile, indexProfile) => {            
            profile.name = this.config.profiles[indexProfile].name
            profile.currentPage = 0
            
            profile.pages = this.config.profiles[indexProfile].pages.map(page => 
                page.map((className) => {
                    module = MM.getModules().find(module => module.data.classes.includes(className))
                    return {
                        name: className,
                        identifier: module.identifier,
                        hidden: false
                    }
            }
            ))
            
        })
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
                pageLength = this.profileData[this.indexProfile].pages.length

                if (payload.type == "NEXT_PAGE") {
                    tmp = currentPage == pageLength - 1 ? 0 : currentPage + 1
                    this.selectPage(tmp)
                } else if (payload.type == "PREVIOUS_PAGE") {
                    tmp = currentPage == 0 ? pageLength - 1 : currentPage - 1
                    this.selectPage(tmp)
                }
                else if (payload.type == "CHANGE_MODULES") {
                    modulesByPage = this.profileData[this.indexProfile].pages[currentPage]
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

                } else {

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
                if (this.isLocking == true || i == this.profileData[this.indexProfile].currentPage) return;

                self.selectPage(i)
            });

            wrapper.appendChild(circle);
        }

		return wrapper;
	},

    selectPage: function(newPage) {
        let circles = document.querySelectorAll('.circle.mmm-screen-control');
        circles.forEach(c => c.classList.remove('active'))
        circles[newPage].classList.add('active');

        this.profileData[this.indexProfile].currentPage = newPage;

        this.updatePageDom();
    },

    updatePageDom: function() {
        this.isLocking = true;
        displayModules = []

        MM.getModules().forEach(module => {
            page = this.profileData[this.indexProfile].currentPage
            currentPage = this.profileData[this.indexProfile].pages[page]

            currentPage.forEach(pageModule => {
                if (module.identifier == pageModule.identifier && pageModule.hidden == false) 
                    displayModules.push(module.identifier)
            })
        })

        MM.getModules().forEach(module => {
            if (module.data.classes.includes(this.data.classes)) return;
            let found = displayModules.findIndex(m => m == module.identifier);
            if (found != -1) {
                module.show(this.config.animationTime, () => null, { lockString: "MMM-Screen-Control" })
            } else module.hide(this.config.animationTime, () => null, { lockString: "MMM-Screen-Control" })
            
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