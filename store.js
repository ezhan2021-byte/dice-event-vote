/* Same-device storage, NOT a secure server or account system. */
window.DiceStore=(()=>{
 const scope=location.pathname.slice(0,location.pathname.lastIndexOf('/')+1);
 const dbName='dice-ballot-v1:'+scope;
 let connection;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(dbName):null;
 function open(){if(connection)return connection;connection=new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('이 브라우저는 투표 저장을 지원하지 않습니다. Chrome 일반 모드에서 열어 주세요.'));return;}
  const req=indexedDB.open(dbName,1);
  req.onupgradeneeded=()=>{const store=req.result.createObjectStore('state');store.put(DiceCore.initial(crypto.randomUUID()),'event');};
  req.onerror=()=>reject(Error('저장소를 열 수 없습니다. 브라우저의 사이트 저장 허용 여부를 확인해 주세요.'));
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();connection=null;};resolve(db);};
  req.onblocked=()=>reject(Error('다른 투표 탭을 닫고 다시 열어 주세요.'));
 });return connection;}
 async function transaction(update){
  const db=await open();return new Promise((resolve,reject)=>{
   const tx=db.transaction('state',update?'readwrite':'readonly');const store=tx.objectStore('state');let result,reason;
   const request=store.get('event');
   request.onsuccess=()=>{try{const s=request.result;if(!s||s.version!==1)throw Error('투표 저장소를 확인해 주세요.');result=update?update(s):s;if(update)store.put(result,'event');}catch(e){reason=e;tx.abort();}};
   tx.oncomplete=()=>{if(update)channel?.postMessage('changed');resolve(result);};
   tx.onabort=tx.onerror=()=>reject(reason||Error('투표 저장에 실패했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.'));
  });
 }
 return {
  publicState:async()=>DiceCore.snapshot(await transaction()),
  results:async()=>DiceCore.result(await transaction()),
  submit:body=>transaction(s=>DiceCore.vote(s,body)),
  changeRound:round=>transaction(s=>DiceCore.changeRound(s,round)),
  newEvent:()=>transaction(()=>DiceCore.initial(crypto.randomUUID())),
  onChange:fn=>{if(channel)channel.onmessage=fn;},
  persist:async()=>{try{return await navigator.storage?.persist?.();}catch{return false;}}
 };
})();
