import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const host=document.getElementById("webgl");
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x050608);
scene.fog=new THREE.FogExp2(0x050608,.018);

const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,400);
camera.position.set(0,1.5,17);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
host.appendChild(renderer.domElement);

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),1.25,.65,.18);
composer.addPass(bloom);

scene.add(new THREE.AmbientLight(0x7180a8,.5));
const key=new THREE.PointLight(0xb8ff5c,45,35);key.position.set(5,7,8);scene.add(key);
const rim=new THREE.PointLight(0x476cff,55,32);rim.position.set(-7,1,3);scene.add(rim);

const world=new THREE.Group();scene.add(world);

const floor=new THREE.Mesh(
 new THREE.PlaneGeometry(60,60),
 new THREE.MeshStandardMaterial({color:0x080b10,metalness:.82,roughness:.3})
);
floor.rotation.x=-Math.PI/2;floor.position.y=-2.4;world.add(floor);

const grid=new THREE.GridHelper(55,55,0x243020,0x151a20);
grid.position.y=-2.36;grid.material.transparent=true;grid.material.opacity=.34;world.add(grid);

const mat=new THREE.MeshPhysicalMaterial({
 color:0xb8ff5c,metalness:.35,roughness:.18,clearcoat:1,clearcoatRoughness:.12,
 emissive:0x263d0d,emissiveIntensity:1.2
});
const dark=new THREE.MeshPhysicalMaterial({color:0x161b24,metalness:.88,roughness:.2,clearcoat:1});
const glass=new THREE.MeshPhysicalMaterial({color:0x101722,metalness:.55,roughness:.1,transparent:true,opacity:.72,emissive:0x061326,emissiveIntensity:1});

const rig=new THREE.Group();rig.position.y=-.25;world.add(rig);

// Central architectural "construction" frame
const beamGeo=new THREE.BoxGeometry(6.8,.28,.28);
for(let y=-1.5;y<=2.7;y+=1.4){
  const b=new THREE.Mesh(beamGeo,dark);b.position.set(0,y,0);rig.add(b);
}
for(const x of [-3.25,3.25]){
  const col=new THREE.Mesh(new THREE.BoxGeometry(.28,5.6,.28),dark);
  col.position.set(x,.6,0);rig.add(col);
}
const diagGeo=new THREE.CylinderGeometry(.07,.07,6.1,10);
for(const s of [-1,1]){
  const d=new THREE.Mesh(diagGeo,mat);d.rotation.z=s*.73;d.position.set(s*1.65,.55,.1);rig.add(d);
}

// Floating luminous construction modules
const modules=[];
for(let i=0;i<16;i++){
  const g=new THREE.BoxGeometry(.34+Math.random()*.8,.08,.34+Math.random()*.5);
  const m=new THREE.Mesh(g,i%3===0?mat:glass);
  const a=i/16*Math.PI*2;
  m.position.set(Math.cos(a)*(4+Math.random()*2),-1+Math.random()*5,Math.sin(a)*(2+Math.random()*3));
  m.rotation.set(Math.random(),Math.random(),Math.random());
  m.userData={a,r:3+Math.random()*3,sp:.15+Math.random()*.35,phase:Math.random()*6};
  world.add(m);modules.push(m);
}

// Floating particles
const count=900, pos=new Float32Array(count*3), sizes=new Float32Array(count);
for(let i=0;i<count;i++){
  const r=4+Math.random()*13, a=Math.random()*Math.PI*2;
  pos[i*3]=Math.cos(a)*r;
  pos[i*3+1]=(Math.random()-.15)*11;
  pos[i*3+2]=Math.sin(a)*r*.58;
  sizes[i]=Math.random()*2+1;
}
const pgeo=new THREE.BufferGeometry();
pgeo.setAttribute("position",new THREE.BufferAttribute(pos,3));
const pmat=new THREE.PointsMaterial({color:0xc9d5ff,size:.035,transparent:true,opacity:.62,sizeAttenuation:true});
const points=new THREE.Points(pgeo,pmat);world.add(points);

// Orbiting "energy ring"
const ring=new THREE.Mesh(new THREE.TorusGeometry(4.55,.012,8,180),new THREE.MeshBasicMaterial({color:0xb8ff5c,transparent:true,opacity:.48}));
ring.rotation.x=Math.PI*.5;ring.position.y=.15;world.add(ring);
const ring2=ring.clone();ring2.material=ring.material.clone();ring2.material.color.set(0x5276ff);ring2.material.opacity=.26;ring2.scale.set(.72,.72,.72);ring2.rotation.x=.9;ring2.rotation.y=.4;world.add(ring2);

const mouse=new THREE.Vector2(0,0), target=new THREE.Vector2(0,0);
addEventListener("pointermove",e=>{
 target.x=(e.clientX/innerWidth-.5)*2;
 target.y=(e.clientY/innerHeight-.5)*2;
});
addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
});

let t=0;
function animate(){
 requestAnimationFrame(animate);t+=.008;
 mouse.lerp(target,.045);
 world.rotation.y=mouse.x*.075;
 world.rotation.x=-mouse.y*.035;
 camera.position.x=mouse.x*.55;
 camera.position.y=1.5-mouse.y*.3;
 camera.lookAt(0,.2,0);

 rig.rotation.y=Math.sin(t*.32)*.045;
 ring.rotation.z=t*.18;
 ring2.rotation.z=-t*.27;
 points.rotation.y=t*.012;
 key.intensity=42+Math.sin(t*1.8)*8;

 for(const m of modules){
   const u=m.userData;
   m.position.y += Math.sin(t*u.sp*4+u.phase)*.0018;
   m.rotation.x += .001*u.sp*2;
   m.rotation.y += .002*u.sp;
 }
 composer.render();
}
animate();

let value=73;
setInterval(()=>{
 value += Math.random()>.7 ? 1 : 0;
 if(value>92)value=73;
 document.getElementById("pct").textContent=value+"%";
 document.getElementById("bar-fill").style.width=value+"%";
},4200);
document.getElementById("year").textContent=new Date().getFullYear();
