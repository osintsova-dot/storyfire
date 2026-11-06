/* Shared SVG/PNG layout: one coordinate model, actual player data only. */
(function(){'use strict';
var W=2480,H=1754,script=document.currentScript,base=new URL('.',script&&script.src||location.href),bgURL=new URL('certificate-bg.webp',base).href,NS='http://www.w3.org/2000/svg',measure=document.createElement('canvas').getContext('2d'),art=new Image();
var ready=Promise.all([new Promise(function(ok,no){art.onload=ok;art.onerror=function(){no(Error('Не удалось загрузить оформление сертификата. Обновите страницу.'))};art.src=bgURL;}),document.fonts?Promise.all([document.fonts.load('600 120px Cormorant'),document.fonts.load('400 48px Andika')]):Promise.resolve()]);
function clean(d){return {name:String(d.name||'Участник').trim().slice(0,48)||'Участник',complete:Math.max(0,Math.min(10,Math.floor(+d.complete||0))),pages:Math.max(0,Math.min(60,Math.floor(+d.pages||0))),date:String(d.date||new Date().toLocaleDateString('ru-RU'))};}
function width(t,size){measure.font='600 '+size+'px Cormorant,Georgia,serif';return measure.measureText(t).width;}
function nameLayout(name){var size,rows=[name],join='';for(size=208;size>=132;size-=4)if(width(name,size)<=1570)return {rows:rows,size:size,ys:[1025],join:join};
 var words=name.split(/\s+/),best=null;
 if(words.length>1){for(var k=1;k<words.length;k++){var r=[words.slice(0,k).join(' '),words.slice(k).join(' ')],v=Math.max(width(r[0],168),width(r[1],168));if(!best||v<best.v)best={rows:r,v:v};}rows=best.rows;join=' ';}
 else{var chars=Array.from(name),mid=Math.ceil(chars.length/2);rows=[chars.slice(0,mid).join(''),chars.slice(mid).join('')];}
 for(size=168;size>36;size-=4)if(rows.every(function(r){return width(r,size)<=1570}))break;
 return {rows:rows,size:size,ys:[950,1110],join:join};}
function model(input){var d=clean(input),n=nameLayout(d.name),lines=[
 {id:'certBrand',text:'ИСТОРИИ У КОСТРА',y:300,size:62,family:'Andika',weight:700,color:'#60388d',spacing:10},
 {id:'certHeading',text:'Сертификат',y:555,size:224,family:'Cormorant',weight:600,color:'#553278'},
 {text:'Зимнее приключение на английском',y:650,size:48,family:'Andika',color:'#6b4c36'},
 {text:'НАГРАЖДАЕТСЯ',y:810,size:36,family:'Andika',color:'#76522f',spacing:7},
 {id:'certTitle',text:d.complete===10?'Хранитель историй':'Участник приключения',y:1225,size:78,family:'Cormorant',weight:600,color:'#714622'},
 {text:'За любопытство, старание и смелость',y:1335,size:51,family:'Andika',color:'#35283d'},
 {text:'говорить на английском.',y:1405,size:51,family:'Andika',color:'#35283d'},
 {id:'certResult',text:'Пройдено историй: '+d.complete+' из 10',y:1475,size:35,family:'Andika',color:'#654d3c'},
 {id:'certPages',text:'Открыто страниц: '+d.pages+' из 60',y:1525,size:35,family:'Andika',color:'#654d3c'},
 {text:'Speak & Smile',y:1590,size:46,family:'Cormorant',weight:600,color:'#60388d'},
 {id:'certDate',text:d.date,y:1648,size:32,family:'Andika',color:'#654d3c'}];
 n.rows.forEach(function(text,i){lines.push({id:i===0?'certName':null,nameLine:true,text:text,y:n.ys[i],size:n.size,family:'Cormorant',weight:600,color:'#553278'});});return {data:d,lines:lines,name:n};}
function node(tag,attrs){var e=document.createElementNS(NS,tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,attrs[k])});return e;}
function svg(input){var m=model(input),root=node('svg',{viewBox:'0 0 '+W+' '+H,xmlns:NS,role:'img','aria-label':'Сертификат: '+m.data.name+', '+m.data.complete+' из 10 историй'});root.append(node('image',{href:bgURL,x:0,y:0,width:W,height:H,preserveAspectRatio:'none'}));root.append(node('path',{d:'M 1085 720 H 1395',stroke:'#ad793b','stroke-width':2,fill:'none'}));root.append(node('path',{d:'M1240 707 L1253 720 L1240 733 L1227 720 Z',fill:'#ad793b'}));
 var stats=node('g',{id:'certResult'});root.append(stats);m.lines.forEach(function(l){var a={x:W/2,y:l.y,'text-anchor':'middle','font-family':l.family+',Georgia,serif','font-size':l.size,'font-weight':l.weight||400,fill:l.color};if(l.id)a.id=l.id==='certResult'?'certStoryCount':l.id;if(l.spacing)a['letter-spacing']=l.spacing;var e=node('text',a);e.textContent=l.text;if(l.id==='certName')e.setAttribute('aria-label',m.data.name);if(l.id==='certResult'||l.id==='certPages'){if(stats.children.length)stats.append(document.createTextNode(' '));stats.append(e)}else root.append(e)});return root;}
function render(host,data){var version=(host._certificateVersion||0)+1;host._certificateVersion=version;host.setAttribute('aria-busy','true');if(!host.children.length)host.textContent='Готовим сертификат…';return ready.then(function(){if(version!==host._certificateVersion)return;var s=svg(data);host.replaceChildren(s);host.removeAttribute('aria-busy');return s;}).catch(function(e){host.textContent=e.message;host.removeAttribute('aria-busy');throw e;});}
async function png(input){await ready;var m=model(input),c=document.createElement('canvas');c.width=3508;c.height=2480;var x=c.getContext('2d');x.scale(c.width/W,c.height/H);x.drawImage(art,0,0,W,H);x.strokeStyle='#ad793b';x.lineWidth=2;x.beginPath();x.moveTo(1085,720);x.lineTo(1395,720);x.stroke();x.fillStyle='#ad793b';x.beginPath();x.moveTo(1240,707);x.lineTo(1253,720);x.lineTo(1240,733);x.lineTo(1227,720);x.closePath();x.fill();x.textAlign='center';
 m.lines.forEach(function(l){x.fillStyle=l.color;x.font=(l.weight||400)+' '+l.size+'px '+l.family+',Georgia,serif';if('letterSpacing' in x)x.letterSpacing='0px';if(l.spacing){var chars=Array.from(l.text),total=chars.reduce(function(a,c){return a+x.measureText(c).width},0)+l.spacing*(chars.length-1),at=W/2-total/2;x.textAlign='left';chars.forEach(function(c){x.fillText(c,at,l.y);at+=x.measureText(c).width+l.spacing});x.textAlign='center'}else x.fillText(l.text,W/2,l.y);});return new Promise(function(ok,no){c.toBlob(function(b){b?ok(b):no(Error('Не удалось сохранить картинку.'))},'image/png')});}
window.StoryCertificate={ready:ready,render:render,png:png,model:model,background:bgURL,width:W,height:H};
})();
