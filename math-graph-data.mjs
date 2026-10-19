// Teaching links are editorial suggestions; they are not mined co-occurrences.
const relationships={
'初一':[
['有理数概念与大小比较','有理数运算与运算律','先弄清正负数、相反数和大小关系，再练带符号的运算。'],
['有理数概念与大小比较','数轴、绝对值与动点','数轴上的位置和正负关系，是理解绝对值和两点距离的基础。'],
['有理数运算与运算律','代数式表示与求值','代入后的计算仍要用到有理数运算和运算顺序。'],
['代数式表示与求值','整式概念、同类项与加减','先理解字母表示数，再判断同类项、合并和化简。'],
['整式概念、同类项与加减','一元一次方程与等式性质','去括号、合并同类项会用于解一元一次方程。'],
['正负数实际应用','代数式表示与求值','把收支、温差等数量关系用字母和式子表示。'],
['有理数运算与运算律','科学记数法与近似数','科学记数法中的乘方和数量级判断需要基本运算。'],
['代数式表示与求值','新定义、进位制与规律探究','读懂新规则后，常需要列式、代入和计算。'],
['数轴、绝对值与动点','一元一次方程与等式性质','动点的距离和相遇问题可以列方程求解。'],
['代数式表示与求值','反比例关系','先写清两个量的关系，再讨论一个量变化时另一个量怎样变化。'],
['整式概念、同类项与加减','有理数与整式综合辨析','综合辨析需要同时检查概念和运算规则。']
],
'初二':[
['三角形边角与面积','全等三角形判定与综合','先找边角条件，再选择全等判定方法。'],
['全等三角形判定与综合','等腰与等边三角形','全等的对应边角关系，常用于等腰、等边三角形的证明。'],
['全等三角形判定与综合','垂直平分线与角平分线','等距、等角条件常可通过构造全等三角形来说明。'],
['轴对称与图形变换','垂直平分线与角平分线','轴对称中的等距关系，与垂直平分线的性质相联系。'],
['垂直平分线与角平分线','尺规作图','作垂直平分线、角平分线时，要能说明作图依据。'],
['轴对称与图形变换','等腰与等边三角形','等腰、等边三角形的对称性可帮助寻找相等边角。'],
['实数与零指数幂运算','整式运算与乘法公式','幂和符号运算要做准确，才能继续处理整式。'],
['整式运算与乘法公式','因式分解','乘法公式反过来使用，是因式分解的一种方法。'],
['整式运算与乘法公式','方程、不等式与实际应用','列式之后，化简和求解仍要用到整式运算。'],
['整式运算与乘法公式','新定义与规律探究','新定义中的式子常需要展开、化简或整体代入。'],
['三角形边角与面积','数学命题与综合辨析','判断几何命题时，需要逐项检查条件和结论。'],
['统计图与样本估计','方程、不等式与实际应用','都需要从文字或图表中找出数量，再写出关系。'],
['实数与零指数幂运算','科学记数法与近似数','幂运算和数量级判断需要一起复习。']
]};
export function buildMathGraph(report,group='全部集团'){
 const selected=report.groups.find(g=>g.name===group),isAll=!selected;
 const nodes=report.topics.map((t,i)=>{
 const evidence=t.evidence.filter(x=>isAll||x.group===group);
 const frequency=isAll?t.frequency:(selected.topics[t.name]?.frequency??null);
 const weight=isAll?t.weight:(selected.topics[t.name]?.weight??null);
 const count=evidence.reduce((s,x)=>s+x.labels.length,0);
 return {id:t.name,index:i,name:t.name,levelHint:report.topicLevels?.[t.name],evidence,frequency,weight,count,papers:isAll?t.paperCount:(frequency===null?null:frequency>0?1:0),color:/三角形|对称|平分线|作图|数轴/.test(t.name)?'#75d8cd':/运算|整式|代数|因式|实数/.test(t.name)?'#a8baff':'#f1c782',val:9+Math.sqrt(count)*5};
 }).filter(n=>isAll||n.count>0);
 const names=new Set(nodes.map(n=>n.id));
 const links=(report.relations||relationships[report.grade]||[]).filter(([a,b])=>names.has(a)&&names.has(b)).map(([source,target,reason,prior])=>({source,target,reason,prior,type:'teaching'}));
 styleMathGraph(nodes,links,isAll);
 return {nodes,links,group,frequencySamples:isAll?report.frequencySamples:selected.frequencySamples,scoreSamples:isAll?report.scoreSamples:selected.scoreSamples,isAll};
}
export function sharedPaperLinks(nodes){
 const links=[];
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
 const evidence=nodes[i].evidence.filter(a=>nodes[j].evidence.some(b=>b.sourceId===a.sourceId));
 if(evidence.length)links.push({source:nodes[i].id,target:nodes[j].id,type:'paper',reason:`在 ${evidence.length} 份试卷中同时出现。这只说明同卷考到，不表示同题综合。`,evidence});
 }
 return links;
}

