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

/**
 * @interface
 */
function GObjReaderObserver () {}

/**
 * This function is called whenever a new GeometryTriMesh object is loaded
 * @param {GeometryTriMesh} New object that was just made available
 */
GObjReaderObserver.prototype.onNewMeshAvailable = function ( mesh ) {};

/**
 * @constructor
 * @param {string} Path to the location of this obj file's resources
 * @param {Array.<string>} Lines of the obj file
 * @param {GScene} Target scene for the loading process
 * @param {GGroup} Target group for the loading process
 * @param {GObjReaderObserver} Observer to the loading process
 */
function GObjReader( path, objStrA, scene, group, observer )
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

	this.objGVerts = [];
	this.objTVerts = [];
	this.objNormals = [];
	this.currentMesh = undefined;
	this.scene = scene;
	this.group = group;
	this.path = path;
	this.objStrA = objStrA;
	this.observer = observer;

	this.currentIndex = 0;
	
	this.groupMap = {};
	
	this.invertNormals = false;
	this.isLoadComplete = false;
	this.updateIndex = 0;
	this.polyCount = 0;
	
	this.lineHandlerMap = 
	{
		"#"      :this.process_comment,
		"o"      :this.process_group,
		"g"      :this.process_group,
		"v"      :this.process_vert,
		"vt"     :this.process_texVert,
		"vn"     :this.process_normal,
		"f"      :this.process_face,
		"mtllib" :this.process_mtllib,
		"usemtl" :this.process_usemtl,
		"invnv"  :this.process_invnv
	}
}

/**
 * Advance through the loading process
 * @param {number} Milliseconds since the last update
 */
GObjReader.prototype.update = function (time)
{
   
	
	if ( this.updateIndex < this.objStrA.length )
	{
		var stra = this.scrub(this.objStrA[this.updateIndex ].split(" "));
						
		if ( stra.length > 1 )
		{
			this.handler = this.lineHandlerMap[stra[0]];
			if (this.handler != undefined)
			{
				this.handler(stra);
			}
			else
			{
			   // console.debug("Cant handle [" + this.objStrA[this.updateIndex ] + "]");
			}
		}
		
		++this.updateIndex;
	}
	else
	{
		//console.debug("Loaded " + this.polyCount + " polygons in " + Object.keys(this.groupMap).length + " objects.");
		this.isLoadComplete = true;
	}
	
};
 
/** 
 * Remove unimportant tokens from the token array
 * @param {Array.<string>} Token array
 * @return {Array.<string>} Scrubbed token array
 */
GObjReader.prototype.scrub = function( stra )
{
	var len = stra.length;
	var ret = [];
	for (var i = 0; i < len; ++i)
	{
		if (stra[i] != "")
		{
			ret.push(stra[i]);
		}
	}
	return ret;
};

/**
 * This function is called while processing a comment line (starting with '#')
 * @param {Array.<string>} 
 */
GObjReader.prototype.process_comment = function( lineA ) {};

/**
 * This function is called while processing a group line (starting with 'o' or 'g')
 * @param {Array.<string>} 
 */
GObjReader.prototype.process_group = function(lineA)
{
	this.invertNormals = false;
	
	if ( this.currentMesh != undefined )
	{
		this.groupMap[this.currentMesh.getName()] = this.currentMesh;
		this.observer.onNewMeshAvailable(this.currentMesh);
	}
	
	this.currentVertIMap = {};
	this.currentTextIMap = {};
	
	var name = lineA[1];
	
	
	for (var i = 2; i < lineA.length; ++i)
	{
		name += " " + lineA[i];
	}
	
	while (this.groupMap[name] != undefined)
	{
		name += "_";
	}
	
	this.currentMesh = new GeometryTriMesh(name);
	this.currentIndex = 0;	
	
	//console.debug("adding group: " + name);
};

/**
 * This function is called while processing a vertex line (starting with 'v')
 * @param {Array.<string>} 
 */
GObjReader.prototype.process_vert = function( lineA )
{
	var vec = vec3.fromValues(parseFloat(lineA[1]),
							  parseFloat(lineA[2]),
							  parseFloat(lineA[3]));
	this.objGVerts.push(vec);
};

/**
 * This function is called while processing a texture vertex line (starting with 'tv')
 * @param {Array.<string>} 
 */
GObjReader.prototype.process_texVert = function( lineA )
{
	var vec = vec2.fromValues(parseFloat(lineA[1]),
							  parseFloat(lineA[2]));
							  
	this.objTVerts.push(vec);
};

/**
 * This function is called while processing a comment line (starting with 'vn')
 * @param {Array.<string>} 
 */
GObjReader.prototype.process_normal = function( lineA )
{
	var vec = vec3.fromValues(parseFloat(lineA[1]),
							  parseFloat(lineA[2]),
							  parseFloat(lineA[3]));
	this.objNormals.push(vec);
};

/**
 * This function is called while processing a face line (starting with 'f')
 * @param {Array.<string>} 
 */
GObjReader.prototype.process_face = function( lineA )
{
	++this.polyCount;
	for (var i = 1; i <= 3; ++i)
	{
		var idxs = new this.IndexRecord( lineA[i] );
		
		var vert = this.objGVerts[idxs.vertIdx];
		var norm = this.objNormals[idxs.normIdx];
		var vtex = this.objTVerts[idxs.textIdx];
		
		if (vtex === undefined)
		{
			vtex = [0,0];
		}
		
		if ( this.invertNormals )
		{
			var temp = norm;
			norm = vec3.create();
			norm[0] = -1*temp[0];
			norm[1] = -1*temp[1];
			norm[2] = -1*temp[2];
		}
		
		this.currentMesh.gVerts.push(vert);
		this.currentMesh.nVerts.push(norm);
		this.currentMesh.tVerts.push(vtex);
		this.currentMesh.indices.push(this.currentIndex++);
	}
};

/**
 * This function is called while processing a material line (starting with 'mtllib')
 * @param {Array.<string>} 
 */
GObjReader.prototype.process_mtllib = function( lineA )
{
	var ldr = new GMtlLoader(this.scene);
	ldr.loadMtl(this.path, lineA[1]);
};

/**
 * This function is called while processing a use material line (starting with 'usemtl')
 * @param {Array.<string>} 
 */
GObjReader.prototype.process_usemtl = function( lineA )
{
	this.currentMesh.setMtlName( lineA[1] );
};

/**
 * This function is called while processing a invert normals line (starting with 'invnv')
 * @param {Array.<string>} 
 */
GObjReader.prototype.process_invnv = function( lineA )
{
	this.invertNormals = true;
};
