import { useEffect, useState } from 'react';
import './App.css';
const { ipcRenderer } =window.require('electron');

function App() {
  const [Timer, setTimer] = useState(false);
  const [Sec, setSec] = useState(0);
  // const [json, setjson] = useState();
  // const [mysql, setmysql] = useState();

  

  function download(json){
  const columns = Object.keys(json[0]);
  const replacer = (key, value) => (value === null ? '' : value);
  const csv = json.map(row => columns.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
  csv.unshift(columns.join(','));
  const csvString = csv.join('\r\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csvString], {type: 'text/csv'}));
  a.download = 'datafromlocal.csv';
  a.click();

  }
  useEffect(()=>{
    ipcRenderer.on('log',function log(e,data){
      // download(data);
      console.log(data);
    })
    ipcRenderer.on('export',function log(e,data){
      download(data);
    })
    return()=>{
      ipcRenderer.removeAllListeners("log");
      ipcRenderer.removeAllListeners("export");
    }
  })
  useEffect(()=>{
    let interval=null;
    if(Timer){
      interval=setInterval(()=>{
        if(Timer){
          setSec(Sec+1);
          let res=Sec%2
          if(res===0){
            ipcRenderer.send('save',{})
          }
        }
      },1000)
    }else{
      // ipcRenderer.send('fetch',{})
    }
    return()=>{
      clearInterval(interval);
    }
  })
  return (
    <div className="App">
      <h1>{Sec}</h1>
      <button className='btn' onClick={()=>{setTimer(!Timer)}} >{Timer?'Stop':"Start"}</button>
      <button className='btn' onClick={()=>{ipcRenderer.send('fetch',{})}}>download</button>
    </div>
  );
}

export default App;
