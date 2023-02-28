import { useEffect, useState } from 'react';
import './App.css';
const { ipcRenderer } = window.require('electron');

function App() {
  const [Timer, setTimer] = useState(false);
  const [Sec, setSec] = useState(0);
  const [num, setnum] = useState(0);
  const [path, setpath] = useState('');
  const [digit, setdigit] = useState(false);

  function sel(e) {
    for (let i = 0; i < e.target.closest('.digits').children.length; i++) {
      const element = e.target.closest('.digits').children[i];
      if(element.classList.contains('sel')){
        if(!window.confirm('Are you sure???')){
          return;
        }
      }
      
    }
      if (!e.target.classList.contains('sel')) {
        setTimer(false);
        setSec(0)
        document.getElementById('thebtn').classList.remove('stopbtn');
        ipcRenderer.send('checkpath', {});
        let digiti = parseInt(e.target.dataset.digit);
        ipcRenderer.send('digit', { digit: digiti })
        for (let i = 0; i < e.target.closest('.digits').children.length; i++) {
          const element = e.target.closest('.digits').children[i];
          element.classList.remove('sel');
        }
        e.target.classList.add('sel');
      } else {
        e.target.classList.remove('sel');
        setdigit(false)
        setTimer(false);
        document.getElementById('thebtn').classList.remove('stopbtn');
        document.getElementById('changebtn').classList.remove('dis-dir')
      }
    

  }
  function start(e) {
    e.preventDefault();
    if(Timer){
     if(!window.confirm('are you sure??')){
      return;
     }
    }
    if (digit) {
      if (Timer) {
        setTimer(false);
        document.getElementById('thebtn').classList.remove('stopbtn');
        document.getElementById('changebtn').classList.remove('dis-dir')
      } else {
        setTimer(true);
        document.getElementById('thebtn').classList.add('stopbtn');
        document.getElementById('changebtn').classList.add('dis-dir')
        document.getElementById('notif').classList.add('show');
        setTimeout(()=>{
          document.getElementById('notif').classList.remove('show');
        },2000)
      }
    } else {
      alert('Please select a digit first')
    }
  }
  const changedir=(e) => { 
    if(!e.target.classList.contains('dis-dir')){
      document.getElementsByClassName('sel')[0].click();
      document.getElementById('changebtn').classList.remove('dis-dir')
      setSec(0); 
      setdigit(false); 
      setTimer(false); 
      setpath(false); 
      ipcRenderer.send('change', {}) 
    }
  }

  useEffect(() => {
    ipcRenderer.on('path', function log(e, data) {
      let pathdata = 'Your file is saved at ' + data;
      setpath(pathdata);
      setdigit(true);
    })

    return () => {
      ipcRenderer.removeAllListeners("path");
    }
  })

  useEffect(() => {
    ipcRenderer.on('log', function log(e, data) {
      console.log(data);
    })
    ipcRenderer.on('count', function log(e, data) {
      setnum(data.count)
    })
    return () => {
      ipcRenderer.removeAllListeners("log");
      ipcRenderer.removeAllListeners("count");
    }
  })


  useEffect(() => {
    let interval = null;
    if (Timer) {
      interval = setInterval(() => {
        if (Timer) {
          setSec(Sec + 1);
          let res = Sec % 2
          if (res === 0) {
            ipcRenderer.send('save', {})
          }
        }
      }, 1000)
    } else {
      // ipcRenderer.send('fetch',{})
    }
    return () => {
      clearInterval(interval);
    }
  })
  return (
    <>
      <div className="App button-main-div">

        <div className="all-buttons">
          <div id='notif' className="notification">
            <p>Started... </p>
          </div>
          <h2>Kunwarsa</h2>
          <div id='digits' className="digits">
            <h4 data-digit='12' className='btn startbtn twelve-digit' onClick={sel}>12 Digit</h4>
            <h4 data-digit='13' className='btn startbtn thirteendigit' onClick={sel}>13 Digit</h4>
          </div>
          <button id='thebtn' className='btn startbtn' onClick={start} >{Timer ? 'Stop' : "Start"}</button>
          {(path && digit && Sec > 2) ?
            <button className='btn startbtn' onClick={() => { ipcRenderer.send('open', {}) }}>Open file</button>
            : <></>}
          {(path && digit && Sec > 2) ?
            <div className="number-count">
              <p>Numbers Generated {num}</p>
            <h5 onClick={()=>{ipcRenderer.send('download', {})}} className='btn startbtn ' >download</h5>
            </div>
            : <></>}
          <div className="directory-text">
            <h6 id='path'>{path}</h6>
            {path ?
              <h5 id='changebtn' className='btn startbtn ' onClick={changedir}>Choose Directory</h5>
              : <></>
            }
          </div>
        </div>
      </div>

    </>
  );
}

export default App;
