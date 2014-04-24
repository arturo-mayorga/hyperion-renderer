
/**
 * @constructor
 */
function GCamera()
{
    this.gl = undefined;
	this.pMatrix = mat4.create();
	
	
	this.rotMat  = mat4.create();
	this.tranMat = mat4.create();
	
	this.eye = vec3.fromValues(0, 0, 0);
	this.up = vec3.fromValues(0, 1, 0);
	this.lookAt = vec3.fromValues(0, 0, 1);
	
	this.mvMatrix = mat4.create();
}
	
GCamera.prototype.draw = function(ouMvMatrix, shader)
{
    var gl = this.gl;
    this.updateMatrices();
    
    mat4.copy(ouMvMatrix, this.mvMatrix);

    mat4.perspective(this.pMatrix, 0.8*(3.14159/4), gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    
    gl.uniformMatrix4fv(shader.uniforms.pMatrixUniform, false, this.pMatrix);
};

GCamera.prototype.getMvMatrix = function(outMvMatrix)
{
    mat4.copy(outMvMatrix, this.mvMatrix);
};

GCamera.prototype.bindToContext = function(gl_)
{
    this.gl = gl_;
};

GCamera.prototype.setEye = function (x, y, z)
{
    this.eye[0] = x; this.eye[1] = y; this.eye[2] = z;
};

GCamera.prototype.getEye = function (outA)
{
    outA[0] = this.eye[0];
    outA[1] = this.eye[1];
    outA[2] = this.eye[2];
};

GCamera.prototype.setUp = function (x, y, z)
{
    this.up[0] = x; this.up[1] = y; this.up[2] = z;
};

GCamera.prototype.getUp = function (outA)
{
    outA[0] = this.up[0];
    outA[1] = this.up[1];
    outA[2] = this.up[2];
};

GCamera.prototype.setLookAt = function (x, y, z)
{
    this.lookAt[0] = x; this.lookAt[1] = y; this.lookAt[2] = z;
};

GCamera.prototype.getLookAt = function (outA)
{
    outA[0] = this.lookAt[0];
    outA[1] = this.lookAt[1];
    outA[2] = this.lookAt[2];
};

GCamera.prototype.updateMatrices = function()
{ 
    mat4.lookAt(this.mvMatrix, this.eye, this.lookAt, this.up);
};