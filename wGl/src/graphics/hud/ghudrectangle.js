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
 * @implements {HGHudWidget}
 */
function GHudRectangle() 
{
    GHudWidget.call( this );
    
    this.transform = mat3.create();
	this.drawTransform = mat3.create();
	this.bgColor = [1, 1, 0, 0.5];
	this.texture = undefined; 
}

GHudRectangle.prototype = Object.create( GHudWidget.prototype );

/**
 * This creates a new texture and downloads the resource
 * @param {string} file name
 * @param {string} path
 */
GHudRectangle.prototype.setTexture = function ( name, path )
{
    if ( undefined !== this.texture )
    {
        this.texture.deleteResources();
    }
    
    this.texture = new GTexture([name], path);
    this.texture.bindToContext(this.gl);
	
};

/**
 * Set the color for this hud rectangle
 * @param {number} r Red component
 * @param {number] g Green component
 * @param {number} b Blue component
 * @param {number} a Alpha component
 */
GHudRectangle.prototype.setColor = function(r, g, b, a)
{
	this.bgColor[0] = r; this.bgColor[1] = g;
	this.bgColor[2] = b; this.bgColor[3] = a;
};

/**
 * Draw the rectangle
 * @param {Array.<number>} Array of numbers representing a 3 by 3 matrix
 * @param {GShader} Shader program to use for drawing this rectangle
 */
GHudRectangle.prototype.draw = function( mat, shader ) 
{
	mat3.multiply(this.drawTransform, mat, this.transform);
	var gl = this.gl;
	if ( null != shader.uniforms.Kd )
    {
        gl.uniform4fv(shader.uniforms.Kd, this.bgColor);
    }
	
	if ( null != shader.uniforms.hMatrixUniform )
    {
        gl.uniformMatrix3fv(shader.uniforms.hMatrixUniform, false, this.drawTransform);
    }
    
    if ( null != shader.uniforms.objid )
    {
        gl.uniform4fv(shader.uniforms.objid, this.objid);
    }
    
    if ( null != shader.uniforms.mapKd )
    {
        if ( undefined === this.texture )
        {
             gl.whiteTexture.draw(gl.TEXTURE0, 
                shader.uniforms.mapKd,
                shader.uniforms.mapKdScale);
        }
        else
        {
            this.texture.draw(gl.TEXTURE0, 
                shader.uniforms.mapKd,
                shader.uniforms.mapKdScale);
        }
    }
    
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.recIndxBuffer);
    gl.drawElements(gl.TRIANGLES, this.recIndxBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};


