var getNormals = require('polyline-normals');
var VERTS_PER_POINT = 2;

export default class LineMeshGeometry extends THREE.BufferGeometry {
    constructor(path, opt){
        super();
        opt = opt || {};

        this.addAttribute('position', new THREE.BufferAttribute(null, 3));
        this.addAttribute('lineNormal', new THREE.BufferAttribute(null, 2));
        this.addAttribute('lineMiter', new THREE.BufferAttribute(null, 1));
        if (opt.distances) {
            this.addAttribute('lineDistance', new THREE.BufferAttribute(null, 1));
        }
        if (typeof this.setIndex === 'function') {
            this.setIndex(new THREE.BufferAttribute(null, 1));
        } else {
            this.addAttribute('index', new THREE.BufferAttribute(null, 1));
        }

        this.updatePath(path)
    }
    updatePath(path, closed = false){
        path = path || [];
        var normals = getNormals(path, closed);
        
        if (closed) {
            path = path.slice();
            path.push(path[0]);
            normals.push(normals[0]);
        }

        var attrPosition = this.getAttribute('position');
        var attrNormal = this.getAttribute('lineNormal');
        var attrMiter = this.getAttribute('lineMiter');
        var attrDistance = this.getAttribute('lineDistance');
        var attrIndex = typeof this.getIndex === 'function' ? this.getIndex() : this.getAttribute('index');

        if (!attrPosition.array || (path.length !== attrPosition.array.length / 3 / VERTS_PER_POINT)) {
            var count = path.length * VERTS_PER_POINT;
            var count = path.length * VERTS_PER_POINT;
            attrPosition.array = new Float32Array(count * 3);
            attrNormal.array = new Float32Array(count * 2);
            attrMiter.array = new Float32Array(count);
            attrIndex.array = new Uint16Array(Math.max(0, (path.length - 1) * 6));

            if (attrDistance) {
                attrDistance.array = new Float32Array(count);
            }
        }



        var index = 0;
        var c = 0;
        var dIndex = 0;
        var indexArray = attrIndex.array;

        path.forEach(function (point, pointIndex, list) {
            var i = index;
            indexArray[c++] = i + 0;
            indexArray[c++] = i + 1;
            indexArray[c++] = i + 2;
            indexArray[c++] = i + 2;
            indexArray[c++] = i + 1;
            indexArray[c++] = i + 3;

            attrPosition.setXYZ(index++, point[0], point[1], 0);
            attrPosition.setXYZ(index++, point[0], point[1], 0);

            if (attrDistance) {
                var d = pointIndex / (list.length - 1);
                attrDistance.setX(dIndex++, d);
                attrDistance.setX(dIndex++, d);
            }
        });

        var nIndex = 0;
        var mIndex = 0;
        normals.forEach(function (n) {
            var norm = n[0];
            var miter = n[1];
            attrNormal.setXY(nIndex++, norm[0], norm[1]);
            attrNormal.setXY(nIndex++, norm[0], norm[1]);

            miter = Math.min(miter, 2)
            attrMiter.setX(mIndex++, -miter);
            attrMiter.setX(mIndex++, miter);
        });

        attrPosition.needsUpdate = true;
        attrNormal.needsUpdate = true;
        attrMiter.needsUpdate = true;
        if (attrDistance) {
            attrDistance.needsUpdate = true;
        }
        attrIndex.needsUpdate = true;
    }
}