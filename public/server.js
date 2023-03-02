const express = require('express');
const { app} = require('electron')
const cors = require('cors');
const bodyParser = require('body-parser')
const App = express();
const sqlite3 = require('sqlite3').verbose();
const path = require('path')

const appname='kunwarsa';
function newEntry(digit) {
    let num = null;
    if (digit === 13) {
        num = Math.floor((Math.random()*10000000000000)).toString().padStart(13,'0');
    } else {
        num = Math.floor((Math.random()*1000000000000)).toString().padStart(12,'0');
    }
    return num
}
function insert(number){
    db.serialize(async () => {
        if(number){
            let qry=`INSERT INTO numbers ( value )VALUES(${number.toString()});`;
            await db.run(qry,function(err){
            if (err) {
                    console.error(err.message);
                    }
                    console.log("saved Locally");
                });
        }
    });

}
let db = new sqlite3.Database(path.join('Numbers.db'), async(err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the sqlite database.');
        let qry = 'CREATE TABLE IF NOT EXISTS numbers (value TEXT PRIMARY KEY)';
        db.serialize(() => {
            db.run(qry, function (err) {
                if (err) {
                    console.error(err.message);
                }
                console.log("DB TABLE SETUP DONE");
            });
        });
    }
});
App.use(cors({ origin: 'http://localhost:3000' }))
App.use(express.urlencoded({ extended: true }));
App.use(bodyParser.json());
async function getdata(){
    let qry=`SELECT * FROM numbers;`;
    await db.all(qry,[],(err,rows) => {
        if (err) {
            console.error(err);
            }
        if(rows){
            console.log(rows);
            return new Set(rows)
        }else{
            return 'No Data Found'
        }
        });
}
App.get('/', async (req, res) => {
    let data=getdata()
    if(data){
        res.json({ data: data })
    }else{
        res.json({ data: 'No data Found' })
    }
})


App.post('/', async (req, res) => {
    let allnumbers= await getdata();
    console.log(allnumbers);
    let digit = req.body.digit;
    if (digit){
        let newnumber;
        // while (digit) {
        //     let number=newEntry(digit)
        //     if (!allnumbers.includes(number)) {
        //         newnumber=number;
        //       break;
        //     }
        //   }
        res.json({ newnumber: newnumber });
        insert('1212')
    }
})
App.listen(3300, () => {
    console.log('Server started and running on http:\\localhost:3300')
})