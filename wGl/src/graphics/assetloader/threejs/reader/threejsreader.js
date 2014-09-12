// Copyright (C) 2014 Arturo Mayorga
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy 
// of this software and associated documentation files (the "Software"), to deal 
// in the Software without restriction, including without limitation the rights 
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
// copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
// SOFTWARE.


// JSON Model format
// 
// Type bitmask
// 
// 00 00 00 00 = TRIANGLE
// 00 00 00 01 = QUAD
// 00 00 00 10 = FACE_MATERIAL
// 00 00 01 00 = FACE_UV
// 00 00 10 00 = FACE_VERTEX_UV
// 00 01 00 00 = FACE_NORMAL
// 00 10 00 00 = FACE_VERTEX_NORMAL
// 01 00 00 00 = FACE_COLOR
// 10 00 00 00 = FACE_VERTEX_COLOR
// 
// 0: 0 = triangle (3 indices), 1 = quad (4 indices)
// 1: 0 = no face material, 1 = face material (1 index)
// 2: 0 = no face uvs, 1 = face uvs (1 index)
// 3: 0 = no face vertex uvs, 1 = face vertex uvs (3 indices or 4 indices)
// 4: 0 = no face normal, 1 = face normal (1 index)
// 5: 0 = no face vertex normals, 1 = face vertex normals (3 indices or 4 indices)
// 6: 0 = no face color, 1 = face color (1 index)
// 7: 0 = no face vertex colors, 1 = face vertex colors (3 indices or 4 indices)
// 
// Skinning is the result of three properties, influencesPerVertex, skinIndices,
// and skinWeights. The value influencesPerVertex will determine the number of 
// elements in the other two. For every vertex, there should be an appropriate 
// number of entries in skinIndices where the value is the index of the bone 
// which is influencing the vertex. If there are 2 influences per vertex, 
// index 0 and 1 of skinIndices and skinWeights will be applied to vertex 0, 
// 2 and 3 will be applied to vertex 1, etc.
// 
// Examples
// {
//     "metadata": { "formatVersion" : 3 },    
// 
//     "materials": [ {
//         "DbgColor" : 15658734, // => 0xeeeeee
//         "DbgIndex" : 0,
//         "DbgName" : "dummy",
//         "colorDiffuse" : [ 1, 0, 0 ],
//     } ],
// 
//     "vertices": [ 0,0,0, 0,0,1, 1,0,1, 1,0,0, ... ],
//     "normals":  [ 0,1,0, ... ],
//     "colors":   [ 1,0,0, 0,1,0, 0,0,1, 1,1,0, ... ],
//     "uvs":      [ [ 0,0, 0,1, 1,0, 1,1 ], ... ],
// 
//     "faces": [ 
// 
//         // triangle
//         // 00 00 00 00 = 0
//         // 0, [vertex_index, vertex_index, vertex_index]
//         0, 0,1,2,
// 
//         // quad
//         // 00 00 00 01 = 1
//         // 1, [vertex_index, vertex_index, vertex_index, vertex_index]
//         1, 0,1,2,3,
// 
//         // triangle with material
//         // 00 00 00 10 = 2
//         // 2, [vertex_index, vertex_index, vertex_index],
//         // [material_index]
//         2, 0,1,2, 0,
// 
//         // triangle with material, vertex uvs and face normal
//         // 00 10 01 10 = 38
//         // 38, [vertex_index, vertex_index, vertex_index],
//         // [material_index],
//         // [vertex_uv, vertex_uv, vertex_uv],
//         // [face_normal]
//         38, 0,1,2, 0, 0,1,2, 0,
// 
//         // triangle with material, vertex uvs and vertex normals
//         // 00 10 10 10 = 42
//         // 42, [vertex_index, vertex_index, vertex_index],
//         // [material_index],
//         // [vertex_uv, vertex_uv, vertex_uv],
//         // [vertex_normal, vertex_normal, vertex_normal]
//         42, 0,1,2, 0, 0,1,2, 0,1,2,
// 
//         // quad with everything
//         // 11 11 11 11 = 255
//         // 255, [vertex_index, vertex_index, vertex_index, vertex_index],
//         //  [material_index],
//         //  [face_uv],
//         //  [face_vertex_uv, face_vertex_uv, face_vertex_uv, face_vertex_uv],
//         //  [face_normal],
//         //  [face_vertex_normal, face_vertex_normal,
//         //   face_vertex_normal, face_vertex_normal],
//         //  [face_color]
//         //  [face_vertex_color, face_vertex_color,
//         //   face_vertex_color, face_vertex_color],
//         255, 0,1,2,3, 0, 0, 0,1,2,3, 0, 0,1,2,3, 0, 0,1,2,3,
//     ]
// }

/**
 * @interface
 */
function ThreejsReaderObserver () {}

/**
 * This function is called whenever a new GeometryTriMesh object is loaded
 * @param {GeometryTriMesh} New mesh that was just made available
 * @param {GeometrySkin} Skin complementing the mesh
 */
