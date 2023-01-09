const { app, BrowserWindow, ipcMain} = require('electron')
const storage = require('electron-json-storage');
const path = require('path')
const isDev = require('electron-is-dev')
const mysql = require('mysql');
let mainWindow = null;

function createMainWindow () {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 400,
        resizable:false,
        webPreferences: {
            nodeIntegration:true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    mainWindow.loadURL(
          isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, 'index.html')}`
        )
}
try {
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'username',
        password : '',
        database : 'temp'
      });
      
      connection.connect();
} catch (error) {
    mainWindow.webcontents.send('log',{error});
}
app.on('ready', () => {
 createMainWindow();
 try {
    var data = storage.getSync('Data');
       if(!data.length){
        storage.set('Data',[], function(error) {
                            if (error) throw error;
                          });
       }  
} catch (error) {
    mainWindow.webcontents.send('log',{error});
}





})
function newEntry(){
    let num =Math.floor(Math.random() * 10000000000000);
    let d= new Date(Date.now());
    let date= d.toString();
    return {number:num,date:date};
}
ipcMain.on('save',()=>{
    let Entry=newEntry()
try {
    var data = storage.getSync('Data');
    data.push(Entry)
    storage.set('Data',data, function(error) {
        if (error) throw error;
      });
} catch (error) {
    mainWindow.webcontents.send('log',{error});
}

// var qry = 'SELECT `emp_id`,`emp_name` FROM `employee`';

// connection.query(qry, function (error, results, fields) {
//     if (error) console.log(error.code);
//     else {
//         console.log(results);
//         $('#resultDiv').text(results[0].emp_name); //emp_name is column name in your database
//     }
//    });

})