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
 * @extends {Mesh}
 * @param {number} radius
 * @param {number} height
 * @param {number} sliceCount
 * @param {string} Name for this object
 */
function Cylinder( radius, height, sliceCount, name )
{
    Mesh.call( this );
    
    this.radiusInner = 0;
    this.radiusOuter = radius;
    this.height = height;
    this.sliceCount = sliceCount;
    
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

Cylinder.prototype = Object.create( Mesh.prototype );

/**
 * Update the buffer arrays with the new set of triangles
 */
Cylinder.prototype.updateBufferArrays = function()
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
    
    for ( var i = 0; i < 12*(this.sliceCount); ++i )
    {
        this.indxA.push(i);
         
    }
    
    for ( var j = 0; j < this.sliceCount-1; ++j )
    {
        this.addArraysBetweenSlices( sliceBuffers[j], sliceBuffers[j+1] );
    }
   
    this.addArraysBetweenSlices( sliceBuffers[this.sliceCount-1], sliceBuffers[0] );
    
};

/**
 * Generate the triangles between slices
 * @param {Array<number>} first slice
 * @param {Array<number>} second slice
 */
Cylinder.prototype.addArraysBetweenSlices = function( bA, bB )
{
    var pW = 8;
    var lO = 0;
    var nO = 3;
    var uO = 6;
    
    for ( var i = 0; i < 6; i+=2 )
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
        
        if ( 4 !== i )
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
Cylinder.prototype.genSliceBuffer = function( loc )
{  
    return [
        Math.cos( loc )*this.radiusInner, 0.5*this.height, Math.sin( loc )*this.radiusInner, 0,1,0, loc/(2*Math.PI),0,
        Math.cos( loc )*this.radiusOuter, 0.5*this.height, Math.sin( loc )*this.radiusOuter, 0,1,0, loc/(2*Math.PI),0,
        Math.cos( loc )*this.radiusOuter, 0.5*this.height, Math.sin( loc )*this.radiusOuter, Math.cos( loc ),0,Math.sin( loc ), loc/(2*Math.PI),0,
        Math.cos( loc )*this.radiusOuter,-0.5*this.height, Math.sin( loc )*this.radiusOuter, Math.cos( loc ),0,Math.sin( loc ), loc/(2*Math.PI),1,
        Math.cos( loc )*this.radiusOuter,-0.5*this.height, Math.sin( loc )*this.radiusOuter, 0,-1,0, loc/(2*Math.PI),1,
        Math.cos( loc )*this.radiusInner,-0.5*this.height, Math.sin( loc )*this.radiusInner, 0,-1,0, loc/(2*Math.PI),1
    ];
};





