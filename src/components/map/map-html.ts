import { DIFFICULTY_STYLE } from "@/theme";

export const PLACE_COLORS: Record<string, string> = {
  waterfall: "#2f7fb0",
  lake: "#1f9aa8",
  peak: "#6b5646",
  village: "#c9912a",
  historic: "#b4432a",
  park: "#356a47",
};

export const AZ_BOUNDS: [number, number, number, number] = [44.77, 38.39, 50.63, 41.91];

const MAPLIBRE = "https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist";
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

/**
 * A self-contained MapLibre page, styled like the website's map (OpenFreeMap Liberty, trails
 * coloured by difficulty, places by type). It talks to React Native through postMessage.
 */
export function mapHtml({ interactive, bounds }: { interactive: boolean; bounds: [number, number, number, number] }) {
  const difficulty = Object.entries(DIFFICULTY_STYLE).flatMap(([k, v]) => [k, v.dot]);
  const places = Object.entries(PLACE_COLORS).flat();
  return `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${MAPLIBRE}/maplibre-gl.css">
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:#e9e4d6;-webkit-tap-highlight-color:transparent}
  .maplibregl-ctrl-attrib{font:11px -apple-system,system-ui,sans-serif;background:rgba(251,248,242,.85)!important;border-radius:10px!important}
  .maplibregl-ctrl-bottom-right{bottom:var(--pad-bottom,0px)}
  .pin{width:26px;height:26px;border-radius:50% 50% 50% 0;background:#b4432a;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3)}
  .me{width:16px;height:16px;border-radius:50%;background:#2f7fb0;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,127,176,.25)}
</style>
<script src="${MAPLIBRE}/maplibre-gl.js"></script>
</head><body><div id="map"></div>
<script>
(function(){
  var post = function(msg){
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent !== window) window.parent.postMessage({__ecotrail: true, payload: s}, "*");
  };
  window.onerror = function(m){ post({type:"error", message: String(m)}); };
  if (!window.maplibregl) { post({type:"error", message:"maplibre failed to load"}); return; }

  var EMPTY = {type:"FeatureCollection", features:[]};
  var map = new maplibregl.Map({
    container: "map",
    style: "${STYLE_URL}",
    bounds: ${JSON.stringify(bounds)},
    fitBoundsOptions: {padding: 24},
    attributionControl: {compact: true},
    interactive: ${interactive},
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false
  });
  map.touchZoomRotate && map.touchZoomRotate.disableRotation();
  window.__map = map;

  var ready = false, queue = [], active = null, pin = null, me = null, lastFit = null, userMoved = false;
  // Keep the last requested framing when the view is resized (layout settles after load), until the user pans.
  map.on("resize", function(){ if (lastFit && !userMoved) map.fitBounds(lastFit.bbox, {padding: lastFit.padding, duration: 0, maxZoom: lastFit.maxZoom}); });
  map.on("dragstart", function(){ userMoved = true; });
  map.on("zoomstart", function(e){ if (e.originalEvent) userMoved = true; });
  var collapse = function(){ var a = document.querySelector(".maplibregl-ctrl-attrib"); if (a) a.classList.remove("maplibregl-compact-show"); };
  map.once("idle", collapse);
  var DIFF = ["match", ["get","difficulty"], ${JSON.stringify(difficulty).slice(1, -1)}, "#356a47"];
  var PLACE = ["match", ["get","type"], ${JSON.stringify(places).slice(1, -1)}, "#356a47"];
  var isActive = ["boolean", ["feature-state","active"], false];

  function setActive(slug){
    ["et-trails","et-trailheads","et-places"].forEach(function(src){
      if (active) try { map.setFeatureState({source: src, id: active}, {active:false}); } catch(e){}
      if (slug) try { map.setFeatureState({source: src, id: slug}, {active:true}); } catch(e){}
    });
    active = slug;
  }

  function handle(msg){
    if (!ready) { queue.push(msg); return; }
    switch (msg.type) {
      case "data":
        var trails = msg.trails || EMPTY;
        map.getSource("et-trails").setData(trails);
        map.getSource("et-trailheads").setData({type:"FeatureCollection", features: trails.features.filter(function(f){return f.properties && f.properties.lat != null;}).map(function(f){
          return {type:"Feature", geometry:{type:"Point", coordinates:[f.properties.lng, f.properties.lat]}, properties:f.properties};
        })});
        map.getSource("et-places").setData(msg.places || EMPTY);
        if (active) setActive(active);
        break;
      case "visibility":
        ["et-trail-casing","et-trail-line","et-trailheads"].forEach(function(id){ map.setLayoutProperty(id, "visibility", msg.trails ? "visible" : "none"); });
        ["et-places","et-place-labels"].forEach(function(id){ map.setLayoutProperty(id, "visibility", msg.places ? "visible" : "none"); });
        if (msg.placeTypes) map.setFilter("et-places", msg.placeTypes.length ? ["in", ["get","type"], ["literal", msg.placeTypes]] : null);
        if (msg.placeTypes) map.setFilter("et-place-labels", msg.placeTypes.length ? ["in", ["get","type"], ["literal", msg.placeTypes]] : null);
        break;
      case "active": setActive(msg.slug || null); break;
      case "fit":
        userMoved = false;
        lastFit = {bbox: msg.bbox, padding: msg.padding || 40, maxZoom: msg.maxZoom || 14};
        map.fitBounds(msg.bbox, {padding: lastFit.padding, duration: msg.animate === false ? 0 : 900, maxZoom: lastFit.maxZoom});
        break;
      case "fly": lastFit = null; map.flyTo({center:[msg.lng, msg.lat], zoom: msg.zoom || 12, duration: 1100, essential: true}); break;
      case "padding":
        document.documentElement.style.setProperty("--pad-bottom", (msg.bottom||0) + "px");
        break;
      case "pin":
        if (pin) { pin.remove(); pin = null; }
        if (msg.lat != null) { var el = document.createElement("div"); el.className = "pin"; pin = new maplibregl.Marker({element: el, anchor: "bottom"}).setLngLat([msg.lng, msg.lat]).addTo(map); }
        break;
      case "me":
        if (me) { me.remove(); me = null; }
        if (msg.lat != null) { var d = document.createElement("div"); d.className = "me"; me = new maplibregl.Marker({element: d}).setLngLat([msg.lng, msg.lat]).addTo(map); }
        break;
    }
  }

  window.__recv = function(msg){ try { handle(typeof msg === "string" ? JSON.parse(msg) : msg); } catch(e) { post({type:"error", message:String(e)}); } };
  window.addEventListener("message", function(e){ if (e.data && e.data.__ecotrail_in) window.__recv(e.data.payload); });

  map.once("style.load", function(){
    collapse();
    map.addSource("et-trails", {type:"geojson", data:EMPTY, promoteId:"slug"});
    map.addSource("et-trailheads", {type:"geojson", data:EMPTY, promoteId:"slug"});
    map.addSource("et-places", {type:"geojson", data:EMPTY, promoteId:"slug"});
    map.addLayer({id:"et-trail-casing", type:"line", source:"et-trails", layout:{"line-cap":"round","line-join":"round"}, paint:{"line-color":"#ffffff","line-width":["case", isActive, 10, 6.5],"line-opacity":0.95}});
    map.addLayer({id:"et-trail-line", type:"line", source:"et-trails", layout:{"line-cap":"round","line-join":"round"}, paint:{"line-color":DIFF,"line-width":["case", isActive, 6, 3.8]}});
    map.addLayer({id:"et-trailheads", type:"circle", source:"et-trailheads", paint:{"circle-radius":["case", isActive, 9, 6],"circle-color":DIFF,"circle-stroke-color":"#ffffff","circle-stroke-width":2.5}});
    map.addLayer({id:"et-places", type:"circle", source:"et-places", paint:{"circle-radius":["interpolate",["linear"],["zoom"],6,["case",isActive,9,5],11,["case",isActive,11,8]],"circle-color":PLACE,"circle-stroke-color":"#ffffff","circle-stroke-width":2.2}});
    map.addLayer({id:"et-place-labels", type:"symbol", source:"et-places", minzoom:9, layout:{"text-field":["get","name"],"text-font":["Noto Sans Regular"],"text-size":12,"text-offset":[0,1.2],"text-anchor":"top","text-optional":true}, paint:{"text-color":"#1a1d19","text-halo-color":"#ffffff","text-halo-width":1.6}});
    ready = true;
    queue.splice(0).forEach(handle);
    post({type:"ready"});
  });

  var LAYERS = ["et-places","et-trailheads","et-trail-line"];
  map.on("click", function(e){
    var box = [[e.point.x-14, e.point.y-14],[e.point.x+14, e.point.y+14]];
    var hits = map.queryRenderedFeatures(box, {layers: LAYERS.filter(function(l){ return map.getLayer(l) && map.getLayoutProperty(l,"visibility") !== "none"; })});
    if (hits.length) {
      var f = hits[0];
      post({type:"select", kind: f.layer.id === "et-places" ? "place" : "trail", slug: f.properties.slug});
    } else {
      post({type:"press", lat: e.lngLat.lat, lng: e.lngLat.lng});
    }
  });
  map.on("contextmenu", function(e){ post({type:"longpress", lat:e.lngLat.lat, lng:e.lngLat.lng}); });
  map.on("moveend", function(){ var b = map.getBounds(); post({type:"bounds", bbox:[b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], zoom: map.getZoom()}); });
})();
</script></body></html>`;
}
