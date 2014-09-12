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
 * @interface
 */
function GRenderStrategy()
{
}

/**
 * @param {string} new name
 * @return {GRenderStrategy} this.
 */
GRenderStrategy.prototype.setName = function ( name )
{
    this.name = name;
    return this;
};

/**
 * Get the current render level
 * @return {number}
 */
GRenderStrategy.prototype.getRenderLevel = function ()
{
    return 0;
};

/**
 * Set the render level to use
 * @param {number} the new render level
 * @return {boolean} true if the change was applied false otherwise
 */
GRenderStrategy.prototype.setRenderLevel = function ( newLevel )
{
    return false;
};

/**
 * @return {boolean} true if the change was applied
 */
GRenderStrategy.prototype.increaseRenderLevel = function()
{
    var nLevel = this.getRenderLevel() + 1;
    return this.setRenderLevel( nLevel );
};

/**
 * @return {boolean} true if the change was applied
 */
GRenderStrategy.prototype.decreaseRenderLevel = function()
{
    var nLevel = this.getRenderLevel() - 1;
    return this.setRenderLevel( nLevel );
};

/**
 * @return {string} name
 */
GRenderStrategy.prototype.getName = function()
{
    return this.name;
};

/**
 * @return {boolean}
 */
GRenderStrategy.prototype.isReady = function() {return false;};

/**
 * Request to reload the current strategy
 */
GRenderStrategy.prototype.reload = function() {};

/**
 * Get the object id of the object at the provided mouse location
 * @param {number}
 * @param {number}
 */
GRenderStrategy.prototype.getObjectIdAt = function(x,y) { return -1; };

/**
 * Get the object id of the object at the provided mouse location
 * @param {number}
 * @param {number}
 */
GRenderStrategy.prototype.getHudObjectIdAt = function(x,y) { return -1; };


/**
 * Draw the current strategy
 * @param {GScene} scene Scene object that needs to be drawn
 * @param (GHudController} hud Hud controller that needs to be drawn
 */
GRenderStrategy.prototype.draw = function ( scene, hud ) {};

