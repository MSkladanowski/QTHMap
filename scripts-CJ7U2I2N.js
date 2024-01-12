import y from"arc";const g=e=>({x:e.lng,y:e.lat});function M(e,o){if(e.geometries[0]&&e.geometries[0].coords[0]){let t=o.lng-e.geometries[0].coords[0][0]-360;return e.geometries.map(r=>(t+=360,r.coords.map(n=>L.latLng([n[1],n[0]+t])))).reduce((r,n)=>r.concat(n))}else return[]}if(L)L.Polyline.Arc=(e,o,t)=>{const r=L.latLng(e),n=L.latLng(o),s={vertices:10,offset:10,...t},a=new y.GreatCircle(g(r),g(n)).Arc(s.vertices,{offset:s.offset}),l=M(a,r);return L.polyline(l,s)};else throw new Error("Leaflet is not defined");L.Maidenhead=L.LayerGroup.extend({options:{color:"rgba(255, 0, 0, 0.4)",redraw:"move",onClick:function(){}},initialize:function(e){L.LayerGroup.prototype.initialize.call(this),L.Util.setOptions(this,e)},onAdd:function(e){this._map=e;var o=this.redraw();this._map.on("viewreset "+this.options.redraw,function(){o.redraw()}),this.eachLayer(e.addLayer,e)},onRemove:function(e){e.off("viewreset "+this.options.redraw,this.map),this.eachLayer(this.removeLayer,this)},redraw:function(){var e=new Array(20,10,10,10,10,10,1,1,1,1,.041666666666666664,.041666666666666664,.041666666666666664,.041666666666666664,.041666666666666664,.004166666666666667,.004166666666666667,.004166666666666667,.00017361111111111112,.00017361111111111112,.00017361111111111112),o=new Array(0,8,8,8,10,14,6,8,8,8,1.4,2.5,3,3.5,4,4,3.5,3.5,1.47,1.8,1.6),t=this._map.getBounds(),r=this._map.getZoom(),n=e[r],s=o[r],h=Math.max(t.getWest(),-180),a=Math.min(t.getEast(),180),l=Math.min(t.getNorth(),90),c=Math.max(t.getSouth(),-90);if(r==1)var i=2;else var i=.1;l>85&&(l=85),c<-85&&(c=-85);var u=Math.floor(h/(n*2))*(n*2),v=Math.ceil(a/(n*2))*(n*2),m=Math.ceil(l/n)*n,p=Math.floor(c/n)*n;this.eachLayer(this.removeLayer,this);for(var d=u;d<v;d+=n*2)for(var f=p;f<m;f+=n){var t=[[f,d],[f+n,d+n*2]];let w=L.rectangle(t,{color:this.options.color,weight:1,fill:!0,interactive:!1});this.addLayer(w),this.addLayer(this._getLabel(d+n-n/s,f+n/2+n/s*i))}return this},_getLabel:function(e,o){var t=new Array(0,10,12,16,20,26,12,16,24,36,12,14,20,36,60,12,20,36,8,12,24),r=this._map.getZoom(),n=t[r]+"px",s='<span style="cursor: default;"><font style="color:'+this.options.color+"; font-size:"+n+'; font-weight: 900; ">'+this.latLngToMaidenheadIndex(e,o)+"</font></span>",h=L.divIcon({className:"my-div-icon",html:s}),a=L.marker([o,e],{icon:h});return a},latLngToMaidenheadIndex:function(e,o){for(var t=new Array(10,1,.041666666666666664,.004166666666666667,.00017361111111111112),r="ABCDEFGHIJKLMNOPQR".split(""),n="ABCDEFGHIJKLMNOPQRSTUVWX".split(""),s=new Array(0,1,1,1,1,1,2,2,2,2,3,3,3,3,3,4,4,4,5,5,5),h="",a=e,l=o,c=s[this._map.getZoom()];a<-180;)a+=360;for(;a>180;)a-=360;a=a+180,l=l+90,h=h+r[Math.floor(a/20)]+r[Math.floor(l/10)];for(var i=0;i<4;i=i+1)if(c>i+1){let u=a%(t[i]*2),v=l%t[i];i%2==0?h+=Math.floor(u/(t[i+1]*2))+""+Math.floor(v/t[i+1]):h+=n[Math.floor(u/(t[i+1]*2))]+""+n[Math.floor(v/t[i+1])]}return h},_letterIndex:function(e){return"ABCDEFGHIJKLMNOPQRSTUVWX".indexOf(e.toUpperCase())},_indexLetter:function(e){return"ABCDEFGHIJKLMNOPQRSTUVWX".charAt(e)},maidehneadIndexToBBox:function(e){const o=e.length;let t=-90,r=-180;if(r+=20*this._letterIndex(e.substring(0,1)),t+=10*this._letterIndex(e.substring(1,2)),e.length===2)return[t,r,t+10,r+20];if(r+=2*Number(e.substring(2,3)),t+=1*Number(e.substring(3,4)),e.length===4)return[t,r,t+1,r+2];if(r+=5/60*this._letterIndex(e.substring(4,5)),t+=2.5/60*this._letterIndex(e.substring(5,6)),e.length===6)return[t,r,t+2.5/60,r+5/60];if(r+=.5/60*Number(e.substring(6,7)),t+=.25/60*Number(e.substring(7,8)),e.length===8)return[t,r,t+.25/60,r+.5/60];throw new Error("String passed to maidenhead indexToBBox has invalid length: "+e+" end"+o)}}),L.maidenhead=function(e){return new L.Maidenhead(e)};
