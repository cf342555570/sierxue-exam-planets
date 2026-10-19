import {graphMarkup,mountMathGraph} from './math-graph.mjs';
import {renderMathReport} from './math-report-view.mjs';
import {subjectCatalog} from './subject-catalog.mjs';
const reports=await fetch('./reports.json').then(r=>{if(!r.ok)throw Error('报告加载失败，请刷新');return r.json()});
const select=document.querySelector('#report-select'),content=document.querySelector('#content');
let dispose=()=>{},mode=new URLSearchParams(location.search).get('view')==='parent'?'parent':'graph';
reports.forEach((r,i)=>{Object.assign(r,subjectCatalog[r.subject]||{});const o=document.createElement('option');o.value=i;o.textContent=r.grade+' · '+r.subject+' · '+r.year;select.append(o)});
select.value=String(Math.max(0,reports.findIndex(r=>r.grade===new URLSearchParams(location.search).get('grade')&&r.subject===new URLSearchParams(location.search).get('subject')&&r.year===new URLSearchParams(location.search).get('year'))));
function render(){dispose();const report=reports[Number(select.value)];const params=new URLSearchParams({grade:report.grade,subject:report.subject,year:report.year,view:mode});history.replaceState(null,'','?'+params);content.innerHTML=mode==='parent'?renderMathReport(report,'parent'):graphMarkup(report);if(mode==='graph')dispose=mountMathGraph(content,report,id=>{const source=report.sources.find(s=>s.id===id);const text=document.querySelector('#source-text');text.replaceChildren();const p=document.createElement('p');p.textContent=source?source.title+'。题号与页码见星球详情。本页不提供原卷下载。':'出处暂待核对';text.append(p);document.querySelector('#source-dialog').showModal()});else dispose=()=>{};}
select.onchange=render;document.querySelector('#show-report').onclick=()=>{mode='parent';render()};document.querySelector('#show-graph').onclick=()=>{mode='graph';render()};document.querySelector('#close-dialog').onclick=()=>document.querySelector('#source-dialog').close();render();
