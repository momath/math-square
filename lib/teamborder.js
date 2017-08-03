import * as THREE from 'three';

// teams is an array of objects { name: <string>, image: <tile image filename> }

export var TeamBorder = (function() {
  var TeamBorder = function(boardSize, blockSize, teams) {
    this.boardSize = boardSize;
    this.blockSize = blockSize;
    this.teams = teams;

    this._teamMaterials = [];
    for(var i = 0; i < teams.length; i++) {
      var texture = new THREE.ImageUtils.loadTexture(teams[i].image);
      this._teamMaterials.push(new THREE.MeshBasicMaterial({ map: texture }));
    }

    this._tileGeometry = new THREE.PlaneGeometry(blockSize, blockSize);
    this._tiles = [];

    this._z = -200;

    this.boundary = new THREE.Geometry();
    this.boundary.vertices.push(new THREE.Vector3(blockSize, blockSize, this._z));
    this.boundary.vertices.push(new THREE.Vector3(boardSize - blockSize, blockSize, this._z));
    this.boundary.vertices.push(new THREE.Vector3(boardSize - blockSize, boardSize - blockSize, this._z));
    this.boundary.vertices.push(new THREE.Vector3(blockSize, boardSize - blockSize, this._z));
    this.boundary.vertices.push(new THREE.Vector3(blockSize, blockSize, this._z));
  };

  TeamBorder.prototype._addTeamTile = function(scene, teamIdx, column, row) {
    var tile = new THREE.Mesh(this._tileGeometry, this._teamMaterials[teamIdx]);
    tile.overdraw = true;
    tile.rotation.x = Math.PI;
    tile.position.set(column * this.blockSize + this.blockSize / 2,
      row * this.blockSize + this.blockSize / 2,
      this._z);

    tile.team = this.teams[teamIdx];

    scene.add(tile);
    this._tiles.push(tile);
  };

  TeamBorder.prototype.addToScene = function(scene) {
    var blocksPerRank = Math.floor(this.boardSize / this.blockSize),
      teamIdx, numTeams = this.teams.length,
      topRightTeamIdx, bottomLeftTeamIdx,
      row, column;

    // Top row
    teamIdx = 0;
    row = 0;
    for(column = 0; column < blocksPerRank; column++) {
      this._addTeamTile(scene, teamIdx, column, row);

      // Double up in the corners
      if(column > 0 && column < blocksPerRank - 2)
        teamIdx = (teamIdx + 1) % numTeams;
    }

    // Remember the team in the top right for later
    topRightTeamIdx = teamIdx;


    // Left column
    // Start with the team that appeared in the top-left (i.e., index 0),
    // and one tile down (since we already did the top row)
    teamIdx = 0;
    column = 0;
    for(row = 1; row < blocksPerRank; row++) {
      this._addTeamTile(scene, teamIdx, column, row);

      // Double up in the corner
      if(row < blocksPerRank - 2)
        teamIdx = (teamIdx + 1) % numTeams;
    }

    // Remember bottom left team for later
    bottomLeftTeamIdx = teamIdx;


    // Right column
    // Start with top-right team, and one tile down (since we already did
    // the top row)
    teamIdx = topRightTeamIdx;
    column = blocksPerRank - 1;
    for(row = 1; row < blocksPerRank; row++) {
      this._addTeamTile(scene, teamIdx, column, row);

      // Double up in the corner
      if(row < blocksPerRank - 2)
        teamIdx = (teamIdx + 1) % numTeams;
    }


    // Bottom Row
    // Start with bottom left team. Don't add leftmost or rightmost tiles,
    // since we already did the left and right columns.
    teamIdx = bottomLeftTeamIdx;
    row = blocksPerRank - 1;
    for(column = 1; column < blocksPerRank - 1; column++) {
      this._addTeamTile(scene, teamIdx, column, row);

      // No worries about doubling up... hopefully it will work out.
      // Nothing we can do at this point.
      teamIdx = (teamIdx + 1) % numTeams;
    }
  };

  // v is a vector3
  // TODO: this is to the ... top-left of the tiles (right?). Is that ok?
  // TODO: is this busted if our _z is > 0?
  TeamBorder.prototype.closestTeamToPoint = function(x, y) {
    var minDistanceSq, winner,
      pos = new THREE.Vector3(x, y, this._z);

    for(var i = 0; i < this._tiles.length; i++) {
      var tile = this._tiles[i],
        dist = tile.position.distanceToSquared(pos);

      if(i == 0) {
        minDistanceSq = dist;
        winner = tile;
      }
      else if(dist < minDistanceSq) {
        minDistanceSq = dist;
        winner = tile;
      }

      // TODO: toss a coin if the distances are equal? Does that happen?
    }

    return winner.team.name;
  };

  TeamBorder.prototype.pointOnBorder = function(x, y) {
    return (x <= this.blockSize) || (x >= this.boardSize - this.blockSize) ||
      (y <= this.blockSize) || (y >= this.boardSize - this.blockSize);
  };

  return TeamBorder;
})();
export default TeamBorder;
