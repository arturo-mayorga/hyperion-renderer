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
 */
function Keyframe()
{
    this.positions = [];
    this.rotations = [];
    this.scales = [];
}

/**
 * Add bone information to the keyframe hirearchy.
 * {Array.<number>} position for this bone 
 * {Array.<number>} rotation quaternion for this bone
 * {Array.<number>} scale for this bone
 */
Keyframe.prototype.addBoneInformation = function ( position, rotation, scale )
{
    this.positions.push( position );
    this.rotations.push( rotation );
    this.scales.push( scale );
};

/**
 * @constructor
 * @param {string} name of this animation
 * @param {number} frames per second
 * @param {number} length in seconds
 */
function Animation( name, fps, length )
{
    this.name = name;
    this.fps = fps;
    this.length = length;
    this.keyframes = [];
} 

/**
 * Add a keyframe to this animation
 * @param {Keyframe} keyframe to add to this animation
 */
Animation.prototype.addKeyframe = function( keyframe )
{
    this.keyframes.push( keyframe );
};



