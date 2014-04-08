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

GRenderStrategy.prototype.reload = function() {};


/**
 * @param {GScene} scene Scene object that needs to be drawn
 * @param (GHudController} hud Hud controller that needs to be drawn
 */
GRenderStrategy.prototype.draw = function ( scene, hud ) {};

/**
 * @constructor
 */
function GRenderStrategyFactory(gl)
{
    this.gl = gl;
    this.strategyMap = 
    {
        "simplePhong": function(gl) { return new GRenderPhongStrategy( gl ); },
        "deferredPhong": function(gl) { return new GRenderDeferredStrategy( gl ); }
    };
    
}

/**
 * @returns {GRenderStrategy}
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
 * @returns {GRenderStrategy}
 */
GRenderStrategyFactory.prototype.creteBestFit = function ()
{
   // return this.createByName( "deferredPhong" );
    return this.createByName( "simplePhong" );
};



