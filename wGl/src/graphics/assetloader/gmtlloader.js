//	
// The MIT License
// 
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
 * @param {GScene}  Scene object that will receive the loaded GMaterial objects
 */
function GMtlLoader( scene_ )
{
    /**
     * @constructor
     * @param {Array.<string> Contents of the mtl file.  Each element is a new line
     * @param {string} Path to the location of the mtl resources
     */
	this.GMtlReader = function( mtlStrA, path )
	{
	    this.path = path;
		this.materials = {};
		this.currentMtl = undefined;
		
		var lineHandlerMap = 
		{
			"#":      this.process_comment,
			"newmtl": this.process_newmtl,
			"ka":     this.process_ka,
			"Ka":     this.process_ka,
			"kd":     this.process_kd,
			"Kd":     this.process_kd,
			"ks":     this.process_ks,
			"Ks":     this.process_ks,
			"map_kd": this.process_mapKd
		}
		
		
        var size = mtlStrA.length;
        for ( var i = 0; i < size; ++i )
        {
            var stra = mtlStrA[i].split(" ");
            
            this.handler = lineHandlerMap[stra[0]];
            if (this.handler != undefined)
            {
                this.handler(stra);
            }
            else
            {
                //console.debug("Cant handle [" + mtlStrA[i] + "]");
            }
        }
        
        console.debug("Loaded " + Object.keys(this.materials).length + " materials.");
	}
	
    /**
     * Get the materials after they are loaded
     * @return {Object} A map containing GMaterial instances (hashed by their material name.
     */
    this.GMtlReader.prototype.getMaterials = function()
    {
        return this.materials;
    };
    
    /**
     * Called when processing a comment (line starting with '#')
     * @param {Array.<string>} Current line (tokenized).
     */
    this.GMtlReader.prototype.process_comment = function ( lineA ){};
    
    /**
     * Called when processing a new material (line starting with 'newmtl')
     * @param {Array.<string>} Current line (tokenized).
     */
    this.GMtlReader.prototype.process_newmtl = function ( lineA )
    {
        this.currentMtl = new GMaterial( lineA[1] );
        this.materials[lineA[1]] = this.currentMtl;
    }
    
    /**
     * Called when processing an ambient color property (line starting with 'ka')
     * @param {Array.<string>} Current line (tokenized).
     */
    this.GMtlReader.prototype.process_ka = function( lineA )
    {
        this.currentMtl.setKa( [parseFloat(lineA[1]),
                                parseFloat(lineA[2]),
                                parseFloat(lineA[3])] );
    }
    
    /**
     * Called when processing a diffuse color property (line starting with 'kd')
     * @param {Array.<string>} Current line (tokenized).
     */
    this.GMtlReader.prototype.process_kd = function( lineA )
    {
        this.currentMtl.setKd( [parseFloat(lineA[1]),
                                parseFloat(lineA[2]),
                                parseFloat(lineA[3])] );
    }
    
    /**
     * Called when processing a specular color (line starting with 'ks')
     * @param {Array.<string>} Current line (tokenized).
     */
    this.GMtlReader.prototype.process_ks = function( lineA )
    {
        this.currentMtl.setKs( [parseFloat(lineA[1]),
                                parseFloat(lineA[2]),
                                parseFloat(lineA[3])] );
    }
    
    /**
     * Called when processing a diffuse color texture (line starting with 'map_kd')
     * @param {Array.<string>} Current line (tokenized).
     */
    this.GMtlReader.prototype.process_mapKd = function( lineA )
    {
        var texArgs = [];
        
        for (var i = 1; i < lineA.length; ++i)
        {
            texArgs.push(lineA[i]);
        }
        
        var texture = new GTexture(texArgs, this.path);
        
        this.currentMtl.setMapKd(texture);
    }

	this.client = new XMLHttpRequest();
	this.target = scene_;
}
	
/**
 * Load a new material file using the current bindings
 * @param {string} Path to the material file and it's assets
 * @param {string} Material file that needs to be loaded
 */
GMtlLoader.prototype.loadMtl = function ( path, source )
{
    this.client.open('GET', path + source);
    this.client.onreadystatechange = function() 
    {
        if ( this.client.readyState == 4 )
        {
            var i = 0;
            var mtlFile = this.client.responseText.split("\n");
            
            var mtlReader = new this.GMtlReader (mtlFile, path);
            
            var mtls = mtlReader.getMaterials();
            
            for (var key in mtls)
            {
                this.target.addMaterial(mtls[key]);
            }				
        }
    }.bind(this);
    this.client.send();
}


