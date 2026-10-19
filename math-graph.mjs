import * as THREE from './three.module.js';
import {buildMathGraph,sharedPaperLinks,layoutMathGraph} from './math-graph-data.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=n=>n===null?'待核实':(n*100).toFixed(1)+'%';
function planet(n){
 const obj=new THREE.Group(),r=n.renderRadius||n.radius||16;
 const texture=document.createElement('canvas');texture.width=256;texture.height=128;const c=texture.getContext('2d');c.fillStyle=n.color;c.fillRect(0,0,256,128);for(let i=0;i<11;i++){c.fillStyle=i%2?'rgba(255,255,255,.10)':'rgba(7,28,42,.11)';c.fillRect(0,i*13,256,5+(i%3)*3)}
 const map=new THREE.CanvasTexture(texture);map.colorSpace=THREE.SRGBColorSpace;
 const sphere=new THREE.Mesh(new THREE.SphereGeometry(r,32,24),new THREE.MeshPhongMaterial({map,color:0xffffff,shininess:35,emissive:n.color,emissiveIntensity:.13}));obj.add(sphere);
 const halo=new THREE.Mesh(new THREE.SphereGeometry(r*1.12,24,20),new THREE.MeshBasicMaterial({color:n.color,transparent:true,opacity:.10,depthWrite:false,side:THREE.BackSide}));obj.add(halo);
 if(n.index%3===0){const ring=new THREE.Mesh(new THREE.TorusGeometry(r*1.55,.65,6,64),new THREE.MeshBasicMaterial({color:n.color,transparent:true,opacity:.65}));ring.rotation.x=1.02;ring.rotation.y=.3;obj.add(ring)}
 return obj;
}
let library;
function loadLibrary(){if(window.ForceGraph3D)return Promise.resolve();return library??=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='./3d-force-graph.min.js';s.onload=resolve;s.onerror=()=>{library=null;reject(Error('立体图暂时没有加载成功，下方仍可按列表查看。'))};document.head.append(s)})}
export function graphMarkup(report={}){return `<section class="knowledge-shell"><div class="knowledge-heading"><div><p class="kicker">长沙秋季 · 学科考点</p><h2>把这次期中的重点，连起来看</h2><p>选一个集团，再点一颗星球，看对应题目和复习顺序。</p></div><span class="graph-local">试阅 · 待老师复核</span></div><div class="knowledge-controls"><label>集团／学校<select id="graph-group"></select></label><div class="graph-switch" role="group" aria-label="图谱样式"><button data-graph-mode="3d" class="active">星球图 3D</button><button data-graph-mode="2d">平面关系图</button></div><label>连线表示<select id="graph-link"><option value="teaching">复习联系（待老师确认）</option><option value="paper">同卷出现（试卷统计）</option><option value="none">不显示连线</option></select></label><button id="graph-reset">回到全景</button><button id="graph-motion" aria-pressed="false">开启慢转</button></div><div class="knowledge-workspace"><div class="graph-stage"><div id="planet-canvas" role="img" aria-label="学科考点三维图，下面的考点按钮也可查看相同内容"></div><div class="planet-labels" id="planet-labels"></div><div class="graph-corner">拖动旋转 · 滚轮缩放 · 点星球看题目</div><div class="graph-legend"><span><i class="basic"></i>浅色：基础理解</span><span><i class="advanced"></i>深色：综合运用</span><span>箭头：先复习 → 后运用</span></div></div><aside class="graph-detail" id="graph-detail" aria-live="polite"></aside></div><div id="graph-summary" class="graph-summary"></div><div class="graph-topic-list" id="graph-topic-list" aria-label="考点列表"></div><p class="graph-footnote">${report.analysisUnit==='题组'?'语文、英语本版按原卷题型分组；未细分到每个语法点或阅读技能。':''}星球大小参考考点出现率和分值占比；分值不全时参考题数。每个考点颜色不同，基础内容较浅、综合运用较深。带箭头的线表示建议先复习哪一项，其他线表示内容联系，均待老师确认。颜色与大小不表示孩子的掌握程度。每个集团同年级目前只有一份卷子，集团页看本卷题数和分值占比，跨集团汇总才看出现率。连线中的复习联系是初步教学整理，待老师确认；同卷出现不代表同题综合。</p><details class="graph-reference"><summary>这张图参考了什么？</summary><p>交互采用 <a href="https://github.com/vasturiano/3d-force-graph" target="_blank" rel="noopener">3d-force-graph</a>（MIT），支持旋转、缩放和点选。平面视图借鉴 <a href="https://obsidian.md/help/plugins/graph" target="_blank" rel="noopener">Obsidian 关系图</a>的查看方式。考点、题号和分值来自本次收集的各科试卷，未使用商业学习机的题库或掌握度数据。</p></details></section>`}
export function mountMathGraph(root,report,onEvidence){
 let disposed=false,graph=null,frame=0,resize=null,group='全部集团',mode='3d',kind='teaching',selected='',motion=false,lastFrame=0,angle=0;
 const q=s=>root.querySelector(s);const groups=report.groups.map(g=>g.name);
 q('#graph-group').innerHTML=['全部集团',...groups].map(x=>`<option>${esc(x)}</option>`).join('');
 let model,activeLinks;
 function choose(id){selected=id;const n=model.nodes.find(x=>x.id===id);if(!n){const sources=report.sources.filter(x=>group==='全部集团'||x.group===group);q('#graph-detail').innerHTML='<h3>'+esc(group==='全部集团'?'暂未完成整卷复核':'这份卷子还需要核对')+'</h3><p>'+esc(group==='全部集团'?'当前没有可统计的考点记录，可切回“初步整理”查看。':'题数或分值说明有疑问，暂不汇总本卷考点。')+'</p>'+sources.map(x=>'<p>'+x.issues.map(esc).join('<br>')+'</p><button class="graph-evidence" data-source="'+esc(x.id)+'">试卷出处：'+esc(x.group)+'</button>').join('');q('#graph-detail').querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>onEvidence(b.dataset.source));return;}
 const related=activeLinks.filter(l=>(l.source.id||l.source)===id||(l.target.id||l.target)===id);
 q('#graph-detail').innerHTML=`<span class="detail-eyebrow">${esc(report.grade)}${esc(report.subject||'数学')} · ${esc(group)} · ${esc(n.levelName)}</span><h3>${esc(n.name)}</h3><div class="detail-stats"><div><b>${n.count}</b><small>${report.analysisUnit==='题组'?'个对应题组':'道对应题'}</small></div><div><b>${pct(n.weight)}</b><small>${model.isAll?'平均分值占比':'本卷分值占比'}</small></div></div>${model.isAll?`<p>出现于 ${n.papers}/${model.frequencySamples} 份完整试卷，出现率 ${pct(n.frequency)}。<br>分值占比依据 ${model.scoreSamples} 份分值明确的试卷。</p>`:`<p>本集团目前只有一份同年级试卷，不据此判断长期高频。${model.scoreSamples?'':'本卷分值尚不完整，暂不计算分值占比。'}${model.frequencySamples?'':'题数有待核对，暂未计入完整卷统计。'}</p>`}<h4>对应题目</h4>${n.evidence.map(x=>`<button class="graph-evidence" data-source="${esc(x.sourceId)}"><b>${esc(x.group)}</b><span>${report.analysisUnit==='题组'?'题组 '+esc(x.labels.join('、')):'第 '+esc(x.labels.join('、'))+' 题'}</span><small>PDF 第 ${esc(x.pages.join('、'))} 页 · 查看试卷出处</small></button>`).join('')||'<p>当前范围内没有可统计的对应题目。</p>'}<h4>${kind==='paper'?'同卷还考到了':kind==='none'?'当前未显示连线':'复习时可以联系着看'}</h4>${related.map(l=>{const other=(l.source.id||l.source)===id?(l.target.id||l.target):(l.source.id||l.source);return `<button class="related-topic" data-related="${esc(other)}"><b>${esc(other)}</b><span>${esc(l.reason)}</span></button>`}).join('')||'<p>暂未整理相关连线。</p>'}`;
 q('#graph-detail').querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>onEvidence(b.dataset.source));
 q('#graph-detail').querySelectorAll('[data-related]').forEach(b=>b.onclick=()=>choose(b.dataset.related));
 q('#graph-topic-list').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.topic===id));
 q('#planet-labels').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.label===id));
 if(graph){graph.nodeColor(x=>x.id===selected?'#fff3c5':x.color).linkColor(l=>(l.source.id||l.source)===id||(l.target.id||l.target)===id?'#f4dc9b':kind==='paper'?'#4b7182':'#688e9e').linkOpacity(.55);}
 }
 function update(){
 model=buildMathGraph(report,group);activeLinks=kind==='teaching'?model.links:kind==='paper'?sharedPaperLinks(model.nodes):[];
 q('#graph-topic-list').innerHTML=model.nodes.map(n=>`<button data-topic="${esc(n.id)}">${esc(n.name)}<small>${n.count}${report.analysisUnit==='题组'?'组':'题'}${model.isAll?' · '+pct(n.frequency):''}</small></button>`).join('');
 q('#graph-topic-list').querySelectorAll('button').forEach(b=>b.onclick=()=>choose(b.dataset.topic));
 const top=[...model.nodes].sort((a,b)=>(b.weight??-1)-(a.weight??-1)||b.count-a.count).slice(0,3);
 q('#graph-summary').innerHTML=`<b>${esc(group==='全部集团'?'这批试卷的重点':group+' · 本卷重点')}</b><span>${top.map(n=>esc(n.name)+'（'+(n.weight===null?n.count+'题':pct(n.weight))+'）').join('、')||(group==='全部集团'?'当前没有可统计的考点记录，可切回“初步整理”查看。':'本卷题数尚待核对，暂不汇总考点。')}</span>`;
 if(graph){const stage=q('#planet-canvas');layoutMathGraph(model.nodes,{width:stage.clientWidth,height:stage.clientHeight,mode,distance:650,fov:graph.camera().fov});graph.numDimensions(mode==='2d'?2:3).graphData({nodes:model.nodes,links:activeLinks}).nodeVal('val');graph.controls().enableRotate=mode==='3d';graph.cameraPosition({x:0,y:0,z:650});}
 q('#planet-labels').innerHTML=model.nodes.map(n=>`<button data-label="${esc(n.id)}">${esc(n.name)}</button>`).join('');q('#planet-labels').querySelectorAll('button').forEach(b=>{b.dataset.width=b.offsetWidth;b.onclick=()=>choose(b.dataset.label)});
 choose(model.nodes.some(n=>n.id===selected)?selected:top[0]?.id);
 }
 q('#graph-group').onchange=x=>{group=x.target.value;update()};q('#graph-link').onchange=x=>{kind=x.target.value;update()};
 root.querySelectorAll('[data-graph-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.graphMode;root.querySelectorAll('[data-graph-mode]').forEach(x=>x.classList.toggle('active',x===b));q('.graph-corner').textContent=mode==='3d'?'拖动旋转 · 滚轮缩放 · 点星球看题目':'拖动平移 · 滚轮缩放 · 点考点看题目';if(mode==='2d'){motion=false;q('#graph-motion').textContent='开启慢转';q('#graph-motion').setAttribute('aria-pressed','false')}q('#graph-motion').disabled=mode==='2d';update()});
 q('#graph-reset').onclick=()=>{if(graph)graph.cameraPosition({x:0,y:0,z:650},450)};
 q('#graph-motion').onclick=()=>{motion=!motion;q('#graph-motion').textContent=motion?'暂停慢转':'开启慢转';q('#graph-motion').setAttribute('aria-pressed',String(motion));angle=0};
 update();
 loadLibrary().then(()=>{if(disposed)return;try{
 const stage=q('#planet-canvas');graph=new window.ForceGraph3D(stage,{controlType:'orbit',rendererConfig:{antialias:true,alpha:true,preserveDrawingBuffer:true}}).backgroundColor('#0b2030').width(stage.clientWidth).height(stage.clientHeight).nodeThreeObject(planet).nodeResolution(32).nodeRelSize(4).nodeOpacity(.96).nodeLabel(n=>esc(n.name)+' · '+n.count+(report.analysisUnit==='题组'?'组':'题')).showNavInfo(false).onNodeClick(n=>choose(n.id)).linkWidth(l=>l.prior?1.25:.8).linkDirectionalArrowLength(l=>l.prior?8:0).linkDirectionalArrowRelPos(.65).enableNodeDrag(false).cooldownTicks(0);
 const points=[];for(let i=0;i<150;i++){const a=i*2.39996,b=(i%29)/29*Math.PI;points.push(Math.cos(a)*Math.sin(b)*650,Math.sin(a)*Math.sin(b)*650,Math.cos(b)*650-140)}
 const sky=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3)),new THREE.PointsMaterial({color:'#a9c6cd',size:1.1,transparent:true,opacity:.40}));graph.scene().add(sky);
 graph.renderer().setPixelRatio(Math.min(devicePixelRatio,2));update();
 resize=new ResizeObserver(()=>{if(!disposed&&graph){graph.width(stage.clientWidth).height(stage.clientHeight);update()}});resize.observe(stage);
 const draw=time=>{if(disposed)return;frame=requestAnimationFrame(draw);if(document.hidden||time-lastFrame<40)return;lastFrame=time;
 if(motion&&mode==='3d'){angle+=.0018;graph.cameraPosition({x:650*Math.sin(angle),y:35*Math.sin(angle*.5),z:650*Math.cos(angle)})}
 const camera=graph.camera(),w=stage.clientWidth,h=stage.clientHeight,used=[];
 for(const b of [...q('#planet-labels').children].sort((a,b)=>Number(b.dataset.label===selected)-Number(a.dataset.label===selected))){const n=model.nodes.find(n=>n.id===b.dataset.label);if(!n||!Number.isFinite(n.x)){b.hidden=true;continue}const v=graph.scene().position.clone().set(n.x,n.y,n.z).project(camera);const x=(v.x+1)*w/2,cy=(-v.y+1)*h/2;
 const width=Math.min(w-20,Number(b.dataset.width)||150),r=n.radius*(w<520?.78:1)+8;
 const candidates=[[x,cy+r],[x,cy-r-28],[x+width/2+r,cy-12],[x-width/2-r,cy-12]];let place=null;
 for(let [cx,y] of candidates){cx=Math.max(width/2+10,Math.min(w-width/2-10,cx));const rect=[cx-width/2,y,cx+width/2,y+29];const blocked=used.some(t=>!(rect[2]+5<t[0]||rect[0]-5>t[2]||rect[3]+5<t[1]||rect[1]-5>t[3]));if(y>=45&&y<h-75&&!blocked){place={cx,y,rect};break}}
 b.hidden=v.z>1||!place;if(!b.hidden){b.style.left=place.cx+'px';b.style.top=place.y+'px';used.push(place.rect)}}

 };frame=requestAnimationFrame(draw);
 }catch(err){q('#planet-canvas').innerHTML='<p class="graph-load-error">当前设备未能开启立体图，可以使用下方考点列表查看相同内容。</p>';console.warn(err)}}).catch(err=>{if(!disposed)q('#planet-canvas').textContent=err.message});
 return ()=>{disposed=true;cancelAnimationFrame(frame);resize?.disconnect();if(graph){graph._destructor();graph=null}};
}
