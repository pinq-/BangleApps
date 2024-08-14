var HZ = 100;
var SAMPLES = 1.6 * HZ;
var SCALE = 2000;
var accelx = new Int16Array(SAMPLES);
var accely = new Int16Array(SAMPLES);
var accelz = new Int16Array(SAMPLES);
var timestep = new Uint16Array(SAMPLES);
var accelId = 0;
var total_throws = 0;
var total_time = 0;
var throws_acc = [];
// Todo 
//  Kiihtyvyys viimeisen nelj ä n heiton perusteella
// Bpm 
var settings = require('Storage').readJSON("Kyykka.settings.json", true) || {};

function saveSettings() {
    require("Storage").writeJSON("Kyykka.settings.json",settings);
  }
function loadSettings() {
    settings = require("Storage").readJSON("Kyykka.settings.json",1)||{};
  }

function SaveThrowJson(json_n){
  //print(timestep);
  require("Storage").write("KyRec_" + (json_n + 1) + ".json", btoa(accelx.buffer) + "-*-" +  btoa(accely.buffer) + "-*-" + btoa(accelz.buffer) + "-*-" + btoa(timestep.buffer));
  //print(btoa(timestep.buffer));
}

function RemoveOldJson(json_files){
  //let json_files = require("Storage").list(/^KyRec_.*.json$/);
  json_files.forEach(f_json => {
    require("Storage").erase(f_json);
  });
}

