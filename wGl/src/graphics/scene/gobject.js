/**
 * @constructor
 */
function GObject(verts, tverts, normals, indices, name)
{
    this.vertBuffer = undefined;
    this.tverBuffer = undefined;
    this.normlBuffer = undefined;
    this.indexBuffer = undefined;
    this.vertA = verts;
    this.tverA = tverts;
    this.normA = normals;
    this.indxA = indices; 
    this.mvMatrix = mat4.create(); 
    mat4.identity(this.mvMatrix);
    this.gl = undefined;
    this.name = name;
    this.mtlName = undefined;
    this.material = undefined;
    this.valid = true;
    this.drawMvMatrix = mat4.create();
    this.normalMatrix = mat4.create();
}

GObject.prototype.getName = function()
{
    return this.name;
}

GObject.prototype.setMtlName = function( mName )
{
    this.mtlName = mName;
    this.material = undefined;
}

GObject.prototype.setMvMatrix = function(mat)
{
    mat4.copy(this.mvMatrix, mat);
}
   
GObject.prototype.bindToContext = function(gl_)
{
    if (gl_ == undefined) return;
    if (gl_ == this.gl) return;
    
    this.gl = gl_;
    var gl = this.gl;
    
    this.vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertA), gl.STATIC_DRAW);
    this.vertBuffer.itemSize = 3;
    this.vertBuffer.numItems = this.vertA.length/3;
    
    this.tverBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tverBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tverA), gl.STATIC_DRAW);
    this.tverBuffer.itemSize = 2;
    this.tverBuffer.numItems = this.tverA.length/2;

    this.normlBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normlBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normA), gl.STATIC_DRAW);
    this.normlBuffer.itemSize = 3;
    this.normlBuffer.numItems = this.normA.length/3;
    
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indxA), gl.STATIC_DRAW);
    this.indexBuffer.itemSize = 1;
    this.indexBuffer.numItems = this.indxA.length;
    
    if (this.indexBuffer.numItems !=  this.normlBuffer.numItems  ||
        this.indexBuffer.numItems !=  this.tverBuffer.numItems || 
        this.indexBuffer.numItems != this.vertBuffer.numItems)
    {
        console.debug("gObject: index missmatch [" + this.name + "]");
        _valid = false;
    }
}

GObject.prototype.draw = function(parentMvMat, materials, shader)
{
   if ( !this.valid ) return;
   
   var gl = this.gl;
   
    if (shader.attributes.positionVertexAttribute > -1)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
        gl.vertexAttribPointer(shader.attributes.positionVertexAttribute, 
                               this.vertBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }

    if (shader.attributes.normalVertexAttribute > -1)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normlBuffer);
        gl.vertexAttribPointer(shader.attributes.normalVertexAttribute, 
                               this.normlBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    
    if (shader.attributes.textureVertexAttribute > -1)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tverBuffer);
        gl.vertexAttribPointer(shader.attributes.textureVertexAttribute, 
                               this.tverBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    
    var isDrawMvMatrixReady = false;
    if ( null != shader.uniforms.mvMatrixUniform )
    {
        mat4.multiply(this.drawMvMatrix, parentMvMat, this.mvMatrix);
        isDrawMvMatrixReady = true;
        gl.uniformMatrix4fv(shader.uniforms.mvMatrixUniform, false, this.drawMvMatrix);
    }
    
    if ( null != shader.uniforms.nMatrixUniform )
    {
        if ( !isDrawMvMatrixReady )
        {
            mat4.multiply(this.drawMvMatrix, parentMvMat, this.mvMatrix);
        }
        
        // mat4 normalMatrix = transpose(inverse(modelView));
        mat4.invert(this.normalMatrix, this.drawMvMatrix);
        mat4.transpose(this.normalMatrix, this.normalMatrix);
        
        gl.uniformMatrix4fv(shader.uniforms.nMatrixUniform, false, this.normalMatrix);
    }
    
    if ( this.material == undefined &&
         this.mtlName != undefined )
    {
        this.material = materials[this.mtlName];
    }
    
    if ( this.material != undefined )
    {
        this.material.draw( shader );
    }
    
    if (this.indexBuffer.numItems !=  this.normlBuffer.numItems  ||
        this.indexBuffer.numItems !=  this.tverBuffer.numItems || 
        this.indexBuffer.numItems != this.vertBuffer.numItems)
    {
        console.debug("gObject: index missmatch [" + this.name + "]");
        this.valid = false;
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}


