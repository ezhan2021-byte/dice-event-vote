let state, voter=null, busy=false;
const $=id=>document.getElementById(id);
const message=(text,error=false)=>{$('message').textContent=text;$('message').className=text?(error?'notice error':'notice'):'';};
async function getState(){return DiceStore.publicState();}
function radio(name,value,label,checked=false){const l=document.createElement('label');l.className='choice';const i=document.createElement('input');i.type='radio';i.name=name;i.value=value;i.required=true;i.checked=checked;const s=document.createElement('span');s.textContent=label;l.append(i,s);return l;}
function render(){
 $('round').textContent=state.label; $('roles').replaceChildren();$('cases').replaceChildren();$('submit').hidden=true;
 $('hint').hidden=!state.available.length;
 if(!state.available.length){const p=document.createElement('p');p.className='sub';p.textContent='이 회차의 투표가 모두 끝났습니다. 진행자의 안내를 기다려 주세요.';$('roles').append(p);return;}
 state.available.forEach(id=>{const l=radio('voter',id,state.roles[id].label,id===voter);l.querySelector('input').addEventListener('change',()=>{voter=id;message('');renderCases();});$('roles').append(l);});
 if(voter!==null)renderCases();
}
function renderCases(){
 $('cases').replaceChildren();
 state.cases.forEach((c,n)=>{const section=document.createElement('section');section.className='panel';const tag=document.createElement('div');tag.className='section-label';tag.textContent=`0${n+2}　 범인 지목`;const title=document.createElement('h2');title.textContent=`${c.label} 사건의 범인은 누구인가요?`;const grid=document.createElement('div');grid.className='roles suspects';state.roles.filter(r=>r.id!==voter).forEach(r=>grid.append(radio('case'+c.id,r.id,r.label)));section.append(tag,title,grid);$('cases').append(section);});$('submit').hidden=false;
}
async function reset(){state=await getState();voter=null;$('ballot').reset();render();}
$('ballot').addEventListener('submit',async e=>{
 e.preventDefault();if(busy||voter===null)return;if(!$('ballot').reportValidity())return;
 const answers={};for(const c of state.cases){const selected=document.querySelector(`input[name="case${c.id}"]:checked`);if(!selected){message('모든 사건에 답해 주세요.',true);return;}answers[c.id]=Number(selected.value);}
 busy=true;$('submit').disabled=true;
 try {await DiceStore.submit({epoch:state.epoch,round:state.round,revision:state.revision,voter,answers});voter=null;$('ballot').reset();$('roles').replaceChildren();$('cases').replaceChildren();$('submit').hidden=true;message('투표가 저장되었습니다. 다음 참가자는 본인 배역을 선택해 주세요.');await reset();window.scrollTo(0,0);
 }catch(err){if(err.code===409)await reset();message(err.message,true);}finally{busy=false;$('submit').disabled=false;}
});
reset().catch(e=>message(e.message,true));
async function sync(){if(busy)return;try{const next=await getState();if(!state||next.epoch!==state.epoch||next.revision!==state.revision||JSON.stringify(next.available)!==JSON.stringify(state.available)){state=next;voter=null;$('ballot').reset();render();message('투표 화면이 갱신되었습니다. 본인 배역을 선택해 주세요.');}}catch(e){message(e.message,true);}}
setInterval(sync,1500);DiceStore.onChange(sync);window.addEventListener('focus',sync);window.addEventListener('pageshow',()=>reset().catch(e=>message(e.message,true)));
