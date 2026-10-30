import { Renderer, StateProvider, VisibilityProvider, type ComponentRegistry } from '@json-render/react';
import type { Spec } from '@json-render/core';
import { Mic, Camera, GitBranch, CheckCircle2, MapPin } from 'lucide-react';
import type { FormSpec } from '../types';
const icons={site:MapPin,note:Mic,branch:GitBranch,photo:Camera,submit:CheckCircle2};
const registry:ComponentRegistry={
 Stack:({children})=><div className="preview-steps">{children}</div>,
 Step:({element})=>{const p=element.props as {label:string;detail:string;kind:keyof typeof icons;number:number};const Icon=icons[p.kind];return <div className="preview-step"><span className="step-symbol"><Icon size={19}/></span><div><strong>{p.label}</strong><p>{p.detail}</p></div><small>{String(p.number).padStart(2,'0')}</small></div>}
};
export function compilePreview(form:FormSpec):Spec{
 const steps=[{kind:'site',label:'Choose your site',detail:'Job, date, and your name. Fixed validation.'},{kind:'note',label:'Tell us how today went',detail:form.note_prompt},{kind:'branch',label:'Clarify what needs attention',detail:form.blocker_question},...(form.require_delivery_photo?[{kind:'photo',label:'Wrong delivery? Add evidence',detail:form.evidence_prompt}]:[]),{kind:'submit',label:'Review and send',detail:'Confirm the details. Your original report stays attached.'}];
 return {root:'root',elements:{root:{type:'Stack',props:{},children:steps.map((_,i)=>`step-${i}`)},...Object.fromEntries(steps.map((s,i)=>[`step-${i}`,{type:'Step',props:{...s,number:i+1}}]))}};
}
export function FormPreview({spec}:{spec:FormSpec}){return <StateProvider initialState={{}}><VisibilityProvider><Renderer spec={compilePreview(spec)} registry={registry}/></VisibilityProvider></StateProvider>}
