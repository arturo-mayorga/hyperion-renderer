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
 * @extends {SceneDrawable}
 * @param {string} name Name for this group
 */
function GGroup( name )
{
    SceneDrawable.call( this );
    
	this.name = name;
	this.children = [];
    this.drawMvMatrix = mat4.create(); 
	this.mvMatrix = mat4.create();
	this.gl = undefined;
} 

GGroup.prototype = Object.create( SceneDrawable.prototype );

/**
 * Set the observer for this group
 * @param {SceneDrawableObserver} new observer for this drawable
 */
GGroup.prototype.setObserver = function ( observer )
{
    SceneDrawable.prototype.setObserver.call( this, observer );
    
    for ( var i in this.children )
    {
        this.children[i].setObserver( observer );
    }
};

/**
 * Get the name of this group
 * @param {string} The name of this object
 */
GGroup.prototype.getName = function()
{
    return this.name;
};

/**
 * Set the model view matrix for this group
 * @param {Array.<number>} Array of numbers representing the 4 by 4 model view matrix
 */
GGroup.prototype.setMvMatrix = function(mat)
{
    mat4.copy(this.mvMatrix, mat);
};
   
/**
 * Called to bind this object to a gl context
 * @param {WebGLRenderingContext} Context to bind to this object
 */
GGroup.prototype.bindToContext = function( gl )
{
	this.gl = gl;
	var childCount = this.children.length;
	for (var i = 0; i < childCount; ++i)
	{
		this.children[i].bindToContext(gl);
	}
};

/**
 * Called to delete all the resources under this drawable
 */
GGroup.prototype.deleteResources = function () 
{
	var childCount = this.children.length;
	for (var i = 0; i < childCount; ++i)
	{
		this.children[i].deleteResources();
	}
};

/**
 * Add a child to this group
 * @param {SceneDrawable} Child to add to this group
 */
GGroup.prototype.addChild = function( child )
{
	child.bindToContext( this.gl );
	child.setObserver( this.observer );
	this.children.push( child );
};

/**
 * Remove the child from this group
 * @param {SceneDrawable} child to remove from this group
 */
GGroup.prototype.removeChild = function( child )
{
    this.children.splice( this.children.indexOf( child ), 1 );
    
    return child;
};

/**
 * Draw this group
 * @param {Array.<number>} List of numbers representing the parent 4 by 4 view matrix
 * @param {Array.<GMaterial>} List of materials to use for rendering
 * @param {GShader} Shader program to use for rendering
 * @param {number} Draw mode for drawing the VBOs
 */
GGroup.prototype.draw = function( parentMvMat, materials, shader, drawMode )
{
	mat4.multiply(this.drawMvMatrix, parentMvMat, this.mvMatrix);
	var childCount = this.children.length;
	for (var i = 0; i < childCount; ++i)
	{
		this.children[i].draw(this.drawMvMatrix, materials, shader, drawMode);
	}
};


