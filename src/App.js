import { useEffect, useState } from 'react';
import './App.css';
const { ipcRenderer } =window.require('electron');

function App() {
  const [Timer, setTimer] = useState(false);
  const [Sec, setSec] = useState(0);
  const [path, setpath] = useState('');

  function sel(e){
    if(!e.target.classList.contains('sel')){
      ipcRenderer.send('getpath',{});
      let digit=parseInt(e.target.dataset.digit);
    ipcRenderer.send('digit',{digit:digit})
    for (let i = 0; i < e.target.closest('.digits').children.length; i++) {
      const element = e.target.closest('.digits').children[i];
      element.classList.remove('sel');
      element.dataset.sel=false;
    }
    e.target.classList.add('sel');
    e.target.dataset.sel=true

    }else{

      e.target.classList.remove('sel');
    }
    
  }
  function start(e){
    e.preventDefault();
    let sel=false;
    // let digits=
    console.log(document.getElementById('digits').children);
    for (let i = 0; i < document.getElementById('digits').children.length; i++) {
      const element = document.getElementById('digits').children[i];
      let temp=element.classList.contains('sel');
      if(temp===true){
        sel=true;
      }
    }
    if(!sel){
      if(Timer){
        alert('Please select a digit first')
      }
    }
    if(sel){
      setTimer(true);
    }else{
      setTimer(false);
    }
  }

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
    ipcRenderer.on('path',function log(e,data){
    let pathdata= 'Your file is saved at '+data+'/sstestdb/';
      setpath(pathdata);
    })
   
    return()=>{
      ipcRenderer.removeAllListeners("path");
    }
  })
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
      <div id='digits' className="digits">
        <h4 data-digit='12' className='btn' onClick={sel}>12 digit</h4>
        <h4 data-digit='13' className='btn' onClick={sel}>13 digit</h4>
      </div>
      <button className='btn' onClick={start} >{Timer?'Stop':"Start"}</button>
      {/* <button className='btn' onClick={()=>{ipcRenderer.send('fetch',{})}}>download</button> */}
      <h6 id='path'>{path}</h6>
    </div>
  );
}

export default App;
