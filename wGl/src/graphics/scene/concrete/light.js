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
 */
function GLight()
{
    this.position  = vec3.create();
    this.color     = vec3.create();
    this.uPosition = vec3.create();
}

/**
 * Set the position of this light
 * @param {number} X component of the light position
 * @param {number} Y component of the light position
 * @param {number} Z component of the light position
 */
GLight.prototype.setPosition = function( x, y, z )
{
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
};

/**
 * Used to get the position of the light
 * @param {Array.<number>} Out param that will contain the position of the light
 */
GLight.prototype.getPosition = function( position )
{
    position[0] = this.position[0];
    position[1] = this.position[1];
    position[2] = this.position[2];
};

/**
 * Called to bind this light to a gl context
 * @param {WebGLRenderingContext} Context to bind to this light
 */
GLight.prototype.bindToContext = function( gl )
{
    this.gl = gl;
};

/**
 * @param {Array.<number>} List of numbers representing the 4 by 4 view matrix
 * @param {GShader} Shader to use to draw this light
 * @param {number} Index of this light
 */
GLight.prototype.draw = function ( parentMvMat, shader, index )
{
    vec3.transformMat4(this.uPosition, this.position, parentMvMat);
    
    var uniform =  null;
    
    switch (index)
    {
        case 0: uniform = shader.uniforms.lightPosition0; break;
        case 1: uniform = shader.uniforms.lightPosition1; break;
        case 2: uniform = shader.uniforms.lightPosition2; break;
        case 3: uniform = shader.uniforms.lightPosition3; break;
        case 4: uniform = shader.uniforms.lightPosition4; break;
        case 5: uniform = shader.uniforms.lightPosition5; break;
        case 6: uniform = shader.uniforms.lightPosition6; break;
        case 7: uniform = shader.uniforms.lightPosition7; break;
        case 8: uniform = shader.uniforms.lightPosition8; break;
    }
    
    if ( null != uniform )
    {
        this.gl.uniform3fv(uniform, this.uPosition);
    } 
};

