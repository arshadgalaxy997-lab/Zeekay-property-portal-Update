import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter, Routes, Route, Link, useNavigate, useParams} from "react-router-dom";
import {collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc} from "firebase/firestore";
import {ref, uploadBytes, getDownloadURL} from "firebase/storage";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged} from "firebase/auth";
import {auth, db, storage} from "./firebase";
import "./style.css";

const sample=[
 {id:"demo1",title:"Luxury Bungalow — DHA Phase 8",type:"Bungalow",area:"DHA Phase 8",price:"PKR 8.50 Crore",size:"500 Sq. Yds",status:"approved",images:[]},
 {id:"demo2",title:"Sea View Apartment — Clifton",type:"Flat",area:"Clifton",price:"PKR 4.20 Crore",size:"3 Bed",status:"approved",images:[]},
 {id:"demo3",title:"Commercial Shop — DHA Phase 6",type:"Shop",area:"DHA Phase 6",price:"PKR 3.10 Crore",size:"1200 Sq. Ft",status:"approved",images:[]}
];

function Layout({children,user}){
 return <><header><Link to="/" className="brand">ZEEKAY <span>PROPERTIES</span></Link><nav><Link to="/">Properties</Link>{user?<Link to="/broker">Dashboard</Link>:<Link to="/broker/login">Broker Login</Link>}<Link to="/admin/login">Admin</Link></nav></header>{children}<footer>ZEEKAY Properties • DHA & Clifton • Client & Broker Property Portal</footer></>
}
function App(){
 const [user,setUser]=useState(null);
 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 return <Layout user={user}><Routes>
  <Route path="/" element={<Home/>}/><Route path="/property/:id" element={<Property/>}/>
  <Route path="/broker/login" element={<BrokerLogin/>}/><Route path="/broker" element={<BrokerDashboard user={user}/>}/>
  <Route path="/admin/login" element={<AdminLogin/>}/><Route path="/admin" element={<AdminDashboard user={user}/>}/>
 </Routes></Layout>
}
async function approved(){
 try {const s=await getDocs(query(collection(db,"properties"),where("status","==","approved"))); return s.docs.map(d=>({id:d.id,...d.data()}))}
 catch{return []}
}
function Home(){
 const [items,setItems]=useState(sample),[q,setQ]=useState(""),[type,setType]=useState("All"),[area,setArea]=useState("All");
 useEffect(()=>{approved().then(x=>{if(x.length)setItems(x)})},[]);
 const filtered=items.filter(x=>(!q||x.title?.toLowerCase().includes(q.toLowerCase())||x.area?.toLowerCase().includes(q.toLowerCase()))&&(type==="All"||x.type===type)&&(area==="All"||x.area===area));
 return <main><section className="hero"><h1>Find your property.<br/>Book your visit.</h1><p>Browse approved ZEEKAY inventory and request a visit in minutes.</p><div className="search"><input placeholder="Search DHA, Clifton, property..." value={q} onChange={e=>setQ(e.target.value)}/><select value={type} onChange={e=>setType(e.target.value)}><option>All</option><option>Plot</option><option>Flat</option><option>Bungalow</option><option>Shop</option><option>Office</option><option>Commercial</option></select><select value={area} onChange={e=>setArea(e.target.value)}><option>All</option><option>DHA Phase 5</option><option>DHA Phase 6</option><option>DHA Phase 8</option><option>Clifton</option></select></div></section>
 <section className="container"><div className="heading"><h2>Available Properties</h2><span>{filtered.length} properties</span></div><div className="grid">{filtered.map(x=><PropertyCard key={x.id} x={x}/>)}</div></section></main>
}
function PropertyCard({x}){return <article className="card"><div className="photo">{x.images?.[0]?<img src={x.images[0]}/>:<b>ZEEKAY<br/>PROPERTY</b>}</div><div className="body"><small>{x.type} • {x.area}</small><h3>{x.title}</h3><strong>{x.price}</strong><p>{x.size||"Premium property"}</p><Link className="btn" to={"/property/"+x.id}>View & Book Visit</Link></div></article>}
function Property(){
 const {id}=useParams(),[x,setX]=useState(sample.find(a=>a.id===id)),[form,setForm]=useState({name:"",phone:"",date:"",time:"",message:""}),[sent,setSent]=useState(false);
 useEffect(()=>{if(!x||id.startsWith("demo"))return;getDocs(query(collection(db,"properties"),where("__name__","==",id))).then(s=>s.docs[0]&&setX({id:s.docs[0].id,...s.docs[0].data()}))},[]);
 if(!x)return <main className="container"><h2>Property not found</h2></main>;
 const submit=async e=>{e.preventDefault();const payload={propertyId:id,propertyTitle:x.title,...form,status:"new",createdAt:serverTimestamp()};try{await addDoc(collection(db,"visits"),payload)}catch{} const msg=`ZEEKAY Visit Request\nProperty: ${x.title}\nClient: ${form.name}\nWhatsApp: ${form.phone}\nDate: ${form.date}\nTime: ${form.time}\nMessage: ${form.message}`;window.open(`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER||""}?text=${encodeURIComponent(msg)}`,"_blank");setSent(true)};
 return <main className="container"><div className="detail"><div className="bigphoto">{x.images?.[0]?<img src={x.images[0]}/>:<b>ZEEKAY PROPERTY</b>}</div><div><small>{x.type} • {x.area}</small><h1>{x.title}</h1><h2>{x.price}</h2><p>{x.size}</p><hr/><h3>Book a Visit</h3>{sent?<div className="success">Visit request created. WhatsApp message is ready to send to ZEEKAY.</div>:<form onSubmit={submit}><input required placeholder="Your Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required placeholder="WhatsApp Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><div className="two"><input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/><input required type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div><textarea placeholder="Requirement / message" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><button className="btn">Confirm Visit</button></form>}</div></div></main>
}
function BrokerLogin(){
 const nav=useNavigate(),[mode,setMode]=useState("login"),[f,setF]=useState({email:"",password:"",name:"",phone:""}),[err,setErr]=useState("");
 const go=async e=>{e.preventDefault();try{if(mode==="login")await signInWithEmailAndPassword(auth,f.email,f.password);else{const c=await createUserWithEmailAndPassword(auth,f.email,f.password);await addDoc(collection(db,"brokers"),{uid:c.user.uid,name:f.name,phone:f.phone,email:f.email,status:"active",createdAt:serverTimestamp()})}nav("/broker")}catch(e){setErr(e.message)}};
 return <main className="container narrow"><div className="panel"><h1>Broker Portal</h1><p>Submit inventory privately. It becomes public only after ZEEKAY approval.</p><div className="tabs"><button onClick={()=>setMode("login")}>Login</button><button onClick={()=>setMode("register")}>Register</button></div><form onSubmit={go}>{mode==="register"&&<><input required placeholder="Broker / Agency Name" onChange={e=>setF({...f,name:e.target.value})}/><input required placeholder="WhatsApp / Phone" onChange={e=>setF({...f,phone:e.target.value})}/></>}<input required type="email" placeholder="Email" onChange={e=>setF({...f,email:e.target.value})}/><input required type="password" placeholder="Password" onChange={e=>setF({...f,password:e.target.value})}/><button className="btn">{mode==="login"?"Login":"Create Broker Account"}</button></form>{err&&<p className="error">{err}</p>}</div></main>
}
function BrokerDashboard({user}){const [f,setF]=useState({title:"",type:"Plot",area:"",price:"",size:"",description:""}),[files,setFiles]=useState([]),[msg,setMsg]=useState("");
 if(!user)return <main className="container"><div className="panel"><h2>Please login</h2><Link to="/broker/login" className="btn">Broker Login</Link></div></main>;
 const submit=async e=>{e.preventDefault();try{let imgs=[];for(const file of files){const r=ref(storage,`properties/${user.uid}/${Date.now()}-${file.name}`);await uploadBytes(r,file);imgs.push(await getDownloadURL(r))}await addDoc(collection(db,"properties"),{...f,images:imgs,status:"pending",brokerUid:user.uid,createdAt:serverTimestamp()});setMsg("Submitted. Your listing is pending admin approval.");setF({title:"",type:"Plot",area:"",price:"",size:"",description:""});setFiles([])}catch(e){setMsg("Submission failed: "+e.message)}};
 return <main className="container"><div className="heading"><h1>Broker Dashboard</h1><button onClick={()=>signOut(auth)}>Logout</button></div><div className="panel"><h2>Add Inventory</h2><form onSubmit={submit}><input required placeholder="Property Title" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/><div className="two"><select value={f.type} onChange={e=>setF({...f,type:e.target.value})}>{["Plot","Flat","Bungalow","Shop","Office","Showroom","Commercial"].map(a=><option>{a}</option>)}</select><input required placeholder="Location / DHA Phase / Clifton" value={f.area} onChange={e=>setF({...f,area:e.target.value})}/></div><div className="two"><input required placeholder="Demand Price" value={f.price} onChange={e=>setF({...f,price:e.target.value})}/><input placeholder="Size / Bedrooms" value={f.size} onChange={e=>setF({...f,size:e.target.value})}/></div><textarea placeholder="Full details" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/><input type="file" multiple accept="image/*" onChange={e=>setFiles([...e.target.files])}/><button className="btn">Submit for Approval</button></form>{msg&&<div className="success">{msg}</div>}</div></main>
}
function AdminLogin(){const nav=useNavigate(),[f,setF]=useState({email:"",password:""}),[err,setErr]=useState("");return <main className="container narrow"><div className="panel"><h1>Admin Login</h1><form onSubmit={async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,f.email,f.password);nav("/admin")}catch(x){setErr(x.message)}}}><input required type="email" placeholder="Admin Email" onChange={e=>setF({...f,email:e.target.value})}/><input required type="password" placeholder="Password" onChange={e=>setF({...f,password:e.target.value})}/><button className="btn">Login</button></form>{err&&<p className="error">{err}</p>}</div></main>}
function AdminDashboard({user}){const [items,setItems]=useState([]),[visits,setVisits]=useState([]);
 const load=async()=>{const a=await getDocs(collection(db,"properties"));setItems(a.docs.map(d=>({id:d.id,...d.data()})));const v=await getDocs(collection(db,"visits"));setVisits(v.docs.map(d=>({id:d.id,...d.data()})))};useEffect(()=>{if(user)load()},[user]);
 if(!user)return <main className="container"><div className="panel"><h2>Please login</h2><Link to="/admin/login" className="btn">Admin Login</Link></div></main>;
 const approve=async id=>{await updateDoc(doc(db,"properties",id),{status:"approved"});load()};
 return <main className="container"><div className="heading"><h1>Admin Dashboard</h1><button onClick={()=>signOut(auth)}>Logout</button></div><div className="panel"><h2>Broker Inventory</h2>{items.length===0?<p>No broker listings yet.</p>:items.map(x=><div className="row"><div><b>{x.title}</b><small>{x.type} • {x.area} • {x.price}</small></div><div>{x.status==="pending"?<button className="btn small" onClick={()=>approve(x.id)}>Approve</button>:<span className="pill">{x.status}</span>}</div></div>)}</div><div className="panel"><h2>Visit Requests</h2>{visits.length===0?<p>No visits yet.</p>:visits.map(v=><div className="row"><div><b>{v.propertyTitle}</b><small>{v.name} • {v.phone} • {v.date} {v.time}</small></div><span className="pill">{v.status}</span></div>)}</div></main>
}
createRoot(document.getElementById("root")).render(<BrowserRouter><App/></BrowserRouter>);