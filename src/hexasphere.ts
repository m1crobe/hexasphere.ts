import Face from "./face"
import Point from "./point"
import Tile from "./tile"

export default class Hexasphere {
  radius: number
  tiles: Tile[]
  tileLookup: { [key: string]: Tile }

  constructor(radius: number, numDivisions: number, hexSize: number) {
    this.radius = radius
    const tao = 1.61803399
    const corners = [
      new Point(1000, tao * 1000, 0),
      new Point(-1000, tao * 1000, 0),
      new Point(1000, -tao * 1000, 0),
      new Point(-1000, -tao * 1000, 0),
      new Point(0, 1000, tao * 1000),
      new Point(0, -1000, tao * 1000),
      new Point(0, 1000, -tao * 1000),
      new Point(0, -1000, -tao * 1000),
      new Point(tao * 1000, 0, 1000),
      new Point(-tao * 1000, 0, 1000),
      new Point(tao * 1000, 0, -1000),
      new Point(-tao * 1000, 0, -1000),
    ]

    const points: { [key: string]: Point } = {}

    for (let i = 0; i < corners.length; i++) {
      points[corners[i].toString()] = corners[i]
    }

    const faces = [
      new Face(corners[0], corners[1], corners[4], false),
      new Face(corners[1], corners[9], corners[4], false),
      new Face(corners[4], corners[9], corners[5], false),
      new Face(corners[5], corners[9], corners[3], false),
      new Face(corners[2], corners[3], corners[7], false),
      new Face(corners[3], corners[2], corners[5], false),
      new Face(corners[7], corners[10], corners[2], false),
      new Face(corners[0], corners[8], corners[10], false),
      new Face(corners[0], corners[4], corners[8], false),
      new Face(corners[8], corners[2], corners[10], false),
      new Face(corners[8], corners[4], corners[5], false),
      new Face(corners[8], corners[5], corners[2], false),
      new Face(corners[1], corners[0], corners[6], false),
      new Face(corners[11], corners[1], corners[6], false),
      new Face(corners[3], corners[9], corners[11], false),
      new Face(corners[6], corners[10], corners[7], false),
      new Face(corners[3], corners[11], corners[7], false),
      new Face(corners[11], corners[6], corners[7], false),
      new Face(corners[6], corners[0], corners[10], false),
      new Face(corners[9], corners[1], corners[11], false),
    ]

    const getPointIfExists = (point: Point) => {
      if (points[point.toString()]) {
        return points[point.toString()]
      } else {
        points[point.toString()] = point
        return point
      }
    }

    const newFaces: Face[] = []

    for (let f = 0; f < faces.length; f++) {
      let prev = null
      let bottom = [faces[f].points[0]]
      const left = faces[f].points[0].subdivide(
        faces[f].points[1],
        numDivisions,
        getPointIfExists,
      )
      const right = faces[f].points[0].subdivide(
        faces[f].points[2],
        numDivisions,
        getPointIfExists,
      )
      for (let i = 1; i <= numDivisions; i++) {
        prev = bottom
        bottom = left[i].subdivide(right[i], i, getPointIfExists)
        for (let j = 0; j < i; j++) {
          let nf = new Face(prev[j], bottom[j], bottom[j + 1])
          newFaces.push(nf)

          if (j > 0) {
            nf = new Face(prev[j - 1], prev[j], bottom[j])
            newFaces.push(nf)
          }
        }
      }
    }

    const newPoints: { [key: string]: Point } = {}
    for (const p in points) {
      const np = points[p].project(radius)
      newPoints[np.toString()] = np
    }

    this.tiles = []
    this.tileLookup = {}

    for (const p in newPoints) {
      const newTile = new Tile(newPoints[p], hexSize)
      this.tiles.push(newTile)
      this.tileLookup[newTile.toString()] = newTile
    }

    for (const t in this.tiles) {
      const _this = this
      this.tiles[t].neighbors = this.tiles[t].neighborIds.map(
        (item) => _this.tileLookup[item],
      )
    }
  }

  toJson() {
    return JSON.stringify({
      radius: this.radius,
      tiles: this.tiles.map((tile) => tile.toJson()),
    })
  }

  toObj() {
    const objV: Point[] = []
    const objF: number[][] = []
    let objText = "# vertices \n"
    const vertexIndexMap: { [key: string]: number } = {}

    for (let i = 0; i < this.tiles.length; i++) {
      const t = this.tiles[i]

      const F: number[] = []
      for (let j = 0; j < t.boundary.length; j++) {
        let index = vertexIndexMap[t.boundary[j].toString()]
        if (index === undefined) {
          objV.push(t.boundary[j])
          index = objV.length
          vertexIndexMap[t.boundary[j].toString()] = index
        }
        F.push(index)
      }

      objF.push(F)
    }

    for (let i = 0; i < objV.length; i++) {
      objText += `v ${objV[i].x} ${objV[i].y} ${objV[i].z}\n`
    }

    objText += "\n# faces\n"
    for (let i = 0; i < objF.length; i++) {
      let faceString = "f"
      for (let j = 0; j < objF[i].length; j++) {
        faceString = `${faceString} ${objF[i][j]}`
      }
      objText += `${faceString}\n`
    }

    return objText
  }
}
