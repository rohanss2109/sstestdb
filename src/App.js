import { useEffect, useState } from 'react';
import './App.css';
const { ipcRenderer } =window.require('electron');

function App() {
  const [Timer, setTimer] = useState(false);
  const [Sec, setSec] = useState(0);
  const [path, setpath] = useState('');
  const [digit, setdigit] = useState(false);

function sel(e){
  if(!e.target.classList.contains('sel')){
    ipcRenderer.send('checkpath',{});
    let digiti=parseInt(e.target.dataset.digit);
  ipcRenderer.send('digit',{digit:digiti})
  for (let i = 0; i < e.target.closest('.digits').children.length; i++) {
    const element = e.target.closest('.digits').children[i];
    element.classList.remove('sel');
  }
  e.target.classList.add('sel');
  }else{
    e.target.classList.remove('sel');
    setdigit(false)
    setTimer(false);
    document.getElementById('thebtn').classList.remove('stopbtn');
  }
  
}
function start(e){
  e.preventDefault();
  if(digit){
    if(Timer){
      setTimer(false);
      document.getElementById('thebtn').classList.remove('stopbtn');
    }else{
      setTimer(true);
      document.getElementById('thebtn').classList.add('stopbtn');
    }
  }else{
    alert('Please select a digit first')
  }
}


useEffect(()=>{
  ipcRenderer.on('path',function log(e,data){
  let pathdata= 'Your file is saved at '+data;
    setpath(pathdata);
    setdigit(true);
  })
  
  return()=>{
    ipcRenderer.removeAllListeners("path");
  }
})

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
  // ipcRenderer.send('fetch',{})
}
return()=>{
  clearInterval(interval);
}
})
  return (
    <div className="App button-main-div">
      
    <div class="all-buttons">
    <h2>Kunwarsa</h2>
      <div id='digits' className="digits">
        <h4 data-digit='12' className='btn startbtn' onClick={sel}>12 digit</h4>
        <h4 data-digit='13' className='btn startbtn' onClick={sel}>13 digit</h4>
      </div>
      <button id='thebtn' className='btn startbtn' onClick={start} >{Timer?'Stop':"Start"}</button>
      {(path&&digit&&Sec>2)?
      <button className='btn startbtn' onClick={()=>{ipcRenderer.send('open',{})}}>Open file</button>
      :<></>}
      <div class="directory-text">
      <h6 id='path'>{path}</h6>
      {path?
      <h6 id='changebtn' className='btn startbtn' onClick={()=>{document.getElementsByClassName('sel')[0].click(); setpath(false);ipcRenderer.send('change',{})}}>Choose Directory</h6>
      :<></>
      }
      </div>
    </div>
    </div>
  );
}

export default App;