ThreejsReaderObserver.prototype.onNewMeshAvailable = function ( mesh, skin ) {};

/**
 * @constructor
 * @param {string} Path to the location of this obj file's resources
 * @param {Object} Lines of the obj file
 * @param {GScene} Target scene for the loading process
 * @param {GGroup} Target group for the loading process
 * @param {ThreejsReaderObserver} Observer to the loading process
 */
function ThreejsReader( path, json, scene, group, observer )
{
	/**
	 * @struct
	 */
	this.IndexRecord = function( string )
	{
		var tokens = string.split("/");
		this.vertIdx = parseFloat(tokens[0])-1;
		this.textIdx = parseFloat(tokens[1])-1;
		this.normIdx = parseFloat(tokens[2])-1;			
	};

	
	this.scene = scene;
	this.group = group;
	this.path = path;
	this.json = json;
	this.observer = observer;

	this.pIdx = 0;
	
	this.groupMap = {};
	
	
	this.isLoadComplete = false;
	this.updateIndex = 0;
	this.polyCount = 0;
	
	this.currentMesh = new GeometryTriMesh( "name" );
	this.currentSkin = new GeometrySkin();
	this.currentIndex = 0;
	
	this.totalProgress = 0;
	
	/**
	 * @struct
	 */
	 this.BITMASK = 
	 {
	     TRIANGLE:             0,
	     QUAD:                 1,
	     FACE_MATERIAL:        2,
	     FACE_UV:              4,
	     FACE_VERTEX_UV:       8,
	     FACE_NORMAL:         16,
	     FACE_VERTEX_NORMAL:  32,
	     FACE_COLOR:          64,
	     FACE_VERTEX_COLOR:  128
     };
}

/**
 * Returns true if the reader is done 
 * @return {boolean}
 */
ThreejsReader.prototype.isComplete = function()
{
    return this.isLoadComplete;
};

/**
 * Get the current progress value
 * @return {number} Total progress
 */
ThreejsReader.prototype.getProgress = function()
{
    return this.totalProgress;
};

/**
 * Advance through the loading process
 * @param {number} Milliseconds since the last update
 */
ThreejsReader.prototype.update = function (time)
{
    if ( this.isLoadComplete ) return;
    
    if ( this.pIdx < this.json['faces'].length )
    {
        var bitField = this.json['faces'][this.pIdx];
        ++this.pIdx;
        if ( bitField & this.BITMASK.QUAD )
        {
            this.processQuad( bitField );
        }
        else
        {
            this.processTri( bitField );
        }
        
        this.totalProgress = this.pIdx / this.json['faces'].length;
    }
    else
    {
        this.isLoadComplete = true;
        this.totalProgress = 1;
        this.observer.onNewMeshAvailable( this.currentMesh, this.currentSkin );
        // console.debug("Loaded " + this.polyCount + " polygons in 1 object.");
    }
};

/**
 * Populates an out vector with the vertex at the requested index
 * @param {number} index to get the vector value from
 * @param {Array.<number>} out vector
 */
ThreejsReader.prototype.getVertexAtIndex = function ( idx, outV )
{
    var len = this.json['vertices'].length;
    
    if ( idx*3 + 2 > len )
    {
        outV[0] = outV[1] = outV[2] = 0;
        return;
    }
    
    outV[0] = this.json['vertices'][ idx*3 + 0 ];
    outV[1] = this.json['vertices'][ idx*3 + 1 ];
    outV[2] = this.json['vertices'][ idx*3 + 2 ];
};

/**
 * Populates an out vector with the normal at the requested index
 * @param {number} index to get the vector value from
 * @param {Array.<number>} out vector
 */
ThreejsReader.prototype.getNormalAtIndex = function ( idx, outV )
{
    var len = this.json['normals'].length;
	
	if ( idx*3 + 2 > len )
	{
		outV[0] = outV[1] = outV[2] = 0;
		return;
	}
	
	outV[0] = this.json['normals'][ idx*3 + 0 ];
	outV[1] = this.json['normals'][ idx*3 + 1 ];
	outV[2] = this.json['normals'][ idx*3 + 2 ];
};

/**
 * Populates an out vector with the color at the requested index
 * @param {number} index to get the vector value from
 * @param {Array.<number>} out vector
 */
ThreejsReader.prototype.getColorAtIndex = function ( idx, outV )
{
    var len = this.json['colors'].length;
	
	if ( idx*3 + 2 > len )
	{
		outV[0] = outV[1] = outV[2] = 0;
		return;
	}
	
	outV[0] = this.json['colors'][ idx*3 + 0 ];
	outV[1] = this.json['colors'][ idx*3 + 1 ];
	outV[2] = this.json['colors'][ idx*3 + 2 ];
};

/**
 * Populates an out vector with the skin information
 * @param {number} index to get the vector value from
 * @param {Array.<number>} out vector
 */