function SaveFile(){
  g.clear();
  E.showMessage("Saving data");
  let storage = require("Storage");
  //let csv_files_N = storage.list(/^KyAc_.*$/).length;
  let json_files = storage.list(/^KyRec_.*.json$/);
  let csv = "";
  let date = new Date();
  let fn = ("0" + ~~(date.getDate())).slice(-2) + ("0" + ~~(date.getMonth() +1)).slice(-2) + date.getFullYear().toString().substr(-2) + "_" + date.getHours() + ("0" + ~~(date.getMinutes())).slice(-2);
  fn = "KyAc_" + fn + ".csv";
  let json_data = "";
  //print(throws_acc);
  let save_file = require("Storage").open(fn,"w");
  json_files.forEach(f_json => {
    csv = "";
    let json_data = storage.read(f_json).split('-*-');
    accelx = new Int16Array(E.toArrayBuffer(atob(json_data[0])));
    accely = new Int16Array(E.toArrayBuffer(atob(json_data[1])));
    accelz = new Int16Array(E.toArrayBuffer(atob(json_data[2])));
    timestep = new Uint16Array(E.toArrayBuffer(atob(json_data[3])));
    for (var i = 0; i < accelx.length; i++){
      csv += `${timestep[i]},${accelx[i]/SCALE},${accely[i]/SCALE},${accelz[i]/SCALE}\n`;
    }
    csv += `${0},${0},${0},${0}\n`;
    save_file.write(csv);
    //offset++;
    //if (offset_old == 0)
    //  storage.write(fn, csv);
    //else
    //  storage.write(fn, csv, offset_old);
    //print(offset_old);
    //offset_old = offset;
  });
  //if (csv != "") storage.write(fn, csv);
  //    storage.write(file.name,txt,file.offset);
  //  file.offset += l;
  RemoveOldJson(json_files);
  g.clear();
  E.showMessage("Saved");
  g.clear();
}
function showMenu() {
	var menu = {
		"": {
			title: "Kyykka ä pp"
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
	accelId = 0;
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
  if (settings.save_record) SaveFile();
  //print(accelx);
  //print(throws_acc);
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
				},{
					type: "txt",
					id: "Thr_speed",
					font: "6x8:2",
					label: "0",
					bgCol: "#69F",
          col: "#000",
					pad: 5,
					fillx: 1
				},
         ]
		}, {
			btns: [{
					id: "btnStop",
					label: "STOP",
					cb: () => {
						if (stopped) {
							showMenu();
						} else {
							layout.state.label = "STOPPED";
							layout.state.bgCol = "#0f0";
              layout.render();
							Bangle.removeListener("accel", accelHandler);
              recordStop();
              stopped = true;
              let date = new Date();
              settings.throws_n = settings.throws_n + total_throws + Throws_n;
              settings.total_time = settings.total_time + show_time;
              settings.throw_log.push({"throws": total_throws + Throws_n, "time": show_time, "Date": date.getHours() + ":" + date.getMinutes() + " " + date.getDate() + "." + (date.getMonth() +1) + "." + date.getFullYear().toString().substr(-2)});
              saveSettings();
              layout.render();
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
  var show_time = 0;
  var t_old = 0;
  var throw_time_limit = 0;
  //var write_record = 0;
  var write_time = getTime();
  let end_samples = 40;
  let end_sample_n = 0;
  let save_record = settings.save_record;
  let g_lim = settings.throw_g_lim;
  let throw_max_g = 0;
  var show_max_thorw_g = 0;
  let thorw_max_g_n = 0;
  
  function add_round(){
    round_n++;
    total_throws = total_throws + Throws_n;
    Throws_n = 0;
    if (save_record) SaveFile();
    render_layout();
  }
	function accelHandler(accel) {
    let timer_ref = getTime();
    aX = Math.abs(accel.x * 2);
    //console.log(aX);
    //print(getTime() - start_time);
    if ((timer_ref - t_old) > 60){ // render every 60 sec
      //print((t - t_old));
      t_old = timer_ref;
      show_time = ~~(timer_ref - start_time);
      render_layout();
    }
    if (throw_max_g != 0){
      throw_max_g += aX;
      thorw_max_g_n++;
      if (aX < g_lim){
        show_max_thorw_g = ((throw_max_g / thorw_max_g_n) * (timer_ref -throw_time_limit)).toFixed(2);
        throw_max_g = 0;
        thorw_max_g_n = 0;
        if (end_sample_n < 2) render_layout();
      }
    }
    //print(aX, g_lim ,(timer_ref -throw_time_limit));
		if (aX > g_lim && (timer_ref -throw_time_limit) > 3 ) {
      //console.log(aX, show_time);
      throw_time_limit = timer_ref;
      throw_max_g = aX;
      end_sample_n = 1;
      thorw_max_g_n = 1;
      Throws_n++;
		}
    if (save_record){
      if (end_sample_n ==  end_samples) {
        SaveThrowJson(Throws_n);
        //json_n++;
        //print(Throws_n, end_sample_n);
        end_sample_n = 0;
        write_time = timer_ref;
        accelx.fill(0);
        accely.fill(0);
        accelz.fill(0);
        timestep.fill(0);
        render_layout();
      }
      accelx[accelId] = accel.x * SCALE * 2;
      accely[accelId] = accel.y * SCALE * 2;
      accelz[accelId] = accel.z * SCALE * 2;
      if ((timer_ref - write_time) > 65) write_time = timer_ref; // If it goes over 65535. Limit of the Uint16
      timestep[accelId] = (timer_ref - write_time)*1000;
      if (end_sample_n > 0) end_sample_n++;
      accelId++;
      if (accelId == SAMPLES) accelId = 0;
    }
	}
  function render_layout(){
    layout.throws.label = Throws_n + "/" + (settings.max_throws -  Throws_n);
		layout.time.label = Math.floor(show_time / 3600) + ":" + ("0" + ~~(show_time / 60)).slice(-2);
    layout.round.label = round_n;
    layout.total_throws.label = (total_throws + Throws_n) + "/" + (2*settings.max_throws -  (total_throws + Throws_n));
    layout.Thr_speed.label = show_max_thorw_g + " g/s";
		layout.render();
  }
  
  render_layout();
	Bangle.on("accel", accelHandler);
}
Bangle.loadWidgets();
Bangle.drawWidgets();
showMenu();