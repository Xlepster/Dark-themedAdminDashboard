import { useState } from 'react'
import { T } from './store'
import { IcX, IcEye, IcEyeOff, IcChevron, IcCheck, IcCopy } from './icons'

export function Pill({color,children}:{color:string;children:React.ReactNode}) {
  const m:{[k:string]:{bg:string;c:string}}={blue:{bg:'rgba(0,122,255,.15)',c:'#007AFF'},green:{bg:'rgba(52,199,89,.15)',c:'#34C759'},red:{bg:'rgba(255,59,48,.15)',c:'#FF3B30'},orange:{bg:'rgba(255,149,0,.15)',c:'#FF9500'},gray:{bg:'rgba(142,142,147,.15)',c:'#8e8e93'},purple:{bg:'rgba(139,92,246,.15)',c:'#8B5CF6'}}
  const s=m[color]||m.gray
  return <span style={{display:'inline-flex',alignItems:'center',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,backgroundColor:s.bg,color:s.c}}>{children}</span>
}

export function BlueBtn({children,onClick,sm}:{children:React.ReactNode;onClick?:()=>void;sm?:boolean}) {
  return <button onClick={onClick} style={{padding:sm?'7px 14px':'9px 20px',fontSize:sm?13:14,fontWeight:500,backgroundColor:'#007AFF',color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'inline-flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}} onMouseEnter={e=>e.currentTarget.style.opacity='.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>{children}</button>
}

export function GreenBtn({children,onClick,sm,disabled}:{children:React.ReactNode;onClick?:()=>void;sm?:boolean;disabled?:boolean}) {
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{padding:sm?'7px 14px':'9px 20px',fontSize:sm?13:14,fontWeight:500,backgroundColor:disabled?'#48484a':'#34C759',color:'#fff',border:'none',borderRadius:10,cursor:disabled?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',display:'inline-flex',alignItems:'center',gap:6,opacity:disabled?.6:1}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity='.8'}} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>{children}</button>
}

export function RedBtn({children,onClick,sm,disabled}:{children:React.ReactNode;onClick?:()=>void;sm?:boolean;disabled?:boolean}) {
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{padding:sm?'7px 14px':'9px 20px',fontSize:sm?13:14,fontWeight:500,backgroundColor:disabled?'#48484a':'#FF3B30',color:'#fff',border:'none',borderRadius:10,cursor:disabled?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',display:'inline-flex',alignItems:'center',gap:6,opacity:disabled?.6:1}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity='.8'}} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>{children}</button>
}

export function GhostBtn({children,onClick,t}:{children:React.ReactNode;onClick?:()=>void;t:T}) {
  return <button onClick={onClick} style={{padding:'8px 16px',fontSize:13,fontWeight:500,backgroundColor:t.inputBg,color:t.text,border:'none',borderRadius:10,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'inline-flex',alignItems:'center',gap:6}} onMouseEnter={e=>e.currentTarget.style.opacity='.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>{children}</button>
}

export function SInput({placeholder,value,onChange,type='text',t,disabled}:{placeholder?:string;value:string;onChange:(v:string)=>void;type?:string;t:T;disabled?:boolean}) {
  const [show,setShow]=useState(false)
  const isPass=type==='password'
  return (
    <div style={{position:'relative',display:'flex',alignItems:'center'}}>
      <input type={isPass&&show?'text':type} placeholder={placeholder} value={value} disabled={disabled}
        onChange={e=>onChange(e.target.value)}
        style={{width:'100%',padding:'10px 14px',paddingRight:isPass?38:14,backgroundColor:t.inputBg,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:14,outline:'none',fontFamily:'Inter,sans-serif',opacity:disabled?.5:1}}
        onFocus={e=>e.target.style.borderColor='#007AFF'} onBlur={e=>e.target.style.borderColor=t.border}/>
      {isPass&&<button onClick={()=>setShow(!show)} style={{position:'absolute',right:10,background:'none',border:'none',cursor:'pointer',color:t.textSec,display:'flex',padding:2}}>{show?<IcEyeOff/>:<IcEye/>}</button>}
    </div>
  )
}

export function SSelect({placeholder,value,onChange,options,t}:{placeholder?:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[];t:T}) {
  return (
    <div style={{position:'relative'}}>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'9px 32px 9px 12px',backgroundColor:t.inputBg,border:`1px solid ${t.border}`,borderRadius:10,color:value?t.text:t.textSec,fontSize:13,outline:'none',appearance:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}} onFocus={e=>e.target.style.borderColor='#007AFF'} onBlur={e=>e.target.style.borderColor=t.border}>
        {placeholder&&<option value="">{placeholder}</option>}
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:t.textSec,pointerEvents:'none'}}><IcChevron/></div>
    </div>
  )
}

export function Field({label,children}:{label:string;children:React.ReactNode}) {
  return <div style={{marginBottom:12}}><div style={{fontSize:12,color:'#8e8e93',marginBottom:5,fontWeight:500}}>{label}</div>{children}</div>
}

export function CheckRow({label,checked,onChange,t}:{label:string;checked:boolean;onChange:(v:boolean)=>void;t:T}) {
  return (
    <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'4px 0'}}>
      <div onClick={()=>onChange(!checked)} style={{width:18,height:18,borderRadius:4,backgroundColor:checked?'#34C759':t.inputBg,border:`1.5px solid ${checked?'#34C759':t.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer'}}>
        {checked&&<IcCheck/>}
      </div>
      <span style={{fontSize:14,color:t.text}}>{label}</span>
    </label>
  )
}

export function CopyBtn({value}:{value:string}) {
  const [done,setDone]=useState(false)
  const copy=(e:React.MouseEvent)=>{
    e.stopPropagation()
    const write=()=>{setDone(true);setTimeout(()=>setDone(false),1500)}
    try {
      navigator.clipboard.writeText(value).then(write).catch(()=>{
        const el=document.createElement('textarea');el.value=value;el.style.position='fixed';el.style.opacity='0';document.body.appendChild(el);el.select();document.execCommand('copy');document.body.removeChild(el);write()
      })
    } catch {
      const el=document.createElement('textarea');el.value=value;el.style.position='fixed';el.style.opacity='0';document.body.appendChild(el);el.select();document.execCommand('copy');document.body.removeChild(el);write()
    }
  }
  return <button onClick={copy} style={{background:'none',border:'none',cursor:'pointer',color:done?'#34C759':'#8e8e93',display:'inline-flex',padding:2}}>{done?<IcCheck/>:<IcCopy/>}</button>
}

export function Toggle({on,onChange}:{on:boolean;onChange:(v:boolean)=>void}) {
  return <button onClick={()=>onChange(!on)} style={{width:44,height:26,borderRadius:13,border:'none',cursor:'pointer',backgroundColor:on?'#34C759':'#48484a',position:'relative',transition:'background-color .2s',flexShrink:0}}><span style={{width:20,height:20,borderRadius:'50%',backgroundColor:'#fff',position:'absolute',top:3,left:on?21:3,transition:'left .15s',display:'block'}}/></button>
}

export function PillToggle({on,onChange,label}:{on:boolean;onChange:(v:boolean)=>void;label:string}) {
  const c='#34C759'
  return (
    <button onClick={()=>onChange(!on)} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px 4px 6px',backgroundColor:on?`${c}22`:'rgba(142,142,147,.15)',border:`1px solid ${on?c:'transparent'}`,borderRadius:20,cursor:'pointer',fontSize:13,fontWeight:500,color:on?c:'#8e8e93'}}>
      <span style={{width:24,height:14,borderRadius:7,backgroundColor:on?c:'#48484a',position:'relative',display:'inline-block',flexShrink:0}}><span style={{width:10,height:10,borderRadius:'50%',backgroundColor:'#fff',position:'absolute',top:2,left:on?12:2,transition:'left .15s',display:'block'}}/></span>
      {label}
    </button>
  )
}

export function Modal({title,onClose,children,t,wide}:{title:string;onClose:()=>void;children:React.ReactNode;t:T;wide?:boolean}) {
  const isMob=typeof window!=='undefined'&&window.innerWidth<768
  return (
    <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,.65)',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:isMob?0:16}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{backgroundColor:t.panel,borderRadius:isMob?'16px 16px 0 0':16,padding:isMob?'20px 16px 28px':24,width:'100%',maxWidth:isMob?'100%':wide?680:480,maxHeight:isMob?'92vh':'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.5)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:700,color:t.text}}>{title}</div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:8,border:`1px solid ${t.border}`,backgroundColor:t.inputBg,cursor:'pointer',color:t.text,display:'flex',alignItems:'center',justifyContent:'center'}}><IcX/></button>
        </div>
        {children}
      </div>
    </div>
  )
}
