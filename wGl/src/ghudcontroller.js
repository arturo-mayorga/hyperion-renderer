/**
 * @interface
 */
function GHudWidget() 
{
    this.gl = undefined;
    this.transform = mat3.create();
}
GHudWidget.prototype.draw = function( mat ) {};
GHudWidget.prototype.bindToContext = function( gl, recIdxBuffer ) 
{
	this.recIndxBuffer = recIdxBuffer;
    this.gl = gl;
};

/**
 * @param {number} x X position to be use for placement
 * @param {number} y Y Position to be used for placement
 * @param {number} width Width value to use for the drawing rec
 * @param {number} height Height value to be used for the drawing rec
 */
GHudWidget.prototype.setDrawRec = function ( x, y, width, height )
{
	// the values passed in are meant to be between 0 and 1
	// currently there are no plans to add debug assertions
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
    this.gl = undefined;
	this.children = [];
	this.transform = mat3.create();
	this.drawTransfomr = mat3.create();
} 

GHudGroup.prototype.setDrawRec = GHudWidget.prototype.setDrawRec;

GHudGroup.prototype.bindToContext = function(gl, recIdxBuffer)
{
   // the expectation is that groups will not need to render themselves
   // they will simply maintain a transformation hierarchy and delegate 
   // all actual drawing to their children.
   var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].bindToContext(gl, recIdxBuffer);
    }
}

GHudGroup.prototype.draw = function( transform )
{
    mat3.multiply(this.drawTransform, transform, this.transform);

    var childCount = this.children.length;
    
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].draw(this.transform);
    }
}

GHudGroup.prototype.addChild = function(child)
{
    child.bindToContext(this.gl, this.recIndxBuffer);
    this.children.push(child);
}

GHudGroup.prototype.removeChild = function(child)
{
	this.children.splice(this.children.indexOf(child),1);
}


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

GHudController.prototype.setDrawRec          = GHudGroup.prototype.setDrawRec;
GHudController.prototype.group_draw          = GHudGroup.prototype.draw;
GHudController.prototype.group_bindToContext = GHudGroup.prototype.bindToContext;
GHudController.prototype.addChild            = GHudGroup.prototype.addChild;
GHudController.prototype.removeChild         = GHudGroup.prototype.removeChild;

GHudController.prototype.bindToContext = function (gl)
{
	this.gl = gl;
    this.recVertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.recVertBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array([-1,-1,0,
                                    1,-1,0,
                                    1,1,0,
                                    -1,1,0]),
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
    
    this.group_bindToContext(gl, this.recIndxBuffer);
}

GHudController.prototype.draw = function()
{
    var gl = this.gl; 
    gl.activeTexture(gl.TEXTURE0);
    
    gl.whiteTexture.draw(gl.TEXTURE0, 
                gl.fullscreenProgram.mapKd,
                gl.fullscreenProgram.mapKdScale);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.recVertBuffer);
    gl.vertexAttribPointer(gl.fullscreenProgram.positionVertexAttribute, 
                           this.recVertBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.recTextBuffer);
    gl.vertexAttribPointer(gl.fullscreenProgram.textureVertexAttribute, 
                           this.recTextBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
   /* if ( null != gl.fullscreenProgram.Kd )
    {
        gl.uniform4fv(gl.fullscreenProgram.Kd, [0, 1, 1, 0.5]);
    }
    
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.recIndxBuffer);
    gl.drawElements(gl.TRIANGLES, this.recIndxBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    */
    this.group_draw(this.transform);
}


