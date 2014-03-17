/**
 * @constructor
 */
function GGroup(name)
{
	this.name = name;
	this.children = [];
    this.drawMvMatrix = mat4.create(); 
	this.mvMatrix = mat4.create();
	this.gl = undefined;
} 

GGroup.prototype.setMvMatrix = function(mat)
{
    mat4.copy(this.mvMatrix, mat);
}
   
GGroup.prototype.bindToContext = function(gl)
{
	this.gl = gl;
	var childCount = this.children.length;
	for (var i = 0; i < childCount; ++i)
	{
		this.children[i].bindToContext(gl);
	}
}

GGroup.prototype.addChild = function(child)
{
	child.bindToContext(this.gl);
	this.children.push(child);
}

GGroup.prototype.draw = function(parentMvMat, materials)
{
	mat4.multiply(this.drawMvMatrix, parentMvMat, this.mvMatrix);
	var childCount = this.children.length;
	for (var i = 0; i < childCount; ++i)
	{
		this.children[i].draw(parentMvMat, materials);
	}
}


