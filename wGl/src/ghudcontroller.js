/**
 * @interface
 */
function GHudWidget() 
{
    this.gl = undefined;
    this.transform = mat3.create();
}
GHudWidget.prototype.draw = function( mat ) {};
GHudWidget.prototype.bindToContext = function( gl ) 
{
    this.gl = gl;
};
GHudWidget.prototype.setDrawRec = function ( x, y, width, height )
{
    mat3.identity(this.transform);
    mat3.scale(this.transform, a, v) 
    mat3.translate(this.transform, a, v)
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

GHudGroup.prototype.bindToContext = function(gl_)
{
    this.gl = gl_;
    var gl = this.gl;
    
    var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].bindToContext(gl);
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
    child.bindToContext(this.gl);
    this.children.push(child);
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
GHudController.prototype.group_draw                = GHudGroup.prototype.draw;
GHudController.prototype.group_bindToContext = GHudGroup.prototype.bindToContext;
GHudController.prototype.addChild            = GHudGroup.prototype.addChild;

GHudController.prototype.bindToContext = function (gl)
{
    this.recVertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.recVertBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array([-0.1,-0.1,0,
                                    0.1,-0.1,0,
                                    0.1,0.1,0,
                                    -0.1,0.1,0]),
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
    
    this.group_bindToContext(gl);
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

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.recIndxBuffer);
    
    if ( null != gl.fullscreenProgram.Kd )
    {
        gl.uniform4fv(gl.fullscreenProgram.Kd, [0, 1, 1, 0.0]);
    }
    
    gl.drawElements(gl.TRIANGLES, this.recIndxBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
    this.group_draw(this.transform);
}


