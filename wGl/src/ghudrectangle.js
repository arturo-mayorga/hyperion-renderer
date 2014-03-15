/**
 * @constructor
 * @implements {HGHudWidget}
 */
function GHudRectangle() 
{
    this.transform = mat3.create();
	this.drawTransform = mat3.create();
	this.bgColor = [1, 1, 0, 0.5];
}

GHudRectangle.prototype.bindToContext = GHudWidget.prototype.bindToContext;
GHudRectangle.prototype.setDrawRec    = GHudWidget.prototype.setDrawRec;

/**
 * @param {number} r Red component
 * @param {number] g Green component
 * @param {number} b Blue component
 * @param {number} a Alpha component
 */
GHudRectangle.prototype.setColor = function(r, g, b, a)
{
	this.bgColor[0] = r; this.bgColor[1] = g;
	this.bgColor[2] = b; this.bgColor[3] = a;
}
GHudRectangle.prototype.draw = function( mat ) 
{
	mat3.multiply(this.drawTransform, mat, this.transform);
	var gl = this.gl;
	if ( null != gl.fullscreenProgram.Kd )
    {
        gl.uniform4fv(gl.fullscreenProgram.Kd, this.bgColor);
    }
	
	if ( null != gl.fullscreenProgram.hMatrixUniform )
    {
        gl.uniformMatrix3fv(gl.fullscreenProgram.hMatrixUniform, false, this.drawTransform);
    }
    
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.recIndxBuffer);
    gl.drawElements(gl.TRIANGLES, this.recIndxBuffer.numItems, gl.UNSIGNED_SHORT, 0);

};


