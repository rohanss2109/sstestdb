const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const Excel = require('exceljs');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const workbook = new Excel.Workbook();
const worksheet = workbook.addWorksheet('My Sheet');
const appname = app.getName();
let mydata = app.getPath('appData');
let appDataPath = false

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 400,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
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
    try {
        var data = storage.getSync('Data');
        if (!data.length) {
            storage.set('Data', [], function (error) {
                if (error) throw error;
            });
        }
    } catch (error) {
        mainWindow.webContents.send('log', { error });
    }

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
        num = Math.floor(1000000000000 + Math.random() * 9000000000000)
    } else {
        num = Math.floor(100000000000 + Math.random() * 900000000000)
    }
    let date = Date.now();
    // let date= d.toString();
    return { number: num, date: date };
}
async function getpathfromuser(){
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
    }
}

function insertexcel(number, date) {
    worksheet.addRow([number, date]);
    let d = new Date(Date.now());
    let file = d.toDateString()
    let name = 'data' + file + '.xlsx'
    workbook.xlsx.writeFile(path.join(appDataPath, name))
        .then(function () {
            console.log('File is written.');
        });
}




ipcMain.on('save', () => {
    let Entry = newEntry()
    insertexcel(Entry.number, Entry.date)
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
    let d = new Date(Date.now());
    let file = 'data' + d.toDateString() + '.xlsx'
    shell.showItemInFolder(path.join(appDataPath,file))
})
ipcMain.on('change', async(e, data) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    })
    if (result.filePaths.length > 0) {
        appDataPath = result.filePaths[0];
        mainWindow.webContents.send('path', appDataPath);
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
