'use client';
import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {supabase} from "../../lib/supabase";
export default function StudentPage(){
 const params=useParams(); const router=useRouter(); const code=decodeURIComponent(String(params.code||"")).toUpperCase();
 const [student,setStudent]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{if(!code)return;(async()=>{const {data,error}=await supabase.rpc("get_student_portal",{p_code:code});if(error||!data?.length)setError("Code élève introuvable.");else setStudent(data[0]);setLoading(false)})()},[code]);
 if(loading)return <main><section><h2>Chargement...</h2></section></main>;
 if(error)return <main><section><h2>{error}</h2><button onClick={()=>router.push("/")}>Retour</button></section></main>;
 const qrPngUrl=student?.qr_code?`https://quickchart.io/qr?size=900&format=png&text=${encodeURIComponent(student.qr_code)}`:"";
 const lastPayment=(student.payments||[]).slice().sort((a:any,b:any)=>String(b.valid_until||"").localeCompare(String(a.valid_until||"")))[0];
 const subscriptionEnd=lastPayment?.valid_until||null;
 const subscriptionEndFormatted=subscriptionEnd?subscriptionEnd.split('-').reverse().join('/'):'-';
 const subscriptionActive=subscriptionEnd?new Date(subscriptionEnd+'T23:59:59')>=new Date():false;
 return <main><header><a className="brand" href="/"><img src="/logo.png" alt="Centre Les Profs"/><b>CENTRE LES PROFS</b></a><nav><button onClick={()=>router.push("/")}>Déconnexion</button></nav></header><section><p className="tag">MON ESPACE PERSONNEL</p><h1>Bienvenue, {student.full_name} 👋</h1><div className="cards"><article><b>🎓</b><h3>Mon profil</h3><p><b>Code :</b> {student.qr_code}</p><p><b>Niveau :</b> {student.level||"-"}</p><p><b>Téléphone :</b> {student.phone||"-"}</p><p><b>Email :</b> {student.email||"-"}</p></article><article><b>📱</b><h3>Mon QR Code</h3>{qrPngUrl&&<div style={{background:"white",padding:12,borderRadius:12,display:"inline-block"}}><img src={qrPngUrl} alt="QR Code" width="220" height="220" style={{display:"block"}}/></div>}<p>{qrPngUrl&&<a className="button" href={qrPngUrl} download={`QR-${student.qr_code}.png`}>⬇️ Télécharger le QR PNG</a>}</p></article></div><div className="cards"><article><b>📚</b><h3>Mes matières</h3>{(student.subjects||[]).length?(student.subjects||[]).map((x:any,i:number)=><p key={i}>{x.name}</p>):<p>Aucune matière enregistrée.</p>}</article><article><b>📅</b><h3>Ma présence</h3><p>Présent : {(student.attendance||[]).filter((x:any)=>x.status==="Présent").length}</p><p>Absent : {(student.attendance||[]).filter((x:any)=>x.status==="Absent").length}</p></article><article><b>💰</b><h3>Mon abonnement</h3><p><b>Statut :</b> {subscriptionActive?'🟢 Actif':'🔴 Expiré / aucun abonnement'}</p><p><b>Expire le :</b> {subscriptionEndFormatted}</p>{(student.payments||[]).length?(student.payments||[]).map((x:any,i:number)=><p key={i}>{x.amount} DH — {x.status}</p>):<p>Aucun paiement enregistré.</p>}</article></div></section></main>
}