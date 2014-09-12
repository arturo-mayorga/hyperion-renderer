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
function PointingEvent( x, y )
{
    this.x = x;
    this.y = y;
}

PointingEvent.prototype.getX = function()
{
    return this.x;
};

PointingEvent.prototype.getY = function()
{
    return this.y;
};

/**
 * @interface
 */
function IContextMouseObserver() {}

/**
 * @param {PointingEvent}
 */
IContextMouseObserver.prototype.onMouseDown = function( ev ) { return false; };

/**
 * @param {PointingEvent}
 */
IContextMouseObserver.prototype.onMouseUp = function( ev ) { return false; };

/**
 * @param {PointingEvent}
 */
IContextMouseObserver.prototype.onMouseMove = function( ev ) { return false; };

/**
 * @constructor
 */
function GContext( canvas )
{
    this.canvas           = canvas;
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
    canvas.onmousedown = function(ev) {_this.handleMouseDown(ev);};
    document.onmouseup = function(ev) {_this.handleMouseUp(ev);};
    document.onmousemove = function(ev) {_this.handleMouseMove(ev);};
    
    document.addEventListener('touchstart', function(e){_this.handleTouchStart(e);}, false);
    document.addEventListener('touchmove', function(e){_this.handleTouchMove(e);}, false);
    document.addEventListener('touchend', function(e){_this.handleTouchEnd(e);}, false);

	
    var gl = this.gl;
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    
    this.renderStrategyFactory = new GRenderStrategyFactory( gl );
    
    this.renderStrategy = this.renderStrategyFactory.creteBestFit();
    
    
    whiteTexture.bindToContext(gl);
    randomTexture.bindToContext(gl);
    whiteCircleTexture.bindToContext(gl);
    gl.whiteCircleTexture = whiteCircleTexture;
    gl.whiteTexture = whiteTexture;
    gl.randomTexture = randomTexture;
    
    this.dom = {};
    this.dom.window = window;
    this.dom.document = document;
    this.dom.element = this.dom.document.documentElement;
    this.dom.body = this.dom.document.getElementsByTagName('body')[0];
}

/**
 * @return {boolean} return true if the render level was changed
 */
GContext.prototype.increaseRenderLevel = function()
{
    var increased = this.renderStrategy.increaseRenderLevel();
    
    if ( false === increased )
    {
        // we were unable to increase the level, see if we can find a differen strategy
        var newStrategy = this.renderStrategyFactory.createNextRenderLevel( this.renderStrategy.getName() );
        
        if ( null !== newStrategy )
        {
            this.renderStrategy.deleteResources();
            this.renderStrategy = newStrategy;
            increased = true;
        }
    }
    
    return increased;
};

/**
 * @return {boolean} return true if the render level was changed
 */
GContext.prototype.decreaseRenderLevel = function()
{
    var decreased = this.renderStrategy.decreaseRenderLevel();
    
    if ( false === decreased )
    {
        // we were unable to increase the level, see if we can find a differen strategy
        var newStrategy = this.renderStrategyFactory.createPreviousRenderLevel( this.renderStrategy.getName() );
        
        if ( null !== newStrategy )
        {
            this.renderStrategy.deleteResources();
            this.renderStrategy = newStrategy;
            decreased = true;
        }
    }
    
    return decreased;
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
 * @param {TouchEvent}
 */
GContext.prototype.handleTouchStart = function(ev)
{
   var x = ev.targetTouches[0].clientX/ev.target.clientWidth;
   var y = ev.targetTouches[0].clientY/ev.target.clientHeight;
   var pev = new PointingEvent( x, y );
   var ret = false;
   
   for ( var i in this.mouseObservers )
   {
       ret = this.mouseObservers[i].onMouseDown( pev );
       if ( ret ) return;
   }
};

/**
 * @param {MouseEvent}
 */
GContext.prototype.handleMouseDown = function(ev)
{
   var x = ev.x/ev.toElement.clientWidth;
   var y = ev.y/ev.toElement.clientHeight;
   var pev = new PointingEvent( x, y );
   var ret = false;
   
   for ( var i in this.mouseObservers )
   {
       ret = this.mouseObservers[i].onMouseDown( pev );
       if ( ret ) return;
   }
};

/**
 * @param {TouchEvent}
 */
GContext.prototype.handleTouchEnd = function(ev)
{
   var x = 0;//ev.targetTouches[0].clientX/ev.target.clientWidth;
   var y = 0;//ev.targetTouches[0].clientY/ev.target.clientHeight;
   var pev = new PointingEvent( x, y );
   var ret = true;
   
   for ( var i in this.mouseObservers )
   {
       ret = this.mouseObservers[i].onMouseUp( pev );
       if ( ret ) return;
   }
};

/**
 * @param {MouseEvent}
 */
GContext.prototype.handleMouseUp = function(ev)
{
   var x = ev.x/ev.toElement.clientWidth;
   var y = ev.y/ev.toElement.clientHeight;
   var pev = new PointingEvent( x, y );
   var ret = false;
   
   for ( var i in this.mouseObservers )
   {
       ret = this.mouseObservers[i].onMouseUp( pev );
       if ( ret ) return;
   }
};

/**
 * @param {TouchEvent}
 */
GContext.prototype.handleTouchMove = function(ev)
{
   var x = ev.targetTouches[0].clientX/ev.target.clientWidth;
   var y = ev.targetTouches[0].clientY/ev.target.clientHeight;
   var pev = new PointingEvent( x, y );
   var ret = false;
   
   for ( var i in this.mouseObservers )
   {
       ret = this.mouseObservers[i].onMouseMove( pev );
       if ( ret ) return;
   }
};

/**
 * @param {MouseEvent}
 */
GContext.prototype.handleMouseMove = function(ev)
{
   var x = ev.x/ev.toElement.clientWidth;
   var y = ev.y/ev.toElement.clientHeight;
   var pev = new PointingEvent( x, y );
   var ret = false;
   
   for ( var i in this.mouseObservers )
   {
       ret = this.mouseObservers[i].onMouseMove( pev );
       if ( ret ) return;
   }
};

/**
 * @param {PointingEvent}
 * @return {number}
 */
GContext.prototype.getSceneObjectIdAt = function ( pev )
{
    var x = Math.round(1024*pev.getX());
    var y = 1024-Math.round(1024*pev.getY());
    
    return this.renderStrategy.getObjectIdAt( x, y );
};

/**
 * @param {PointingEvent}
 * @return {number}
 */
GContext.prototype.getHudObjectIdAt = function ( pev )
{
    var x = Math.round(1024*pev.getX());
    var y = 1024-Math.round(1024*pev.getY());
    
    return this.renderStrategy.getHudObjectIdAt( x, y );
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
    var x = this.dom.window.innerWidth  || this.dom.element.clientWidth  || this.dom.body.clientWidth;
    var y = this.dom.window.innerHeight || this.dom.element.clientHeight || this.dom.body.clientHeight;
    
    this.scene.getCamera().setAspect( x/y );
    
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

/**
 * used to enter full screen mode
 */
GContext.prototype.requestFullScreen = function()
{
    var c = this.canvas;
    
    if( c.webkitRequestFullscreen )
    {
        c.webkitRequestFullscreen();
    }
    else if( c.mozRequestFullScreen)
    {
        c.mozRequestFullScreen();
    } 
};

/**
 * @return {boolean} true if the context is currently in full screen mode
 */
GContext.prototype.isFullScreen = function ()
{
    var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
    var fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled;

    return fullscreenEnabled && null !== fullscreenElement;
};

