var e={d:(t,r)=>{for(var s in r)e.o(r,s)&&!e.o(t,s)&&Object.defineProperty(t,s,{enumerable:!0,get:r[s]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t)},t={};function r([e,t]){let r=(e=e.trim()).split(" "),s=r.shift().trim(),i=r.join(" ").trim();return"string"==typeof t&&(t=t.trim()),{event:s,selector:i,handler:t}}e.d(t,{A:()=>h});let s={tagName:"div",events:{}};class i{constructor(e){this.id=function(){let e=new Uint8Array(32);window.crypto.getRandomValues(e);let t=btoa(e);return t=t.replace(/\//g,"_").replace(/\+/g,"-").replace(/=+$/,""),t}(),Object.assign(this,s),this.preinitialize.apply(this,arguments),Object.assign(this,e),this._ensureElement(),this.initialize.apply(this,arguments)}preinitialize(){}initialize(){}render(){return this}remove(){this.el.parentElement.removeChild(this.el)}appendTo(e){e.appendChild(this.el)}replaceContentsOf(e){e.innerHTML="",this.appendTo(e)}setElement(e){return this.el!==e&&(this.el=e,this._addListeners()),this}_createElement(e){let t=document.createElement(e);return t.setAttribute("id",this.id),t.view=this,t}_ensureElement(){this.el?this._addListeners():this.setElement(this._createElement(this.tagName)),this._setAttributes(),this.className&&this.el.classList.add(this.className)}_setAttributes(e){if(this.attributes)for(let[e,t]of Object.entries(this.attributes))this.el.setAttribute(e,t)}_addListeners(){this.eventTriggers=Object.entries(this.events).map(r);let e=(t=this.eventTriggers,Array.from(t.reduce(((e,t)=>(e.add(t.event),e)),new Set)));var t;for(let t of e)this.el.addEventListener(t,this._eventHandler.bind(this))}_getCandidates(e){return"."===e?[this.el]:Array.from(this.el.querySelectorAll(e))}_eventHandler(e){for(let t of this.eventTriggers)if(e.type==t.event){let r=this._getCandidates(t.selector),s=null;for(let t of r)if(t===e.target||t.contains(e.target)){s=t;break}if(s){"string"==typeof t.handler?this[t.handler].call(this,e,s):"function"==typeof t.handler&&t.handler.call(this,e,s);break}}}}class a{constructor(){this.handles={}}on(e,t){let r=this.handles[e];return r||(r=this.handles[e]=[]),r.push(t),this}emit(e,...t){if(e in this.handles)for(let r of this.handles[e])r.apply(this,t)}removeListener(e,t){e in this.handles&&(this.handles[e]=this.handles[e].filter((e=>e!==t)))}}let l,n="undefined"==typeof EventTarget?a:EventTarget;l="undefined"!=typeof EventTarget?class extends n{constructor(e){super(e),this.innerEventTarget=e||this}on(e,t){if(this.innerEventTarget.addEventListener){let r=e=>{t.apply(this,e.detail)};t.nativeListener=r,this.innerEventTarget.addEventListener(e,r)}else super.on(e,t);return this}emit(e,...t){return this.innerEventTarget.dispatchEvent?this.innerEventTarget.dispatchEvent(this._makeEvent(e,t)):super.emit(e,...t),this}removeListener(e,t){return this.innerEventTarget.removeEventListener?(t=t.nativeListener||t,this.innerEventTarget.removeEventListener(e,t)):super.removeListener(e,t),this}_makeEvent(e,t){if("function"==typeof CustomEvent)return new CustomEvent(e,{detail:t});{let r=new Event(e);return r.detail=t,r}}}:a;const o=l;class h extends i{preinitialize(e={}){this.desktopHandleSelector=e.desktopHandleSelector||"*",this.mobileHandleSelector=e.mobileHandleSelector||".handle",this.events=Object.assign({},{"drop .":"handleDrop","dragend .":"handleDragEnd","dragleave .":"handleDragLeave","dragover .":"handleDragover","dragenter .":"dragEnter","dragover *":"dragEnterCell",["dragstart "+this.desktopHandleSelector]:"dragStart",["touchstart "+this.mobileHandleSelector]:"touchDrag",["touchmove "+this.mobileHandleSelector]:"touchMove",["touchend "+this.mobileHandleSelector]:"touchEnd",["touchcancel "+this.mobileHandleSelector]:"touchCancel"},e.events),this.placeholderName=e.placeholderName||"New Item",e.events=this.events,this.emitter||(this.emitter=new o),this.overscrollCaptures={}}isFileTypeDrag(e){if(e.dataTransfer&&e.dataTransfer.item&&e.dataTransfer.item.length>0&&"file"===e.dataTransfer.items[0].kind)return!0;if(e.dataTransfer&&e.dataTransfer.types)for(let t of e.dataTransfer.types)if("files"==t.toLowerCase())return!0;return!1}isResourceTypeDrag(e){return!!this.extractLabel(e)}dragEnterCell(e,t){this.canCancel=!1}handleDragEnd(e,t){this.cleanupDrag()}handleDragLeave(e,t){this.externalDrag&&(e.target==this.el||this.getCells().includes(e.target))&&(this.canCancel=!0,setTimeout((()=>{this.canCancel&&this.cleanupDrag()}),20))}_getFilesFromEvent(e){let t=[];if(e.dataTransfer.items){let r=[];[...e.dataTransfer.items].forEach(((e,t)=>{r.push(e)}));for(let e of r)if("file"===e.kind){if(e.webkitGetAsEntry){let t=e.webkitGetAsEntry();if(t&&t.isDirectory)continue}t.push(e.getAsFile())}else e instanceof File&&t.push(e)}else[...e.dataTransfer.files].forEach(((e,r)=>{t.push(e)}));return t.filter((e=>!!e))}shouldInsertCellForExternalDrag(e){return this.isFileTypeDrag(e)||this.isResourceTypeDrag(e)}touchDrag(e,t){this.captureOverscroll("html"),this.captureOverscroll("body"),this.dragStart(e,t)}touchMove(e,t){let r=this.boxTop(),s=Math.max(0,e.touches[0].pageY)-r;this.positionOnDrag(s)}touchEnd(e,t){this.handleDrop(e,t)}touchCancel(e,t){this.cleanupDrag()}dragStart(e,t){this.dragging=this.getCellFromChild(t),this.dragging.classList.add("dragging"),e.dataTransfer&&e.dataTransfer.setDragImage(document.createElement("div"),0,0)}extractLabel(e){for(let t of e.dataTransfer.types)if(0==t.indexOf("data:text/label,"))return t.substring(16);return null}restoreOverscroll(e){e in this.overscrollCaptures&&(document.querySelector(e).style["overscroll-behavior"]=this.overscrollCaptures[e],delete this.overscrollCaptures[e])}captureOverscroll(e){let t=document.querySelector(e);this.overscrollCaptures[e]=t.style["overscroll-behavior"],t.style["overscroll-behavior"]="none"}_makeElementFromHTML(e){let t=document.createElement("div");return t.innerHTML=e,t.children[0]}createExternalDragPlaceholderHTML(e){return`<div class="cell">\n\t\t\t<span class="handle">↕</span>\n\t\t\t${this.extractLabel(e)||this.placeholderName}\n\t\t</div>`}createExternalDragPlaceholderCell(e){let t=this.createExternalDragPlaceholderHTML(e),r=this._makeElementFromHTML(t);r.setAttribute("draggable",!0),this.el.appendChild(r),this.dragStart(e,r)}dragEnter(e,t){!this.dragging&&this.shouldInsertCellForExternalDrag(e)&&(this.externalDrag=!0,this.createExternalDragPlaceholderCell(e))}handleDragover(e,t){e.preventDefault(),this.canCancel=!1;let r=this.boxTop(),s=e.y-r;this.dragging?(e.dataTransfer&&(e.dataTransfer.dropEffect="move"),this.positionOnDrag(s)):e.dataTransfer&&(e.dataTransfer.dropEffect="copy")}createCellsForFiles(e){return e.map((e=>e.name)).map((e=>{let t=`<div class="cell">\n\t\t\t\t<span class="handle">↕</span>\n\t\t\t\t${e}\n\t\t\t</div>`;return this._makeElementFromHTML(t)}))}createCellsForUriList(e){return Array.isArray(e)||(e=[e]),e.map((e=>{let t=`<div class="cell">\n\t\t\t\t<span class="handle">↕</span>\n\t\t\t\t${e}\n\t\t\t</div>`;return this._makeElementFromHTML(t)}))}createCellsForUnknownType(e){return[]}handleDrop(e,t){e.dataTransfer.getData("text");let r=e.dataTransfer.getData("text/uri-list");if(e.preventDefault(),this.externalDrag){let t=[],s=this._getFilesFromEvent(e),i=[];if(s&&s.length>0){i=this.createCellsForFiles(s);for(let e=0;e<i.length;e++){let t=i[e];t.file||(t.file=s[e])}}else if(r){if("string"==typeof r){let e=[r];for(let t of["\r\n","\n",","]){let r=[];for(let s of e)r.push(...s.split(t));e=r}r=e}i=this.createCellsForUriList(r)}else i=this.createCellsForUnknownType(e);for(let e of i)e.setAttribute("draggable",!0),this.el.insertBefore(e,this.dragging),t.push({cell:e,file:e.file});this.dragging.remove(),this.emitter.emit("list-change",{type:"drop",cells:i,files:s,changes:t,event:e})}else this.emitter.emit("list-change",{type:"reorder",cells:[this.dragging]});this.cleanupDrag()}positionOnDrag(e){let t=this.findOver(e);t?t!=this.dragging&&this.el.insertBefore(this.dragging,t):this.el.appendChild(this.dragging)}getCells(){return[...this.el.children]}cleanupDrag(){this.dragging&&this.externalDrag&&this.dragging.remove(),delete this.dragging,delete this.externalDrag,this.getCells().forEach((e=>{e.classList.remove("dragging")})),this.restoreOverscroll("html"),this.restoreOverscroll("body")}findOver(e){let t=this.findLocations();for(let r of t)if(e>=r.top&&e<=r.bottom)return r.cell}boxTop(){return this.el.getBoundingClientRect().top}render(){this.getCells().forEach((e=>{e.setAttribute("draggable",!0)})),this.mobileHandleSelector&&this.el.querySelectorAll(this.mobileHandleSelector).forEach((e=>{e.style["touch-action"]="none"}))}findLocations(){let e=this.boxTop(),t=[];return this.getCells().forEach((r=>{let s=r.getBoundingClientRect();t.push({top:s.top-e,bottom:s.bottom-e,cell:r})})),t}getCellFromChild(e){return e.parentElement==this.el?e:e?this.getCellFromChild(e.parentElement):null}}var d=t.A;export{d as default};
//# sourceMappingURL=index.js.map