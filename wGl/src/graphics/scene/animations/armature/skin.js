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
 * @param {Array.<number>} Buffer containing the skin properties
 */
function Skin( sverts )
{
    this.svertA = sverts; // [ index, index, weight, weight...
} 

/**
 * Draw this object
 * @param {GShader} Shader program to use for rendering
 */
Skin.prototype.draw = function( shader )
{
    var gl = this.gl;
    
    if ( shader.attributes.skinVertexAttribute > -1 )
    {
        gl.bindBuffer( gl.ARRAY_BUFFER, this.svertBuffer );
        gl.vertexAttribPointer( shader.attributes.skinVertexAttribute, 
                                this.svertBuffer.itemSize, gl.FLOAT, false, 0, 0 );
    } 
};

/**
 * Called to delete all the resources under this drawable
 */
Skin.prototype.deleteResources = function () 
{
    this.gl.deleteBuffer( this.svertBuffer );
};

/**
 * Called to bind this object to a gl context
 * @param {WebGLRenderingContext} Context to bind to this object
 */
Skin.prototype.bindToContext = function( gl )
{
    this.gl = gl;
    
    this.svertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.svertBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.svertA), gl.STATIC_DRAW);
    this.svertBuffer.itemSize = 4;
    this.svertBuffer.numItems = this.svertA.length/4;
};

