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
function IContextMouseObserver() {}

/**
 * @param {MouseEvent}
 * @param {number}
 */
IContextMouseObserver.prototype.onMouseDown = function( ev, objid ) {};

/**
 * @param {MouseEvent}
 */
IContextMouseObserver.prototype.onMouseUp = function( ev, objid ) {};

/**
 * @param {MouseEvent}
 */
IContextMouseObserver.prototype.onMouseMove = function( ev, objid ) {};

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
	this.mouseObservers = [];
	
	var whiteTexture = new GTexture(["white.jpg"], "assets/2d/");
	var randomTexture = new GTexture(["noise_1024.png"], "assets/2d/");
	var whiteCircleTexture = new GTexture(["whitecircle_1024.png"], "assets/2d/");
    
    this.gl = canvas.getContext("webgl", { antialias: true } );
    
    if ( undefined === this.gl ||
         null === this.gl )
    {
        this.gl = canvas.getContext("experimental-webgl", { antialias: true } );
    }
    
    var _this = this;
    canvas.onmousedown = function(ev) {_this.handleMouseDown(ev);}
    document.onmouseup = function(ev) {_this.handleMouseUp(ev);}
    document.onmousemove = function(ev) {_this.handleMouseMove(ev);}
	
    var gl = this.gl;
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    
    var renderStrategyFactory = new GRenderStrategyFactory( gl );
    
    this.renderStrategy = renderStrategyFactory.creteBestFit();
    
    
    whiteTexture.bindToContext(gl);
    randomTexture.bindToContext(gl);
    whiteCircleTexture.bindToContext(gl);
    gl.whiteCircleTexture = whiteCircleTexture;
    gl.whiteTexture = whiteTexture;
    gl.randomTexture = randomTexture;
};

/**
 * @param {IContextMouseObserver}
 */
GContext.prototype.addMouseObserver = function( observer )
{
    this.mouseObservers.push( observer );
};

/**
 * @param {IContextMouseObserver}
 */
GContext.prototype.removeMouseObserver = function( observer )
{
    var i = this.mouseObservers.indexOf( observer );
    
    if ( i < 0 )
    {
        return;
    }
    
    this.mouseObservers.splice( i, 1 );
};

/**
 * @param {MouseEvent}
 */
GContext.prototype.handleMouseDown = function(ev)
{
   // console.debug(ev);
   
   var x = Math.round(1024*ev.x/ev.toElement.clientWidth);
   var y = 1024-Math.round(1024*ev.y/ev.toElement.clientHeight);
   var objid = this.renderStrategy.getObjectIdAt(x,y);
   
   for ( var i in this.mouseObservers )
   {
       this.mouseObservers[i].onMouseDown(ev, objid);
   }
};

/**
 * @param {MouseEvent}
 */
GContext.prototype.handleMouseUp = function(ev)
{
   // console.debug(ev);
   
   // var x = Math.round(1024*ev.x/ev.toElement.clientWidth);
   // var y = 1024-Math.round(1024*ev.y/ev.toElement.clientHeight);
   // var objid = this.renderStrategy.getObjectIdAt(x,y);
   
   for ( var i in this.mouseObservers )
   {
       this.mouseObservers[i].onMouseUp(ev);
   }
};

/**
 * @param {MouseEvent}
 */
GContext.prototype.handleMouseMove = function(ev)
{
   //console.debug(ev);
   
   // var x = Math.round(1024*ev.x/ev.toElement.clientWidth);
   // var y = 1024-Math.round(1024*ev.y/ev.toElement.clientHeight);
   // var objid = this.renderStrategy.getObjectIdAt(x,y);
   
   for ( var i in this.mouseObservers )
   {
       this.mouseObservers[i].onMouseMove(ev);
   }
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
 * @return {GScene}
 */
GContext.prototype.getScene = function ()
{
    return this.scene;
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
 * @return {GHudController}
 */
GContext.prototype.getHud = function ()
{
    return this.hud;
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


