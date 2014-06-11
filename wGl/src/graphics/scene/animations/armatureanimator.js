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
    
    this.lastFrame = -1;
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
    this.lastFrame += 1;
    this.lastFrame %= this.animations[0].keyframes.length;
    
    var currentFrame = this.animations[0].keyframes[ this.lastFrame ];
    
    for ( var i in this.target.bones )
    {
        this.target.bones[i].setCurrentValues( currentFrame.positions[i],
                                               currentFrame.rotations[i],
                                               currentFrame.scales[i] );
    }
};

/**
 * Set the animator to the play state
 */
ArmatureAnimator.prototype.play = function ( )
{
};

