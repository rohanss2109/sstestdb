import { useEffect, useState } from 'react';
import './App.css';
const { ipcRenderer } =window.require('electron');

function App() {
  const [Timer, setTimer] = useState(false);
  const [Sec, setSec] = useState(0);

  useEffect(()=>{
    ipcRenderer.on('log',function log(e,data){
      console.log(data);
    })
    return()=>{
      ipcRenderer.removeAllListeners("log");
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
      ipcRenderer.send('fetch',{})
    }
    return()=>{
      clearInterval(interval);
    }
  })
  return (
    <div className="App">
      <h1>{Sec}</h1>
      <button className='btn' onClick={()=>{setTimer(!Timer)}} >{Timer?'Stop':"Start"}</button>
    </div>
  );
}

export default App;
