/**
 * @constructor
 * @param {string} Name for this group
 */
function GGroup( name )
{
	this.name = name;
	this.children = [];
    this.drawMvMatrix = mat4.create(); 
	this.mvMatrix = mat4.create();
	this.gl = undefined;
} 

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
 * Add a child to this group
 * @param {GGroup|GObject} Child to add to this group
 */
GGroup.prototype.addChild = function( child )
{
	child.bindToContext(this.gl);
	this.children.push(child);
};

/**
 * Remove the child from this group
 * @param {GGroup|GObject} child to remove from this group
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


