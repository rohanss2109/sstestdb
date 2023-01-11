const { app, BrowserWindow, ipcMain} = require('electron')
const storage = require('electron-json-storage');
const path = require('path')
const isDev = require('electron-is-dev')
const sqlite3 = require('sqlite3').verbose();
const Excel = require('exceljs');
const fs = require('fs');
const workbook = new Excel.Workbook();
const worksheet = workbook.addWorksheet('My Sheet');
// const mysql = require('mysql');
const appDataPath = app.getPath('appData');
console.log(appDataPath)
let mainWindow = null;
let digit=13
function setdigit(data){
    digit=data;
}
function newEntry(){
    let num=null;
    if(digit===13){
        num =Math.floor(1000000000000 + Math.random() * 9000000000000)
    }else{
        num =Math.floor(100000000000 + Math.random() * 900000000000)
    }
    let date= Date.now();
    // let date= d.toString();
    return {number:num,date:date};
}
function insert(number,date){
    db.serialize(async () => {
        // let qry= "DELETE FROM projectbilling"
        if(number&&date){
            let qry=`INSERT INTO random ( number , timestamp)VALUES(${number},'${date}');`
            db.run(qry,function(err){
            if (err) {
                    console.error(err.message);
                    }
                    console.log("saved Locally");
                    mainWindow.webContents.send("log",'saved')
                });
        }
        });
    }


function create(){
    let qry=`CREATE TABLE IF NOT EXISTS random (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number INTEGER NOT NULL UNIQUE,
            timestamp TEXT NOT NULL
        );`;
        db.serialize(() => {
            db.run(qry,function(err){
            if (err) {
                    console.error(err.message);
                    }
                    console.log("DB TABLE SETUP DONE");
                });
        });
}
            
function select(){
    let qry=`SELECT * FROM random;`;
    // db.serialize(() => {
    db.all(qry,[],(err,rows) => {
        // let qry= "DELETE FROM projectbilling"
        if (err) {
            console.error(err);
            }
            if(rows){
                mainWindow.webContents.send("export",rows)
            }
            });
        // });

}

function insertexcel(number,date){
    // workbook.xlsx.readFile('example.xlsx')
    // .then(function() {
    //     // Get the first worksheet
    //     const worksheet = workbook.getWorksheet(1);

    //     // Add a new row
    //     worksheet.addRow(['New Person', 40, 'Other']);

    //     // Write the workbook to a file
    //     workbook.xlsx.writeFile('example.xlsx')
    //         .then(function() {
    //             console.log('File is written.');
    //         });
    // });
   

// Add some data to the worksheet
worksheet.addRow([number, date]);
let d= new Date(Date.now());
let file=d.toDateString()
let name='data'+file+'.xlsx'
workbook.xlsx.writeFile(path.join(appDataPath, 'sstestdb', name))
    .then(function() {
        console.log('File is written.');
    });
}

            
            
// function deleterow (id){
//     db.serialize(() => {
//         if(id){
//             let qry= `DELETE FROM random WHERE id=${id}`;
//             db.run(qry,function(err){
//             if (err) {
//                     console.error(err.message);
//                     mainWindow.webContents.send("log",{err})
//                 }
//                 mainWindow.webContents.send("log","cong")
//                     console.log("deleted Locally");
//                 });
//         }
//         });
// }
            
let db = new sqlite3.Database(path.join(appDataPath, 'sstestdb', 'database.db'), (err) => {
    if (err) {
        console.error(err.message);
    }else{
        console.log('Connected to the sqlite database.');
        create();
    }
    });
              
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
// try {
//     var connection = mysql.createConnection({
//         host     : 'localhost',
//         user     : 'root',
//         password : '',
//         database : 'temp'
//       });
//       connection.connect();
// } catch (error) {
//     mainWindow.webcontents.send('log',{error});
// }
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
    mainWindow.webContents.send('log',{error});
}

})

ipcMain.on('save',()=>{
    let Entry=newEntry()
    insert(Entry.number,Entry.date)
    insertexcel(Entry.number,Entry.date)
// try {
//     let data = storage.getSync('Data');
//     data.push(Entry)
//     storage.set('Data',data, function(error) {
//         if (error) throw error;
//       });
// } catch (error) {
//     mainWindow.webContents.send('log',{error});
// }
// try {
//     let qry = `INSERT INTO random (number, date) VALUES ('${Entry.number}', '${Entry.date}')`;

//         connection.query(qry, function (error, results, fields) {
//             if (error) console.log(error.code);
//             else {
//                 // console.log(results[0]);
//                 // $('#resultDiv').text(results[0].emp_name); //emp_name is column name in your database
//             }
//         });
// } catch (error) {
//     mainWindow.webContents.send('log',{error});
// }

});
ipcMain.on('digit',(e,data)=>{
    setdigit(data.digit)
})
ipcMain.on('getpath',(e,data)=>{
    mainWindow.webContents.send('path',appDataPath);
})
ipcMain.on('fetch',()=>{
//     let data = storage.getSync('Data');
//     mainWindow.webContents.send('local',data);
//     try {
//         let qry = 'SELECT * FROM random';

//         connection.query(qry, function (error, results, fields) {
//             if (error) console.log(error.code);
//             else {
//                 mainWindow.webContents.send('mysql',results);
//                 // $('#resultDiv').text(results[0].emp_name); //emp_name is column name in your database
//             }
//         });
//     } catch (error) {
//         mainWindow.webContents.send('log',{error});
//     }
    select()
});