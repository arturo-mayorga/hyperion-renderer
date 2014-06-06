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
 * @extends {MeshDecorator}
 * @param {Mesh} Name for this group
 */
function ArmatureMeshDecorator( mesh, skin, bones )
{
    this.mesh = mesh; 
} 

/**
 * Get the name of this object
 * @param {string} The name of this object
 */
ArmatureMeshDecorator.prototype.getName = 
    MeshDecorator.prototype.getName;

/**
 * Set the material name for this object to use
 * @param {string} name of the material that should be used by this object
 */
ArmatureMeshDecorator.prototype.setMtlName = 
    MeshDecorator.prototype.setMtlName;

/**
 * Set the model view matrix for this object
 * @param {Array.<number>} Array of numbers representing the 4 by 4 model view matrix
 */
ArmatureMeshDecorator.prototype.setMvMatrix = 
    MeshDecorator.prototype.setMvMatrix;
   
/**
 * Called to bind this object to a gl context
 * @param {WebGLRenderingContext} Context to bind to this object
 */
ArmatureMeshDecorator.prototype.bindToContext = 
    MeshDecorator.prototype.bindToContext;

/**
 * Draw this object
 * @param {Array.<number>} List of numbers representing the parent 4 by 4 view matrix
 * @param {Array.<GMaterial>} List of materials to use for rendering
 * @param {GShader} Shader program to use for rendering
 * @param {number} Draw mode for drawing the VBOs
 */
ArmatureMeshDecorator.prototype.draw = 
    MeshDecorator.prototype.draw;

