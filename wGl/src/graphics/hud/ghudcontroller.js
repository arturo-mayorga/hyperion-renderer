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
function GHudWidget() 
{
    this.gl = undefined;
    this.transform = mat3.create();
    
    var objid_ = GHudWidget.instanceCounter;
    this.objid_ = objid_;
    this.objid = [ (0x000000ff & (objid_>>16))/255, 
                   (0x000000ff & (objid_>>8))/255, 
                   (0x000000ff & objid_)/255, 1];
    GHudWidget.instanceCounter += 1;
}

GHudWidget.instanceCounter = 0;

/** 
 * @return {number}
 */
GHudWidget.prototype.getObjId = function()
{
    return this.objid_;
};

/**
 * Draw this widget using the provided transform matrix and shader
 * @param {Array.<number>} List of numbers representing the 3 by 3 transform matrix
 * @param {GShader} Shader program to use for drawing this group
 */
GHudWidget.prototype.draw = function( mat, shader ) {};

/**
 * Bind the current widget to the webgl context and buffer to use for drawing
 * @param {WebGLRenderingContext}
 * @param {WebGLBuffer}
 */
GHudWidget.prototype.bindToContext = function( gl, recIdxBuffer ) 
{
	this.recIndxBuffer = recIdxBuffer;
    this.gl = gl;
};

/**
 * Set the drawing rectangle area
 * NOTE: The values passed in are meant to be between 0 and 1
 * currently there are no plans to add debug assertions
 * @param {number} X position to be use for placement
 * @param {number} Y Position to be used for placement
 * @param {number} Width value to use for the drawing rec
 * @param {number} Height value to be used for the drawing rec
 */
GHudWidget.prototype.setDrawRec = function ( x, y, width, height )
{
    mat3.identity(this.transform);
	mat3.translate(this.transform, this.transform, [x, y]);
	mat3.scale(this.transform,this.transform, [width, height]);  
}

/**
 * @interface
 * @extends {GHudWidget}
 */
function GHudGroup() 
{
    GHudWidget.call( this );
    
    this.gl = undefined;
	this.children = [];
	this.transform = mat3.create();
	this.drawTransfomr = mat3.create();
} 

GHudGroup.prototype.setDrawRec = GHudWidget.prototype.setDrawRec;

/**
 * Bind the current group to the webgl context and buffer to use for drawing
 * NOTE: The expectation is that groups will not need to render themselves
 * they will simply maintain a transformation hierarchy and delegate 
 * all actual drawing to their children.
 * @param {WebGLRenderingContext}
 * @param {WebGLBuffer}
 */
GHudGroup.prototype.bindToContext = function( gl, recIdxBuffer )
{
   var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].bindToContext(gl, recIdxBuffer);
    }
}

/**
 * Draw this group using the provided transform matrix and shader
 * @param {Array.<number>} List of numbers representing the 3 by 3 transform matrix
 * @param {GShader} Shader program to use for drawing this group
 */
GHudGroup.prototype.draw = function( transform, shader )
{
    mat3.multiply(this.drawTransform, transform, this.transform);

    var childCount = this.children.length;
    
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].draw(this.transform, shader);
    }
}

/**
 * Add the provided child to the HUD
 * @param {GHudRectangle} Child to add to the HUD
 */
GHudGroup.prototype.addChild = function( child )
{
    child.bindToContext(this.gl, this.recIndxBuffer);
    this.children.push(child);
};

/**
 * Remove the provided child from the HUD
 * @param {GHudRectangle} Child to remove from the HUD
 */
GHudGroup.prototype.removeChild = function( child )
{
	this.children.splice(this.children.indexOf(child),1);
};


/**
 * @constructor
 * @implements {GHudController}
 */
function GHudController()
{
	this.gl = undefined;
	this.children = [];
	this.transform = mat3.create();
	this.drawTransform = mat3.create();
}

GHudController.prototype = Object.create( GHudGroup.prototype );

/**
 * Called to bind this HUD controller to a gl context
 * @param {WebGLRenderingContext} Context to bind to this HUD controller
 */
GHudController.prototype.bindToContext = function ( gl )
{
	this.gl = gl;
    this.recVertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.recVertBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array([-1,-1,1,
                                    1,-1,1,
                                    1,1,1,
                                    -1,1,1]),
                  gl.STATIC_DRAW);
    
    this.recVertBuffer.itemSize = 3;
    this.recVertBuffer.numItems = 4;
    
    this.recTextBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.recTextBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 
                  new Float32Array([0,0,  
                                    1,0,  
                                    1,1,  
                                    0,1]), 
                  gl.STATIC_DRAW);
    this.recTextBuffer.itemSize = 2;
    this.recTextBuffer.numItems = 4;
    
    this.recIndxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.recIndxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
                  new Uint16Array([0, 1, 2, 2, 3, 0]),
                  gl.STATIC_DRAW);
    this.recIndxBuffer.itemSize = 1;
    this.recIndxBuffer.numItems = 6;
    
    GHudGroup.prototype.bindToContext.call( this, gl, this.recIndxBuffer);
};

/**
 * Draw the heads up display
 * @param {GShader} Shader program to use for drawing the HUD
 */
GHudController.prototype.draw = function( shader )
{
    var gl = this.gl; 
    gl.activeTexture(gl.TEXTURE0);
    
    gl.whiteTexture.draw(gl.TEXTURE0, 
                shader.uniforms.mapKd,
                shader.uniforms.mapKdScale);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.recVertBuffer);
    gl.vertexAttribPointer(shader.attributes.positionVertexAttribute, 
                           this.recVertBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.recTextBuffer);
    gl.vertexAttribPointer(shader.attributes.textureVertexAttribute, 
                           this.recTextBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    GHudGroup.prototype.draw.call( this, this.transform, shader);
};


