var recipe = {
  transcriptionHooks: {
      "HIDE_SCREEN": {
        pattern: "^tắt (hiển thị|màn hình)$",
        command: "HIDE_SCREEN"
      },
      "DISPLAY_SCREEN": {
		 pattern: "^bật (hiển thị|màn hình)$",
        command: "DISPLAY_SCREEN"
	  },
  },
  commands: {
    "HIDE_SCREEN": {
      moduleExec:{
      module: "MMM-GoogleAssistant",
      exec: (module, param, from)=>{
		  module.sendNotification("MMM-Screen-Control", {type: "HIDE_SCREEN"});
		  }
      }
    }, 
    "DISPLAY_SCREEN": {
	  moduleExec:{
      module: "MMM-GoogleAssistant",
      exec: (module, param, from)=>{
		  module.sendNotification("MMM-Screen-Control", {type: "DISPLAY_SCREEN"});
		  }
      }
	}
  },
  plugins: {
    // Describe your plugin callback functions here.
    //
  },
}

exports.recipe = recipe // Don't remove this line.

