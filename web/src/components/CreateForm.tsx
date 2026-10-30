import { useState } from 'react';
import { ArrowRight, ClipboardList, WandSparkles } from 'lucide-react';
import { api,errorMessage } from '../api';
import type { Form,Proposal } from '../types';
import { Modal,Busy,Notice } from './ui';
export function CreateForm({onClose,onCreated}:{onClose:()=>void;onCreated:(p:Proposal)=>void}){
 const [title,setTitle]=useState('Daily site update');const [brief,setBrief]=useState('My team should give me a quick update before leaving. Ask what they finished, what held them up, and what they need tomorrow. Keep it short.');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function create(){setBusy(true);setError('');try{const result=await api<{form:Form;proposal:Proposal}>('/forms','POST',{title,brief});onCreated(result.proposal);}catch(e){setError(errorMessage(e));}finally{setBusy(false)}}
 return <Modal title="Start with a familiar workflow" onClose={onClose}><p className="muted">A useful starting point. Make it work your way.</p><div className="template-choice"><ClipboardList size={28}/><div><strong>Daily site update</strong><p>Completed work, blockers, and what happens next.</p></div><span className="selected-check">✓</span></div><label>Form name<input value={title} maxLength={80} onChange={e=>setTitle(e.target.value)}/></label><label>What should your team tell you?<textarea rows={5} value={brief} maxLength={4000} onChange={e=>setBrief(e.target.value)}/></label><p className="helper">We’ll prepare a preview. Nothing goes live until you approve it.</p>{error&&<Notice tone="error">{error}</Notice>}<button className="primary full" disabled={busy||brief.trim().length<10||title.trim().length<3} onClick={create}>{busy?<Busy text="Preparing your workflow…"/>:<><WandSparkles size={18}/>Create preview<ArrowRight size={17}/></>}</button></Modal>
}
