export default class CustomGeometry extends THREE.BufferGeometry {
    constructor() {
        super();

        this.xSize = 20; //width/50 ;
        this.ySize = 20; //height/50;
        this.zSize = 20;
        this.ring = (this.xSize + this.zSize) * 2;

        var cornerVertices = 8;
        var edgeVertices = (this.xSize + this.ySize + this.zSize - 3) * 4;
        var faceVertices = 2 * ( (this.xSize - 1) * (this.ySize - 1) + (this.ySize - 1) * (this.zSize - 1) + (this.zSize - 1) * (this.xSize - 1) );
        var verticesLength = cornerVertices + edgeVertices + faceVertices;

        var vertices = []; //new Float32Array( verticesLength * 3 );
        this.vertexArray = [];
        this.nomalizeArray = [];

        var vv = 0;
        var xx, zz, yy;

        for (yy = 0; yy <= this.ySize; yy++) {
            for (xx = 0; xx <= this.xSize; xx++) vv = this.setVertex( vv, vertices, xx, yy, 0);

            // -------------

            for (zz = 1; zz <= this.zSize; zz++) vv = this.setVertex(vv, vertices, this.xSize, yy, zz);

            // -------------

            for (xx = this.xSize - 1; xx >= 0; xx--) vv = this.setVertex(vv, vertices, xx, yy, this.zSize);

            // -------------

            for (zz = this.zSize - 1; zz > 0; zz--) vv = this.setVertex(vv, vertices, 0, yy, zz);
        }

        for(zz = 1; zz < this.zSize; zz++)
            for( xx = 1; xx < this.xSize; xx++)
                vv = this.setVertex(vv, vertices, xx, this.ySize, zz);

        for(zz = 1; zz < this.zSize; zz++)
            for( xx = 1; xx < this.xSize; xx++)
                vv = this.setVertex(vv, vertices, xx, 0, zz);

        vertices = new Float32Array(vertices);
        this.vertices = vertices;

        //this.verticesAttribute = new THREE.BufferAttribute(vertices, 3);
        //this.addAttribute('position', this.verticesAttribute);


        var indices = [];
        var indexNum = 0;

        var ind = 0;

        for(var yy = 0; yy < this.ySize; yy++) {
            for (var ii = 0; ii < this.ring - 1; ii++) {
                indexNum = CustomGeometry.setQuad(indices, indexNum, ind, ind + 1, ind + this.ring, ind + this.ring + 1);
                ind++;
            }

            indexNum = CustomGeometry.setQuad(indices, indexNum,  ind, ind - this.ring + 1, ind + this.ring, ind +  1 );
            ind++;
        }

        indexNum = this.createTopRings( indices, indexNum, this.ring );
        indexNum = this.createBottomFace( indices, indexNum, this.ring );

        indices = new Uint32Array(indices);
        this.setIndex( new THREE.BufferAttribute( indices, 1 ) );
        this.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

        this.computeFaceNormals();
        this.computeVertexNormals();    // requires correct face normals
    }

    setVertex( vv, vertices, xx, yy, zz ){
        var vertex = new THREE.Vector3(xx, yy, zz);
        var inner = new THREE.Vector3(xx, yy, zz);
        this.vertexArray.push(vertex);


        var roundness = 8;
        if (xx < roundness) {
            inner.x = roundness;
        }
        else if (xx > this.xSize - roundness) {
            inner.x = this.xSize - roundness;
        }

        if (yy < roundness) {
            inner.y = roundness;
        }
        else if (yy > this.ySize - roundness) {
            inner.y = this.ySize - roundness;
        }

        if (zz < roundness) {
            inner.z = roundness;
        }
        else if (zz > this.zSize - roundness) {
            inner.z = this.zSize - roundness;
        }

        var normal = new THREE.Vector3(
            vertex.x - inner.x,
            vertex.y - inner.y,
            vertex.z - inner.z
        ).normalize();

        //if(normal.x > 0){
        //    console.log(normal);
        //}

        vertices[vv]   = inner.x + normal.x * roundness;
        vertices[vv+1] = inner.y + normal.y * roundness;
        vertices[vv+2] = inner.z + normal.z * roundness;


        return vv + 3
    }

