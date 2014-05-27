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
function ThreejsReaderObserver () {}

/**
 * This function is called whenever a new GeometryTriMesh object is loaded
 * @param {GeometryTriMesh} New object that was just made available
 */
ThreejsReaderObserver.prototype.onNewMeshAvailable = function ( mesh ) {};

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
	}

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
	
}

/**
 * Returns true if the reader is done 
 * @return {boolean}
 */
ThreejsReader.prototype.isComplete = function()
{
    return false;
};

/**
 * Advance through the loading process
 * @param {number} Milliseconds since the last update
 */
ThreejsReader.prototype.update = function (time)
{
};
 
