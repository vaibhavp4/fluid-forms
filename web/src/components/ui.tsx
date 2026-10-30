import { LoaderCircle, AlertCircle, Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
export function Busy({text='Working…'}:{text?:string}){return <span className="busy"><LoaderCircle size={17} className="spin"/>{text}</span>}
export function Notice({children,tone='info'}:{children:ReactNode;tone?:string}){return <div className={`notice ${tone}`} role={tone==='error'?'alert':undefined}><AlertCircle size={18}/><div>{children}</div></div>}
export function Status({issue,review=false}:{issue:string;review?:boolean}){const good=issue==='none'&&!review;return <span className={`status ${good?'good':'attention'}`}>{good?<Check size={14}/>:<AlertCircle size={14}/>} {review?'Review needed':good?'On track':'Needs attention'}</span>}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X/></button></header>{children}</section></div>}
