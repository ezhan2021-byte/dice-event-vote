(function(root){
 'use strict';
 const roles=['감정사(최윤재)','미술관장(최민석)','경찰(서재필)','애인(조수민)','화가(윤재헌)','기자(김성원)'];
 const cases=['대부호(김도흔)','비서','관리인'];
 const rounds=[0,1,2,3].map(id=>({id,label:id===3?'최종 투표':`중간 ${id+1}차`,cases:id===3?[0,1,2]:[id]}));
 function initial(epoch){return {version:1,epoch,round:0,revision:0,votes:[]};}
 function snapshot(s){return {epoch:s.epoch,round:s.round,revision:s.revision,label:rounds[s.round].label,cases:rounds[s.round].cases.map(id=>({id,label:cases[id]})),roles:roles.map((label,id)=>({id,label})),available:roles.map((_,id)=>id).filter(id=>!s.votes.some(v=>v.round===s.round&&v.voter===id))};}
 function fail(message,code=400){const e=Error(message);e.code=code;throw e;}
 function vote(s,b){
  if(b.epoch!==s.epoch||b.round!==s.round||b.revision!==s.revision)fail('회차가 변경되었습니다. 본인 배역부터 다시 선택해 주세요.',409);
  if(!Number.isInteger(b.voter)||!roles[b.voter])fail('본인 배역을 선택해 주세요.');
  if(s.votes.some(v=>v.round===s.round&&v.voter===b.voter))fail('이 배역은 이미 제출했습니다.',409);
  const expected=rounds[s.round].cases;
  if(!b.answers||typeof b.answers!=='object'||Array.isArray(b.answers)||Object.keys(b.answers).length!==expected.length||!expected.every(c=>Number.isInteger(b.answers[c])&&roles[b.answers[c]]&&b.answers[c]!==b.voter))fail('모든 사건에서 본인을 제외한 용의자 한 명을 선택해 주세요.');
  return {...s,votes:[...s.votes,{round:s.round,voter:b.voter,answers:{...b.answers},submittedAt:new Date().toISOString()}]};
 }
 function changeRound(s,round){if(!Number.isInteger(round)||!rounds[round])fail('회차를 확인해 주세요.');return {...s,round,revision:s.revision+1};}
 function result(s){return {...s,roles,cases,rounds};}
 function tally(s,round,c){return roles.map((_,id)=>s.votes.filter(v=>v.round===round&&v.answers[c]===id).length);}
 const api={roles,cases,rounds,initial,snapshot,vote,changeRound,result,tally};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.DiceCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
