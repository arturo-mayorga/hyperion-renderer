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
function GMtlLoader( scene )
{
	this.client = new XMLHttpRequest();
	this.target = scene;
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
        if ( this.client.readyState === 4 )
        {
            var i = 0;
            var mtlFile = this.client.responseText.split("\n");
            
            var mtlReader = new GMtlReader (mtlFile, path);
            
            var mtls = mtlReader.getMaterials();
            
            for (var key in mtls)
            {
                this.target.addMaterial(mtls[key]);
            }				
        }
    }.bind(this);
    this.client.send();
};


