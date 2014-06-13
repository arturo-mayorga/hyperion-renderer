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
 * This composite is to keep track of different variants of the same shader
 * @param {string} Source for the vertex shader
 * @param {string} Source for the fragment shader
 */
function ShaderComposite ( vertexSource, fragmentSource )
{
    this.staticS = new GShader(vertexSource, fragmentSource);
    this.armatureS = new GShader("#define ARMATURE_SUPPORT\n"+vertexSource, fragmentSource);
}

/**
 * Access to the static shader
 * @return {GShader}
 */
ShaderComposite.prototype.getStaticShader = function ()
{
    return this.staticS;
};

/**
 * Access to the armature shader
 * @return {GShader}
 */
ShaderComposite.prototype.getArmatureShader = function ()
{
    return this.armatureS;
};

/**
 * Called to bind the shaders to a gl context
 * @param {WebGLRenderingContext} Context to bind to this object
 */
ShaderComposite.prototype.bindToContext = function ( gl )
{
    this.staticS.bindToContext( gl );
    this.armatureS.bindToContext( gl );
};

/**
 * prepare the shaders for deletion
 */
ShaderComposite.prototype.destroy = function ()
{
    this.staticS.destroy();
    this.armatureS.destroy();
};
