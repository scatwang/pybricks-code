"use strict";(self.webpackChunk_pybricks_pybricks_code=self.webpackChunk_pybricks_pybricks_code||[]).push([[4357],{32430:(e,i,n)=>{n.d(i,{$:()=>d,f:()=>c});var t=n(54629);const d=(0,t.P)((e=>({type:"terminal.action.sendData",value:e}))),c=(0,t.P)((e=>({type:"terminal.action.receiveData",value:e})))},14357:(e,i,n)=>{n.r(i),n.d(i,{default:()=>w});var t=n(61924),d=n(23739),c=n(96249),l=n(47523),o=n(45326),a=n(26079),r=n(38222),s=n(32430);const u=new TextEncoder,y=new TextDecoder,f=new TextDecoder;function*b(e){const{runtime:i,useLegacyStdio:n}=yield(0,t.Ys)((e=>e.hub));if(!n)return;if(i===a.n.Loading&&1===e.value.buffer.byteLength){const i=new DataView(e.value.buffer);return void(yield(0,t.gz)((0,o.K2)(i.getUint8(0))))}const d=y.decode(e.value.buffer,{stream:!0});yield(0,t.gz)((0,s.$)(d))}function*g(e){const i=f.decode(e.payload,{stream:!0});yield(0,t.gz)((0,s.$)(i))}function*h(){const e=yield(0,t.fw)("nextMessageId"),i=yield(0,t.ZO)(s.f);for(;;){let n=(yield(0,t.qn)(i)).value;for(;n.length<c.$Y;){const{action:e,timeout:d}=yield(0,t.S3)({action:(0,t.qn)(i),timeout:(0,t.gw)(20)});if(d)break;(0,r.ri)(e),n+=e.value}if(!(yield(0,t.Ys)((e=>e.hub.runtime===a.n.Running)))){yield(0,t.gz)((0,s.$)("\x07"));continue}const o=u.encode(n),{useLegacyStdio:y,maxBleWriteSize:f}=yield(0,t.Ys)((e=>e.hub));if(y)for(let i=0;i<o.length;i+=c.$Y){const{id:n}=yield(0,t.gz)((0,d.cW)(e(),o.slice(i,i+c.$Y)));yield(0,t.qn)((e=>(d.xk.matches(e)||d.Jh.matches(e))&&e.id===n)),yield(0,t.S3)([(0,t.qn)(d.sn),(0,t.gw)(100)])}else{(0,r.hu)(f>=20,"bad maxBleWriteSize");for(let i=0;i<o.length;i+=f){const{id:n}=yield(0,t.gz)((0,l.$1)(e(),o.slice(i,i+f))),{didFail:d}=yield(0,t.S3)({didSucceed:(0,t.qn)(l.fb.when((e=>e.id===n))),didFail:(0,t.qn)(l.xN.when((e=>e.id===n)))});d&&console.error(d.error)}}}}function*m(e){const{dataSource:i}=yield(0,t.fw)("terminal");i.next(e.value)}function v(){dispatchEvent(new CustomEvent("pb-terminal-focus"))}function*w(){yield(0,t.ib)(d.sn,b),yield(0,t.ib)(l.Zq,g),yield(0,t.rM)(h),yield(0,t.ib)(s.$,m),yield(0,t.ib)(o.us,v)}}}]);
//# sourceMappingURL=4357.3f706c20.chunk.js.map