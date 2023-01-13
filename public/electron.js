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
    workbook.xlsx.readFile(path.join(appDataPath, filename))
    .then(function() {
        var oldworksheet = workbook.getWorksheet(1);
        oldworksheet.addRow([number]);
        return workbook.xlsx.writeFile(path.join(appDataPath, filename));
    })
    }
}




ipcMain.on('save', () => {
    try {
        if (fs.existsSync(path.join(appDataPath, filename))) {
               newfile=false
        }else{
            worksheet.addRow(["Number"])
            newfile=true
        }
    } catch(err) {
        console.error(err)
    }
    let Entry = newEntry()
    insertexcel(Entry.number)
    workbook.xlsx.readFile(path.join(appDataPath, filename))
    .then(function() {
        var oldworksheet = workbook.getWorksheet(1);
        mainWindow.webContents.send('count',{count:oldworksheet.rowCount})
    })
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
