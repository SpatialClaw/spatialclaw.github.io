/* Per-benchmark radar — theme-aware, rebuilds on `themechange`. */
(function(){
  var canvas=document.getElementById('headlineRadar');
  if(!canvas||typeof Chart==='undefined')return;

  // cat: 0 Single-image, 1 Multi-view, 2 Video&4D, 3 General spatial, 4 General video
  var benchmarks=[
    {cat:0,name:'ERQA',ours:61.3,noTool:58.3,spaceTools:52.0,pySpatial:50.8},
    {cat:0,name:'Omni3D',ours:54.3,noTool:51.7,spaceTools:50.7,pySpatial:50.6},
    {cat:0,name:'OmniSpatial',ours:63.6,noTool:57.3,spaceTools:60.4,pySpatial:58.0},
    {cat:0,name:'SPBench',ours:68.4,noTool:55.1,spaceTools:45.1,pySpatial:53.5},
    {cat:1,name:'MindCube',ours:72.8,noTool:57.5,spaceTools:52.9,pySpatial:67.1},
    {cat:1,name:'MMSI',ours:51.3,noTool:37.9,spaceTools:33.1,pySpatial:33.2},
    {cat:1,name:'SPAR-Bench',ours:63.3,noTool:55.2,spaceTools:53.9,pySpatial:51.7},
    {cat:2,name:'MMSI-Video',ours:41.6,noTool:36.9,spaceTools:36.6,pySpatial:28.7},
    {cat:2,name:'OSI-Bench',ours:41.9,noTool:35.6,spaceTools:30.2,pySpatial:32.0},
    {cat:2,name:'PAI-Bench',ours:68.1,noTool:65.0,spaceTools:65.1,pySpatial:46.0},
    {cat:2,name:'VSI-Bench-U',ours:48.5,noTool:48.0,spaceTools:33.6,pySpatial:44.4},
    {cat:2,name:'VSTI-Bench',ours:67.6,noTool:54.7,spaceTools:56.0,pySpatial:55.0},
    {cat:2,name:'DSI-Bench',ours:62.9,noTool:45.3,spaceTools:43.0,pySpatial:43.7},
    {cat:3,name:'BLINK',ours:73.4,noTool:75.7,spaceTools:58.2,pySpatial:60.3},
    {cat:3,name:'SpatialTree',ours:60.7,noTool:59.9,spaceTools:52.7,pySpatial:53.9},
    {cat:3,name:'ViewSpatial',ours:60.2,noTool:51.7,spaceTools:52.1,pySpatial:49.9},
    {cat:4,name:'CV-Bench',ours:72.2,noTool:69.8,spaceTools:46.8,pySpatial:67.7},
    {cat:4,name:'PerceptComp',ours:44.0,noTool:36.8,spaceTools:38.6,pySpatial:37.1},
    {cat:4,name:'Video-MME',ours:77.0,noTool:74.8,spaceTools:74.6,pySpatial:50.3},
    {cat:4,name:'Video-MME-v2',ours:44.4,noTool:40.7,spaceTools:37.4,pySpatial:23.0}
  ];
  var catLight={0:'#4a7a00',1:'#2c5fa3',2:'#8b3c8b',3:'#b56b1c',4:'#0d8473'};
  var catDark ={0:'#9bd13a',1:'#6aa6e8',2:'#cd7fcd',3:'#e0a050',4:'#3dc5b0'};
  var catNames=['Single-image','Multi-view','Video & 4D','General spatial','General video'];

  var labels=benchmarks.map(function(b){return b.name;});
  var target=80;
  var oursData=benchmarks.map(function(){return target;});
  var noToolData=benchmarks.map(function(b){return +(b.noTool*target/b.ours).toFixed(2);});
  var stData=benchmarks.map(function(b){return +(b.spaceTools*target/b.ours).toFixed(2);});
  var pyData=benchmarks.map(function(b){return +(b.pySpatial*target/b.ours).toFixed(2);});
  var originals={'SpatialClaw (Ours)':benchmarks.map(function(b){return b.ours;}),
    'SpaceTools-Toolshed':benchmarks.map(function(b){return b.spaceTools;}),
    'pySpatial':benchmarks.map(function(b){return b.pySpatial;}),
    'No-tool baseline':benchmarks.map(function(b){return b.noTool;})};

  var ctx=canvas.getContext('2d');
  var chart=null;

  function build(){
    var dark=document.documentElement.getAttribute('data-theme')==='dark';
    var catColor=dark?catDark:catLight;
    var grid=dark?'rgba(255,255,255,0.10)':'rgba(0,0,0,0.08)';
    var labelColors=benchmarks.map(function(b){return catColor[b.cat];});
    var w=window.innerWidth;
    var lblSize=w<420?7.5:(w<768?8.5:11);
    var pad=w<420?2:(w<768?6:18);

    if(chart)chart.destroy();
    chart=new Chart(ctx,{
      type:'radar',
      data:{labels:labels,datasets:[
        {label:'No-tool baseline',data:noToolData,backgroundColor:'rgba(140,140,140,0.06)',borderColor:dark?'rgba(150,150,150,0.8)':'rgba(120,120,120,0.85)',borderWidth:1.4,borderDash:[5,4],pointBackgroundColor:'rgba(140,140,140,0.9)',pointBorderColor:dark?'#15171b':'#fff',pointRadius:2.2,order:4},
        {label:'pySpatial',data:pyData,backgroundColor:'rgba(216,118,26,0.08)',borderColor:dark?'rgba(224,160,80,0.95)':'rgba(216,118,26,0.95)',borderWidth:1.5,pointBackgroundColor:dark?'#e0a050':'rgba(216,118,26,1)',pointBorderColor:dark?'#15171b':'#fff',pointRadius:2.3,order:3},
        {label:'SpaceTools-Toolshed',data:stData,backgroundColor:'rgba(48,104,180,0.12)',borderColor:dark?'rgba(106,166,232,0.95)':'rgba(50,100,180,0.95)',borderWidth:1.6,pointBackgroundColor:dark?'#6aa6e8':'rgba(50,100,180,1)',pointBorderColor:dark?'#15171b':'#fff',pointRadius:2.4,order:2},
        {label:'SpatialClaw (Ours)',data:oursData,backgroundColor:'rgba(118,185,0,0.28)',borderColor:dark?'rgba(133,200,20,1)':'rgba(90,144,0,1)',borderWidth:2.4,pointBackgroundColor:'rgba(118,185,0,1)',pointBorderColor:dark?'#15171b':'#fff',pointRadius:3,pointHoverRadius:5,order:1}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,layout:{padding:{top:Math.round(pad*0.15),right:pad,bottom:Math.round(pad*0.7),left:pad}},
        plugins:{legend:{display:false},tooltip:{
          backgroundColor:dark?'rgba(8,10,16,0.95)':'rgba(22,22,22,0.92)',padding:10,
          titleFont:{family:"'NVIDIA Sans',sans-serif",weight:'600'},bodyFont:{family:"'NVIDIA Sans',sans-serif"},
          callbacks:{
            title:function(items){var i=items[0].dataIndex;return benchmarks[i].name+'  ·  '+catNames[benchmarks[i].cat];},
            label:function(item){var orig=originals[item.dataset.label]?originals[item.dataset.label][item.dataIndex]:null;var shown=(typeof orig==='number')?orig.toFixed(1):item.formattedValue;return item.dataset.label+': '+shown;}
          }
        }},
        scales:{r:{min:0,max:100,ticks:{display:false,stepSize:20},
          angleLines:{color:grid},grid:{color:grid},
          pointLabels:{color:function(c){return labelColors[c.index]||(dark?'#f4f5f4':'#161616');},font:{family:"'NVIDIA Sans',sans-serif",size:lblSize,weight:'600'},padding:8}
        }}
      }
    });
  }
  build();
  window.addEventListener('themechange',build);
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(build,160);});
})();
