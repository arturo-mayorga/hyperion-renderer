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
 * @param {number} Width
 * @param {number} Height
 * @param {number} Depth
 * @param {string} Name for this object
 */
function Cuboid( w, h, d, name )
{
    Mesh.call( this );
    
    w*=0.5;
    h*=0.5;
    d*=0.5;
    
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

Cuboid.prototype = Object.create( Mesh.prototype );



