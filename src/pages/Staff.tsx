import { T, Employee } from '../store'
import { IcEdit, IcPlus } from '../icons'
import { BlueBtn } from '../ui'

export default function StaffPage({employees,onAdd,onEdit,t,isMobile}:{employees:Employee[];onAdd:()=>void;onEdit:(e:Employee)=>void;t:T;isMobile?:boolean}) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:isMobile?16:20,fontWeight:700,color:t.text}}>Сотрудники</div>
        <BlueBtn sm onClick={onAdd}><IcPlus/> Создать</BlueBtn>
      </div>
      {employees.length===0?(<div style={{backgroundColor:t.panel,borderRadius:12,padding:'32px 0',textAlign:'center',color:t.textSec,fontSize:14}}>Сотрудники не добавлены</div>):(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {employees.map(emp=>(
            <div key={emp.id} style={{backgroundColor:t.panel,borderRadius:12,padding:isMobile?'12px 14px':'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0,flex:1}}>
                <div style={{width:36,height:36,borderRadius:'50%',backgroundColor:'#007AFF22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#007AFF',flexShrink:0}}>{emp.name.slice(0,1).toUpperCase()}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.name}</div>
                  <div style={{fontSize:12,color:t.textSec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.email}</div>
                </div>
              </div>
              <button onClick={()=>onEdit(emp)} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'7px 12px',borderRadius:9,border:`1px solid ${t.border}`,backgroundColor:t.inputBg,color:t.text,fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>
                <IcEdit/>{!isMobile&&' Редактировать'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
