/* Dependency-free native WebGL lunar globe. Interactive and textured. */
const vs = `
attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV;
uniform mat4 uTransform; uniform float uZoom; uniform vec2 uAspect;
varying vec3 vNormal; varying vec2 vUV; varying vec3 vPos;
void main(){ vec4 p=uTransform*vec4(aPosition,1.0); vPos=p.xyz; vNormal=(uTransform*vec4(aNormal,0.0)).xyz; vUV=aUV;
 gl_Position=vec4(p.xy*uZoom*uAspect,p.z*0.1,1.0); }
`;
const fs = `
precision mediump float;
uniform sampler2D uTexture; uniform vec3 uLight;
varying vec3 vNormal; varying vec2 vUV; varying vec3 vPos;
void main(){ vec3 n=normalize(vNormal); float lit=max(0.,dot(n,normalize(uLight)));
 float rim=pow(1.-max(0.,dot(n,vec3(0.,0.,1.))),2.2);
 vec3 base=texture2D(uTexture,vec2(vUV.x,1.0-vUV.y)).rgb;
 vec3 color=base*(0.17+0.91*lit)+vec3(.24,.25,.27)*rim*.40;
 gl_FragColor=vec4(color,1.); }
`;
function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function sphere(rows=70,cols=140){const pos=[],norm=[],uv=[],idx=[];
 for(let i=0;i<=rows;i++){const lat=(i/rows-.5)*Math.PI;for(let j=0;j<=cols;j++){
 const lon=(j/cols)*2*Math.PI-Math.PI;
 const x=Math.cos(lat)*Math.sin(lon),y=Math.sin(lat),z=Math.cos(lat)*Math.cos(lon);
 pos.push(x,y,z);norm.push(x,y,z);uv.push(j/cols, i/rows);
 }}for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;idx.push(a,a+1,b,b,a+1,b+1)}
 return {pos,norm,uv,idx};}
function rotation(pitch,yaw){const a=Math.cos(pitch),b=Math.sin(pitch),c=Math.cos(yaw),d=Math.sin(yaw);
 // yaw(Y) multiplied by pitch(X); in column-major layout
 return new Float32Array([c, 0, -d, 0, d*b, a, c*b, 0, d*a, -b, c*a, 0, 0,0,0,1]); }
function rotatePoint(v,pitch,yaw){const a=Math.cos(pitch),b=Math.sin(pitch),c=Math.cos(yaw),d=Math.sin(yaw);
 const x=v[0],y=a*v[1]-b*v[2],z=b*v[1]+a*v[2];return [c*x+d*z,y,-d*x+c*z];}
