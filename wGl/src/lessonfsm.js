
/**
 * @return {FsmState}
 */
function createLesson()
{
	var ret = new FsmMachine();
	
	ret.addState("state1", new State1());
	ret.addTransition( "state1", "sig", "state1" );
	ret.setState("state1");
	return ret;
}

/**
 * @constructor
 * @implements {FsmState}
 */
function State1() {}
State1.prototype.update = function (time) {};
State1.prototype.enter = function () 
{
	console.debug("entering State1");
};
State1.prototype.exit = function () 
{
	console.debug("exiting State1");
};

/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
State1.prototype.setSignalObserver = FsmState.prototype.setSignalObserver;

/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
State1.prototype.fireSignal = FsmState.prototype.fireSignal;