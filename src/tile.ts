import Face from "./face"
import Point from "./point"

function vector(p1: Point, p2: Point) {
  return {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
    z: p2.z - p1.z,
  }
}

function calculateSurfaceNormal(p1: Point, p2: Point, p3: Point) {
  const U = vector(p1, p2)
  const V = vector(p1, p3)

  return {
    x: U.y * V.z - U.z * V.y,
    y: U.z * V.x - U.x * V.z,
    z: U.x * V.y - U.y * V.x,
  }
}

function pointingAwayFromOrigin(p: Point, v: Point) {
  return p.x * v.x >= 0 && p.y * v.y >= 0 && p.z * v.z >= 0
}

function normalizeVector(v: Point) {
  const m = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)

  return {
    x: v.x / m,
    y: v.y / m,
    z: v.z / m,
  }
}

export default class Tile {
  centerPoint: Point
  faces: Face[]
  boundary: Point[]
  neighborIds: string[]
  neighbors: Tile[]

  constructor(centerPoint: Point, hexSize: number) {
    if (hexSize === undefined) {
      hexSize = 1
    }

    hexSize = Math.max(0.01, Math.min(1.0, hexSize))

    this.centerPoint = centerPoint
    this.faces = centerPoint.getOrderedFaces()
    this.boundary = []
    this.neighborIds = []
    this.neighbors = []

    const neighborHash: { [key: string]: number } = {}
    for (let f = 0; f < this.faces.length; f++) {
      this.boundary.push(
        this.faces[f].getCentroid().segment(this.centerPoint, hexSize),
      )

      const otherPoints = this.faces[f].getOtherPoints(this.centerPoint)
      for (let o = 0; o < 2; o++) {
        neighborHash[otherPoints[o].toString()] = 1
      }
    }

    this.neighborIds = Object.keys(neighborHash)

    const normal = calculateSurfaceNormal(
      this.boundary[1],
      this.boundary[2],
      this.boundary[3],
    )

    if (!pointingAwayFromOrigin(this.centerPoint, normal as Point)) {
      this.boundary.reverse()
    }
  }

  getLatLon(radius: number, boundaryNum: number) {
    let point = this.centerPoint
    if (typeof boundaryNum === "number" && boundaryNum < this.boundary.length) {
      point = this.boundary[boundaryNum]
    }
    const phi = Math.acos(point.y / radius)
    const theta =
      ((Math.atan2(point.x, point.z) + Math.PI + Math.PI / 2) % (Math.PI * 2)) -
      Math.PI
    return {
      lat: (180 * phi) / Math.PI - 90,
      lon: (180 * theta) / Math.PI,
    }
  }

  scaledBoundary(scale: number) {
    scale = Math.max(0, Math.min(1, scale))

    const ret = []
    for (let i = 0; i < this.boundary.length; i++) {
      ret.push(this.centerPoint.segment(this.boundary[i], 1 - scale))
    }

    return ret
  }

  toJson() {
    return {
      centerPoint: this.centerPoint.toJson(),
      boundary: this.boundary.map((point) => point.toJson()),
    }
  }
}
