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
 * @constructor
 * @param {string} Name of this geometry instance
 */
function GeometryTriMesh(name)
{
	this.name = name;
	this.matName = "";
	
	this.gVerts = [];
	this.nVerts = [];
	this.tVerts = [];
	this.indices = [];
}

/**
 * merge the provided mesh to this merge
 * @param {GeometryTriMesh} the mesh containing the new geometry
 */
GeometryTriMesh.prototype.merge = function( mesh )
{
	var prevIdxLen = this.indices.length;
	var newIdxLen = mesh.indices.length;
	
	this.gVerts = this.gVerts.concat( mesh.gVerts );
	this.nVerts = this.nVerts.concat( mesh.nVerts );
	this.tVerts = this.tVerts.concat( mesh.tVerts );
	
	for ( var i = 0; i < newIdxLen; ++i )
	{
		this.indices.push( i + prevIdxLen );
	}
};
	
/**
 * Sets the material name for this instance
 * @param {string} New name for this instance
 */
GeometryTriMesh.prototype.setMtlName = function( matName )
{
	this.matName = matName;
};

/**
 * Returns the material name for this instance
 * @return {string} The current name for this instance
 */
GeometryTriMesh.prototype.getMtlName = function()
{
	return this.matName;
};

/**
 * Returns the name of this instance
 * @return {string} Instance name
 */
GeometryTriMesh.prototype.getName = function()
{
	return this.name;
};

/**
 * Returns the texture vertex buffer
 * @return {Array.<number>} Buffer with texture vertex values
 */
GeometryTriMesh.prototype.getTVerBuffer = function()
{
	var len = this.gVerts.length;
	var ret = [];
	for (var i = 0; i < len; ++i)
	{
		var _this = this.tVerts[i];
		if ( _this != undefined )
		{
			for( var j = 0; j < 2; ++j)
			{
				ret.push(_this[j]); 
			}
		}
		else
		{
			ret.push(0);
		}
	}
	
	return ret;
};

/**
 * Returns the vertex buffer
 * @return {Array.<number>} Buffer with vertex values.
 */
GeometryTriMesh.prototype.getVertBuffer = function()
{
	var len = this.gVerts.length;
	var ret = [];
	for (var i = 0; i < len; ++i)
	{
		var _this = this.gVerts[i];
		for( var j = 0; j < 3; ++j)
		{
			ret.push(_this[j]); 
		}
	}
	
	return ret;
};

/**
 * Returns the normals buffer
 * @return {Array.<number>} Buffer with normal values.
 */
GeometryTriMesh.prototype.getNormBuffer = function()
{
	var len = this.nVerts.length;
	var ret = [];
	for (var i = 0; i < len; ++i)
	{
		var _this = this.nVerts[i];
		for (var j = 0; j < 3; ++j)
		{
			ret.push(_this[j]);
		}
	}
	
	return ret;
};
