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
function ArmatureAnimator()
{
    this.animations = [];
    
    this.playTime = 0;
    
    this.tempPosV = vec3.create();
    this.tempRotV = quat.create();
    this.tempSclV = vec3.create();
} 

/**
 * Add an animation to this animator
 * @param {Animation} animation being added to this animator
 */
ArmatureAnimator.prototype.addAnimation = function ( animation )
{
    this.animations.push( animation );
};

/**
 * Set the target for this animator
 * @param {ArmatureMeshDecorator} target for this animator
 */
ArmatureAnimator.prototype.setTarget = function ( target )
{
    this.target = target;
};

/**
 * This is the update function for this animator
 * @param {number} number of milliseconds since the last update
 */
ArmatureAnimator.prototype.update = function ( time ) 
{
    var frameCount = this.animations[0].keyframes.length;
    var aniLen = this.animations[0].length;
    
    var progress = frameCount * this.playTime / aniLen;
    
    var prevFrameI = Math.floor(progress);
    var nextFrameI = Math.ceil(progress);
    var weight = progress - prevFrameI;
    
    var prevFrame = this.animations[0].keyframes[ prevFrameI % frameCount ];
    var nextFrame = this.animations[0].keyframes[ nextFrameI % frameCount ];
    
    for ( var i in this.target.bones )
    {
        vec3.lerp( this.tempPosV, prevFrame.positions[i], nextFrame.positions[i], weight );
        quat.slerp( this.tempRotV, prevFrame.rotations[i], nextFrame.rotations[i], weight );
        vec3.lerp( this.tempSclV, prevFrame.scales[i], nextFrame.scales[i], weight );
        
        this.target.bones[i].setCurrentValues( this.tempPosV, this.tempRotV, this.tempSclV ); 
    }
    
    this.playTime += time;
};

/**
 * Set the animator to the play state
 */
ArmatureAnimator.prototype.play = function ( )
{
    this.playTime = 0;
};

/**
 * Set the animator to the stop state
 */
ArmatureAnimator.prototype.stop = function ( )
{
};


ArmatureAnimator.prototype.pause = function ( )
{
};

