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
    
    this.gl = canvas.getContext("experimental-webgl", { antialias: true } );
	
    var gl = this.gl;
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    
    var renderStrategyFactory = new GRenderStrategyFactory( gl );
    
    this.renderStrategy = renderStrategyFactory.creteBestFit();
    
    
    whiteTexture.bindToContext(gl);
    gl.whiteTexture = whiteTexture;
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


