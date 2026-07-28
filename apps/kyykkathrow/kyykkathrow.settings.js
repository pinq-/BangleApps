(
  function (back) {
    var settings = require("Storage").readJSON("kyykkathrow.settings.json", 1) || {"max_throws":0,"throw_g_lim":5,"throws_n":0,"total_time":0};

    function saveSettings() {
      require("Storage").writeJSON("kyykkathrow.settings.json",settings);
    }
    function showMenu() {
      var menu = [];
      menu[""] = {
        title: "Settings",
        back: back
      };
      menu.push({
        title: "Max throws",
        value : settings.max_throws, min: 4, max:20, step:2,
        onchange : (v)  => {
                settings.max_throws = v;
                saveSettings();
        }
      });
      menu.push({
        title: "Throw g-force threshold",
        value : settings.throw_g_lim, min:1 , max:7, step:0.5,
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
            settings.throw_log = [];
            saveSettings();
            }
          showMenu();
          });
        }
      });
      menu.push({
        title: "Save record",
        value : settings.save_record,
        format : v => v?"On":"Off",
        onchange : v => { settings.save_record = v; saveSettings();}
      });
      menu.push({
        title: "Send bl",
        value : settings.send_bl,
        format : v => v?"On":"Off",
        onchange : v => { settings.send_bl = v; saveSettings();}
      });
      E.showMenu(menu);
    }
    showMenu();
})