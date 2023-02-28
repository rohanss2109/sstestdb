const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const Excel = require('exceljs');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const os = require('os');

let interfaces = os.networkInterfaces();
let addresses = [];
for (let k in interfaces) {
    for (let k2 in interfaces[k]) {
        let address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}
let ipno=addresses[0].split('.')[addresses[0].split('.').length-1].toString().padStart(3,'0');
const workbook = new Excel.Workbook();
let worksheet = workbook.addWorksheet('My Sheet');
let d = new Date(Date.now());
let srr= d.toDateString().split(' ');
const filename12 = srr[2]+' '+srr[1]+' '+srr[3]+' '+srr[0]+ '_12.xlsx'
const filename13 = srr[2]+' '+srr[1]+' '+srr[3]+' '+srr[0]+ '_13.xlsx'
let filename;
let newfile=true;
let currentcolumn = 1;
const appname = app.getName();
let mydata = app.getPath('appData');
let appDataPath = false
let series;

function create(){
    let qry=`CREATE TABLE IF NOT EXISTS Numbers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT NOT NULL,
            ipno TEXT NOT NULL,
            number TEXT NOT NULL,
            series TEXT NOT NULL,
            digit TEXT NOT NULL
        );`;
        db.serialize(() => {
            db.run(qry,function(err){
            if (err) {
                    console.error(err.message);
                    mainWindow.webContents.send("log",err);
                    }
                    console.log("DB TABLE SETUP DONE");
                });
        });
}

function insert(time,ipno,number,series,digit){

    db.serialize(async () => {
    
        if(time&&ipno&&number&&series&&digit){
            let qry=`INSERT INTO Numbers ( time ,ipno, number , series, digit)VALUES('${time}','${ipno}',${number.toString()},${series},${digit});`
            await db.run(qry,function(err){
            if (err) {
                    console.error(err.message);
                    }
                    console.log("saved Locally");
                });
        }
        });
        
    
    }

    function deleterow (id){
        db.serialize(() => {
            if(id){
                let qry= `DELETE FROM Numbers WHERE id=${id}`;
                db.run(qry,function(err){
                if (err) {
                        console.error(err.message);
                        mainWindow.webContents.send("log",{err})
                    }
                    mainWindow.webContents.send("log","sent")
                        console.log("deleted Locally");
                    });
            }
            });
    }

    async function  select(){
        let qry=`SELECT * FROM Numbers;`;
    
        await db.all(qry,[],(err,rows) => {
    
            if (err) {
                console.error(err);
                }
                if(rows){
                    const currentDate = new Date();
                    const twoDaysAgo = new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000);

                    const filteredData = rows.filter(item => {
                    const itemDate = new Date(Number(item.time));
                    return itemDate < twoDaysAgo;
                    });
                    filteredData.forEach(row => {deleterow(row.id)})
                }
                });

    
    }
    async function getdata(){
        let qry=`SELECT * FROM Numbers;`;
        let datasend
        await db.all(qry,[],(err,rows) => {

            if (err) {
                console.error(err);
                }
                if(rows){
                    const today = new Date(Date.now());
                    const todayData = rows.filter(item => {
                        const itemDate = new Date(Number(item.time));
                        return itemDate.getDate() === today.getDate() &&
                          itemDate.getMonth() === today.getMonth() &&
                          itemDate.getFullYear() === today.getFullYear();
                      });
                      if(todayData){
                          const today12Data = todayData.filter(item => {
                            return Number(item.digit)===12
                          })
                          const today13Data = todayData.filter(item => {
                            return Number(item.digit)===13
                          })
                          const today12series= today12Data.reduce((max, item) => item.id > max.id ? item : max, {});
                          const today13series= today13Data.reduce((max, item) => item.id > max.id ? item : max, {});
                          const downloadworkbook = new Excel.Workbook();
                        let worksheet12 = downloadworkbook.addWorksheet('MySheet12');
                        let worksheet13 = downloadworkbook.addWorksheet('MySheet13');
                        worksheet12.addRow(["Number"]);
                        worksheet13.addRow(["Number"]);
                        today12Data.forEach(e=>{
                            worksheet12.addRow([e.number.toString().padStart(12,'0')]);
                        })
                        today13Data.forEach(e=>{
                            worksheet13.addRow([e.number.toString().padStart(13,'0')]);
                        })
                        downloadworkbook.xlsx.writeFile(path.join(appDataPath, "downloaded.xlsx"))
                            .then(function () {
                                mainWindow.webContents.send('saved',{})
                            });
                          datasend= {
                            today12Data:today12Data,
                            today13Data:today13Data,
                            today12series:today12series.series,
                            today13series:today13series.series,
                          }
                      }else{
                        datasend=false
                      }
                }
                });
                return datasend;
    }
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 400,
        resizable: false,
        autoHideMenuBar:false,
        devTools:false,
        maximizable:false,
        webPreferences: {
            nodeIntegration: true,
        }
    })
    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, 'index.html')}`
    )
}

app.on('ready', () => {
    createMainWindow();
    console.log(filename)
    // Menu.setApplicationMenu(null)
})

let db = new sqlite3.Database(path.join(mydata, appname, 'database.db'), async(err) => {
    if (err) {
        console.error(err.message);

    } else {
        console.log('Connected to the sqlite database.');
        let qry = `CREATE TABLE IF NOT EXISTS pathdata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL
        );`;
        db.serialize(() => {
            db.run(qry, function (err) {
                if (err) {
                    console.error(err.message);
                    mainWindow.webContents.send("log", err);
                }
                console.log("DB TABLE SETUP DONE");
                mainWindow.webContents.send("log", 'rows')
            });
        });
        await create();
    }
});



let mainWindow = null;
let digit = 13
async function setdigit(data) {
    let rows = await select();
        if(rows){
            if (data===12) {
                series=rows.today12series
            }else{
                series=rows.today13series
            }
        }else{
            series=0
        }
    digit = data;
    if (data===12) {
        filename=filename12
    }else{
        filename=filename13
    }
    workbook.removeWorksheet(worksheet.id);
    worksheet = workbook.addWorksheet('My Sheet');
}
function newEntry() {
    let num = null;
    if (digit === 13) {
        // let timestamp = Math.floor(Date.now() / 1000);
        // timestamp = timestamp.toString().padStart(6, '0');
        // if(series===9999){
        //     series=0
        // }
        // num=timestamp+ipno+series.toString().padStart(4,0);
        num = Math.floor((Math.random()*10000000000000)).toString().padStart(13,'0');
    } else {
        // let timestamp = Math.floor(Date.now() / 1000);
        // timestamp = timestamp.toString().padStart(5, '0');
        // if(series===9999){
        //     series=0
        // }
        // num=timestamp+ipno+series.toString().padStart(4,0);
        num = Math.floor((Math.random()*1000000000000)).toString().padStart(12,'0');
    }
    series=series+1;
    let date = Date.now();
    return { number: num, date: date };
}
async function getpathfromuser(){
    newfile=true
    
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    })
    if (result.filePaths.length > 0) {
        appDataPath = result.filePaths[0];
        mainWindow.webContents.send('path', appDataPath);
        db.serialize(async () => {
            if (appDataPath) {
                let qry = `INSERT INTO pathdata ( path )VALUES('${appDataPath}');`
                await db.run(qry, function (err) {
                    if (err) {
                        console.error(err.message);
                    }
                    console.log("saved Locally");
                    mainWindow.webContents.send("log", 'saved')
                });
            }
        });
        try {
            if (fs.existsSync(path.join(appDataPath, filename))) {
                console.log(
                    'exists'
                )
                newfile=false
                workbook.xlsx.readFile(path.join(appDataPath, filename))
                .then(function() {
                    let oldworksheet = workbook.getWorksheet(1);
                    let columnCount = oldworksheet.getColumnCount();
                    let lastColumn = 0;
                    for (var i = columnCount; i >= 1; i--) {
                        var hasContent = false;
                        var rowCount = oldworksheet.getRowCount();
                        for (var j = 1; j <= rowCount; j++) {
                            var cell = oldworksheet.getCell(j, i);
                            if (cell.getValue() != null) {
                                hasContent = true;
                                break;
                            }
                        }
                        if (hasContent) {
                            lastColumn = i;
                            break;
                        }
                    }
                    currentcolumn=lastColumn
                })
                   
            }else{
                console.log('not exitss')
                worksheet.addRow(["Number"])
                newfile=true
                
            }
        } catch(err) {
            console.error(err)
        }
    }
}

function insertexcel(number) {
    if(newfile){     
        worksheet.addRow([number]);
        workbook.xlsx.writeFile(path.join(appDataPath, filename))
            .then(function () {
                mainWindow.webContents.send('saved',{})
            });
    }else{
        try {
            workbook.xlsx.readFile(path.join(appDataPath, filename))
            .then(function() {
                let oldworksheet = workbook.getWorksheet(1);
                // oldworksheet.addRow([number]);
                let rowCount = oldworksheet.rowCount;
                let lastRow = 0;

                for (let i = 1; i <= rowCount; i++) {
                    let row = oldworksheet.getRow(i);
                    if (row) {
                        let cell = row.getCell(currentcolumn);
                        if (cell.value != null) {
                            lastRow++;
                        } else {
                            break;
                        }
                    }
                }

                if (lastRow === 1001) {
                    currentcolumn++;
                    oldworksheet.getRow(1).getCell(currentcolumn).value = 'Number';
                    oldworksheet.getRow(2).getCell(currentcolumn).value = number;
                }else{
                    oldworksheet.getRow(lastRow+1).getCell(currentcolumn).value = number;
                }


                let allrows = oldworksheet.actualRowCount;
                let cellsWithContent = 0;//getting numbers generated
                for (let i = 1; i <= allrows; i++) {
                    for (let j = 1; j <= currentcolumn; j++) {
                        let row = oldworksheet.getRow(i);
                        if(row) {
                            let cell = row.getCell(j);
                            if (cell.value != null) {
                                cellsWithContent++;
                            }
                        }
                    }
                }
                mainWindow.webContents.send('count',{count:cellsWithContent-currentcolumn})

                
                return workbook.xlsx.writeFile(path.join(appDataPath, filename));
            })
        } catch (error) {
            console.log(error)
        }

    }
    try {
        insert(Date.now(),ipno,number,series,digit)
    } catch (error) {
        console.log(error);
    }
}




ipcMain.on('save', () => {
    try {
        if (fs.existsSync(path.join(appDataPath, filename))) {
               newfile=false
        }else{
            // worksheet.addRow(["Number"])
            newfile=true
        }
    } catch(err) {
        console.error(err)
    }
    let Entry = newEntry()
    insertexcel(Entry.number)
});
ipcMain.on('digit', (e, data) => {
    setdigit(data.digit)
})
ipcMain.on('checkpath', async (e, data) => {
    if (!appDataPath) {
        let qry = `SELECT * FROM pathdata;`;

        await db.all(qry, [], (err, rows) => {
            if (err) {
                console.error(err);
            }
            if (rows[0]) {
                appDataPath=rows[0].path
                mainWindow.webContents.send('path', appDataPath);
                try {
                    if (fs.existsSync(path.join(appDataPath, filename))) {
                        console.log(
                            'exists'
                        )
                           newfile=false
                           workbook.xlsx.readFile(path.join(appDataPath, filename))
                           .then(function() {
                               let oldworksheet = workbook.getWorksheet(1);
                               let columnCount = oldworksheet.getColumnCount();
                               let lastColumn = 0;
                               for (var i = columnCount; i >= 1; i--) {
                                   var hasContent = false;
                                   var rowCount = oldworksheet.getRowCount();
                                   for (var j = 1; j <= rowCount; j++) {
                                       var cell = oldworksheet.getCell(j, i);
                                       if (cell.getValue() != null) {
                                           hasContent = true;
                                           break;
                                       }
                                   }
                                   if (hasContent) {
                                       lastColumn = i;
                                       break;
                                   }
                               }
                               currentcolumn=lastColumn
                           })
                    }else{
                        console.log('not exitss')
                        worksheet.addRow(["Number"])
                        newfile=true
                    }
                } catch(err) {
                    console.error(err)
                }
                return;
            }else{
                getpathfromuser()
            }
        });
       
    } else {
        mainWindow.webContents.send('path', appDataPath);
    }
})
// ipcMain.on('getpath',(e,data)=>{
//     mainWindow.webContents.send('path',appDataPath);
// })
ipcMain.on('open', (e, data) => {
    
    shell.showItemInFolder(path.join(appDataPath,filename))
})
ipcMain.on('change', async(e, data) => {
    newfile=true
    workbook.removeWorksheet(worksheet.id);
    worksheet = workbook.addWorksheet('My Sheet');
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    })
    if (result.filePaths.length > 0) {
        appDataPath = result.filePaths[0];
        // mainWindow.webContents.send('path', appDataPath);
        db.serialize(async () => {
            if (appDataPath) {
                let qry = `UPDATE pathdata SET path='${appDataPath}';`
                await db.run(qry, function (err) {
                    if (err) {
                        console.error(err.message);
                    }
                    console.log("saved Locally");
                    mainWindow.webContents.send("log", 'saved')
                });
            }
        });
    }
})

ipcMain.on("download",async()=>{
    let data= await getdata()
})
