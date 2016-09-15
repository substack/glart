var surfaceNets = require('surface-nets')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')

module.exports = function (size, f) {
  if (typeof size === 'number') {
    var sx = size, sy = size, sz = size
  } else {
    var sx = size[0], sy = size[1], sz = size[2]
  }
  var data = ndarray(new Float64Array(sx*sy*sz),[sx,sy,sz])
  return scale(surfaceNets(fill(data, function (i,j,k) {
    return f(i/sx*2-1, j/sy*2-1, k/sz*2-1)
  })))
  function scale (mesh) {
    var p = mesh.positions
    for (var i = 0; i < p.length; i++) {
      p[i][0] = p[i][0] / sx * 2 - 1
      p[i][1] = p[i][1] / sy * 2 - 1
      p[i][2] = p[i][2] / sz * 2 - 1
    }
    return mesh
  }
}