const stages={
 '有理数概念与大小比较':0,'正负数实际应用':0,'科学记数法与近似数':0,'有理数运算与运算律':1,'代数式表示与求值':1,'整式概念、同类项与加减':1,'反比例关系':1,'一元一次方程与等式性质':1,'数轴、绝对值与动点':2,'新定义、进位制与规律探究':2,'有理数与整式综合辨析':2,
 '三角形边角与面积':0,'实数与零指数幂运算':0,'轴对称与图形变换':1,'等腰与等边三角形':1,'垂直平分线与角平分线':1,'尺规作图':1,'整式运算与乘法公式':1,'因式分解':1,'统计图与样本估计':1,'全等三角形判定与综合':2,'方程、不等式与实际应用':2,'数学命题与综合辨析':2,'新定义与规律探究':2
};
const priorPairs=new Set([
'有理数概念与大小比较|有理数运算与运算律','有理数概念与大小比较|数轴、绝对值与动点','有理数运算与运算律|代数式表示与求值','代数式表示与求值|整式概念、同类项与加减','整式概念、同类项与加减|一元一次方程与等式性质',
'三角形边角与面积|全等三角形判定与综合','实数与零指数幂运算|整式运算与乘法公式','整式运算与乘法公式|因式分解','垂直平分线与角平分线|尺规作图'
]);
export function styleMathGraph(nodes,links,isAll){
 const maxWeight=Math.max(.001,...nodes.map(n=>n.weight??0)),maxCount=Math.max(1,...nodes.map(n=>n.count));
 const hues=[171,250,35,195,316,83,225,12,280,145,48,341,110,208];
 nodes.forEach(n=>{n.level=n.levelHint??stages[n.id]??1;n.levelName=['基础理解','方法应用','综合运用'][n.level];n.color=`hsl(${hues[n.index%hues.length]}, ${[48,61,76][n.level]}%, ${[79,67,56][n.level]}%)`;
 n.importance=n.weight===null?n.count/maxCount:(isAll?.40*(n.frequency??0)+.60*n.weight/maxWeight:.25*n.count/maxCount+.75*n.weight/maxWeight);
 n.radius=11+25*Math.pow(Math.max(0,Math.min(1,n.importance)),1.15);
 });
 links.forEach(l=>{l.prior=l.type==='teaching'&&(l.prior??priorPairs.has(`${l.source}|${l.target}`))});
 return {nodes,links};
}
export function layoutMathGraph(nodes,{width,height,mode='3d',distance=650,fov=50}){
 const unit=2*distance*Math.tan(fov*Math.PI/360)/height,mobile=width<520;
 const ranked=[...nodes].sort((a,b)=>b.importance-a.importance||a.index-b.index),core=Math.min(3,ranked.length);
 ranked.forEach((n,i)=>{let x,y;
 if(mobile){const rows=Math.ceil(ranked.length/2),pitch=Math.min(110,(height-170)/Math.max(1,rows-1));x=width*(i%2?.74:.26);y=85+Math.floor(i/2)*pitch;}
 else if(i<core){const a=-Math.PI/2+i*Math.PI*2/core;x=width/2+Math.cos(a)*width*.17;y=height*.49+Math.sin(a)*height*.16;}
 else {const a=-Math.PI/2+(i-core+.4)*Math.PI*2/Math.max(1,ranked.length-core);x=width/2+Math.cos(a)*width*.38;y=height*.49+Math.sin(a)*height*.37;}
 n.fx=(x-width/2)*unit;n.fy=(height/2-y)*unit;n.fz=mode==='2d'?0:Math.sin(n.index*1.7)*23;n.renderRadius=n.radius*(mobile?.78:1)*unit;
 });return nodes;
}
