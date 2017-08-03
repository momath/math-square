import P5Behavior from 'p5beh';
import * as Display from 'display';
import 'lib/rhill-voronoi-core';

var p5;

function Voro(_p5, _verts, _manyTeams, _colors) {
  this.p5 = _p5;
  this.vertices = _verts;
  this.manyTeams = _manyTeams;
  this.voronoi;
  this.colors = _colors;
}

Voro.prototype.resetPoints = function(users){
  this.p5.clear();
  this.vertices = users.map(function (u) { return { x: u.x, y: u.y }; });
  this.draw(users);
}

Voro.prototype.polygonArea = function(points) { 
  var area = 0;         
  var j = points.length-1; 

  for (var i=0; i<points.length; i++){ 
    area = area +  (points[j].x+points[i].x) * (points[j].y-points[i].y); 
    j = i;  
  }
  return area/2;
};

Voro.prototype.draw = function(users){
  var bbox = {xl:1, xr:Display.width, yt:0, yb:Display.height-1};
  this.voronoi = new Voronoi();
  var points = this.voronoi.compute(this.vertices,bbox);
  var cellGeometryVertices = [];

  for(var thisCellID in points.cells){
    var thisCell = points.cells[thisCellID];
    if(thisCell != undefined){
      this.p5.beginShape();
      var count = 0;
      if(thisCell.halfedges != undefined){
        for(var halfEdgeID in thisCell.halfedges){
          if(count == 0){
            var thisStartPoint = points.cells[thisCellID].halfedges[halfEdgeID].getStartpoint();
            this.p5.vertex(thisStartPoint.x,thisStartPoint.y);
            cellGeometryVertices.push({x: thisStartPoint.x, y: thisStartPoint.y});
          }
          var thisEndPoint = points.cells[thisCellID].halfedges[halfEdgeID].getEndpoint();
          this.p5.vertex(thisEndPoint.x,thisEndPoint.y)
          cellGeometryVertices.push({x: thisEndPoint.x, y: thisEndPoint.y});
          count++;
        }

        var a = this.polygonArea(cellGeometryVertices);
        var siteVec = {x: thisCell.site.x, y: thisCell.site.y};
        var team = 0;
        for(var user of users){
          var gVec = {x: user.x, y: user.y};
          var distance = Math.sqrt(Math.pow(siteVec.x - gVec.x, 2) + Math.pow(siteVec.y - gVec.y, 2));
          if(distance < 0.5) {
            user.area = a;
            team = user.team;
          }
        }
        this.p5.stroke('white');
        this.p5.fill(this.manyTeams ? '#'+this.colors[team].toString(16) : (team == 0 ? '#FF0000' : '#0000FF'));
        this.p5.endShape();
      }
    }
  }  
}

export default Voro;