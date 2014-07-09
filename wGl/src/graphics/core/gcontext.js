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
function GContext( canvas )
{
	this.scene            = undefined;
	this.gl               = undefined;
	this.rttFramebuffer   = undefined;
	this.rttTexture       = undefined;
	this.screenVertBuffer = undefined;
	this.screenTextBuffer = undefined;
	this.screenIndxBuffer = undefined;
	this.currentProgram   = undefined;
	
	var whiteTexture = new GTexture(["white.jpg"], "assets/2d/");
	var randomTexture = new GTexture(["noise_1024.png"], "assets/2d/");
    
    this.gl = canvas.getContext("webgl", { antialias: true } );
	
    var gl = this.gl;
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    
    var renderStrategyFactory = new GRenderStrategyFactory( gl );
    
    this.renderStrategy = renderStrategyFactory.creteBestFit();
    
    
    whiteTexture.bindToContext(gl);
    randomTexture.bindToContext(gl);
    gl.whiteTexture = whiteTexture;
    gl.randomTexture = randomTexture;
};
	
/**
 * Set the Scene for this context
 * @param {GScene} Scene that is being assigned to this context
 */
GContext.prototype.setScene = function (scene_)
{
    this.scene = scene_;
    this.scene.bindToContext(this.gl);
};

/**
 * Set the HUD for this context
 * @param {GHudController} Controller that is being assigned to this context
 */
GContext.prototype.setHud = function ( hud_ )
{
    this.hud = hud_;
    this.hud.bindToContext(this.gl);
};

/**
 * Draw the current context with it's scene and HUD elements
 */
GContext.prototype.draw = function()
{
    this.renderStrategy.draw(this.scene, this.hud);
};

/**
 * Check if the context is ready for rendering
 * @returns {boolean}
 */
GContext.prototype.isReady = function()
{
    return this.renderStrategy.isReady();
};

/**
 * Reoload the current render strategy.  This is useful for doing things like
 * reloading the shader programs without having to restart the application
 */
GContext.prototype.reloadRenderStrategy = function()
{
    this.renderStrategy.reload();
};


