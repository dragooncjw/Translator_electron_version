import { ipcRenderer, remote } from 'electron';
const URL = require('url').URL
var request = require('request');
const { Menu, MenuItem, dialog } = remote;

let currentFile = null; //当前文档保存的路径
let isSaved = true;     //当前文档是否已保存
let txtEditor = document.getElementById('txtEditor'); //获得TextArea文本框的引用

// document.title = "Notepad - Untitled"; //设置文档标题，影响窗口标题栏名称

//给文本框增加右键菜单
String.prototype.trim = function (char) {
  return this.replace(new RegExp('^\\'+char+'+|\\'+char+'+$', 'g'), '');
}
const contextMenuTemplate=[
    { role: 'undo' },       //Undo菜单项
    { role: 'redo' },       //Redo菜单项
    { type: 'separator' },  //分隔线
    { role: 'cut' },        //Cut菜单项
    { role: 'copy' },       //Copy菜单项
    { role: 'paste' },      //Paste菜单项
    { role: 'delete' },     //Delete菜单项
    { type: 'separator' },  //分隔线
    { role: 'selectall' }   //Select All菜单项
];
const contextMenu=Menu.buildFromTemplate(contextMenuTemplate);
txtEditor.addEventListener('contextmenu', (e)=>{
    e.preventDefault();
    contextMenu.popup(remote.getCurrentWindow());
});
//监控文本框内容是否改变
txtEditor.oninput=(e)=>{
  if(isSaved) document.title += " *";
  isSaved=false;
};

//监听与主进程的通信
ipcRenderer.on('action', (event, arg) => {
  switch(arg){        
  // case 'new': //新建文件
  //     askSaveIfNeed();
  //     currentFile=null;
  //     txtEditor.value='';   
  //     document.title = "Notepad - Untitled";
  //     //remote.getCurrentWindow().setTitle("Notepad - Untitled *");
  //     isSaved=true;
  //     break;
  case 'translate':
      let txt = txtEditor.value;
      txt = txt.replace(/[\r\n]/g,"");
      googleTranslate(txt);
      // txtEditor.value = googleTranslate(txt);
      break;
  case 'open': //打开文件
      askSaveIfNeed();
      const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
          filters: [
              { name: "Text Files", extensions: ['txt', 'js', 'html', 'md'] }, 
              { name: 'All Files', extensions: ['*'] } ],
          properties: ['openFile']
      });
      if(files){
          currentFile=files[0];
          const txtRead=readText(currentFile);
          txtEditor.value=txtRead;
          document.title = "Notepad - " + currentFile;
          isSaved=true;
      }
      break;
  // case 'save': //保存文件
  //     saveCurrentDoc();
  //     break;
  case 'exiting':
      // askSaveIfNeed();
      ipcRenderer.sendSync('reqaction', 'exit');
      break;
    }
});

//读取文本文件
function readText(file){
    const fs = require('fs');
    return fs.readFileSync(file, 'utf8');
}
//保存文本内容到文件
function saveText(text, file){
    const fs = require('fs');
    fs.writeFileSync(file, text);
}

//保存当前文档
function saveCurrentDoc(){
if(!currentFile){
    const file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
        filters: [
            { name: "Text Files", extensions: ['txt', 'js', 'html', 'md'] }, 
            { name: 'All Files', extensions: ['*'] } ]
    });
    if(file) currentFile=file;
}
if(currentFile){
    const txtSave=txtEditor.value;
    saveText(txtSave, currentFile);
    isSaved=true;
    document.title = "Notepad - " + currentFile;
  }
}

//如果需要保存，弹出保存对话框询问用户是否保存当前文档
function askSaveIfNeed(){
    if(isSaved) return;
    const response=dialog.showMessageBox(remote.getCurrentWindow(), {
        message: 'Do you want to save the current document?',
        type: 'question',
        buttons: [ 'Yes', 'No' ]
    });
    if(response==0) saveCurrentDoc(); //点击Yes按钮后保存当前文档
}
//#endregion
function googleTranslate(text) {
  if (text == "" || text == null)
  {
      return "";
  }
  else
  {
      // text.replace(/\s/g,'%20');
      console.log(text);
      
      let url = 'https://translate.google.cn/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=' + text;
      url = new URL(url);
      const myUrlString = url.toString();
      try{
      request(myUrlString, function (error, response, body) {
        console.log('error:',error);
        console.log('response:',response);
        console.log('body:',body);
        
        let pattern = /\"([^\"]*)\"/g;
        body = body.match(pattern);
        let result = "";
        console.log('body:',body)
        let last = -2;
        body.forEach((value, index) => {
            if(value === '"2876b4f2653853cee22abadb2a855b9a"'|| value === '""' || value === '"en"')
                result +="";
            else{
                if(index === last + 1){
                    result += "";
                    last = -2
                }else{
                    result += value.trim('\"')
                    last = index
                }
            }
        })
        txtEditor.value = result;
      })
    }catch(e){
      console.log(e)
    } 
  }
}