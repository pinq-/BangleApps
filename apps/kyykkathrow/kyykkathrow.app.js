
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
// Todo 
//  Kiihtyvyys viimeisen nelj ä n heiton perusteella
// Bpm 
var settings = require('Storage').readJSON("kyykkathrow.settings.json", true) || {"max_throws":0,"throw_g_lim":5,"throws_n":0,"total_time":0 , "throw_log":[]};

function saveSettings() {
    require("Storage").writeJSON("kyykkathrow.settings.json",settings);
  }
function loadSettings() {
    settings = require("Storage").readJSON("kyykkathrow.settings.json",1)||{"max_throws":0,"throw_g_lim":5,"throws_n":0,"total_time":0 , "throw_log":[]};
  }

function SaveThrowJson(json_n){
  //print(timestep);
  require("Storage").write("kyykkathrow_KyRec_" + (json_n + 1) + ".json", btoa(accelx.buffer) + "-*-" +  btoa(accely.buffer) + "-*-" + btoa(accelz.buffer) + "-*-" + btoa(timestep.buffer));
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
  let json_files = storage.list(/^kyykkathrow_KyRec_.*.json$/);
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

function Send_bl_Throw(){
  Bluetooth.println(JSON.stringify({data:{timestep:timestep, acc:{x:accelx}, inx:accelId, mode: 1, device: "Bangle", battery: E.getBattery()}}));
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
      eval(require("Storage").read("kyykkathrow.settings.js"))(() => showMenu());
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
  NRF.setTxPower(8);
  startRecord();
}

function recordStop() {"ram"
  console.log("end settings");
  Bangle.setPollInterval(80);
  Bangle.accelWr(0x18, 0b01101100);
  Bangle.accelWr(0x1B, 0x0);
  Bangle.accelWr(0x18, 0b11101100);
  if (settings.save_record) SaveFile();
  NRF.setTxPower(4);
  //print(accelx);
  //print(throws_acc);
}

function rerange_array(ar, inx){
  if (inx == 0 || inx > (ar.length -1)) return ar;
  return ar.slice(inx,ar.length).concat(ar.slice(0,inx));
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
                  //pad: 2
                }, {
                  type: "txt",
                  id: "throws",
                  font: "6x8:3",
                  label: "  -  ",
                  //pad: 5,
                  bgCol: g.theme.bg
                }, ]
              },{
          fillx: 1
            },{
              type: "v",
              c:  [{
                  type: "txt",
                  font: "6x8",
                  label: "Round Time",
                }, {
                  type: "txt",
                  id: "round_time",
                  font: "6x8:3",
                  label: "----",
                }]
            }, ]
        }, {
          type: "h",
          c: [{
                type: "v",
                c: [{
                  type: "txt",
                  font: "6x8",
                  label: "Round",
                }, {
                  type: "txt",
                  id: "round",
                  font: "6x8:3",
                  label: "-",
                }, ]
            }, {
                type: "v",
                c: [{
                  type: "txt",
                  font: "6x8",
                  label: "Pre",
                }, {
                  type: "txt",
                  id: "pre_round",
                  font: "6x8:3",
                  label: " - ",
                }]
            }, {
                type: "v",
                c:[{
                  type: "txt",
                  font: "6x8",
                  label: "Total Thr",
                  //pad: 2
                }, {
                  type: "txt",
                  id: "total_throws",
                  font: "6x8:3",
                  label: "---",
                  //pad: 5,
                  bgCol: g.theme.bg
                }]
            }]
        }, {
          filly: 1
        }, {
          type: "h",
          c: [{
                type: "v",
                c: [{
                  type: "txt",
                  font: "6x8",
                  label: "pre Speed",
                }, {
                  type: "txt",
                  id: "pre_speed",
                  font: "6x8:3",
                  label: "---",
                }, ]
            },{
                type: "v",
                c: [{
                  type: "txt",
                  font: "6x8",
                  label: "Speed g/s",
                  //pad: 3
                }, {
                  type: "txt",
                  id: "Thr_speed",
                  font: "6x8:3",
                  label: "  -  ",
                  //pad: 5,
                  bgCol: g.theme.bg
                }, ]
            }]
        }, {
          type: "h",
          c: [{
                  type: "btn",
                  cb: l=>add_round(),
                  src: require("icons").getIcon("sync")
                }, {
                  type: "btn",
                  id: "time",
                  font: "6x8:3",
                  label: "-",
                  fillx: 1,
                  cb: l=>pause_recording(),
                  btnFaceCol: "#0000FF",
                }, {
                  type: "btn",
                  id: "btnStop",
                  src: require("icons").getIcon("close"),
                  btnFaceCol: "#f00",
                  cb: () => {
                    if (stopped) {
                      showMenu();
                    } else {
                      layout.btnStop.btnFaceCol = "#0f0";
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
            }]
        }, 
         ]
    }, {lazy:true});
  layout.render();
  //layout.debug();
  var start_time = getTime();
  var Throws_n = 0;
  var aX = 0, aX_avg = 0;
  var show_time = 0;
  var t_old = 0; // for rendering every second
  var throw_time_limit = 0;
  var write_time = getTime();
  let end_samples = 20;
  let end_sample_n = 0;
  let save_record = settings.save_record;
  let send_bt = settings.send_bl;
  let g_lim = settings.throw_g_lim;
  //let throw_max_g = 0;
  var show_thr_speed = 0;
  var show_thr_speed_back = 0;
  var thr_speed_back = 0;
  var thr_speed = 0;
  //let thorw_max_g_n = 0;
  let pause = false;
  let round_time = getTime();
  let acc_d = 0, acc_d_n = 0;
  let acc_d_reset_n = 0;
  let acc_d_time = 0;
  //let pre_acc_d = 0;
  let pre_acc_d_time = getTime();
  let pre_acc_1 = 1, pre_acc_2 = 1;
  let timer_ref = 0;
  
  
  function add_round(){
    round_n++;
    total_throws = total_throws + Throws_n;
    layout.pre_round.label = (settings.max_throws -  Throws_n);
    Throws_n = 0;
    round_time = getTime();
    if (save_record) SaveFile();
    render_layout();
  }
  
  function pause_recording(){
    pause = !pause;
    if (pause){
      layout.time.btnFaceCol = "#f00";
      //Bangle.removeListener("accel", accelHandler);
    }
    else{
      layout.time.btnFaceCol = "#0000FF";
      //Bangle.on("accel", accelHandler);
    }
    layout.render();
  }
  
  function is_it_throw(){
    //let test_x  = rerange_array(accelx, accelId);
    //let test_time  = rerange_array(timestep, accelId);
    let time_ref = 0, last_time = 0, edge_start_time = 0;
    let pre_ax = 1, pre_ax_n = 0,ax_off_n = 0, speed = 0, pre_speed = 0;
    let pull_speed = 0,thorw_speed = 0, is_it_throw = false;
    for( let i = accelId + 1; i !== accelId; i++){
      if( i == accelx.length) i = 0;
    //test_x.forEach((x, i) => {
      time_ref = timestep[i]/1000;
      //time_ref = test_time[i]/1000;
      x = Math.abs(accelx[i] /SCALE);
      //x = Math.abs(x /SCALE);
      if (pre_ax < x){
        pre_ax = x;
        pre_ax_n ++;
        last_time = time_ref;
      }
      else {
        ax_off_n ++;
        if (ax_off_n > 20){
          if (pre_ax_n > 10){
            speed = (pre_ax - 1)/ (last_time - edge_start_time);
            //print("kerattya",speed, pre_speed, pre_ax, (last_time- (timestep[accelId]/1000))*1000, (edge_start_time- (timestep[accelId]/1000))*1000,(last_time - edge_start_time), pre_ax_n)

            if (speed > settings.throw_speed_lim && (last_time - edge_start_time) < 2 && pre_speed < speed){
              //thorw_speed = speed;
              //pull_speed = pre_speed;
              is_it_throw = true;
              show_thr_speed = speed;
              show_thr_speed_back = pre_speed;
              //print(show_thr_speed, show_thr_speed_back)
            }
            pre_speed = speed;
          }
          pre_ax = 1;
          pre_ax_n = 0;
          edge_start_time = time_ref;
          ax_off_n = 0;
        }
      }
    };
    //print("throw speed",show_thr_speed);
    //print(test_x);
    //print(test_time);
    if(is_it_throw){
     return true
    }
    else{
      return false
    }
  }
  function accelHandler(accel) {
    //print(getTime() - timer_ref);
    timer_ref = getTime();
    aX = Math.abs(accel.x * 2);
    //aX_avg = (aX + pre_acc_1 + pre_acc_2) / 3;
    //pre_acc_2 = pre_acc_1;
    //pre_acc_1 = aX;
    //(getTime() - start_time);
    if ((timer_ref - t_old) > 60){ // render every 1 min
      //print((t - t_old));
      t_old = timer_ref;
      show_time = ~~(timer_ref - start_time);
      render_layout();
    }
    if (pause) return;
    //if (throw_max_g != 0){
    //  throw_max_g += aX;
    //  thorw_max_g_n++;
    //  if (aX < g_lim){
        //show_max_thorw_g = ((throw_max_g / thorw_max_g_n) * (timer_ref -throw_time_limit)).toFixed(2);
    //    throw_max_g = 0;
    //    thorw_max_g_n = 0;
    //    if (end_sample_n < 2) render_layout();
    //  }
    // }
    //print(aX_avg, aX);
    //if (acc_d < aX){ // calculate acceleration of acc_x
      //print(aX);
    //  acc_d = aX
      //pre_acc_2 = pre_acc_1;
      //pre_acc_1 = aX;
    //  acc_d_n += 1;
    //}
    //else {
    //  acc_d_reset_n ++;
    //  if (acc_d_reset_n > 3){
    //    //print("tulostaa", acc_d_reset_n, acc_d_n, pre_acc);
    //    if ( acc_d_n > 4){
    //      thr_speed = ((acc_d - 1) /(timer_ref - acc_d_time)) << 0;
    //      //print(thr_speed, acc_d_n , (timer_ref - acc_d_time), acc_d);
    //      if(thr_speed > settings.throw_speed_lim -10 && (timer_ref - acc_d_time) < 2 && thr_speed_back < thr_speed ){
    //        //print("heitto");
    //        Throws_n++;
    //        end_sample_n = 1;
    //        show_thr_speed = thr_speed;
    //        show_thr_speed_back = thr_speed_back;
    //        render_layout();
    //      }
    //      thr_speed_back = thr_speed;
    //      pre_acc_d_time = timer_ref;
    //    }
    //    acc_d_reset_n = 0;
    //    //pre_acc_1 = 1;
    //    //pre_acc_2 = 1;
    //    acc_d_time = timer_ref;
    //    acc_d = 1;
    //    acc_d_n = 0;
    //  }
    //}
    //print(aX, g_lim ,(timer_ref -throw_time_limit));
    //if (aX > g_lim && (timer_ref -throw_time_limit) > 3 ) {
      //console.log(aX, show_time);
      //throw_time_limit = timer_ref;
      //throw_max_g = aX;
      //end_sample_n = 1;
      //thorw_max_g_n = 1;
      //Throws_n++;
    //}
    if (g_lim < aX){// Was it a throw
      acc_d_n ++;
      print(" over 5g", acc_d_n);
      if (acc_d_n > 4){
        end_sample_n = 1;
        acc_d_n = 0;
      }
    }

    //if (save_record || send_bt){
      if (end_sample_n ==  end_samples) {
        //print("is it a throw");
        if(send_bt) Send_bl_Throw();
        if(is_it_throw()){
          if(save_record) SaveThrowJson(Throws_n);
          //if(send_bt) Send_bl_Throw();
          Throws_n++;
          //json_n++;
          //print(Throws_n, end_sample_n);
          end_sample_n = 0;
          write_time = timer_ref;
          accelx.fill(0);
          //accely.fill(0);
          //accelz.fill(0);
          timestep.fill(0);
          render_layout();
        }
      }
      accelx[accelId] = accel.x * SCALE * 2;
      //accely[accelId] = accel.y * SCALE * 2;
      //accelz[accelId] = accel.z * SCALE * 2;
      if ((timer_ref - write_time) > 65) write_time = timer_ref; // If it goes over 65535. Limit of the Uint16
      timestep[accelId] = (timer_ref - write_time)*1000;
      if (end_sample_n > 0) end_sample_n++;
      accelId++;
      if (accelId == SAMPLES) accelId = 0;
    //}
  }
  function render_layout(){
    let render_round_time = ~~(getTime() - round_time);
    layout.throws.label = Throws_n + "/" + Math.max(0,(settings.max_throws -  Throws_n));
    layout.time.label = Math.floor(show_time / 3600) + ":" + ("0" + ~~(show_time%3600/60)).slice(-2);
    layout.round_time.label = Math.floor(render_round_time / 3600) + ":" + ("0" + ~~(render_round_time%3600/60)).slice(-2);
    layout.round.label = round_n;
    layout.total_throws.label = (total_throws + Throws_n); //+ "/" + (2*settings.max_throws -  (total_throws + Throws_n));
    layout.pre_speed.label = ~~(show_thr_speed_back);
    layout.Thr_speed.label = ~~(show_thr_speed);
    layout.render();
  }
  
  render_layout();
  Bangle.on("accel", accelHandler);
}
Bangle.loadWidgets();
Bangle.drawWidgets();
showMenu();