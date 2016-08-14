var column = require('column-mesh')
var fs = require('fs')
var params = [
  { radius: 2, height: 10, capitalHeight: 0.5, baseHeight: 0.5 },
  { radius: 3, height: 20, capitalHeight: 2, baseHeight: 2 },
  { radius: 4, height: 50, capitalHeight: 4, baseHeight: 4 }
]

;(function next (i) {
  if (i >= params.length) return
  var p = params[i]
  var file = 'data/' + i + '.json'
  process.stdout.write(file + ' ... ')
  fs.writeFile(file, JSON.stringify(column(p)), function (err) {
    if (err) return exit(err)
    process.stdout.write(' ok\n')
    next(i+1)
  })
})(0)

function exit (err) {
  console.error(err)
  process.exit(1)
}
