/* <begin wbk> */
(function(window) {
'use strict';
var wbkWebsite = {
env : 'website',
replaceClass : function(n, cA, cB) {
if(n) {
if(n.classList && n.classList.replace) {
n.classList.replace(cA, cB);
} else {
this.removeClass(n, cA);
this.addClass(n, cB);
}
return true;
}
return false;
},
hasClass : function(n, c) {
if(n) {
if(n.classList) {
return n.classList.contains(c);
} else {
const r = new RegExp(' '+c+' ', 'i');
return r.test(' '+n.className+' ');
}
}
return false;
},
classLoop : function(n, c, fn) {
if(n) {
c = c.split(/\s+/);
for(let i = 0, l = c.length; i < l; i++) {
if(c[i] !== '') {
fn(n, c[i]);
}
}
return true;
}
return false;
},
addClass : function(n, c) {
if(n) {
if(n.classList) {
this.classLoop(n, c, function(n, c) { n.classList.add(c); });
} else {
this.removeClass(n, c);
this.classLoop(n, c, function(n, c) { n.className += ' '+c; });
n.className = this.trim(n.className);
}
return true;
}
return false;
},
removeClass : function(n, c) {
if(n) {
if(n.classList) {
this.classLoop(n, c, function(n, c) { n.classList.remove(c); });
} else {
this.classLoop(n, c, function(n, c) { n.className = (' '+n.className+' ').replace(new RegExp(' '+c+' ', 'gi'), ' '); });
n.className = this.trim(n.className);
}
return true;
}
return false;
},
trim : function(s) {
return s.replace(/^\s+/, '').replace(/\s+$/, '');
},
isVisible : function(n) {
if(n && (n.offsetWidth || n.offsetHeight || n.getClientRects().length)) {
while(n) {
if(n.nodeType === 1) {
if (n.style.visibility === 'hidden') {
return false;
}
const o = parseFloat(n.style.opacity);
if (!isNaN(o) && o <= 0.0001) {
return false;
}
const style = getComputedStyle(n);
if(style) {
if (style.visibility === 'hidden') {
return false;
}
const o = parseFloat(style.opacity);
if (!isNaN(o) && o <= 0.0001) {
return false;
}
}
}
n = n.parentNode;
if(n && (n.nodeType === 9 || n.nodeType === 10 || n.nodeType === 11)) {
break;
}
}
return true;
}
return false;
},
offsetTop : function(n) {
if(!n || !n.getClientRects().length) {
return 0;
}
const r = n.getBoundingClientRect();
return r.top + window.scrollY;
},
layoutWidgets : {
viewportContent : null,
viewportLayout : null,
nodesContent : {},
nodesLayout : {},
setValue : {
align : function(n, v) {
if(v) {
if(!n.classList.contains('align'+v)) {
n.classList.remove('alignleft', 'aligncenter', 'alignright', 'alignjustify');
n.classList.add('align'+v);
wbkWebsite.callListener('layoutwidgetschange');
}
} else {
n.classList.remove('alignleft', 'aligncenter', 'alignright', 'alignjustify');
wbkWebsite.callListener('layoutwidgetschange');
}
},
src : function(n, v) {
if(v && v !== n.getAttribute('src')) {
n.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=');
n.setAttribute('src', v);
wbkWebsite.callListener('layoutwidgetschange');
}
},
size : function(n, v) {
const w = n.getAttribute('width');
const h = n.getAttribute('height');
if(v) {
const s = v.match(/^([0-9]+)x([0-9]+)$/);
if(s) {
if(w !== s[1] || h !== s[2]) {
n.setAttribute('width', s[1]);
n.setAttribute('height', s[2]);
wbkWebsite.callListener('layoutwidgetschange');
}
return true;
}
}
if(w || h) {
n.removeAttribute('width');
n.removeAttribute('height');
wbkWebsite.callListener('layoutwidgetschange');
}
},
default : function(n, v) {
if(v) {
n.classList.remove('wbk-default');
} else {
n.classList.add('wbk-default');
}
}
},
renew : function() {
this.viewportContent = null;
this.viewportLayout = null;
this.nodesContent = {};
this.nodesLayout = {};
this.onViewportChange();
},
setNodes : function(k) {
const contentNode = document.getElementById('wbk-content');
const footerNode = document.getElementById('wbk-footer');
this.nodesContent[k] = [];
this.nodesLayout[k] = [];
const a = document.querySelectorAll('[data-wbk-viewport-'+k+']');
for(let i = 0, l = a.length; i < l; i++) {
const n = a[i];
if( (contentNode && contentNode.contains(n))
|| (footerNode && footerNode.contains(n))
) {
this.nodesContent[k].push(n);
} else {
this.nodesLayout[k].push(n);
}
};
if(this.nodesContent[k].length === 0) {
delete this.nodesContent[k];
}
if(this.nodesLayout[k].length === 0) {
delete this.nodesLayout[k];
}
},
trigger : function(nodeList, key, viewport) {
if(!viewport) {
return;
}
const rV = new RegExp(viewport+'-(\\S+)');
const rA = new RegExp('all-(\\S+)');
nodeList.forEach(function(n){
if(n) {
const h = n.getAttribute('data-wbk-viewport-' + key);
if(h) {
let v = h.match(rV);
if (v && v.length === 2) {
v = v[1];
} else {
v = h.match(rA);
if (v && v.length === 2) {
v = v[1];
} else {
v = null;
}
}
wbkWebsite.layoutWidgets.setValue[key](n, v);
}
}
});
},
onViewportChange : function() {
const w = wbkWebsite.breakpointListener.callbackParams.width;
const h = wbkWebsite.breakpointListener.callbackParams.height;
if(w === null || h === null) {
return;
}
if(this.viewportContent === null || this.viewportLayout === null) {
this.nodesContent = {};
this.nodesLayout = {};
for(let k in this.setValue) {
this.setNodes(k);
}
}
let oldVC = this.viewportContent;
let oldVL = this.viewportLayout;
if(w <= 480) {
this.viewportContent = 'mobile';
this.viewportLayout = 'mobile';
} else if(w <= 834) {
this.viewportContent = 'tablet';
this.viewportLayout = 'tablet';
} else if(h <= 566) {
this.viewportContent = 'desktop';
this.viewportLayout = 'tablet';
} else {
this.viewportContent = 'desktop';
this.viewportLayout = 'desktop';
}
if(oldVL !== this.viewportLayout) {
for(let k in this.nodesLayout) {
this.trigger(this.nodesLayout[k], k, this.viewportLayout);
}
}
if(oldVC !== this.viewportContent) {
for(let k in this.nodesContent) {
this.trigger(this.nodesContent[k], k, this.viewportContent);
}
}
}
},
getCurrentViewport : function() {
return this.breakpointListener.callbackParams.status;
},
breakpointListener : {
callbackParams : {
height : null,
width : null,
status : null
},
isBinded : false,
bind : function() {
if(this.isBinded) { return; }
this.isBinded = true;
window.addEventListener('resize', function() { wbkWebsite.breakpointListener.execute(); }, false);
window.addEventListener('orientationchange', function () { wbkWebsite.breakpointListener.execute(); }, false);
this.execute();
},
execute : function () {
const status = this.callbackParams.status;
this.callbackParams.width = window.innerWidth;
this.callbackParams.height = window.innerHeight;
wbkWebsite.layoutWidgets.onViewportChange();
if(this.callbackParams.width <= 834 || this.callbackParams.height <= 566) {
this.callbackParams.status = 'mobile';
} else {
this.callbackParams.status = 'desktop';
}
if(status !== this.callbackParams.status) {
if(status !== null && typeof(wbkmnav) !== 'undefined' && wbkmnav) {
if (wbkmnav.hover.isMnavOpened()) {
wbkmnav.close();
}
if (wbkmnav.hover.accordionmodes.mainnav === 'toggle') {
wbkmnav.hover.removeAll(['main'], 'expanded');
}
if (wbkmnav.hover.accordionmodes.subnav === 'toggle') {
wbkmnav.hover.removeAll(['sub'], 'expanded');
}
}
wbkWebsite.callListener('breakpoint');
}
}
},
listenerStack : [],
listenerNamesCalled : {},
callListener : function(name) {
this.listenerNamesCalled[name] = true;
for(let i = 0, l = this.listenerStack.length; i < l; i++) {
const listener = this.listenerStack[i];
if(listener.name === name) {
this.applyListener(listener);
}
}
},
applyListener : function(listener) {
if(listener.name === 'breakpoint') {
listener.args[0].apply(wbkWebsite.breakpointListener.callbackParams, listener.args.slice(1));
} else {
listener.args[0].apply(null, listener.args.slice(1));
}
},
addListener : function(name, args) {
let listener = {name:name, args:Array.prototype.slice.call(args)};
this.listenerStack.push(listener);
if(this.listenerNamesCalled[name]) {
this.applyListener(listener);
}
},
addNavOpenListener : function() { this.addListener('navopen', arguments); },
addNavCloseListener : function() { this.addListener('navclose', arguments); },
addNavResizeListener : function() { this.addListener('navresize', arguments); },
addAnchorOffsetChangeListener : function() { this.addListener('anchoroffsetchange', arguments); },
addBreakpointListener : function() { this.addListener('breakpoint', arguments); },
addGraduallyDocLoadListener : function() { this.addListener('graduallydocload', arguments); },
addLayoutWidgetsChangeListener : function() { this.addListener('layoutwidgetschange', arguments); },
smoothScroll : {
duration : 468,
start : { x : 0, y : 0, time : null },
target : { x : 0, y : 0 },
requestId : null,
run : false,
stopRun : false,
timeout : null,
supportNative : true,
now : function() {
if(window.performance && window.performance.now) {
return window.performance.now();
}
return Date.now();
},
step : function () {
if(this.stopRun) {
this.run = false;
} else {
this.run = true;
let elapsed = (this.now() - this.start.time) / this.duration;
if (elapsed > 1) {
elapsed = 1;
}
const value = 0.5 * (1 - Math.cos(Math.PI * elapsed));
let x = Math.ceil(this.start.x + (this.target.x - this.start.x) * value);
let y = Math.ceil(this.start.y + (this.target.y - this.start.y) * value);
if (x < 0) {
x = 0;
}
if (y < 0) {
y = 0;
}
window.scrollTo(x, y);
if (x !== this.target.x || y !== this.target.y) {
this.requestId = window.requestAnimationFrame(wbkWebsite.smoothScroll.step.bind(wbkWebsite.smoothScroll));
} else {
this.run = false;
}
}
},
abort : function() {
this.stopRun = true;
if(this.requestId) {
try { window.cancelAnimationFrame(this.requestId); } catch(e) {}
}
this.requestId = null;
if(this.timeout) {
try { window.clearTimeout(this.timeout); } catch(e) {}
}
this.timeout = null;
},
disableNativeSmooth : function() {
if(this.supportNative) {
const htmlNode = document.querySelector('html');
htmlNode.style.scrollBehavior = 'auto';
wbkWebsite.scroll.pause = true;
}
},
enableNativeSmooth : function() {
if(this.supportNative) {
const htmlNode = document.querySelector('html');
htmlNode.style.scrollBehavior = 'smooth';
}
},
to : function(x, y, disableSmooth) {
x = Math.ceil(x);
y = Math.ceil(y);
if(x < 0) x = 0;
if(y < 0) y = 0;
if(this.supportNative) {
if(disableSmooth) {
this.disableNativeSmooth();
window.scrollTo(x, y);
this.enableNativeSmooth();
} else {
window.scrollTo(x, y);
}
} else {
this.abort();
if(this.run) {
this.timeout = window.setTimeout(function(x, y, disableSmooth) {
wbkWebsite.smoothScroll.to(x, y, disableSmooth);
}, 100, x, y, disableSmooth);
} else {
if(disableSmooth) {
this.stopRun = false;
this.run = true;
wbkWebsite.scroll.pause = true;
window.scrollTo(x, y);
this.run = false;
} else {
this.start.time = this.now();
this.start.x = Math.ceil(window.scrollX);
this.start.y = Math.ceil(window.scrollY);
this.target.x = x;
this.target.y = y;
this.stopRun = false;
this.step();
}
}
}
}
},
scroll : {
userInteraction : false,
userScrolled : false,
isScrolling : false,
timout : null,
pause : false,
onScrollEndStack : {},
addOnScrollEnd : function(id, callback, params) {
this.onScrollEndStack[id] = { callback:callback, params:params };
},
removeOnScrollEnd : function(id) {
if(id in this.onScrollEndStack && this.onScrollEndStack[id]) {
delete this.onScrollEndStack[id];
}
},
onScrollEnd : function() {
this.isScrolling = false;
for (let id in this.onScrollEndStack) {
const item = this.onScrollEndStack[id];
item.callback(item.params);
}
this.onScrollEndStack = {};
},
onScroll : function() {
if(!this.pause) {
this.isScrolling = true;
if (this.userInteraction) {
this.userScrolled = true;
}
if (this.timout) {
window.clearTimeout(this.timout);
}
this.timout = window.setTimeout(function () {
wbkWebsite.scroll.onScrollEnd();
}, 250);
}
this.pause = false;
},
init : function() {
window.addEventListener('scroll', function () { wbkWebsite.scroll.onScroll(); }, false);
document.addEventListener('keydown', function () { wbkWebsite.scroll.userInteraction = true; }, false);
document.addEventListener('mousedown', function () { wbkWebsite.scroll.userInteraction = true; }, false);
document.addEventListener('touchstart', function () { wbkWebsite.scroll.userInteraction = true; }, false);
document.addEventListener('wheel', function () { wbkWebsite.scroll.userInteraction = true; }, false);
}
},
navDropdownPositionObserver : {
resizeObserver : null,
attrName : 'data-wbk-dropdown-direction',
getEmInPixel : function(id, em) {
const n = document.querySelector('#'+id+' > li.hasChildren');
if(n) {
const w = document.createElement('span');
w.setAttribute('style', 'display:block !important;position:absolute !important;top:0 !important;left:0 !important;right:auto !important;bottom:auto !important;line-height:1 !important;width:1em !important;height:1px !important;font-size:1em !important;overflow:hidden !important;visibility:visible !important;opacity:1 !important;border:none !important;outline:none !important;margin:none !important;padding:none !important;min-width:none !important;min-height:none !important;transform:none !important;');
n.appendChild(w);
let s = w.clientWidth;
 if(!s) { s = 0; }
n.removeChild(w);
s = s * em;
const max = window.innerWidth * 0.4;
 if(s > max) { s = max; }
return s;
}
return 0;
},
setItem : function(li, m) {
if(li && m) {
let d = null;
if (li.getClientRects().length) {
const rect = li.getBoundingClientRect();
const l = rect.left + li.clientWidth;
const r = window.innerWidth - rect.left;
if (l > m && r > m) { d = null; }
else if (l < m && r > m) { d = 'right'; }
else if (l > m && r < m) { d = 'left'; }
else if (l < r) { d = 'right'; }
else { d = 'left'; }
}
if (!d) {
if (li.hasAttribute(this.attrName)) {
li.removeAttribute(this.attrName);
}
} else {
if (!li.hasAttribute(this.attrName)
|| li.getAttribute(this.attrName) !== d
) {
li.setAttribute(this.attrName, d);
}
}
}
},
sizes : {},
setSize : function(id) {
const n = document.getElementById(id);
if(n) {
this.sizes[id] = n.clientWidth+'x'+n.clientHeight;
} else {
this.sizes[id] = 'x';
}
},
set : function() {
const ids = { main : 'wbk-main-nav', sub : 'wbk-sub-nav'};
let tnr = false;
for(let k in ids) {
const id = ids[k];
let tnrs = (this.sizes[id])?this.sizes[id]:'x';
this.setSize(id);
if(!tnr && tnrs !== this.sizes[id]) {
tnr = true;
}
const minWidth = this.getEmInPixel(id, 20);
if(minWidth > 0) {
const liA = document.querySelectorAll('#' + id + ' > li.hasChildren');
if (liA) {
for (let i = 0, l = liA.length; i < l; i++) {
this.setItem(liA[i], minWidth);
}
}
}
}
if(tnr) {
wbkWebsite.callListener('navresize');
wbkWebsite.anchorOffset.readOffset('navresize');
}
},
timeout : null,
setTimeout : function(timeout) {
if(this.timeout) { window.clearTimeout(this.timeout); }
this.timeout = window.setTimeout(function() { wbkWebsite.navDropdownPositionObserver.set(); }, timeout);
},
init : function() {
const main = document.getElementById('wbk-main-nav');
const sub = document.getElementById('wbk-sub-nav');
if(!main && !sub) {
return;
}
if(typeof ResizeObserver !== 'undefined' && ResizeObserver) {
this.resizeObserver = new ResizeObserver(function() {
window.requestAnimationFrame(function () {
wbkWebsite.navDropdownPositionObserver.set();
});
});
if(main) { this.resizeObserver.observe(main); }
if(sub) { this.resizeObserver.observe(sub); }
window.addEventListener('resize', function() { wbkWebsite.navDropdownPositionObserver.setTimeout(250); }, false);
wbkWebsite.navDropdownPositionObserver.set();
} else {
wbkWebsite.onGraduallyDocLoad.add(function(){
wbkWebsite.navDropdownPositionObserver.setTimeout(0);
wbkWebsite.navDropdownPositionObserver.setTimeout(250);
});
window.addEventListener('orientationchange', function () { wbkWebsite.navDropdownPositionObserver.setTimeout(250); }, false);
window.addEventListener('resize', function () { wbkWebsite.navDropdownPositionObserver.setTimeout(250); }, false);
window.addEventListener('scroll', function () { wbkWebsite.navDropdownPositionObserver.setTimeout(250); }, false);
}
}
},
customWidgets : {
debug : false,
debugID : 0,
getDebugID : function() {
if(this.debug) {
this.debugID++;
}
return this.debugID;
},
items : {},
language : 'de',
addWidget : function(id, data, callback, language) {
if(!(id in this.items)) {
this.items[id] = {
data : data,
id : id,
instances : [],
callback : callback
};
}
this.language = language;
},
hasWidget : function(id) {
return (id in this.items);
},
addInstance : function(widgetID, values, node) {
if(widgetID in this.items) {
this.items[widgetID].instances.push({
values: values,
node: node,
listenerStack: [],
breakpointListener : null
});
let instanceIndex = this.items[widgetID].instances.length - 1;
this.initInstance(widgetID, instanceIndex);
if(wbkWebsite.env === 'editor') {
node.setAttribute('data-wbk-editor-customwidget-instance', instanceIndex);
}
}
},
removeInstance : function(widgetID, instanceIndex) {
this.offAll(widgetID, instanceIndex);
if( widgetID in this.items
&& this.items[widgetID].instances.length > instanceIndex
&& instanceIndex > -1
&& this.items[widgetID].instances[instanceIndex]
) {
this.items[widgetID].instances[instanceIndex] = null;
}
},
iterateData(data, callback) {
const debugID = this.getDebugID();
if(this.debug) { console.log('CustomWidget: start iterateData ['+debugID+']'); }
if (Array.isArray(data)) {
for (let i = 0, l = data.length; i < l; i++) {
const item = data[i];
if(item && typeof(item) === 'object' && 'key' in item && 'type' in item) {
if (false === callback(item)) {
if(this.debug) { console.log('CustomWidget: end iterateData ['+debugID+']'); }
return false;
}
if ('items' in item) {
if(false === this.iterateData(item.items, callback)) {
if(this.debug) { console.log('CustomWidget: end iterateData ['+debugID+']'); }
return false;
}
}
}
}
} else if (data && typeof (data) === 'object' && 'items' in data) {
// Erste Ebene
if(false === this.iterateData(data.items, callback)) {
if(this.debug) { console.log('CustomWidget: end iterateData ['+debugID+']'); }
return false;
}
}
if(this.debug) { console.log('CustomWidget: end iterateData ['+debugID+']'); }
return true;
},
getLabel : function(id, key) {
let label = key;
if(id in this.items) {
this.iterateData(this.items[id].data, function(item){
if(item.key === key) {
if('label' in item && item.label && typeof(item.label) === 'object') {
const lang = wbkWebsite.customWidgets.language;
const langArray = [lang];
if(lang !== 'en') langArray.push('en');
if(lang !== 'de') langArray.push('de');
for(let i = 0, l = langArray.length; i < l; i++) {
const lang = langArray[i];
if(lang in item.label && typeof(item.label[lang]) === 'string') {
label = item.label[lang];
return false;
}
}
for(let lang in item.label) {
if(typeof(item.label[lang]) === 'string') {
label =item.label[lang];
return false;
}
}
}
return false;
}
});
}
return label;
},
getTemplate : function(id, key) {
let template = '';
if(id in this.items) {
if(!key) {
const item = this.items[id].data;
if('template' in item && typeof(item.template) === 'string') {
template = item.template;
}
} else {
this.iterateData(this.items[id].data, function(item){
if(item.key === key) {
if('template' in item && typeof(item.template) === 'string') {
template = item.template;
}
return false;
}
});
}
}
return template;
},
getNode : function(id, instanceIndex) {
if( id in this.items
&& this.items[id].instances.length > instanceIndex
&& instanceIndex > -1
&& this.items[id].instances[instanceIndex]
) {
return this.items[id].instances[instanceIndex].node;
}
return null;
},
iterateValues : function(values, keyTypes, callback, path) {
const debugID = this.getDebugID();
if(this.debug) { console.log('CustomWidget: start iterateValues ['+debugID+']'); }
if(!path) {
path = [];
}
if(values && typeof(values) === 'object') {
for(let key in values) {
if(key in keyTypes) {
const itempath = path.slice(0);
itempath.push(key);
const value = values[key];
const type = keyTypes[key];
if(type === 'repeater') {
if(Array.isArray(value)) {
if(false === callback(key, value, itempath)) {
if(this.debug) { console.log('CustomWidget: end iterateValues ['+debugID+']'); }
return false;
}
itempath.push(0);
const itempathindex = itempath.length - 1;
for(let i = 0, l = value.length; i < l; i++) {
itempath[itempathindex] = i;
if(false === this.iterateValues(value[i], keyTypes, callback, itempath)) {
if(this.debug) { console.log('CustomWidget: end iterateValues ['+debugID+']'); }
return false;
}
}
}
} else {
if(false === callback(key, value, itempath)) {
if(this.debug) { console.log('CustomWidget: end iterateValues ['+debugID+']'); }
return false;
}
}
}
}
}
if(this.debug) { console.log('CustomWidget: end iterateValues ['+debugID+']'); }
},
getValue : function(id, instanceIndex, key, path) {
let result = null;
if( id in this.items
&& this.items[id].instances.length > instanceIndex
&& instanceIndex > -1
&& this.items[id].instances[instanceIndex]
) {
let values = this.items[id].instances[instanceIndex].values;
if(Array.isArray(path)) {
for(let i = 0, l = path.length; i < l; i++) {
const part = path[i];
if(values && typeof(values) === 'object' && part in values) {
values = values[part];
} else {
return null;
}
}
}
const keyTypes = {};
this.iterateData(this.items[id].data, function(item){
if('key' in item && 'type' in item) {
keyTypes[item.key] = item.type;
}
});
this.iterateValues(values, keyTypes, function(itemkey, itemvalue, itempath) {
if(itemkey === key) {
if(Array.isArray(itemvalue)) {
result = itemvalue.slice(0);
} else if(itemvalue && typeof(itemvalue) === 'object') {
result = JSON.parse(JSON.stringify(itemvalue));
} else {
result = itemvalue;
}
return false;
}
});
}
return result;
},
eachValue : function(id, instanceIndex, parentkey, callback) {
if( id in this.items
&& this.items[id].instances.length > instanceIndex
&& instanceIndex > -1
&& this.items[id].instances[instanceIndex]
) {
const values = this.items[id].instances[instanceIndex].values;
const keyTypes = {};
this.iterateData(this.items[id].data, function(item){
if('key' in item && 'type' in item) {
keyTypes[item.key] = item.type;
}
});
if(parentkey in keyTypes && keyTypes[parentkey] === 'repeater') {
this.iterateValues(values, keyTypes, function (key, value, path) {
if (parentkey === key) {
const itempath = path.slice(0);
itempath.push(0);
const itempathindex = itempath.length - 1;
for(let i = 0, l = value.length; i < l; i++) {
itempath[itempathindex] = i;
callback(itempath);
}
return false;
}
});
}
}
},
parseEvent : function(event) {
event = event.split('.');
let type = event[0].toLowerCase();
if(/[^a-z]+/.test(type)) {
type = '';
}
let namespace = '';
if(event.length === 2) {
namespace = event[1].replace(/[^a-zA-Z0-9_\-]+/g, '');
}
return { type:type, namespace:namespace };
},
on : function(id, instanceIndex, node, event, listener, options) {
if( id in this.items
&& this.items[id].instances.length > instanceIndex
&& instanceIndex > -1
&& this.items[id].instances[instanceIndex]
&& node
) {
event = this.parseEvent(event);
if(event.type !== '') {
if( options === true
|| options === false
|| (options && typeof(options) === 'object')
) {
// Gültig
} else {
// Default
options = false;
}
this.items[id].instances[instanceIndex].listenerStack.push({
node: node,
type: event.type,
namespace: event.namespace,
listener: listener,
options: options
});
node.addEventListener(event.type, listener, options);
}
}
},
off : function(id, instanceIndex, node, event) {
if( id in this.items
&& this.items[id].instances.length > instanceIndex
&& instanceIndex > -1
&& this.items[id].instances[instanceIndex]
) {
event = this.parseEvent(event);
let i = this.items[id].instances[instanceIndex].listenerStack.length;
while(i--) {
const item = this.items[id].instances[instanceIndex].listenerStack[i];
if( (event.namespace !== '' && item.namespace !== event.namespace)
|| (event.type !== '' && item.type !== event.type)
) {
continue;
}
if(item.node) {
item.node.removeEventListener(item.type, item.listener, item.options);
}
this.items[id].instances[instanceIndex].listenerStack.splice(i, 1);
}
}
},
offAll : function(id, instanceIndex) {
if( id in this.items
&& this.items[id].instances.length > instanceIndex
&& instanceIndex > -1
&& this.items[id].instances[instanceIndex]
) {
this.items[id].instances[instanceIndex].listenerStack.forEach(function(item){
if(item.node) {
item.node.removeEventListener(item.type, item.listener, item.options);
}
});
this.items[id].instances[instanceIndex].listenerStack = [];
}
},
onViewportChange : function(id, instanceIndex, listener) {
if( id in this.items
&& this.items[id].instances.length > instanceIndex
&& instanceIndex > -1
&& this.items[id].instances[instanceIndex]
) {
this.items[id].instances[instanceIndex].breakpointListener = listener;
if(listener) {
listener(this.breakpointListener.viewport);
}
}
},
breakpointListener : {
viewport : null,
isInitiated : false,
init : function() {
if(this.isInitiated) { return; }
this.isInitiated = true;
window.addEventListener('resize', function() { wbkWebsite.customWidgets.breakpointListener.execute(); }, false);
window.addEventListener('orientationchange', function () { wbkWebsite.customWidgets.breakpointListener.execute(); }, false);
this.execute();
},
execute : function () {
const oldViewport = this.viewport;
if(window.innerWidth <= 834) {
this.viewport = 'mobile';
} else {
this.viewport = 'desktop';
}
if(oldViewport !== this.viewport) {
for(let id in wbkWebsite.customWidgets.items) {
wbkWebsite.customWidgets.items[id].instances.forEach(function(instance){
if(instance && instance.breakpointListener) {
instance.breakpointListener(this.viewport);
}
}.bind(this));
}
}
}
},
initInstance : function(id, instanceIndex) {
this.breakpointListener.init();
if( id in this.items
&& this.items[id].instances.length > instanceIndex
&& instanceIndex > -1
&& this.items[id].instances[instanceIndex]
) {
const debugID = this.getDebugID();
if(this.debug) { console.log('CustomWidget: start initInstance ['+debugID+'] [widget:'+id+', instance:'+instanceIndex+']'); }
this.items[id].callback.call({
widget : id,
instance : instanceIndex,
on : function(node, event, listener, options) {
wbkWebsite.customWidgets.on(this.widget, this.instance, node, event, function(evt) { listener.call(this, evt); }.bind(this), options);
},
off : function(node, event) {
wbkWebsite.customWidgets.off(this.widget, this.instance, node, event);
},
getLanguage : function() {
return wbkWebsite.customWidgets.language;
},
getLabel : function(key) {
return wbkWebsite.customWidgets.getLabel(this.widget, key);
},
getTemplate : function(key) {
return wbkWebsite.customWidgets.getTemplate(this.widget, key);
},
getNode : function() {
return wbkWebsite.customWidgets.getNode(this.widget, this.instance);
},
getValue : function(key, path) {
return wbkWebsite.customWidgets.getValue(this.widget, this.instance, key, path);
},
eachValue : function(key, callback) {
return wbkWebsite.customWidgets.eachValue(
this.widget,
this.instance,
key,
function(path){
callback.call(this, path);
}.bind(this)
);
},
onViewportChange : function(listener) {
wbkWebsite.customWidgets.onViewportChange(this.widget, this.instance, function(viewport) { listener.call(this, viewport); }.bind(this));
},
getViewport : function() {
return wbkWebsite.customWidgets.breakpointListener.viewport;
}
});
if(this.debug) { console.log('CustomWidget: end initInstance ['+debugID+'] [widget:'+id+', instance:'+instanceIndex+']'); }
}
}
},
anchorOffset : {
top : -1,
 node : null,
resizeTimeout : null,
init : function () {
this.node = document.getElementById('wbk-anchoroffset');
wbkWebsite.onGraduallyDocLoad.add(function(){
wbkWebsite.anchorOffset.readOffset('onGraduallyDocLoad');
});
window.addEventListener('resize', function () {
if(wbkWebsite.anchorOffset.resizeTimeout) {
window.clearTimeout(wbkWebsite.anchorOffset.resizeTimeout);
}
wbkWebsite.anchorOffset.resizeTimeout = window.setTimeout(function() {
wbkWebsite.anchorOffset.readOffset('resize');
}, 100);
}, false);
window.addEventListener('orientationchange', function () {
wbkWebsite.anchorOffset.readOffset('orientationchange');
}, false);
},
readOffset : function (eventtype) {
wbkWebsite.scroll.removeOnScrollEnd('anchorReadOffset');
if(wbkWebsite.scroll.isScrolling) {
wbkWebsite.scroll.addOnScrollEnd('anchorReadOffset', function(eventtype){ wbkWebsite.anchorOffset.readOffset('onScrollEnd'+eventtype); }, eventtype);
return;
}
const oldTop = this.top;
if(this.node && this.node.getClientRects().length) {
this.top = this.node.getBoundingClientRect().top;
this.top = Math.floor(this.top);
if(this.top < 0) { this.top = 0; }
} else {
this.top = 0;
}
if(oldTop !== this.top) {
this.outerSectionMinHeightFix.apply();
wbkWebsite.callListener('anchoroffsetchange');
}
wbkWebsite.anchorOffset.scrollToStartAnchor();
window.setTimeout(function(){ wbkWebsite.anchorOffset.scrollToStartAnchor(); }, 100);
},
scrollToStartAnchor : function() {
if(!wbkWebsite.scroll.userScrolled) {
const anchorName = location.hash.replace('#', '');
if (anchorName !== '') {
let n = document.querySelector('a[name="' + anchorName + '"]');
if (!n) {
n = document.getElementById(anchorName);
}
if (n) {
let y = (this.top * -1) + wbkWebsite.offsetTop(n);
y = Math.ceil(y);
if (y < 0) {
y = 0;
}
wbkWebsite.smoothScroll.to(0, y, true);
}
}
}
},
outerSectionMinHeightFix : {
pause : false,
type : 'scalable',
apply : function(nA, winH) {
if(!nA && this.pause) {
return;
}
if(!nA) {
nA = document.querySelectorAll('.wbk-widget-content-section[data-wbk-has-minheight="1"]');
}
if(nA) {
if(!winH) {
winH = window.innerHeight;
}
let t = wbkWebsite.anchorOffset.top - 1;
if(t >= winH) { t = 0; }
for(let i = 0, l = nA.length; i < l; i++) {
const n = nA[i];
let h;
if(n.hasAttribute('data-wbk-minheight')) {
h = n.getAttribute('data-wbk-minheight');
} else {
h = n.style.minHeight;
if (h && typeof h === 'string' && (h = h.match(/^([0-9]{1,3})vh$/i))) {
h = h[1];
} else {
h = '100';
}
n.setAttribute('data-wbk-minheight', h);
}
if(!wbkWebsite.anchorOffset.node || t <= 0) {
n.style.minHeight = h + 'vh';
} else {
if (this.type === 'scalable') {
n.style.minHeight = 'calc(' + h + ' * (100vh - ' + t + 'px) / 100)';
} else if (this.type === 'fixed') {
n.style.minHeight = Math.ceil(winH - t) + 'px';
}
}
}
}
}
}
},
onGraduallyDocLoad : {
fnStack : [],
isLoaded : false,
detectStarted : false,
resizeObserver : null,
executed : 0,
detect : function() {
wbkWebsite.onGraduallyDocLoad.execute(0);
wbkWebsite.onCssLoad.add(function(){
wbkWebsite.onGraduallyDocLoad.execute(0, 'onCssLoad');
});
if(typeof ResizeObserver !== 'undefined' && ResizeObserver) {
this.resizeObserver = new ResizeObserver(function() {
window.requestAnimationFrame(function () {
wbkWebsite.onGraduallyDocLoad.execute(100, 'ResizeObserver');
});
});
const idA = [
'wbk-languages', 'wbk-main-nav', 'wbk-sub-nav', 'wbk-header', 'wbk-logo', 'wbk-title', 'wbk-subtitle',
'wbk-headline', 'wbk-content', 'wbk-footer', 'wbk-actionbar-1', 'wbk-actionbar-2', 'wbk-current-language',
'wbk-mnav-languages', 'wbk-mnav-main-nav', 'wbk-mnav-logo', 'wbk-mnav-title', 'wbk-mnav-subtitle',
'wbk-mnav-headline', 'wbk-mnav-actionbar-1', 'wbk-mnav-actionbar-2'
];
for(let i = 0, l = idA.length; i < l; i++) {
const n = document.getElementById(idA[i]);
if(n) { this.resizeObserver.observe(n); }
}
} else {
const n = document.querySelector('#wbk-logo img');
if(n) {
n.addEventListener('load', function () {
wbkWebsite.onGraduallyDocLoad.execute(0);
}, false);
}
}
window.addEventListener('load', function(){
wbkWebsite.onGraduallyDocLoad.isLoaded = true;
if(wbkWebsite.resizeObserver) {
wbkWebsite.resizeObserver.disconnect();
wbkWebsite.resizeObserver = null;
}
wbkWebsite.onGraduallyDocLoad.execute(0);
}, false);
},
timeout : null,
execute : function(time) {
if(this.timeout) { window.clearTimeout(this.timeout); }
if(time > 0) {
this.timeout = window.setTimeout(function() { wbkWebsite.onGraduallyDocLoad.executeAfterTimeout(); }, time);
} else {
this.executeAfterTimeout();
}
},
executeAfterTimeout : function() {
if(this.isLoaded) {
while(this.fnStack.length > 0) {
const fn = this.fnStack.shift();
fn();
}
} else {
for(let i = 0, l = this.fnStack.length; i < l; i++) {
this.fnStack[i]();
}
}
wbkWebsite.callListener('graduallydocload');
this.executed++;
},
add : function(fn) {
if(!this.isLoaded) {
this.fnStack.push(fn);
if(this.executed > 0) { fn(); }
} else {
fn();
}
}
},
onCssLoad : {
fnStack : [],
isLoaded : false,
detect : function() {
if(!this.isLoaded) {
const n = document.createElement('div');
n.id = 'wbk-editor-cssreadydetector';
document.body.appendChild(n);
const r = (n.clientWidth < 48);
document.body.removeChild(n);
if(r) {
this.isLoaded = true;
}
}
if(!this.isLoaded) {
window.setTimeout(function() { wbkWebsite.onCssLoad.detect(); }, 10);
} else {
while(this.fnStack.length > 0) {
const fn = this.fnStack.shift();
fn();
}
}
},
add : function(fn) {
if(!this.isLoaded) {
this.fnStack.push(fn);
} else {
fn();
}
}
},
animations : {
init : function() {
if ('IntersectionObserver' in window) {
this.observer = new IntersectionObserver(
(entries, observer) => {
entries.forEach((entry) => {
wbkWebsite.animations.callback(entry);
});
},
{
root: null,
rootMargin: '0px',
threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
}
);
let count = 0;
document.querySelectorAll('[data-wbk-animation]:not([data-wbk-animation-count="infinite"])').forEach((n) => {
count++;
if (n.style.animationPlayState !== 'running') {
wbkWebsite.animations.observe(n);
}
});
if (count > 0) {
for (let i = 0; i <= 5500; i += 100) {
window.setTimeout(function () {
wbkWebsite.onGraduallyDocLoad.execute(0);
}, i);
}
}
}
},
observer : null,
callback : function(entry) {
if(entry.isIntersecting && entry.intersectionRatio !== 0) {
let intersectionRatio = 0.9;
if((entry.boundingClientRect.height / entry.rootBounds.height) > 0.5) {
intersectionRatio = entry.rootBounds.height / 2 / entry.boundingClientRect.height;
}
if(entry.intersectionRatio >= intersectionRatio) {
entry.target.wbkAnimationNode.style.animationPlayState = 'running';
wbkWebsite.animations.observer.unobserve(entry.target);
}
}
},
findWidget : function(n) {
while(n) {
if(n.classList && n.classList.contains('wbk-widget')) {
return n;
}
n = n.parentNode;
}
return null;
},
observe : function(n) {
if(this.observer) {
let p = this.findWidget(n);
if(p) {
p.wbkAnimationNode = n;
this.observer.unobserve(p);
this.observer.observe(p);
}
}
},
unobserve : function(n) {
if(this.observer) {
let p = this.findWidget(n);
if(p) {
this.observer.unobserve(p);
}
}
}
},
frameCommunicator : {
frames : {},
frameOrigin : window.location.protocol+'//'+window.location.host,
init : function() {
document.querySelectorAll('.wbk-widget-content.wbk-widget-content-sourcecode > iframe[data-wbk-src]').forEach((n) => {
let param = 'access=allow';
if( wbkWebsite.env === 'website'
&& n.hasAttribute('data-wbk-cb')
&& window.wbkConsentBanner
&& !window.wbkConsentBanner.isAcceptedByArray(n.getAttribute('data-wbk-cb').replace(/^_/, '').replace(/_$/, '').split('_'))
) {
param = '';
}
let src = n.getAttribute('data-wbk-src');
if(param !== '') {
if(src.indexOf('?') === -1) {
src += '?'+param;
} else {
src += '&'+param;
}
}
n.removeAttribute('data-wbk-src');
n.removeAttribute('srcdoc');
n.setAttribute('src', src);
});
wbkWebsite.onCssLoad.add(function(){
wbkWebsite.frameCommunicator.updateCss();
});
window.addEventListener('message', (event) => {
if( event.origin !== wbkWebsite.frameCommunicator.frameOrigin
&& event.origin !== wbkWebsite.frameCommunicator.frameOrigin+':'+window.location.port
) {
return false;
}
if( typeof(event.data) === 'object'
&& 'id' in event.data
&& typeof(event.data.id) === 'string'
&& /^[a-zA-Z0-9]+$/.test(event.data.id)
) {
if(!wbkWebsite.frameCommunicator.frames[event.data.id]) {
let n = document.querySelector('iframe#wbk-id-scw-'+event.data.id);
if(n) {
wbkWebsite.frameCommunicator.frames[event.data.id] = {
id : event.data.id,
node : n,
window : n.contentWindow,
cssUpdated : false
};
let access = 'allow';
if( wbkWebsite.env === 'website'
&& n.hasAttribute('data-wbk-cb')
&& window.wbkConsentBanner
&& !window.wbkConsentBanner.isAcceptedByArray(n.getAttribute('data-wbk-cb').replace(/^_/, '').replace(/_$/, '').split('_'))
) {
access = 'deny';
}
n.contentWindow.postMessage({
id : event.data.id,
access : access,
consentBannerOpenable : (window.wbkConsentBanner)?true:false
}, wbkWebsite.frameCommunicator.frameOrigin);
}
}
if( wbkWebsite.frameCommunicator.frames[event.data.id]
&& 'height' in event.data
&& typeof(event.data.height) === 'string'
&& /^[0-9]+px$/.test(event.data.height)
) {
wbkWebsite.frameCommunicator.frames[event.data.id].node.style.height = event.data.height;
}
if( wbkWebsite.frameCommunicator.frames[event.data.id]
&& 'emptyFrame' in event.data
&& event.data.emptyFrame
&& wbkWebsite.env === 'website'
) {
let widgetNode = wbkWebsite.frameCommunicator.frames[event.data.id].node.parentNode.parentNode;
if(widgetNode) {
widgetNode.remove();
delete wbkWebsite.frameCommunicator.frames[event.data.id];
}
}
if( wbkWebsite.frameCommunicator.frames[event.data.id]
&& 'openConsentBanner' in event.data
&& event.data.openConsentBanner
&& wbkWebsite.env === 'website'
&& window.wbkConsentBanner
) {
window.wbkConsentBanner.open();
}
if(wbkWebsite.onCssLoad.isLoaded) {
wbkWebsite.frameCommunicator.updateCss();
}
}
}, false);
},
updateCssItem : function(frame) {
if(frame) {
let result = {};
const styles = window.getComputedStyle(frame.node);
const properties = [
'color', 'direction', 'font-family', 'font-size', 'font-style', 'font-variant', 'font-weight',
'letter-spacing', 'line-height', 'text-align', 'text-decoration', 'text-transform', 'text-shadow',
'unicode-bidi', 'word-spacing'
];
for(let i = 0, l = properties.length; i < l; i++) {
const value = String(styles.getPropertyValue(properties[i]));
if(properties[i] !== 'color' || value !== 'transparent' ) {
result[properties[i]] = String(styles.getPropertyValue(properties[i]));
}
}
frame.window.postMessage({ id : frame.id, styles : result }, this.frameOrigin);
const n = document.querySelector('html > head > style#wbk-fontcss');
if(n) {
frame.window.postMessage({
fontface_css : n.innerHTML,
fontface_type : 'main',
}, this.frameOrigin);
}
}
},
updateCss : function() {
this.eachFrame(function(k, frame){
if(!frame.cssUpdated) {
wbkWebsite.frameCommunicator.updateCssItem(frame);
wbkWebsite.frameCommunicator.frames[k].cssUpdated = true;
}
});
},
resetCss : function(doUpdate) {
this.eachFrame(function(k, frame){
wbkWebsite.frameCommunicator.frames[k].cssUpdated = false;
});
if(doUpdate) {
window.setTimeout(function(){ wbkWebsite.frameCommunicator.updateCss(); }, 50);
}
},
resetCssByParent : function(parent, doUpdate) {
const nA = parent.querySelectorAll('iframe');
if(nA) {
for(let i = 0, l = nA.length; i < l; i++) {
this.eachFrame(function(k, frame){
if(frame.node.id === nA[i].id) {
wbkWebsite.frameCommunicator.frames[k].cssUpdated = false;
}
});
}
}
if(doUpdate) {
window.setTimeout(function(){ wbkWebsite.frameCommunicator.updateCss(); }, 50);
}
},
deleteFramesByParent : function(parent) {
const nA = parent.querySelectorAll('iframe');
if(nA) {
for(let i = 0, l = nA.length; i < l; i++) {
this.eachFrame(function(k, frame){
if(frame.node.id === nA[i].id) {
delete wbkWebsite.frameCommunicator.frames[k];
}
});
}
}
},
eachFrame : function(fn) {
for(let k in this.frames) {
if(document.querySelector('iframe#wbk-id-scw-'+this.frames[k].id)) {
fn(k, this.frames[k]);
} else {
delete this.frames[k];
}
}
}
},
scrollObserver : {
isScrolled : false,
nodes : [],
check : function() {
const px = window.scrollY;
if(px >= 10 && !this.isScrolled) {
this.isScrolled = true;
wbkWebsite.addClass(document.body, 'wbk-is-scrolled');
} else if(px < 9 && this.isScrolled) {
this.isScrolled = false;
wbkWebsite.removeClass(document.body, 'wbk-is-scrolled');
}
for(let i = 0, l = this.nodes.length; i < l; i++) {
const item = this.nodes[i];
const r = item.node.getBoundingClientRect();
if(r) {
if(r.top <= 0) {
if(item.isTop !== true) {
this.nodes[i].isTop = true;
wbkWebsite.addClass(item.node, 'top');
}
} else {
if(item.isTop !== false) {
this.nodes[i].isTop = false;
wbkWebsite.removeClass(item.node, 'top');
}
}
}
}
},
init : function() {
const ids = ['logo', 'main-nav', 'sub-nav', 'languages', 'title', 'actionbar-1', 'actionbar-2'];
for(let i = 0, l = ids.length; i < l; i++) {
const id = 'wbk-' + ids[i];
const n = document.getElementById(id);
if(n) {
this.nodes.push({
node : n,
isTop : false
});
}
}
window.addEventListener('scroll', function () { wbkWebsite.scrollObserver.check(); });
window.addEventListener('resize', function () { wbkWebsite.scrollObserver.check(); });
wbkWebsite.scrollObserver.check();
}
},
cssVars : {
node : null,
vars : {},
init : function() {
this.node = document.getElementById('wbk-elementvars');
const resizeObserver = new ResizeObserver((entries) => {
for (const entry of entries) {
const id = entry.target.getAttribute('id');
let w = 0;
let h = 0;
const rect = entry.target.getBoundingClientRect();
if(rect) {
w = rect.width;
h = rect.height;
}
let iw = 0;
let ih = 0;
if (entry.contentBoxSize) {
if(entry.contentBoxSize[0]) {
iw = entry.contentBoxSize[0].inlineSize;
ih = entry.contentBoxSize[0].blockSize;
} else {
iw = entry.contentBoxSize.inlineSize;
ih = entry.contentBoxSize.blockSize;
}
} else {
iw = entry.contentRect.width;
ih = entry.contentRect.height;
}
wbkWebsite.cssVars.vars[id + '-width'] = w + 'px';
wbkWebsite.cssVars.vars[id + '-height'] = h + 'px';
wbkWebsite.cssVars.vars[id + '-innerwidth'] = iw + 'px';
wbkWebsite.cssVars.vars[id + '-innerheight'] = ih + 'px';
}
wbkWebsite.cssVars.set();
});
const ids = [
'logo', 'title', 'subtitle', 'headline', 'main-nav', 'sub-nav', 'languages',
'content', 'footer', 'header', 'actionbar-1', 'actionbar-2',
'mnav-logo', 'mnav-title', 'mnav-subtitle', 'mnav-headline', 'mnav-main-nav', 'mnav-languages',
'mnav-actionbar-1', 'mnav-actionbar-2'
];
for(let i = 0, l = ids.length; i < l; i++) {
const id = 'wbk-' + ids[i];
wbkWebsite.cssVars.vars[id + '-width'] = '0px';
wbkWebsite.cssVars.vars[id + '-height'] = '0px';
wbkWebsite.cssVars.vars[id + '-innerwidth'] = '0px';
wbkWebsite.cssVars.vars[id + '-innerheight'] = '0px';
wbkWebsite.cssVars.set();
const n = document.getElementById(id);
if(n) {
resizeObserver.observe(n);
}
}
},
set : function() {
let css = ':root{';
for(let name in this.vars) {
const value = this.vars[name];
css += '--' + name + ':' + value + ';';
}
css += '}';
if(this.node) {
this.node.innerHTML = css;
}
}
},
bindFormMsgDialogs : function() {
document.querySelectorAll('dialog.wbk-form-msg-wrap[data-wbk-form-id] > button').forEach((btn) => {
const dialog = btn.parentNode;
dialog.showModal();
btn.focus();
btn.addEventListener('click', function(){
const dialog = this.parentNode;
dialog.close();
dialog.remove();
const formID = dialog.getAttribute('data-wbk-form-id');
if(typeof(formID) === 'string' && formID !== '') {
const form = document.getElementById(formID);
if(form) {
form.scrollIntoView(true);
}
}
});
});
},
renew : function() {
this.navDropdownPositionObserver.setTimeout(0);
this.frameCommunicator.resetCss(false);
this.callListener('graduallydocload');
},
init : function() {
if(window.wbkConsentBanner) {
window.wbkConsentBanner.init();
}
wbkWebsite.frameCommunicator.init();
if ('scrollBehavior' in document.documentElement.style) {
wbkWebsite.smoothScroll.supportNative = true;
document.querySelector('html').style.scrollBehavior = 'smooth';
} else {
wbkWebsite.smoothScroll.supportNative = false;
document.querySelector('html').style.scrollBehavior = 'auto';
}
wbkWebsite.cssVars.init();
wbkWebsite.scroll.init();
wbkWebsite.anchorOffset.init();
wbkWebsite.onGraduallyDocLoad.detect();
wbkWebsite.onCssLoad.detect();
wbkWebsite.navDropdownPositionObserver.init();
wbkWebsite.breakpointListener.bind();
wbkWebsite.scrollObserver.init();
const cl = document.querySelector('ul#wbk-languages > li.current');
if(cl) {
cl.addEventListener('click', function() {
const ul = this.parentNode;
if(wbkWebsite.hasClass(ul, 'expanded')) {
wbkWebsite.removeClass(ul, 'expanded');
} else {
wbkWebsite.addClass(ul, 'expanded');
}
});
}
wbkWebsite.animations.init();
wbkWebsite.bindFormMsgDialogs();
},
};
window.wbkWebsite = wbkWebsite;
if (navigator.userAgent.match(/ipad|iphone|ipod/i)) {
wbkWebsite.addClass(document.body, 'wbk-nobgfixed');
}
if('WBK_DOMContentLoaded' in window && window.WBK_DOMContentLoaded) {
wbkWebsite.anchorOffset.outerSectionMinHeightFix.type = 'fixed';
wbkWebsite.env = 'editor';
wbkWebsite.init();
} else {
document.addEventListener('DOMContentLoaded', function () {
wbkWebsite.init();
});
}
})(window);
(function(window){
'use strict';
var wbkslider = {
items : [],
init : function() {
this.each(function(n){
if(!n.getAttribute('data-wbk-slider-id')) {
const key = wbkslider.items.length;
n.setAttribute('data-wbk-slider-id', key);
let time = n.getAttribute('data-wbk-time');
if(time) {
time = parseInt(time, 10);
if(!isNaN(time) && time > 0) {
time = time * 1000;
} else {
time = 0;
}
} else {
time = 0;
}
const inputs = n.querySelectorAll('input');
let count = 0;
if(inputs) {
count = inputs.length;
for(let i = 0; i < count; i++) {
inputs[i].addEventListener('change', function() {
if(this.checked) {
const k = parseInt(this.parentNode.getAttribute('data-wbk-slider-id'), 10);
if(!isNaN(k) && wbkslider.items[k]) {
const pos = parseInt(this.value, 10);
if(!isNaN(pos) && wbkslider.items[k].pos !== pos) {
wbkslider.items[k].pos = pos;
wbkslider.diashow(k);
}
}
}
}, false);
}
}
wbkslider.items.push({
pos : 0,
count : count,
time : time,
timeout : null,
n : n
});
wbkWebsite.addClass(n, 'wbk-slider-ready');
wbkslider.diashow(key);
}
});
},
diashow : function(itemKey) {
if(this.items[itemKey]) {
if(this.items[itemKey].timeout) {
try {
window.clearTimeout(this.items[itemKey].timeout);
} catch (e) {}
this.items[itemKey].timeout = null;
}
if(this.items[itemKey].time > 0 && this.items[itemKey].count > 0) {
this.items[itemKey].timeout = window.setTimeout(function(itemKey){ wbkslider.next(itemKey); }, this.items[itemKey].time, itemKey);
}
}
},
next : function(itemKey) {
if(this.items[itemKey] && this.items[itemKey].count > 0) {
this.items[itemKey].pos++;
if(this.items[itemKey].pos >= this.items[itemKey].count) {
this.items[itemKey].pos = 0;
}
const inputs = this.items[itemKey].n.querySelectorAll('input');
if(inputs) {
for(let i = 0, l = inputs.length; i < l; i++) {
if(i === this.items[itemKey].pos) {
inputs[i].checked = true;
inputs[i].setAttribute('checked', 'checked');
} else {
inputs[i].checked = false;
inputs[i].removeAttribute('checked');
}
}
}
this.diashow(itemKey);
}
},
each : function(fn) {
if(document.querySelectorAll) {
const n = document.querySelectorAll('.wbk-widget-imageslider-wrap');
if(n) {
for(let i = 0, l = n.length; i < l; i++) {
fn(n[i]);
}
}
}
}
};
window.wbkslider = wbkslider;
wbkWebsite.onCssLoad.add(function(){
wbkslider.init();
});
})(window);
(function(window){
'use strict';
var wbkmnav = {
nBtn : null,
nMainNav : null,
nContent : null,
sClosed : 'wbk-mnav-closed',
sOpened : 'wbk-mnav-opened',
unexpandMainnav : null,
open : function() {
this.nMainNav.removeAttribute('data-wbk-animation');
this.nMainNav.removeAttribute('data-wbk-animation-duration');
this.unexpandMainnav = !!(this.hover.accordionmodes.mainnav === 'toggle' && (wbkWebsite.isVisible(this.nMainNav) || wbkWebsite.isVisible(this.nContent)));
if(this.unexpandMainnav) {
this.hover.removeAll(['wbk-main-nav', 'wbk-mnav-main-nav'], 'expanded');
}
wbkWebsite.replaceClass(document.body, this.sClosed, this.sOpened);
if(this.nBtn) {
this.nBtn.setAttribute('aria-expanded', 'true');
this.nBtn.setAttribute('aria-label', 'Hide navigation');
}
if(this.nContent && (!this.nBtn || wbkWebsite.offsetTop(this.nContent) < wbkWebsite.offsetTop(this.nBtn))) {
this.nContent.scrollIntoView(true);
} else if(this.nMainNav && (!this.nBtn || wbkWebsite.offsetTop(this.nMainNav) < wbkWebsite.offsetTop(this.nBtn))) {
this.nMainNav.scrollIntoView(true);
} else if(this.nBtn) {
this.nBtn.scrollIntoView(true);
}
wbkWebsite.callListener('navopen');
},
close : function() {
if(this.unexpandMainnav === true || this.unexpandMainnav === null) {
wbkmnav.hover.removeAll(['wbk-main-nav', 'wbk-mnav-main-nav'], 'expanded');
}
wbkWebsite.replaceClass(document.body, this.sOpened, this.sClosed);
if(this.nBtn) {
this.nBtn.setAttribute('aria-expanded', 'false');
this.nBtn.setAttribute('aria-label', 'Show navigation');
}
wbkWebsite.callListener('navclose');
},
init : function() {
this.nBtn = document.getElementById('wbk-mnav-button');
this.nMainNav = document.getElementById('wbk-main-nav');
this.nContent = document.getElementById('wbk-mnav-content');
if(this.nBtn) {
this.nBtn.addEventListener('click', function(evt){
evt.preventDefault();
if(wbkWebsite.hasClass(document.body, wbkmnav.sClosed)) {
wbkmnav.open();
} else {
wbkmnav.close();
}
return false;
}, true);
wbkWebsite.addClass(this.nBtn, 'wbk-mnav-ready');
}
},
hover : {
ids : [
'wbk-main-nav',
'wbk-mnav-main-nav',
'wbk-sub-nav'
],
isMnavOpened : function() {
return wbkWebsite.hasClass(document.body, 'wbk-mnav-opened');
},
getMainLi : function(n) {
let li = null;
loopParent:
while(n && n.nodeType === 1) {
switch(n.nodeName.toLowerCase()) {
case 'li':
li = n;
break;
case 'ul':
if(this.ids.indexOf(n.id) > -1) {
break loopParent;
}
break;
}
n = n.parentNode;
}
return li;
},
set : function(li, className) {
if(li) {
const excludeMainLi = this.getMainLi(li);
if(excludeMainLi) {
if(className === 'expanded') {
if(this.isMnavOpened()) {
if(this.accordionmodes.navbutton === 'toggle') {
this.removeAllMain(this.ids, excludeMainLi, className);
}
} else {
if(this.accordionmodes.mainnav === 'toggle') {
this.removeAllMain(['wbk-main-nav', 'wbk-mnav-main-nav'], excludeMainLi, className);
}
if(this.accordionmodes.subnav === 'toggle') {
this.removeAllMain(['wbk-sub-nav'], excludeMainLi, className);
}
}
} else {
this.removeAllMain(this.ids, excludeMainLi, className);
}
this.removeChildrens(li, className);
loopParent:
while (li && li.nodeType === 1) {
switch (li.nodeName.toLowerCase()) {
case 'li':
this.setType(li, className);
break;
case 'ul':
if(this.ids.indexOf(li.id) > -1) {
break loopParent;
}
break;
}
li = li.parentNode;
}
}
}
},
remove : function(li, className) {
this.removeType(li, className);
this.removeChildrens(li, className);
},
setType : function(li, className) {
if (li && !wbkWebsite.hasClass(li, className)) {
wbkWebsite.addClass(li, className);
if(className === 'expanded') {
const b = li.querySelector('button.expand');
if (b) {
b.setAttribute('aria-expanded', 'true');
b.setAttribute('aria-label', 'Hide');
}
}
}
},
removeType : function(li, className) {
if (li && wbkWebsite.hasClass(li, className)) {
wbkWebsite.removeClass(li, className);
if(className === 'expanded') {
const b = li.querySelector('button.expand');
if (b) {
b.setAttribute('aria-expanded', 'false');
b.setAttribute('aria-label', 'Show');
}
}
}
},
removeChildrens : function(parent, className) {
if(parent) {
const nA = parent.querySelectorAll('li.'+className);
if (nA) {
for (let i = 0, l = nA.length; i < l; i++) {
this.removeType(nA[i], className);
}
}
}
},
removeAllMain : function(ids, excludeMainLi, className) {
const nA = document.querySelectorAll('#' + ids.join(' > li, #') + ' > li');
if (nA) {
for (let i = 0, l = nA.length; i < l; i++) {
const n = nA[i];
if (!excludeMainLi || !excludeMainLi.isEqualNode(n)) {
this.remove(n, className);
}
}
}
},
removeAll : function(ids, className) {
const nA = document.querySelectorAll('#' + ids.join(' li.' + className + ', #') + ' li.' + className);
if (nA) {
for (let i = 0, l = nA.length; i < l; i++) {
this.removeType(nA[i], className);
}
}
},
keyHoverLi : null,
disableHover : null,
accordionmodes : {
navbutton : 'fix',
mainnav : 'toggle',
subnav : 'toggle'
},
init : function() {
const nA = document.querySelectorAll('#' + this.ids.join(' li, #') + ' li');
if (nA) {
for (let i = 0, l = nA.length; i < l; i++) {
const n = nA[i];
n.addEventListener('touchstart', function (evt) {
if (wbkmnav.hover.disableHover === null) {
if (!wbkWebsite.hasClass(this, 'hover')) {
wbkmnav.hover.disableHover = true;
wbkmnav.hover.keyHoverLi = null;
wbkmnav.hover.removeAll(wbkmnav.hover.ids, 'hover');
} else {
wbkmnav.hover.disableHover = false;
}
}
}, true);
n.addEventListener('mouseenter', function (evt) {
if (wbkmnav.hover.disableHover !== true) {
wbkmnav.hover.keyHoverLi = null;
wbkmnav.hover.set(this, 'hover');
}
}, false);
n.addEventListener('mouseleave', function (evt) {
if (wbkmnav.hover.disableHover !== true) {
wbkmnav.hover.keyHoverLi = null;
wbkmnav.hover.remove(this, 'hover');
}
}, false);
if(wbkWebsite.hasClass(n, 'hasChildren')) {
n.addEventListener('click', function (evt) {
wbkmnav.hover.keyHoverLi = null;
let n = evt.target;
let isLink = false;
while (n && n.nodeType === 1) {
if (n.nodeName.toLowerCase() === 'a') {
if (n.hasAttribute('href') && n.getAttribute('href') === '#') {
isLink = false;
} else {
isLink = true;
}
} else if (n.nodeName.toLowerCase() === 'li') {
break;
}
n = n.parentNode;
}
if (!isLink) {
evt.preventDefault();
evt.stopPropagation();
if (wbkWebsite.hasClass(this, 'expanded')) {
wbkmnav.hover.remove(this, 'expanded');
} else {
wbkmnav.hover.set(this, 'expanded');
}
return false;
}
return true;
}, false);
}
}
}
document.addEventListener('click', function (evt) {
wbkmnav.hover.keyHoverLi = null;
let n = evt.target;
let outerNavClick = true;
while (n && n.nodeType === 1) {
if( n.nodeName.toLowerCase() === 'a'
&& n.id === 'wbk-mnav-button'
) {
outerNavClick = false;
break;
}
if ( n.nodeName.toLowerCase() === 'ul'
&& wbkmnav.hover.ids.indexOf(n.id) > -1
) {
outerNavClick = false;
break;
}
n = n.parentNode;
}
if(outerNavClick) {
if(wbkmnav.hover.isMnavOpened()) {
if(wbkmnav.hover.accordionmodes.navbutton === 'toggle') {
wbkmnav.hover.removeAll(wbkmnav.hover.ids,'expanded');
}
} else {
if(wbkmnav.hover.accordionmodes.mainnav === 'toggle') {
wbkmnav.hover.removeAll(['wbk-main-nav', 'wbk-mnav-main-nav'],'expanded');
}
if(wbkmnav.hover.accordionmodes.subnav === 'toggle') {
wbkmnav.hover.removeAll(['wbk-sub-nav'],'expanded');
}
}
if(wbkmnav.hover.disableHover !== true) {
wbkmnav.hover.removeAll(wbkmnav.hover.ids,'hover');
}
}
}, true);
document.addEventListener('keyup', function (evt) {
if( wbkmnav.hover.disableHover !== true
&& wbkmnav.hover.keyHoverLi
) {
wbkmnav.hover.set(wbkmnav.hover.keyHoverLi, 'hover');
}
}, true);
document.addEventListener('keydown', function (evt) {
wbkmnav.hover.keyHoverLi = null;
}, true);
const nA2 = document.querySelectorAll('#' + this.ids.join(' a, #') + ' a, #' + this.ids.join(' button.expand, #') + ' button.expand');
if (nA2) {
for (let i = 0, l = nA2.length; i < l; i++) {
nA2[i].addEventListener('focus', function (evt) {
if(wbkmnav.hover.disableHover !== true) {
wbkmnav.hover.keyHoverLi = this.parentNode;
}
}, false);
}
}
}
}
};
window.wbkmnav = wbkmnav;
wbkWebsite.onCssLoad.add(function(){
wbkmnav.hover.init();
wbkmnav.init();
});
})(window);
(function(window) {
'use strict';
var wbkAnchor = {
removeClassnames : function(id) {
const cNA = ['active', 'activeParent'];
for (let cI = 0, cL = cNA.length; cI < cL; cI++) {
const cN = cNA[cI];
const remCn = document.querySelectorAll('#'+id+' li.'+cN);
if (remCn) {
for (let i = 0, l = remCn.length; i < l; i++) {
wbkWebsite.removeClass(remCn[i], cN);
}
}
}
},
setClassnames : function(n) {
let c = 'active';
while(n && n.id !== 'wbk-main-nav' && n.id !== 'wbk-sub-nav') {
if(n.nodeName.toLowerCase() === 'li') {
wbkWebsite.addClass(n, c);
c = 'activeParent';
}
n = n.parentNode;
}
},
setAnimationState : function(disable) {
const idA = ['wbk-main-nav', 'wbk-sub-nav'];
for(let i = 0, l = idA.length; i < l; i++) {
const n = document.getElementById(idA[i]);
if(n) {
if(disable) {
n.setAttribute('data-wbk-disable-animation', 'true');
} else {
n.removeAttribute('data-wbk-disable-animation');
}
}
}
},
firstSet : true,
set : function(nM, nS) {
const o = { 'wbk-main-nav': nM, 'wbk-sub-nav': nS };
for(let id in o) {
let n = o[id];
if(n) {
n = n.parentNode;
}
if(n) {
if(!wbkWebsite.hasClass(n, 'active')) {
this.removeClassnames(id);
this.setClassnames(n);
}
} else {
this.removeClassnames(id);
}
}
if(this.firstSet) {
this.firstSet = false;
window.setTimeout(function() {
wbkAnchor.setAnimationState(false);
}, 0);
}
},
setOriginal : function() {
this.set(
document.querySelector('#wbk-main-nav a[data-wbk-behavior="self"]'),
document.querySelector('#wbk-sub-nav a[data-wbk-behavior="self"]')
);
},
setName : function(anchor_name) {
if(typeof(anchor_name) === 'string' && anchor_name !== '') {
this.set(
document.querySelector('#wbk-main-nav a[href="#' + anchor_name + '"]'),
document.querySelector('#wbk-sub-nav a[href="#' + anchor_name + '"]')
);
}
},
anchors : {},
readAnchorNames : function() {
this.anchors = {};
const nA = document.querySelectorAll('#wbk-main-nav a[href^="#"], #wbk-sub-nav a[href^="#"]');
if(nA) {
for (let i = 0, l = nA.length; i < l; i++) {
const n = nA[i];
if(n) {
let name = n.getAttribute('href');
if(name) {
const p = name.indexOf('#');
if(p > -1) {
name = wbkWebsite.trim(name.substring(p + 1));
if(name !== '') {
this.anchors[name] = true;
}
}
}
}
}
}
},
readAnchorPositions : function() {
for(let name in this.anchors) {
const n = document.querySelector('.wbk-widget-content-anchor a[name="'+name+'"]');
if(n) {
this.anchors[name] = wbkWebsite.offsetTop(n);
} else {
delete this.anchors[name];
}
}
},
detectByPosition : function() {
let offsetY = document.getElementById('wbk-anchoroffset');
if(offsetY && offsetY.getClientRects().length) {
offsetY = offsetY.getBoundingClientRect().top;
} else {
offsetY = 0;
}
offsetY += 5;
 offsetY *= -1;
const wY = window.scrollY;
let rDiff = null;
let rName = null;
for(let name in this.anchors) {
const diff = wY - this.anchors[name];
if (diff >= offsetY && (rDiff === null || rDiff > diff)) {
rDiff = diff;
rName = name;
}
}
if (rName) {
this.setName(rName);
} else {
this.setOriginal();
}
},
scrollReadPositions : true,
pauseScrollReadPositions : function() {
this.scrollReadPositions = false;
window.setTimeout(function() {
wbkAnchor.scrollReadPositions = true;
}, 1000);
},
scrollTop : function() {
wbkWebsite.smoothScroll.to(0, 0);
},
scrollToAnchor : function(target) {
let y = (wbkWebsite.anchorOffset.top * -1) + wbkWebsite.offsetTop(target);
y = Math.ceil(y);
if (y < 0) {
y = 0;
}
wbkWebsite.smoothScroll.to(0, y);
},
changeHashTag : function(newHashTag) {
const h = location.hash.replace('#', '');
if(h !== newHashTag) {
location.hash = newHashTag;
return true;
}
return false;
},
resizeTimeout : null,
docHeight : null,
init : function() {
if(document.querySelector('#wbk-main-nav a[href^="#"], #wbk-sub-nav a[href^="#"]')) {
this.setAnimationState(true);
this.removeClassnames('wbk-main-nav');
this.removeClassnames('wbk-sub-nav');
wbkWebsite.onCssLoad.add(function() {
wbkAnchor.readAnchorNames();
wbkWebsite.onGraduallyDocLoad.add(function(){
wbkAnchor.readAnchorPositions();
wbkAnchor.detectByPosition();
});
wbkWebsite.addAnchorOffsetChangeListener(function(){
wbkAnchor.readAnchorPositions();
wbkAnchor.detectByPosition();
});
window.addEventListener('scroll', function () {
if(wbkAnchor.scrollReadPositions) {
wbkAnchor.pauseScrollReadPositions();
wbkAnchor.readAnchorPositions();
}
wbkAnchor.detectByPosition();
}, false);
window.addEventListener('resize', function () {
if(wbkAnchor.resizeTimeout) {
window.clearTimeout(wbkAnchor.resizeTimeout);
}
wbkAnchor.resizeTimeout = window.setTimeout(function() {
wbkAnchor.readAnchorPositions();
wbkAnchor.detectByPosition();
}, 100);
}, false);
window.addEventListener('orientationchange', function () {
wbkAnchor.readAnchorPositions();
wbkAnchor.detectByPosition();
}, false);
window.setInterval(function(){
const h = document.documentElement.clientHeight;
if(h !== wbkAnchor.docHeight) {
wbkAnchor.docHeight = h;
wbkAnchor.readAnchorPositions();
wbkAnchor.detectByPosition();
}
}, 500);
});
}
window.addEventListener('hashchange', function() {
const anchorName = location.hash.replace('#', '');
if(wbkImageDialog.isGalleryPaginationAnchor(anchorName)) {
} else if(anchorName !== '') {
let n = document.querySelector('a[name="' + anchorName + '"]');
if (!n) {
n = document.getElementById(anchorName);
}
if (n) {
wbkAnchor.scrollToAnchor(n);
}
} else {
wbkAnchor.scrollTop();
}
}, false);
wbkWebsite.onCssLoad.add(function() {
const nA = document.querySelectorAll('a[href]');
for (let i = 0, l = nA.length; i < l; i++) {
nA[i].addEventListener('click', function (evt) {
if (this.hasAttribute('href')) {
const href = wbkWebsite.trim(this.getAttribute('href'));
const anchorPos = href.indexOf('#');
const isAnchor = (anchorPos === 0);
 const anchorName = isAnchor ? href.slice(1) : '';
if( isAnchor
&& anchorName === ''
&& this.parentNode.nodeName.toLowerCase() === 'li'
&& wbkWebsite.hasClass(this.parentNode, 'hasChildren')
) {
let n = this;
while (n && n.nodeType === 1) {
if ( n.nodeName.toLowerCase() === 'ul'
&& (n.id === 'wbk-main-nav' || n.id === 'wbk-sub-nav')
) {
evt.preventDefault();
return false;
}
n = n.parentNode;
}
}
if ( anchorName !== ''
&& ( !wbkImageDialog.isGalleryPaginationAnchor(anchorName)
|| anchorName === location.hash.replace('#', '')
)
) {
let n = document.querySelector('a[name="' + anchorName + '"]');
if (!n) {
n = document.getElementById(anchorName);
}
if (n) {
evt.preventDefault();
if (wbkmnav.hover.isMnavOpened()) {
wbkmnav.close();
}
if(!wbkAnchor.changeHashTag(anchorName)) {
wbkAnchor.scrollToAnchor(n);
}
return false;
}
}
if (this.hasAttribute('data-wbk-behavior') && this.getAttribute('data-wbk-behavior') === 'self') {
evt.preventDefault();
if (wbkmnav.hover.isMnavOpened()) {
wbkmnav.close();
}
if(!wbkAnchor.changeHashTag('')) {
wbkAnchor.scrollTop();
}
return false;
}
}
return true;
}, true);
}
});
}
};
window.wbkAnchor = wbkAnchor;
wbkAnchor.init();
})(window);
(function(window) {
'use strict';
var wbkImageDialog = {
initExecuted : false,
init : function() {
if(this.initExecuted) {
return;
}
this.initExecuted = true;
const nA = document.querySelectorAll('.wbk-widget a[data-wbk-image-dialog="1"][href]');
if(nA) {
for(let i = 0, l = nA.length; i < l; i++) {
const n = nA[i];
n.setAttribute('data-wbk-href', n.getAttribute('href'));
n.setAttribute('aria-label', 'fullscreen');
n.onclick = function() {
wbkImageDialog.open(this);
return false;
};
}
}
window.addEventListener('keydown', function(evt){
if(wbkImageDialog.imageNode) {
const keyCode = (evt.keyCode) ? evt.keyCode : evt.code;
if ([32, 33, 34, 35, 36, 38, 40].indexOf(keyCode) > -1) {
evt.preventDefault();
evt.stopPropagation();
return false;
}
}
}, true);
window.addEventListener('keyup', function(evt){
if(wbkImageDialog.imageNode) {
const keyCode = (evt.keyCode) ? evt.keyCode : evt.code;
wbkImageDialog.keyctrl(keyCode, evt.target);
}
}, true);
window.addEventListener('hashchange', function(){ wbkImageDialog.pagination(true); }, false);
this.pagination(false);
},
paginationReplaceImage : function(nLi) {
let n = nLi.querySelector('img');
if(!n) {
n = nLi.querySelector('span');
if(n) {
const img = document.createElement('img');
const attrA = n.attributes;
for(let i = 0, l = attrA.length; i < l; i++) {
const attr = attrA[i];
img.setAttribute(attr.name.replace(/^data-/, ''), attr.value);
}
n.parentNode.insertBefore(img, n);
n.parentNode.removeChild(n);
}
}
},
isGalleryPaginationAnchor : function(anchorName) {
return (anchorName.match(/^gallery(content|footer)[0-9]+page[0-9]+$/));
},
pagination : function(hashchange) {
const h = location.hash.replace('#', '');
if(this.isGalleryPaginationAnchor(h)) {
let page = h.match(/[0-9]+$/);
const prefix = h.replace(/[0-9]+$/, '');
const nUl = document.getElementById(prefix);
let nLi = document.getElementById(h);
if(page) {
page = parseInt(page[0], 10);
} else {
page = null;
}
if(!hashchange && (!page || page === 1)) {
return;
}
if(!isNaN(page) && page > 0 && nUl && nLi) {
let ipp = nUl.getAttribute('data-wbk-imagesperpage');
const nP = nUl.parentNode.querySelector('ul.wbk-pagination');
if(ipp && nP) {
ipp = parseInt(ipp, 10);
if(!isNaN(ipp) && ipp > 0) {
const aLi = nUl.querySelectorAll('li');
let lastPage = 1;
if(aLi) {
lastPage = parseInt(Math.ceil(aLi.length / ipp), 10);
for(let i = 0, l = aLi.length; i < l; i++) {
wbkWebsite.removeClass(aLi[i], 'current');
}
}
if(page > lastPage) {
page = lastPage;
}
while(ipp > 0 && nLi) {
if(nLi.nodeType === 1) {
wbkWebsite.addClass(nLi,'current');
this.paginationReplaceImage(nLi);
ipp--;
}
nLi = nLi.nextSibling;
}
let n = null;
const rC = ['disabled', 'current', 'neighbor'];
let c = 2;
for(let i = 0, l = rC.length; i < l; i++) {
n = nP.querySelectorAll('li.'+rC[i]);
if(n) {
for(let j = 0, jl = n.length; j < jl; j++) {
wbkWebsite.removeClass(n[j], rC[i]);
}
}
}
n = nP.querySelector('li.prev');
if(n && page <= 1) {
wbkWebsite.addClass(n, 'disabled');
c++;
} else if(!n) {
c++;
}
n = nP.querySelector('li.next');
if(n && page >= lastPage) {
wbkWebsite.addClass(n, 'disabled');
c++;
} else if(!n) {
c++;
}
n = nP.querySelector('li.page'+page);
if(n) {
wbkWebsite.addClass(n, 'current');
if(wbkWebsite.hasClass(n, 'first') || wbkWebsite.hasClass(n, 'last')) {
c++;
}
let p = n.previousSibling;
n = n.nextSibling;
while(c > 0 && (p || n)) {
if(n && n.nodeType === 1 && wbkWebsite.hasClass(n, 'page') && !wbkWebsite.hasClass(n, 'last')) {
wbkWebsite.addClass(n, 'neighbor');
c--;
}
if(c > 0 && p && p.nodeType === 1 && wbkWebsite.hasClass(p, 'page') && !wbkWebsite.hasClass(p, 'first')) {
wbkWebsite.addClass(p, 'neighbor');
c--;
}
if(p) p = p.previousSibling;
if(n) n = n.nextSibling;
}
}
n = nP.querySelector('li.prev a');
if(n) {
if(page > 1) {
n.setAttribute('href', '#'+prefix+(page-1));
n.href = '#'+prefix+(page-1);
} else {
n.setAttribute('href', '#'+prefix+'1');
n.href = '#'+prefix+'1';
}
}
n = nP.querySelector('li.next a');
if(n) {
if(page < lastPage) {
n.setAttribute('href', '#'+prefix+(page+1));
n.href = '#'+prefix+(page+1);
} else {
n.setAttribute('href', '#'+prefix+lastPage);
n.href = '#'+prefix+lastPage;
}
}
if(hashchange && wbkAnchor && wbkAnchor.scrollToAnchor) {
wbkAnchor.scrollToAnchor(nUl);
}
}
}
}
}
},
position : 0,
images : [],
wrapNode : null,
imageWrapNode : null,
imageNode : null,
titleNode : null,
posNode : null,
loaderNode : null,
playNode : null,
playTimeout : null,
diashow : false,
open : function(nA) {
this.destroy();
if(!nA) {
return;
}
let nUl = nA;
while(nUl && nUl.nodeType === 1) {
nUl = nUl.parentNode;
if( nUl
&& nUl.nodeType === 1
&& nUl.nodeName.toLowerCase() === 'ul'
&& nUl.classList
&& nUl.classList.contains('images')
) {
const n = nUl.querySelectorAll('a[data-wbk-image-dialog="1"][data-wbk-href]');
if(n) {
for(let i = 0, l = n.length; i < l; i++) {
this.images.push(n[i]);
if(n[i].isEqualNode(nA)) {
this.position = i;
}
}
}
break;
}
}
if(this.images.length === 0) {
this.images.push(nA);
}
this.change();
},
change : function() {
if(this.images.length == 0) {
return;
}
if(this.position < 0) {
this.position = this.images.length - 1;
} else if(this.position > (this.images.length - 1)) {
this.position = 0;
}
if(!this.imageNode) {
this.create();
}
if(this.imageNode) {
this.imageNode.onload = function(){
wbkImageDialog.showAfterLoading();
};
this.imageNode.onerror = function(){
wbkImageDialog.showAfterLoading();
};
if(!this.diashow) {
wbkWebsite.removeClass(this.loaderNode, 'hide');
wbkWebsite.addClass(this.imageNode, 'hide');
}
this.imageNode.src = this.images[this.position].getAttribute('data-wbk-href');
}
},
showAfterLoading : function() {
wbkWebsite.addClass(this.loaderNode, 'hide');
wbkWebsite.removeClass(this.imageNode, 'hide');
let title = '';
let nFigure = this.images[this.position].querySelector('figure');
if(!nFigure) {
nFigure = this.images[this.position].parentNode.querySelector('figure');
}
if(!nFigure) {
nFigure = this.images[this.position].parentNode;
while(nFigure && nFigure.nodeType === 1 && nFigure.nodeName.toLowerCase() !== 'figure') {
nFigure = nFigure.parentNode;
}
if(!nFigure || nFigure.nodeType !== 1) {
nFigure = null;
}
}
if(nFigure) {
const nCaption = nFigure.querySelector('figcaption');
if(nCaption) {
const nTmp = document.createElement('div');
document.body.appendChild(nTmp);
nTmp.innerHTML = nCaption.innerHTML.replace(/<\s*br\s*\/?\s*>/g, ' ');
title = wbkWebsite.trim(nTmp.innerText.replace(/\s+/g, ' '));
document.body.removeChild(nTmp);
}
}
nFigure = null;
if(title !== '') {
this.titleNode.innerText = title;
wbkWebsite.removeClass(this.titleNode, 'hide large medium small');
if(title.length > 200) {
wbkWebsite.addClass(this.titleNode, 'small');
} else if(title.length > 100) {
wbkWebsite.addClass(this.titleNode, 'medium');
} else {
wbkWebsite.addClass(this.titleNode, 'large');
}
} else {
this.titleNode.innerText = '';
wbkWebsite.addClass(this.titleNode, 'hide');
}
if(this.posNode && this.images.length > 1) {
this.posNode.innerText = (this.position + 1)+'/'+this.images.length;
}
if(this.diashow) {
if(this.playTimeout) {
try { window.clearTimeout(this.playTimeout); } catch (e) {}
}
this.playTimeout = window.setTimeout(function(){ wbkImageDialog.next(); }, 4000);
}
},
create : function() {
this.wrapNode = document.createElement('dialog');
this.wrapNode.id = 'wbk-imagegallery-dialog';
this.imageWrapNode = document.createElement('div');
this.imageWrapNode.className = 'image';
this.wrapNode.appendChild(this.imageWrapNode);
this.imageNode = document.createElement('img');
this.imageNode.src = 'data:image/png,';
this.imageNode.setAttribute('alt', '');
this.imageWrapNode.appendChild(this.imageNode);
this.titleNode = document.createElement('span');
this.titleNode.className = 'title';
this.wrapNode.appendChild(this.titleNode);
this.loaderNode = document.createElement('span');
this.loaderNode.className = 'loader hide';
this.wrapNode.appendChild(this.loaderNode);
const lang = document.documentElement.getAttribute('lang');
let n;
if(this.images.length > 1) {
this.posNode = document.createElement('span');
this.posNode.className = 'position';
this.wrapNode.appendChild(this.posNode);
n = document.createElement('a');
n.setAttribute('href', '#previous');
n.href = '#previous';
n.title = (lang == 'de')?'vorheriges Bild':'previous image';
n.setAttribute('aria-label', (lang == 'de')?'vorheriges Bild':'previous image');
n.innerHTML = '<';
n.className = 'prev';
n.onclick = function(e){
e.preventDefault();
e.stopPropagation();
window.setTimeout(function(){ wbkImageDialog.prev(); }, 0);
return false;
};
this.wrapNode.appendChild(n);
n = document.createElement('a');
n.setAttribute('href', '#next');
n.href = '#next';
n.title = (lang == 'de')?'nächstes Bild':'next image';
n.setAttribute('aria-label', (lang == 'de')?'nächstes Bild':'next image');
n.innerHTML = '>';
n.className = 'next';
n.onclick = function(e){
e.preventDefault();
e.stopPropagation();
window.setTimeout(function(){ wbkImageDialog.next(); }, 0);
return false;
};
this.wrapNode.appendChild(n);
n = document.createElement('a');
n.setAttribute('href', '#diashow');
n.href = '#diashow';
n.title = (lang == 'de')?'Diashow':'diashow';
n.setAttribute('aria-label', (lang == 'de')?'Diashow':'diashow');
n.innerHTML = '&nbsp;';
n.className = 'play';
n.onclick = function(e){
e.preventDefault();
e.stopPropagation();
wbkImageDialog.handleDiashow();
return false;
};
this.wrapNode.appendChild(n);
}
n = document.createElement('a');
n.setAttribute('href', '#close');
n.href = '#close';
n.title = (lang == 'de')?'schließen':'close';
n.setAttribute('aria-label', (lang == 'de')?'schließen':'close');
n.innerHTML = '&#10006;';
n.className = 'close';
n.onclick = function(e){
e.preventDefault();
e.stopPropagation();
window.setTimeout(function(){ wbkImageDialog.destroy(); }, 0);
return false;
};
this.wrapNode.appendChild(n);
n = null;
document.body.appendChild(this.wrapNode);
this.wrapNode.showModal();
this.wrapNode.focus();
},
destroy : function(){
if(this.playTimeout) {
try { window.clearTimeout(this.playTimeout); } catch (e) {}
this.playTimeout = null;
}
if(this.wrapNode) {
this.wrapNode.close();
this.wrapNode.parentNode.removeChild(this.wrapNode);
}
this.position = 0;
this.images = [];
this.wrapNode = null;
this.imageNode = null;
this.imageWrapNode = null;
this.titleNode = null;
this.posNode = null;
this.playNode = null;
this.loaderNode = null;
this.diashow = false;
},
prev : function(){
this.position--;
this.change();
},
next : function(){
this.position++;
this.change();
},
handleDiashow : function() {
if(this.playTimeout) {
try { window.clearTimeout(this.playTimeout); } catch (e) {}
this.playTimeout = null;
}
if(this.diashow) {
this.diashow = false;
wbkWebsite.removeClass(this.wrapNode, 'diashow');
} else {
this.diashow = true;
wbkWebsite.addClass(this.wrapNode, 'diashow');
this.playTimeout = window.setTimeout(function(){ wbkImageDialog.next(); }, 4000);
}
},
keyctrl : function(keyCode, target){
if(keyCode === 13 && target.nodeName.toLowerCase() === 'a') {
return;
}
switch(keyCode) {
case 8:
 case 33:
 case 37:
 case 38:
 case 109:
 if(this.images.length > 1) {
this.prev();
}
break;
case 13:
 case 34:
 case 39:
 case 40:
 case 107:
 if(this.images.length > 1) {
this.next();
}
break;
case 27:
 case 46:
 this.destroy();
break;
case 35:
 if(this.images.length > 1) {
this.position = this.images.length - 1;
this.change();
}
break;
case 36:
 if(this.images.length > 1) {
this.position = 0;
this.change();
}
break;
case 32:
 if(this.images.length > 1) {
wbkImageDialog.handleDiashow();
}
break;
}
}
};
window.wbkImageDialog = wbkImageDialog;
document.addEventListener('DOMContentLoaded', function () {
wbkImageDialog.init();
});
})(window);
wbkmnav.hover.accordionmodes.navbutton='fix';wbkmnav.hover.accordionmodes.mainnav='toggle';wbkmnav.hover.accordionmodes.subnav='toggle';
/* <end wbk> */
/* <begin website> */
/* <end website> */
/* <begin blog-forms> */
(function(window){document.body.querySelectorAll(".wbk-blog-toolbar form input, .wbk-blog-toolbar form select").forEach((n) => {n.addEventListener("change", function() {this.form.submit();});});})(window);
/* <end blog-forms> */