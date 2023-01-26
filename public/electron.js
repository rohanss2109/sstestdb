const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const Excel = require('exceljs');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const workbook = new Excel.Workbook();
const worksheet = workbook.addWorksheet('My Sheet');
let d = new Date(Date.now());
let srr= d.toDateString().split(' ');
let filename = srr[2]+' '+srr[1]+' '+srr[3]+' '+srr[0]+ '.xlsx'
let newfile=true;
let currentcolumn = 1;
const appname = app.getName();
let mydata = app.getPath('appData');
let appDataPath = false



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
    Menu.setApplicationMenu(null)
})

let db = new sqlite3.Database(path.join(mydata, appname, 'database.db'), (err) => {
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
    }
});



let mainWindow = null;
let digit = 13
function setdigit(data) {
    digit = data;
}
function newEntry() {
    let num = null;
    if (digit === 13) {
        num = Math.floor((Math.random()*10000000000000)).toString().padStart(13,'0');
    } else {
        num = Math.floor((Math.random()*1000000000000)).toString().padStart(12,'0');
    }
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
