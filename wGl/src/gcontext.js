/**
 * @constructor
 */
function GContext(canvas, shaderSrcMap)
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
    
    this.renderStrategy = new GRenderStrategy( gl, shaderSrcMap );
    
    
    whiteTexture.bindToContext(gl);
    gl.whiteTexture = whiteTexture;
}
	
GContext.prototype.setScene = function (scene_)
{
    this.scene = scene_;
    this.scene.bindToContext(this.gl);
}

GContext.prototype.setHud = function ( hud_ )
{
    this.hud = hud_;
    this.hud.bindToContext(this.gl);
}

GContext.prototype.draw = function()
{
    this.renderStrategy.draw(this.scene, this.hud);
}


