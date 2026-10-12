import {useId} from 'react';
export default function Pet({form=1,size=180,emotion='idle',className=''}:{form?:number;size?:number;emotion?:string;className?:string}){
 const id=useId().replace(/:/g,'');
 return <svg width={size} height={size} viewBox="0 0 240 240" role="img" aria-label={['基础精灵','观察员','连接者','探索者'][form-1]} className={`pet ${emotion} ${className}`}>
 <defs><radialGradient id={id} cx="35%" cy="25%"><stop stopColor="#f6ffd4"/><stop offset=".55" stopColor="#deef99"/><stop offset="1" stopColor="#9bce6f"/></radialGradient><filter id={`${id}g`}><feGaussianBlur stdDeviation="9"/></filter></defs>
 <ellipse cx="120" cy="205" rx="56" ry="8" fill="#0b2c24" opacity=".15"/>
 <circle cx="120" cy="114" r="75" fill="#d9f19b" opacity=".18" filter={`url(#${id}g)`}/>
 {form>=2&&<ellipse cx="120" cy="128" rx="99" ry="30" fill="none" stroke="#dcebaf" strokeWidth="2" opacity=".7" transform="rotate(-25 120 128)"/>}
 {form>=4&&<><ellipse cx="120" cy="128" rx="105" ry="38" fill="none" stroke="#f0d299" strokeWidth="2" transform="rotate(35 120 128)"/><path d="m174 35 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#f3d398"/></>}
 <g className="pet-body"><path d="M62 141C35 109 51 70 81 65c17-26 56-28 72-7 37 0 62 36 46 67 7 35-15 62-49 65-21 14-57 3-65-13-16-2-25-16-23-36Z" fill={`url(#${id})`}/><ellipse cx="87" cy="115" rx="7" ry={emotion==='rest'?2:9} fill="#173e30"/><ellipse cx="147" cy="115" rx="7" ry={emotion==='rest'?2:9} fill="#173e30"/><circle cx="89" cy="112" r="2" fill="#fff"/><circle cx="149" cy="112" r="2" fill="#fff"/><ellipse cx="74" cy="135" rx="11" ry="5" fill="#daab7c" opacity=".6"/><ellipse cx="159" cy="135" rx="11" ry="5" fill="#daab7c" opacity=".6"/><path d="M105 141q12 12 24-1" fill="none" stroke="#173e30" strokeWidth="4" strokeLinecap="round"/><path d="m116 51 5-11 6 10" stroke="#b3d477" strokeWidth="5" fill="none" strokeLinecap="round"/>
 {form===2&&<g transform="rotate(-18 175 159)"><circle cx="174" cy="150" r="19" fill="#eaf8cf" fillOpacity=".6" stroke="#547e43" strokeWidth="5"/><path d="m185 165 13 20" stroke="#547e43" strokeWidth="7" strokeLinecap="round"/></g>}
 {form>=3&&<path d="m119 161 5-8 8 5-2 9-10 2Z" fill="#f7ffdd" stroke="#789846" strokeWidth="2"/>}</g>
 {form>=3&&<g className="pet-orbit"><path d="m35 91 157-34 18 95" stroke="#dbeaac" fill="none" strokeWidth="1.5" opacity=".6"/><circle cx="35" cy="91" r="8" fill="#ddeb9f"/><circle cx="192" cy="57" r="10" fill="#efcf9c"/><circle cx="210" cy="152" r="7" fill="#adc9e2"/></g>}
 <path d="m46 45 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#d8edb3" opacity=".85"/>
 </svg>;
}
