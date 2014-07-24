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
 * @param {number} Width
 * @param {number} Height
 * @param {number} Depth
 * @param {string} Name for this object
 */
function Cylinder( w, h, d, name )
{
    //verts, tverts, normals, indices, name
    var verts = 
    [
        -w,-h,d, -w,h,d, w,-h,d,  -w,h,d, w,h,d, w,-h,d,       // front
        -w,h,d, -w,h,-d, w,h,d,  -w,h,-d,  w,h,-d, w,h,d,      // top
        -w,-h,d, -w,h,-d, -w,h,d,  -w,-h,d, -w,-h,-d, -w,h,-d, // left
        w,-h,d,  w,h,d, w,h,-d,  w,-h,d, w,h,-d, w,-h,-d,      // right
        -w,-h,d, w,-h,d, w,-h,-d,  -w,-h,d, w,-h,-d, -w,-h,-d, // bottom
        -w,-h,-d, w,-h,-d, -w,h,-d,  w,-h,-d, w,h,-d, -w,h,-d  // back
    ];
    
    var qt = 1.0/4.0;
    var tverts = 
    [
        1*qt,2*qt, 1*qt,1*qt, 2*qt,2*qt,  1*qt,1*qt, 2*qt,1*qt, 2*qt,2*qt, // front
        1*qt,1*qt, 1*qt,0*qt, 2*qt,1*qt,  1*qt,0*qt, 2*qt,0*qt, 2*qt,1*qt, // top
        1*qt,2*qt, 0*qt,1*qt, 1*qt,1*qt,  1*qt,2*qt, 0*qt,2*qt, 0*qt,1*qt, // left
        2*qt,2*qt, 2*qt,1*qt, 3*qt,1*qt,  2*qt,2*qt, 3*qt,1*qt, 3*qt,2*qt, // right
        1*qt,2*qt, 2*qt,2*qt, 2*qt,3*qt,  1*qt,2*qt, 2*qt,3*qt, 1*qt,3*qt, // bottom
        4*qt,2*qt, 3*qt,2*qt, 4*qt,1*qt,  3*qt,2*qt, 4*qt,1*qt, 3*qt,1*qt, // back
    ];
    
    var normals =
    [
        0,0,1, 0,0,1, 0,0,1,  0,0,1, 0,0,1, 0,0,1,       // front
        0,1,0, 0,1,0, 0,1,0,  0,1,0, 0,1,0, 0,1,0,       // top
        -1,0,0, -1,0,0, -1,0,0,  -1,0,0, -1,0,0, -1,0,0, // left 
        1,0,0, 1,0,0, 1,0,0,  1,0,0, 1,0,0, 1,0,0,       // right
        0,-1,0, 0,-1,0, 0,-1,0,  0,-1,0, 0,-1,0, 0,-1,0, // bottom
        0,0,-1, 0,0,-1, 0,0,-1,  0,0,-1, 0,0,-1, 0,0,-1, // back
    ];
    
    var indices =
    [
        0, 1, 2,  3, 4, 5,       // front
        6, 7, 8,  9, 10, 11,     // top
        12, 13, 14,  15, 16, 17, // left
        18, 19, 20,  21, 22, 23, // right
        24, 25, 26,  27, 28, 29, // bottom
        30, 31, 32,  33, 34, 35  // back
    ];
    
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

Cylinder.prototype = Object.create( SceneDrawable.prototype );

/**
 * Get the name of this object
 * @param {string} The name of this object
 */
Cylinder.prototype.getName = function()
{
    return this.name;
};

/**
 * Set the material name for this object to use
 * @param {string} name of the material that should be used by this object
 */
Cylinder.prototype.setMtlName = function( mName )
{
    this.mtlName = mName;
    this.material = undefined;
};

/**
 * Set the model view matrix for this object
 * @param {Array.<number>} Array of numbers representing the 4 by 4 model view matrix
 */
Cylinder.prototype.setMvMatrix = function( mat )
{
    mat4.copy(this.mvMatrix, mat);
};
   
/**
 * Called to bind this object to a gl context
 * @param {WebGLRenderingContext} Context to bind to this object
 */
Cylinder.prototype.bindToContext = function(gl_)
{
    if (gl_ === undefined) return;
    if (gl_ === this.gl) return;
    
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
    
    if (this.indexBuffer.numItems != this.normlBuffer.numItems  ||
        this.indexBuffer.numItems != this.tverBuffer.numItems || 
        this.indexBuffer.numItems != this.vertBuffer.numItems)
    {
        console.debug("Mesh: index missmatch [" + this.name + "]");
        _valid = false;
    }
};

/**
 * Draw this object
 * @param {Array.<number>} List of numbers representing the parent 4 by 4 view matrix
 * @param {Array.<GMaterial>} List of materials to use for rendering
 * @param {GShader} Shader program to use for rendering
 * @param {number} Draw mode for drawing the VBOs
 */
Cylinder.prototype.draw = function( parentMvMat, materials, shader, drawMode )
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
    
    if ( this.material === undefined &&
         this.mtlName !== undefined )
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
        console.debug("Mesh: index missmatch [" + this.name + "]");
        this.valid = false;
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(drawMode, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};


