var aboutString = "";
var gotos = [];
var Textures = [];
var switchBallcallback = null;
var beCalledFunction = null;
var clickFunctions = new Array()
gotos[0] = {
TargetID: new Array(1025,""),
Position: new Array({ x:-0.4954586,y: 0,z:0.8686315})
};
Textures[0]={ ID:1024,ViewName:escape("1"),Map:"home.jpg", TargetIDs:gotos[0]};

clickFunctions.push(function () {if(beCalledFunction!=null)beCalledFunction();switchBallcallback(1024); });
//----------------------------ID:0finish----------------

gotos[1] = {
TargetID: new Array(1026,""),
Position: new Array({ x:-0.1796609,y: 0,z:0.9837286})
};
Textures[1]={ ID:1025,ViewName:escape("2"),Map:"service.jpg", TargetIDs:gotos[1]};

clickFunctions.push(function () {if(beCalledFunction!=null)beCalledFunction();switchBallcallback(1025); });
//----------------------------ID:1finish----------------

gotos[2] = {
TargetID: new Array(1027,""),
Position: new Array({ x:0.1564345,y: 0,z:0.9876884})
};
Textures[2]={ ID:1026,ViewName:escape("3"),Map:"simple.jpg", TargetIDs:gotos[2]};

clickFunctions.push(function () {if(beCalledFunction!=null)beCalledFunction();switchBallcallback(1026); });
//----------------------------ID:2finish----------------

gotos[3] = {
TargetID: new Array(1024,""),
Position: new Array({ x:0.01570721,y: 0,z:0.9998766})
};
Textures[3]={ ID:1027,ViewName:escape("4"),Map:"View.jpg", TargetIDs:gotos[3]};

clickFunctions.push(function () {if(beCalledFunction!=null)beCalledFunction();switchBallcallback(1027); });
//----------------------------ID:3finish----------------

