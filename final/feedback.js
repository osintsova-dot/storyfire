/* «Перед сертификатом»: отзыв родителя. Обязательные вопросы проверяются здесь и на сервере (ss-pay, sfFeedback).
   Сертификат открывается после отправки: window.Feedback.init(onDone). */
(function(){'use strict';
var $=function(s){return document.querySelector(s)};
var MIN={q1_why:3,q3_text:3,q4:5,q6:5,q7_why:3};
var MAX={q1_why:500,q3_text:500,q4:800,q5:500,q6:800,q7_why:500};
var LABEL={q1:'вопрос 1',q1_why:'вопрос 1 («что зацепило»)',q2:'вопрос 2',q3:'вопрос 3',q3_text:'вопрос 3 (подробнее)',q4:'вопрос 4',q6:'вопрос 6',q7:'вопрос 7',q7_why:'вопрос 7 («почему»)',q8:'вопрос 8'};
function val(f,name){var el=f.elements[name];if(!el)return '';return (el.value||'').trim();}
function radio(f,name){var r=f.querySelector('input[name="'+name+'"]:checked');return r?r.value:'';}
function collect(f){
  return {q1:parseInt(radio(f,'q1'),10),q1_why:val(f,'q1_why'),q2:radio(f,'q2'),q3:radio(f,'q3'),q3_text:val(f,'q3_text'),
    q4:val(f,'q4'),q5:val(f,'q5'),q6:val(f,'q6'),q7:parseInt(radio(f,'q7'),10),q7_why:val(f,'q7_why'),q8:radio(f,'q8')};
}
function check(a){
  var miss=[];
  if(!a.q1)miss.push('q1');if(!a.q2)miss.push('q2');if(!a.q3)miss.push('q3');if(!a.q7)miss.push('q7');if(!a.q8)miss.push('q8');
  ['q1_why','q3_text','q4','q6','q7_why'].forEach(function(k){ if(!a[k]||a[k].length<MIN[k])miss.push(k); });
  return miss;
}
function init(onDone){
  var f=$('#fbForm'), msg=$('#fbMsg'), btn=$('#fbSend');
  if(!f)return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var a=collect(f), miss=check(a);
    // подсвечиваем первый незаполненный вопрос и пишем, что именно доделать
    f.querySelectorAll('.fb-q').forEach(function(q){q.classList.remove('fb-miss');});
    if(miss.length){
      var first=null;
      miss.forEach(function(k){ var q=f.querySelector('[data-q="'+k.replace(/_.*/,'')+'"]'); if(q){ q.classList.add('fb-miss'); if(!first)first=q; } });
      msg.className='msg bad';
      msg.textContent='Ответьте, пожалуйста, на обязательные вопросы — '+miss.map(function(k){return LABEL[k]||k;}).filter(function(v,i,arr){return arr.indexOf(v)===i;}).join(', ')+'. Пару слов или предложение достаточно.';
      if(first)first.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    btn.disabled=true; msg.className='msg'; msg.textContent='Отправляем…';
    window.SF.feedbackSend(a).then(function(j){
      if(j&&j.ok){ f.classList.add('done'); msg.className='msg good'; msg.textContent='Спасибо! Сертификат открыт ниже.'; if(onDone)onDone(); return; }
      btn.disabled=false; msg.className='msg bad';
      msg.textContent= j&&j.reason==='offline' ? 'Нет связи. Ответы не потеряются — попробуйте отправить ещё раз.' : 'Не получилось отправить. Проверьте ответы и попробуйте ещё раз.';
    });
  });
}
window.Feedback={init:init};
})();
