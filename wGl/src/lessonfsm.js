
/**
 * @return {FsmState}
 */
function createLesson()
{
	var ret = new FsmMachine();
	
	ret.addState("Load", new LoadState());
	ret.addState("Explore", new ExploreState());
	
	ret.addTransition( "Load", "loadComplete", "Explore" );
	ret.setState("Load");
	return ret;
}

/**
 * @constructor
 * @implements {FsmState}
 */
function LoadState() {}
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
};
LoadState.prototype.exit = function () 
{
	console.debug("exiting LoadState");
};
LoadState.prototype.update = function (time) 
{
	this.fireSignal("loadComplete");
};


/**
 * @constructor
 * @implements {FsmState}
 */
function ExploreState() {}
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