    createTopRings( indices, indexNum, ring ){
        var v = this.ring * this.ySize;
        for(var xx = 0; xx < this.xSize - 1; xx++, v++){
            indexNum  = CustomGeometry.setQuad(indices, indexNum, v, v + 1, v + ring - 1, v + ring);
        }

        indexNum  = CustomGeometry.setQuad(indices, indexNum, v, v + 1, v + ring - 1, v + 2);

        var vMin = ring * (this.ySize + 1) - 1;
        var vMid = vMin + 1;
        var vMax = v + 2;


        for (var z = 1; z < this.zSize - 1; z++, vMin--, vMid++, vMax++){
            indexNum = CustomGeometry.setQuad(indices, indexNum, vMin, vMid, vMin - 1, vMid + this.xSize - 1);
            for (var x = 1; x < this.xSize - 1; x++, vMid++) {
                indexNum = CustomGeometry.setQuad(indices, indexNum, vMid, vMid + 1, vMid + this.xSize - 1, vMid + this.xSize);
            }
            indexNum = CustomGeometry.setQuad(indices, indexNum, vMid, vMax, vMid + this.xSize - 1, vMax + 1);
        }

        var vTop = vMin - 2;
        indexNum = CustomGeometry.setQuad(indices, indexNum, vMin, vMid, vMin - 1, vMin - 2);

        for (var x = 1; x < this.xSize - 1; x++, vTop--, vMid++) {
            indexNum = CustomGeometry.setQuad(indices, indexNum, vMid, vMid + 1, vTop, vTop - 1);
        }

        indexNum = CustomGeometry.setQuad( indices, indexNum, vMid, vTop - 2, vTop, vTop - 1);

        return indexNum;
    }

    createBottomFace( indices, indexNum, ring ){
        var v = 1;
        var vMid = this.vertices.length /3- (this.xSize - 1) * (this.zSize - 1);

        indexNum = CustomGeometry.setQuad(indices, indexNum, ring - 1, vMid, 0, 1);
        for (var x = 1; x < this.xSize - 1; x++, v++, vMid++) {
            indexNum = CustomGeometry.setQuad(indices, indexNum, vMid, vMid + 1, v, v + 1);
        }
        indexNum = CustomGeometry.setQuad(indices, indexNum, vMid, v + 2, v, v + 1);


        var vMin = ring - 2;
        vMid -= this.xSize - 2;
        var vMax = v + 2;

        for (var z = 1; z < this.zSize - 1; z++, vMin--, vMid++, vMax++) {
            indexNum = CustomGeometry.setQuad(indices, indexNum, vMin, vMid + this.xSize - 1, vMin + 1, vMid);
            for (var x = 1; x < this.xSize - 1; x++, vMid++) {
                indexNum = CustomGeometry.setQuad( indices, indexNum, vMid + this.xSize - 1, vMid + this.xSize, vMid, vMid + 1);
            }
            indexNum = CustomGeometry.setQuad(indices, indexNum, vMid + this.xSize - 1, vMax + 1, vMid, vMax);
        }


        var vTop = vMin - 1;
        indexNum = CustomGeometry.setQuad(indices, indexNum, vTop + 1, vTop, vTop + 2, vMid);
        for (var x = 1; x < this.xSize - 1; x++, vTop--, vMid++) {
            indexNum = CustomGeometry.setQuad(indices, indexNum, vTop, vTop - 1, vMid, vMid + 1);
        }
        indexNum = CustomGeometry.setQuad(indices, indexNum, vTop, vTop - 1, vMid, vTop - 2);

        return indexNum;
    }

    static setQuad( indices, ii, v00, v10, v01, v11) {
        indices[ii] = v00;
        indices[ii + 1] = indices[ii + 4] = v01;
        indices[ii + 2] = indices[ii + 3] = v10;
        indices[ii + 5] = v11;
        return ii + 6;
    }

    updateLoop(dt) {
        /**
         this.triangles.forEach(function(triangle){
            triangle.updateLoop(dt, this.verticesAttribute);
        }.bind(this));
         this.verticesAttribute.needsUpdate = true;
         */
    }

}