export function makeMoon(canvas,overlay,textureURL,siteClicked){
 let gl=null;try{gl=canvas.getContext('webgl',{antialias:true,alpha:true,preserveDrawingBuffer:true});}catch{}
 const ctx=overlay.getContext('2d');let pitch=-1.04,yaw=.2,zoom=.82,sites=[],selected=null,drag=false,startX=0,startY=0,lastX=0,lastY=0,lastT=0;
 if(gl){
  const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);gl.useProgram(p);
  const geo=sphere();const indices=new Uint16Array(geo.idx);
  function buffer(data,attr,size){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);const loc=gl.getAttribLocation(p,attr);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);}
  buffer(geo.pos,'aPosition',3);buffer(geo.norm,'aNormal',3);buffer(geo.uv,'aUV',2);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  // WebGL 1 requires CLAMP_TO_EDGE + non-mipmapped filtering for NPOT textures.
  // Our lunar texture is 1600 x 800 (not powers of two). Without these parameters,
  // the sampler is incomplete and the globe appears as a black circle.
  const tex=gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([149,154,162,255]));
  const im=new Image();
  im.onload=()=>{
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);
    // Use mipmaps only if the uploaded texture has power-of-two dimensions.
    const pot=n=>n>0&&(n&(n-1))===0;
    if(pot(im.naturalWidth)&&pot(im.naturalHeight)){
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    draw();
  };
  im.onerror=()=>{console.warn('LUNARIS: lunar texture failed to load; using the gray fallback.');draw();};
  im.src=textureURL;
  gl.uniform1i(gl.getUniformLocation(p,'uTexture'),0);
  gl.uniform3f(gl.getUniformLocation(p,'uLight'),-.65,.4,1.2);
  var drawGl=()=>{gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.useProgram(p);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uTransform'),false,rotation(pitch,yaw));gl.uniform1f(gl.getUniformLocation(p,'uZoom'),zoom);gl.uniform2f(gl.getUniformLocation(p,'uAspect'),Math.min(1,canvas.height/canvas.width),Math.min(1,canvas.width/canvas.height));gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);};
 } else {
  // Software-rendered, draggable 3D Moon for browsers/devices where WebGL is disabled.
  // This is still a genuine sphere projection with latitude/longitude texture lookup,
  // directional lighting and the same interactive pitch/yaw/zoom as the GPU renderer.
  const surface=canvas.getContext('2d',{alpha:true});
  let texture=null, texW=0, texH=0;
  const image=new Image();
  image.onload=()=>{
   try{
    const temp=document.createElement('canvas');temp.width=image.naturalWidth;temp.height=image.naturalHeight;
    const t=temp.getContext('2d',{willReadFrequently:true});t.drawImage(image,0,0);
    texture=t.getImageData(0,0,temp.width,temp.height).data;texW=temp.width;texH=temp.height;
   }catch(err){console.warn('LUNARIS: software texture unavailable',err)}
   draw();
  };
  image.onerror=()=>console.warn('LUNARIS: moon texture could not be loaded');
  image.src=textureURL;
  var drawGl=()=>{
   const w=canvas.width,h=canvas.height,dim=Math.min(w,h),cx=w/2,cy=h/2,r=dim*zoom/2;
   if(!w||!h||!r)return;
   surface.clearRect(0,0,w,h);
   if(!texture){
    // Shaded fallback even before the image finishes decoding.
    const gr=surface.createRadialGradient(cx-r*.3,cy-r*.32,r*.04,cx,cy,r);
    gr.addColorStop(0,'#a0a7ab');gr.addColorStop(.6,'#5b646c');gr.addColorStop(1,'#181e27');
    surface.fillStyle=gr;surface.beginPath();surface.arc(cx,cy,r,0,Math.PI*2);surface.fill();
    return;
   }
   const pixels=surface.createImageData(w,h),data=pixels.data;
   const a=Math.cos(pitch),b=Math.sin(pitch),c=Math.cos(yaw),d=Math.sin(yaw);
   const x0=Math.max(0,Math.floor(cx-r-1)),x1=Math.min(w,Math.ceil(cx+r+1));
   const y0=Math.max(0,Math.floor(cy-r-1)),y1=Math.min(h,Math.ceil(cy+r+1));
   for(let y=y0;y<y1;y++){
    const ny=(cy-(y+.5))/r;
    for(let x=x0;x<x1;x++){
     const nx=((x+.5)-cx)/r, distance=nx*nx+ny*ny;
     if(distance>1)continue;
     const nz=Math.sqrt(1-distance);
     // Inverse transform: view-space normal back into the Moon's texture frame.
     const px=c*nx-d*nz,py=ny,pz=d*nx+c*nz;
     const qx=px,qy=a*py+b*pz,qz=-b*py+a*pz;
     const lon=Math.atan2(qx,qz),lat=Math.asin(Math.max(-1,Math.min(1,qy)));
     const tx=Math.min(texW-1,Math.max(0,Math.floor((lon/(2*Math.PI)+.5)*texW)));
     const ty=Math.min(texH-1,Math.max(0,Math.floor((.5-lat/Math.PI)*texH)));
     const k=(ty*texW+tx)*4,j=(y*w+x)*4;
     const light=Math.max(0,(-.65*nx+.4*ny+1.2*nz)/Math.hypot(-.65,.4,1.2));
     const intensity=.20+.86*light;
     const rim=Math.pow(1-nz,2.2)*14;
     data[j]=Math.min(255,texture[k]*intensity+rim);
     data[j+1]=Math.min(255,texture[k+1]*intensity+rim);
     data[j+2]=Math.min(255,texture[k+2]*intensity+rim);
     data[j+3]=Math.round(255*Math.min(1,Math.max(0,(1-distance)*90)));
    }
   }
   surface.putImageData(pixels,0,0);
  };
 }
 function point(lat,lon){const a=lat*Math.PI/180,b=lon*Math.PI/180;return [Math.cos(a)*Math.sin(b),Math.sin(a),Math.cos(a)*Math.cos(b)];}
 let locs=[];
 function drawOverlay(){const w=overlay.width,h=overlay.height,dim=Math.min(w,h);ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.strokeStyle='rgba(113,183,222,.17)';ctx.lineWidth=1;
 for(let i=1;i<=3;i++){ctx.beginPath();ctx.ellipse(0,0,dim*zoom/2+i*16,dim*zoom/2+i*16,0,0,Math.PI*2);ctx.stroke();}
 ctx.beginPath();ctx.moveTo(-w/2+20,0);ctx.lineTo(w/2-20,0);ctx.moveTo(0,-h/2+20);ctx.lineTo(0,h/2-20);ctx.setLineDash([3,12]);ctx.stroke();ctx.setLineDash([]);
 locs=[];
 for(const s of sites){const q=rotatePoint(point(s.lat,s.lon),pitch,yaw);if(q[2]<0.03)continue;
 const x=q[0]*dim*zoom/2,y=-q[1]*dim*zoom/2;locs.push({...s,x,y});const active=selected?.id===s.id;
 ctx.strokeStyle=active?'#7df9df':'#ffce75';ctx.fillStyle=active?'#7df9df':'#ffce75';ctx.lineWidth=1.6;
 ctx.beginPath();ctx.arc(x,y,active?11:6,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,active?4:2.8,0,Math.PI*2);ctx.fill();
 if(active){ctx.font='600 12px system-ui';ctx.textAlign='left';ctx.fillStyle='#d7fff7';ctx.fillText(s.name,x+15,y-9);}
 }
 ctx.restore();}
 function resize(){const rect=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));overlay.width=canvas.width;overlay.height=canvas.height;ctx.setTransform(1,0,0,1,0,0);draw();}
 function draw(){drawGl();drawOverlay();}
 const coord=e=>{const r=overlay.getBoundingClientRect();return [(e.clientX-r.left)*overlay.width/r.width-overlay.width/2,(e.clientY-r.top)*overlay.height/r.height-overlay.height/2]};
 overlay.addEventListener('pointerdown',e=>{drag=true;[startX,startY]=coord(e);lastX=startX;lastY=startY;lastT=Date.now();overlay.setPointerCapture(e.pointerId)});
 overlay.addEventListener('pointermove',e=>{if(!drag)return;const [x,y]=coord(e);const d=Math.min(overlay.width,overlay.height);yaw+=(x-lastX)*3/d;pitch=Math.max(-1.55,Math.min(1.55,pitch+(y-lastY)*3/d));lastX=x;lastY=y;draw();});
 overlay.addEventListener('pointerup',e=>{if(!drag)return;drag=false;const [x,y]=coord(e);if(Math.hypot(x-startX,y-startY)<8){let closest=null,best=18*(devicePixelRatio||1);for(const s of locs){const dist=Math.hypot(s.x-x,s.y-y);if(dist<best){best=dist;closest=s;}}if(closest)siteClicked?.(closest.id);}});
 overlay.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(1.12,zoom+(e.deltaY<0?.045:-.045)));draw();},{passive:false});
 window.addEventListener('resize',resize);new ResizeObserver(resize).observe(canvas);
 return {setSites(a){sites=a;draw();},select(s){selected=s;draw();},focus(){pitch=-1.04;yaw=.2;zoom=.82;draw();},draw, getAngles(){return {pitch,yaw,zoom}},resize};
}
