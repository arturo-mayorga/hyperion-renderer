
/**
 * @return {FsmState}
 * @param {GScene} scene Scene that is driven by the returned state machine
 */
function createLesson( scene )
{
	var ret = new FsmMachine();
	
	ret.addState("Load", new LoadState( scene ));
	ret.addState("Explore", new ExploreState( scene ));
	
	ret.addTransition( "Load", "loadComplete", "Explore" );
	ret.setState("Load");
	return ret;
}

/**
 * @constructor
 * @implements {FsmState}
 * @implements {GObjLoaderObserver}
 * @param {GScene} scene Scene that is driven by this state
 */
function LoadState( scene ) 
{
    this.scene = scene;
	this.loader = new GObjLoader(this.scene);
	this.loader.setObserver(this);
}

/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
LoadState.prototype.setSignalObserver = FsmState.prototype.setSignalObserver;

/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
LoadState.prototype.fireSignal = FsmState.prototype.fireSignal;

LoadState.prototype.enter = function () 
{
	console.debug("entering LoadState");
	this.loader.loadObj("assets/3d/office3d/18361-obj-4/", "OfficeOBJ.obj");
};

LoadState.prototype.exit = function () 
{
	console.debug("exiting LoadState");
};

LoadState.prototype.update = function (time) 
{
    this.loader.update(time);
};
 
LoadState.prototype.onObjLoaderCompleted = function () 
{
    this.fireSignal("loadComplete");
};

/**
 * @param {number} progress Progress value
 */
LoadState.prototype.onObjLoaderProgress = function ( progress ) 
{
};


/**
 * @constructor
 * @implements {FsmState}
 * @param {GScene} scene Scene that is driven by this state
 */
function ExploreState( scene ) 
{
    this.scene = scene;
}
/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
ExploreState.prototype.setSignalObserver = FsmState.prototype.setSignalObserver;
/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
ExploreState.prototype.fireSignal = FsmState.prototype.fireSignal;

ExploreState.prototype.enter = function () 
{
	console.debug("entering ExploreState");
};
ExploreState.prototype.exit = function () 
{
	console.debug("exiting ExploreState");
};
ExploreState.prototype.update = function (time) 
{
};

