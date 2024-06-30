"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const face_1 = __importDefault(require("./face"));
const point_1 = __importDefault(require("./point"));
const tile_1 = __importDefault(require("./tile"));
class Hexasphere {
    constructor(radius, numDivisions, hexSize) {
        this.radius = radius;
        const tao = 1.61803399;
        const corners = [
            new point_1.default(1000, tao * 1000, 0),
            new point_1.default(-1000, tao * 1000, 0),
            new point_1.default(1000, -tao * 1000, 0),
            new point_1.default(-1000, -tao * 1000, 0),
            new point_1.default(0, 1000, tao * 1000),
            new point_1.default(0, -1000, tao * 1000),
            new point_1.default(0, 1000, -tao * 1000),
            new point_1.default(0, -1000, -tao * 1000),
            new point_1.default(tao * 1000, 0, 1000),
            new point_1.default(-tao * 1000, 0, 1000),
            new point_1.default(tao * 1000, 0, -1000),
            new point_1.default(-tao * 1000, 0, -1000),
        ];
        const points = {};
        for (let i = 0; i < corners.length; i++) {
            points[corners[i].toString()] = corners[i];
        }
        const faces = [
            new face_1.default(corners[0], corners[1], corners[4], false),
            new face_1.default(corners[1], corners[9], corners[4], false),
            new face_1.default(corners[4], corners[9], corners[5], false),
            new face_1.default(corners[5], corners[9], corners[3], false),
            new face_1.default(corners[2], corners[3], corners[7], false),
            new face_1.default(corners[3], corners[2], corners[5], false),
            new face_1.default(corners[7], corners[10], corners[2], false),
            new face_1.default(corners[0], corners[8], corners[10], false),
            new face_1.default(corners[0], corners[4], corners[8], false),
            new face_1.default(corners[8], corners[2], corners[10], false),
            new face_1.default(corners[8], corners[4], corners[5], false),
            new face_1.default(corners[8], corners[5], corners[2], false),
            new face_1.default(corners[1], corners[0], corners[6], false),
            new face_1.default(corners[11], corners[1], corners[6], false),
            new face_1.default(corners[3], corners[9], corners[11], false),
            new face_1.default(corners[6], corners[10], corners[7], false),
            new face_1.default(corners[3], corners[11], corners[7], false),
            new face_1.default(corners[11], corners[6], corners[7], false),
            new face_1.default(corners[6], corners[0], corners[10], false),
            new face_1.default(corners[9], corners[1], corners[11], false),
        ];
        const getPointIfExists = (point) => {
            if (points[point.toString()]) {
                return points[point.toString()];
            }
            else {
                points[point.toString()] = point;
                return point;
            }
        };
        const newFaces = [];
        for (let f = 0; f < faces.length; f++) {
            let prev = null;
            let bottom = [faces[f].points[0]];
            const left = faces[f].points[0].subdivide(faces[f].points[1], numDivisions, getPointIfExists);
            const right = faces[f].points[0].subdivide(faces[f].points[2], numDivisions, getPointIfExists);
            for (let i = 1; i <= numDivisions; i++) {
                prev = bottom;
                bottom = left[i].subdivide(right[i], i, getPointIfExists);
                for (let j = 0; j < i; j++) {
                    let nf = new face_1.default(prev[j], bottom[j], bottom[j + 1]);
                    newFaces.push(nf);
                    if (j > 0) {
                        nf = new face_1.default(prev[j - 1], prev[j], bottom[j]);
                        newFaces.push(nf);
                    }
                }
            }
        }
        const newPoints = {};
        for (const p in points) {
            const np = points[p].project(radius);
            newPoints[np.toString()] = np;
        }
        this.tiles = [];
        this.tileLookup = {};
        for (const p in newPoints) {
            const newTile = new tile_1.default(newPoints[p], hexSize);
            this.tiles.push(newTile);
            this.tileLookup[newTile.toString()] = newTile;
        }
        for (const t in this.tiles) {
            const _this = this;
            this.tiles[t].neighbors = this.tiles[t].neighborIds.map((item) => _this.tileLookup[item]);
        }
    }
    toJson() {
        return JSON.stringify({
            radius: this.radius,
            tiles: this.tiles.map((tile) => tile.toJson()),
        });
    }
    toObj() {
        const objV = [];
        const objF = [];
        let objText = "# vertices \n";
        const vertexIndexMap = {};
        for (let i = 0; i < this.tiles.length; i++) {
            const t = this.tiles[i];
            const F = [];
            for (let j = 0; j < t.boundary.length; j++) {
                let index = vertexIndexMap[t.boundary[j].toString()];
                if (index === undefined) {
                    objV.push(t.boundary[j]);
                    index = objV.length;
                    vertexIndexMap[t.boundary[j].toString()] = index;
                }
                F.push(index);
            }
            objF.push(F);
        }
        for (let i = 0; i < objV.length; i++) {
            objText += `v ${objV[i].x} ${objV[i].y} ${objV[i].z}\n`;
        }
        objText += "\n# faces\n";
        for (let i = 0; i < objF.length; i++) {
            let faceString = "f";
            for (let j = 0; j < objF[i].length; j++) {
                faceString = `${faceString} ${objF[i][j]}`;
            }
            objText += `${faceString}\n`;
        }
        return objText;
    }
}
exports.default = Hexasphere;
