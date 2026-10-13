export function markRegion(W,onRegion){
 const c=W.document.querySelector('canvas');if(!c)return;W.__pause?.();
 W.document.querySelector('[data-region-overlay]')?.remove();const r=c.getBoundingClientRect(),overlay=W.document.createElement('div'),box=W.document.createElement('div');
 overlay.dataset.regionOverlay='true';overlay.tabIndex=0;overlay.setAttribute('aria-label','Drag a region for the frame annotation. Escape cancels.');
 const color=getComputedStyle(document.documentElement).getPropertyValue('--acc').trim();
 overlay.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:30;cursor:crosshair;touch-action:none`;
 box.style.cssText=`position:absolute;border:2px dashed ${color};pointer-events:none`;overlay.append(box);W.document.body.append(overlay);overlay.focus();
 let start;const point=e=>({x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))});
 overlay.onpointerdown=e=>{start=point(e);overlay.setPointerCapture(e.pointerId);};
 const area=p=>[Math.min(p.x,start.x),Math.min(p.y,start.y),Math.abs(p.x-start.x),Math.abs(p.y-start.y)];
 overlay.onpointermove=e=>{if(!start)return;const a=area(point(e));Object.assign(box.style,{left:a[0]*100+'%',top:a[1]*100+'%',width:a[2]*100+'%',height:a[3]*100+'%'});};
 overlay.onpointerup=e=>{if(!start)return;const a=area(point(e));overlay.remove();if(a[2]*r.width>=3&&a[3]*r.height>=3)onRegion(a);};
 overlay.onpointercancel=()=>overlay.remove();overlay.onkeydown=e=>{if(e.key==='Escape'){overlay.remove();e.preventDefault();}};
}
