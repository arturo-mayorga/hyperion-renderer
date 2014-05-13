/**
 * @interface
 */
function GRenderStrategy()
{
}

/**
 * @return {boolean}
 */
GRenderStrategy.prototype.isReady = function() {return false;};

/**
 * Request to reload the current strategy
 */
GRenderStrategy.prototype.reload = function() {};


/**
 * Draw the current strategy
 * @param {GScene} scene Scene object that needs to be drawn
 * @param (GHudController} hud Hud controller that needs to be drawn
 */
GRenderStrategy.prototype.draw = function ( scene, hud ) {};

/**
 * @constructor
 * @param {WebGLRenderingContext}
 */
function GRenderStrategyFactory( gl )
{
    this.gl = gl;
    this.strategyMap = 
    {
        "simplePhong": function(gl) { return new GRenderPhongStrategy( gl ); },
        "deferredPhong": function(gl) { return new GRenderDeferredStrategy( gl ); }
    };
    
}

/**
 * Create a new render strategy using the given name
 * @param {string}
 * @return {GRenderStrategy}
 */
GRenderStrategyFactory.prototype.createByName = function ( name )
{
    var createFn = this.strategyMap[name];
    if ( undefined != createFn )
    {
        return createFn(this.gl);
    }
    
    return null;
};

/**
 * @return {GRenderStrategy}
 */
GRenderStrategyFactory.prototype.creteBestFit = function ()
{ 
     return this.createByName( "deferredPhong" );
    //return this.createByName( "simplePhong" );
};



