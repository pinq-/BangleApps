var HZ = 100;
var SAMPLES = 2 * HZ;
var SCALE = 2000;
var accelx = new Int16Array(SAMPLES);
var accely = new Int16Array(SAMPLES);
var accelz = new Int16Array(SAMPLES);
var timestep = new Int16Array(SAMPLES);
var accelIdx = 0;
var total_throws = 0;
var total_time = 0;

var settings = require('Storage').readJSON("Kyykka.settings.json", true) || {};

function saveSettings() {
    require("Storage").writeJSON("Kyykka.settings.json",settings);
  }
function loadSettings() {
    settings = require("Storage").readJSON("Kyykka.settings.json",1)||{};
  }
function showMenu() {
	var menu = {
		"": {
			title: "Kyykka äpp"
		},
		"< Back": function () {
			load();
		},
		"Start": function () {
      loadSettings();
			E.showMenu();
      recordStart();
		},
		"View Logs": function () {
			viewLogs();
		},
    "Settings": function () {
			eval(require("Storage").read("Kyykka.settings.js"))(() => showMenu());
		},
	};
	E.showMenu(menu);
}
function viewLogs() {
    loadSettings();
		var menu = {
		"": {
			title: "Logs"
		},
		"< Back": function () {
			showMenu();
		},
		 "Total throws" : {
      value: settings.throws_n
     },
    "Total time" : {
      value:  (Math.floor(settings.total_time / 60) + ":" + ("0" + ~~(settings.total_time)).slice(-2))
     },
	};
	E.showMenu(menu);
}


function recordStart() {"ram"
  console.log("start settings");
	accelIdx = 0;
	Bangle.accelWr(0x18, 0b01110100);
	Bangle.accelWr(0x1B, 0x03 | 0x40);
	Bangle.accelWr(0x18, 0b11110100);
	Bangle.setPollInterval(10);
  startRecord();
}

function recordStop() {"ram"
  console.log("end settings");
  Bangle.setPollInterval(80);
	Bangle.accelWr(0x18, 0b01101100);
	Bangle.accelWr(0x1B, 0x0);
	Bangle.accelWr(0x18, 0b11101100);
}

function startRecord() {
	var stopped = false;
  var round_n = 1;
	g.clear(1);
	Bangle.drawWidgets();
	var Layout = require("Layout");
	var layout = new Layout({
			type: "v",
			c: [{
					type: "h",
					c: [{
							type: "v",
							c: [{
									type: "txt",
									font: "6x8",
									label: "Throws",
									pad: 2
								}, {
									type: "txt",
									id: "throws",
									font: "6x8:2",
									label: "  -  ",
									pad: 5,
									bgCol: g.theme.bg
								}, ]
						}, {
							type: "v",
							c: [{
									type: "txt",
									font: "6x8",
									label: "Time",
									pad: 2
								}, {
									type: "txt",
									id: "time",
									font: "6x8:2",
									label: "  -  ",
									pad: 5,
									bgCol: g.theme.bg
								}, ]
						}, ]
				}, {
					type: "h",
					c: [{
							type: "v",
							c: [{
									type: "txt",
									font: "6x8",
									label: "Round",
									pad: 2
								}, {
									type: "txt",
									id: "round",
									font: "6x8:2",
									label: "  -  ",
									pad: 5,
									bgCol: g.theme.bg
								}, ]
						}, {
							type: "v",
							c: [{
									type: "txt",
									font: "6x8",
									label: "Total Thr",
									pad: 3
								}, {
									type: "txt",
									id: "total_throws",
									font: "6x8:2",
									label: "  -  ",
									pad: 5,
									bgCol: g.theme.bg
								}, ]
						}]
				},{
					type: "txt",
					id: "state",
					font: "6x8:2",
					label: "RECORDING",
					bgCol: "#f00",
					pad: 5,
					fillx: 1
				},
         //{type:"h", c: [
         //  {type:"btn", label:"Round", bgCol: "#f00", cb: l=>{ add_round();}},
           //{type:"btn", label:"Random", cb: l=>{ console.log(2);}},
         // ]}
         ]
		}, {
			btns: [{
					id: "btnStop",
					label: "STOP",
					cb: () => {
						if (stopped) {
							showMenu();
						} else {
              recordStop();
							Bangle.removeListener("accel", accelHandler);
							layout.state.label = "STOPPED";
							layout.state.bgCol = "#0f0";
							stopped = true;
							layout.render();
              settings.throws_n = settings.throws_n + total_throws + Throws_n;
              settings.total_time = settings.total_time + t;
              saveSettings();
						}
					}
				},
        {label:"Round", cb: l=>add_round()}
			]
		});
	layout.render();
	var start_time = getTime();
  var Throws_n = 0;
	var maxMag = 0;
	var aX = 0;
	var maxY = 0;
	var maxZ = 0;
  var t = 0;
  var t_old = 0;
  var throw_time_limit = 0;
  function add_round(){
    round_n++;
    total_throws = total_throws + Throws_n;
    Throws_n = 0;
  }
	function accelHandler(accel) {
		t = ~~(getTime() - start_time);
    aX = Math.abs(accel.x * 2);
    console.log(aX);
    //print((t - t_old));
    if (t != t_old){
      //print((t - t_old));
      t_old = t;
      render_layout();
    }
    //print(t -throw_time_limit, t, throw_time_limit);
		if (aX > settings.throw_g_lim && (t -throw_time_limit) > 3 ) {
      //console.log(aX);
      throw_time_limit = t;
			Throws_n++;
      render_layout();
		}
	}
  function render_layout(){
    layout.throws.label = Throws_n + "/" + (settings.max_throws -  Throws_n);
		layout.time.label = Math.floor(t / 60) + ":" + ("0" + ~~(t)).slice(-2);
    layout.round.label = round_n;
    layout.total_throws.label = (total_throws + Throws_n) + "/" + (2*settings.max_throws -  (total_throws + Throws_n));
		layout.render();
  }
  
  render_layout();
	Bangle.on("accel", accelHandler);
}
Bangle.loadWidgets();
Bangle.drawWidgets();
showMenu();