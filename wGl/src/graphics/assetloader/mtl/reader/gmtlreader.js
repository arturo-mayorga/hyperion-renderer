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
 * @param {Array.<string> Contents of the mtl file.  Each element is a new line
 * @param {string} Path to the location of the mtl resources
 */
function GMtlReader( mtlStrA, path )
{
	this.path = path;
	this.materials = {};
	this.currentMtl = undefined;
	
	var lineHandlerMap = 
	{
		"#":        this.process_comment,
		"newmtl":   this.process_newmtl,
		"ka":       this.process_ka,
		"Ka":       this.process_ka,
		"kd":       this.process_kd,
		"Kd":       this.process_kd,
		"ks":       this.process_ks,
		"Ks":       this.process_ks,
		"map_kd":   this.process_mapKd,
		"map_bump": this.process_mapBump,
		"bump":     this.process_mapBump
	};

	var size = mtlStrA.length;
	for ( var i = 0; i < size; ++i )
	{
		var stra = mtlStrA[i].split(" ");
		
		var key = stra[0].toLowerCase();
		
		this.handler = lineHandlerMap[key];
		if (this.handler != undefined)
		{
			this.handler(stra);
		}
		else
		{
			//console.debug("Cant handle [" + mtlStrA[i] + "]");
		}
	}
	
	//console.debug("Loaded " + Object.keys(this.materials).length + " materials.");
}

/**
 * Get the materials after they are loaded
 * @return {Object} A map containing GMaterial instances (hashed by their material name.
 */
GMtlReader.prototype.getMaterials = function()
{
	return this.materials;
};

/**
 * Called when processing a comment (line starting with '#')
 * @param {Array.<string>} Current line (tokenized).
 */
GMtlReader.prototype.process_comment = function ( lineA ){};

/**
 * Called when processing a new material (line starting with 'newmtl')
 * @param {Array.<string>} Current line (tokenized).
 */
GMtlReader.prototype.process_newmtl = function ( lineA )
{
	this.currentMtl = new GMaterial( lineA[1] );
	this.materials[lineA[1]] = this.currentMtl;
};

/**
 * Called when processing an ambient color property (line starting with 'ka')
 * @param {Array.<string>} Current line (tokenized).
 */
GMtlReader.prototype.process_ka = function( lineA )
{
	this.currentMtl.setKa( [parseFloat(lineA[1]),
							parseFloat(lineA[2]),
							parseFloat(lineA[3])] );
};

/**
 * Called when processing a diffuse color property (line starting with 'kd')
 * @param {Array.<string>} Current line (tokenized).
 */
GMtlReader.prototype.process_kd = function( lineA )
{
	this.currentMtl.setKd( [parseFloat(lineA[1]),
							parseFloat(lineA[2]),
							parseFloat(lineA[3])] );
};

/**
 * Called when processing a specular color (line starting with 'ks')
 * @param {Array.<string>} Current line (tokenized).
 */
GMtlReader.prototype.process_ks = function( lineA )
{
	this.currentMtl.setKs( [parseFloat(lineA[1]),
							parseFloat(lineA[2]),
							parseFloat(lineA[3])] );
};

/**
 * Called when processing a diffuse color texture (line starting with 'map_kd')
 * @param {Array.<string>} Current line (tokenized).
 */
GMtlReader.prototype.process_mapKd = function( lineA )
{
	var texArgs = [];
	
	for (var i = 1; i < lineA.length; ++i)
	{
		texArgs.push(lineA[i]);
	}
	
	var texture = new GTexture(texArgs, this.path);
	
	this.currentMtl.setMapKd(texture);
};

/**
 * Called when processing a bump map texture (line starting with '[map_]bump')
 * @param {Array.<string>} Current line (tokenized).
 */
GMtlReader.prototype.process_mapBump = function( lineA )
{
	var texArgs = [];
	
	for (var i = 1; i < lineA.length; ++i)
	{
		texArgs.push(lineA[i]);
	}
	
	var texture = new GTexture(texArgs, this.path);
	
	this.currentMtl.setMapBump(texture);
};
