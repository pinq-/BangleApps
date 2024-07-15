(
	function (back) {
	var settings = require("Storage").readJSON("Kyykka.settings.json", 1) || {};

  function saveSettings() {
    require("Storage").writeJSON("Kyykka.settings.json",settings);
  }
  function showMenu() {
    var menu = [];
		menu[""] = {
			title: "Settings",
			back: back
		};
		menu.push({
			title: "Max throws",
      value : settings.max_throws, min: 4, max:20, step:4,
      onchange : (v)  => {
              settings.max_throws = v;
              saveSettings();
      }
		});
    menu.push({
			title: "Throw g lim",
      value : settings.throw_g_lim, min: 2, max:8,
      onchange : (v)  => {
              settings.throw_g_lim = v;
              saveSettings();
      }
		});
    menu.push({
			title: "Reset records",
      onchange : ()  => {
        E.showPrompt("Reset records?").then(function(yes) {
        if (yes) {
          settings.total_time = 0;
          settings.throws_n = 0;
          saveSettings();
          }
         showMenu();
        });
      }
		});
		E.showMenu(menu);
	}
  showMenu();
})