ThreejsReader.prototype.getSkinAtIndex = function ( idx, outV )
{
    var lenI = this.json['skinIndices'].length;
    var lenW = this.json['skinWeights'].length;
    
    outV[0] = outV[1] = outV[2] = outV[3] = 0;
    
    if ( idx*2 + 1 <= lenI )
    {
        outV[0] = this.json['skinIndices'][ idx*2 + 0 ];
        outV[1] = this.json['skinIndices'][ idx*2 + 1 ];
    }
    
    if ( idx*2 + 1 <= lenW )
    {
        outV[2] = this.json['skinWeights'][ idx*2 + 0 ];
        outV[3] = this.json['skinWeights'][ idx*2 + 1 ];
    }
};

/**
 * process a quad face
 * @param {number} bit field for this face
 */
ThreejsReader.prototype.processQuad = function ( bitField )
{
    this.polyCount += 2;
	
    var skin = [ [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0] ];
	var vert = [ [0,0,0],[0,0,0],[0,0,0],[0,0,0] ];
	var norm = [ [0,0,0],[0,0,0],[0,0,0],[0,0,0] ];
	var vtex = [ [0,0],[0,0],[0,0],[0,0] ];
	
	// verts go first
	for ( var i = 0; i < 4; ++i )
	{
	    this.getVertexAtIndex( this.json['faces'][this.pIdx + i], vert[i] );
	    this.getSkinAtIndex( this.json['faces'][this.pIdx + i], skin[i] );
	}
	this.pIdx += 4;
	
	if ( bitField & this.BITMASK.FACE_MATERIAL )
	{
		this.pIdx += 1;
	}
	if ( bitField & this.BITMASK.FACE_UV ) 
	{
		this.pIdx += 1;
	}
	if ( bitField & this.BITMASK.FACE_VERTEX_UV )
	{
		this.pIdx += 4;
	}
	if ( bitField & this.BITMASK.FACE_NORMAL )
	{
		this.pIdx += 1;
	}
	if ( bitField & this.BITMASK.FACE_VERTEX_NORMAL )
	{
		for ( var i = 0; i < 4; ++i )
        {
            this.getNormalAtIndex( this.json['faces'][this.pIdx + i], norm[i] );
        }
		this.pIdx += 4;
	}
	if ( bitField & this.BITMASK.FACE_COLOR )
	{
		this.pIdx += 1;
	}
	if ( bitField & this.BITMASK.FACE_VERTEX_COLOR )
	{
		this.pIdx += 4;
	}
	
	for ( var i = 0; i < 3; ++i )
	{
		this.currentMesh.gVerts.push(vert[i]);
		this.currentMesh.nVerts.push(norm[i]);
		this.currentMesh.tVerts.push(vtex[i]);
		this.currentMesh.indices.push(this.currentIndex++);
		
		this.currentSkin.sVerts.push(skin[i]);
	}
	
	for ( var i = 2; i < 5; ++i )
	{
		this.currentMesh.gVerts.push(vert[i%4]);
		this.currentMesh.nVerts.push(norm[i%4]);
		this.currentMesh.tVerts.push(vtex[i%4]);
		this.currentMesh.indices.push(this.currentIndex++);
		
		this.currentSkin.sVerts.push(skin[i%4]);
	}
};
 
/**
 * process a tri face
 * @param {number} bit field for this face
 */
ThreejsReader.prototype.processTri = function ( bitField )
{
    this.polyCount += 1;
	
	var vert = [ [0,0,0],[0,0,0],[0,0,0] ];
	var norm = [ [0,0,0],[0,0,0],[0,0,0] ];
	var vtex = [ [0,0],[0,0],[0,0] ];
	
	// verts go first
	this.pIdx += 3;
	
	if ( bitField & this.BITMASK.FACE_MATERIAL )
	{
		this.pIdx += 1;
	}
	if ( bitField & this.BITMASK.FACE_UV ) 
	{
		this.pIdx += 1;
	}
	if ( bitField & this.BITMASK.FACE_VERTEX_UV )
	{
		this.pIdx += 3;
	}
	if ( bitField & this.BITMASK.FACE_NORMAL )
	{
		this.pIdx += 1;
	}
	if ( bitField & this.BITMASK.FACE_VERTEX_NORMAL )
	{
		this.pIdx += 3;
	}
	if ( bitField & this.BITMASK.FACE_COLOR )
	{
		this.pIdx += 1;
	}
	if ( bitField & this.BITMASK.FACE_VERTEX_COLOR )
	{
		this.pIdx += 4;
	}
	
	for ( var i = 0; i < 3; ++i )
	{
		this.currentMesh.gVerts.push(vert[i]);
		this.currentMesh.nVerts.push(norm[i]);
		this.currentMesh.tVerts.push(vtex[i]);
		this.currentMesh.indices.push(this.currentIndex++);
	} 
};
