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
 * @param {number} radius
 * @param {number} sliceCount
 * @param {number} stackCount
 * @param {string} Name for this object
 */
function Sphere( radius, sliceCount, stackCount, name )
{
    this.radius = radius;
    this.sliceCount = sliceCount;
    this.sliceCountMinor = stackCount;
    
    this.updateBufferArrays();
    
    this.vertBuffer = undefined;
    this.tverBuffer = undefined;
    this.normlBuffer = undefined;
    this.indexBuffer = undefined;
     
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

Sphere.prototype = Object.create( SceneDrawable.prototype );

/**
 * Update the buffer arrays with the new set of triangles
 */
Sphere.prototype.updateBufferArrays = function()
{
    var sliceBuffers = [];
    
    for ( var i = 0; i < this.sliceCount; ++i )
    {
        sliceBuffers.push( this.genSliceBuffer( (i*2*Math.PI)/this.sliceCount ) );
    }
    
    this.vertA = [];
    this.tverA = [];
    this.normA = [];
    this.indxA = [];
    
    for ( var i = 0; i < 6*(this.sliceCountMinor-1)*this.sliceCount; ++i )
    {
        this.indxA.push(i);
         
    }
    
    for ( var i = 0; i < this.sliceCount-1; ++i )
    {
        this.addArraysBetweenSlices( sliceBuffers[i], sliceBuffers[i+1] );
    }
   
    this.addArraysBetweenSlices( sliceBuffers[this.sliceCount-1], sliceBuffers[0] );
    
};

/**
 * Generate the triangles between slices
 * @param {Array<number>} first slice
 * @param {Array<number>} second slice
 */
Sphere.prototype.addArraysBetweenSlices = function( bA, bB )
{
    var pW = 8;
    var lO = 0;
    var nO = 3;
    var uO = 6;
    
    for ( var i = 0; i < this.sliceCountMinor; ++i )
    {
        if ( 0 !== i )
        {
            this.vertA.push(bA[(i+0)*pW+lO+0]);  this.vertA.push(bA[(i+0)*pW+lO+1]);  this.vertA.push(bA[(i+0)*pW+lO+2]);
            this.vertA.push(bB[(i+0)*pW+lO+0]);  this.vertA.push(bB[(i+0)*pW+lO+1]);  this.vertA.push(bB[(i+0)*pW+lO+2]);
            this.vertA.push(bB[(i+1)*pW+lO+0]);  this.vertA.push(bB[(i+1)*pW+lO+1]);  this.vertA.push(bB[(i+1)*pW+lO+2]);
            
            this.normA.push(bA[(i+0)*pW+nO+0]);  this.normA.push(bA[(i+0)*pW+nO+1]);  this.normA.push(bA[(i+0)*pW+nO+2]);
            this.normA.push(bB[(i+0)*pW+nO+0]);  this.normA.push(bB[(i+0)*pW+nO+1]);  this.normA.push(bB[(i+0)*pW+nO+2]);
            this.normA.push(bB[(i+1)*pW+nO+0]);  this.normA.push(bB[(i+1)*pW+nO+1]);  this.normA.push(bB[(i+1)*pW+nO+2]);
            
            this.tverA.push(bA[(i+0)*pW+uO+0]);  this.tverA.push(bA[(i+0)*pW+uO+1]);
            this.tverA.push(bB[(i+0)*pW+uO+0]);  this.tverA.push(bB[(i+0)*pW+uO+1]);
            this.tverA.push(bB[(i+1)*pW+uO+0]);  this.tverA.push(bB[(i+1)*pW+uO+1]);
        }
    
        if ( this.sliceCountMinor-1 !== i )
        {
            this.vertA.push(bA[(i+0)*pW+lO+0]);  this.vertA.push(bA[(i+0)*pW+lO+1]);  this.vertA.push(bA[(i+0)*pW+lO+2]);
            this.vertA.push(bB[(i+1)*pW+lO+0]);  this.vertA.push(bB[(i+1)*pW+lO+1]);  this.vertA.push(bB[(i+1)*pW+lO+2]);
            this.vertA.push(bA[(i+1)*pW+lO+0]);  this.vertA.push(bA[(i+1)*pW+lO+1]);  this.vertA.push(bA[(i+1)*pW+lO+2]);
            
            this.normA.push(bA[(i+0)*pW+nO+0]);  this.normA.push(bA[(i+0)*pW+nO+1]);  this.normA.push(bA[(i+0)*pW+nO+2]);
            this.normA.push(bB[(i+1)*pW+nO+0]);  this.normA.push(bB[(i+1)*pW+nO+1]);  this.normA.push(bB[(i+1)*pW+nO+2]);
            this.normA.push(bA[(i+1)*pW+nO+0]);  this.normA.push(bA[(i+1)*pW+nO+1]);  this.normA.push(bA[(i+1)*pW+nO+2]);
            
            this.tverA.push(bA[(i+0)*pW+uO+0]);  this.tverA.push(bA[(i+0)*pW+uO+1]);
            this.tverA.push(bB[(i+1)*pW+uO+0]);  this.tverA.push(bB[(i+1)*pW+uO+1]);
            this.tverA.push(bA[(i+1)*pW+uO+0]);  this.tverA.push(bA[(i+1)*pW+uO+1]);
        }
    }
};

/**
 * Generate a buffer containing slice information
 * @paraam {number} slice location in radians
 * @return {Array<number>} slice buffer 
 *          [ topCenter, topEdge, topShell, bottomShell, bottomEdge, bottomCenter ] 
 *                         +--| ...pos.xyz, norm.xyz, uv.xy... | (for each of the six elements above)
 */
Sphere.prototype.genSliceBuffer = function( loc )
{  
    var ret = [];
    
    for ( var i = 0; i < this.sliceCountMinor+1; ++i )
    {
      ret = ret.concat( this.genMinorRingPoint(loc, i*Math.PI/this.sliceCountMinor) );
    }
    
    return ret;
};

/**
 * Generate a point on the minor circle
 * @param {number} location along the major ring
 * @param {number} location along the minor ring
 * @return {Array<number>} point buffer
 */
Sphere.prototype.genMinorRingPoint = function( lMa, lMi )
{
    var rPMa = [Math.cos(lMa), Math.sin(lMa)];
    var rPMi = [Math.sin(lMi), Math.cos(lMi)];
    var rM = 0;
    var rm = this.radius;
    
    var ret = [];
    ret = ret.concat( [rPMa[0]*(rM+rPMi[0]*rm), rPMi[1]*rm, rPMa[1]*(rM+rPMi[0]*rm)] );
    ret = ret.concat( [rPMa[0]*rPMi[0], rPMi[1], rPMa[1]*rPMi[0]] );
    ret = ret.concat( [lMa/(2*Math.PI),lMi/(2*Math.PI)] );
    
    return ret;
};

/**
 * Get the name of this object
 * @param {string} The name of this object
 */
Sphere.prototype.getName = function()
{
    return this.name;
};

/**
 * Set the material name for this object to use
 * @param {string} name of the material that should be used by this object
 */
Sphere.prototype.setMtlName = function( mName )
{
    this.mtlName = mName;
    this.material = undefined;
};

/**
 * Set the model view matrix for this object
 * @param {Array.<number>} Array of numbers representing the 4 by 4 model view matrix
 */
Sphere.prototype.setMvMatrix = function( mat )
{
    mat4.copy(this.mvMatrix, mat);
};
   
/**
 * Called to bind this object to a gl context
 * @param {WebGLRenderingContext} Context to bind to this object
 */
Sphere.prototype.bindToContext = function(gl_)
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
Sphere.prototype.draw = function( parentMvMat, materials, shader, drawMode )
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




