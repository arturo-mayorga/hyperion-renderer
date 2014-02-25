function GCameraController()
{
    var _dEyePos = vec3.create();
    var _dX, _dY, _dZ;
    var _dPitch, _dRoll, _dYaw;
    
    var _eyePos = vec3.create();
	var _eyeLookAtDir = vec3.create();
	var _eyeUp = vec3.create();
	var _eyeLookAt = vec3.create();
	var _eyeRight = vec3.create();
    
    var _moveSize = .1;
    var _rotSize = .05;
    
    var _cUp, _cDown, _cLeft, cRight = 0;
    var _cPitch, _cRoll, _cYaw = 0;
    
    var _camera;
    
    function init_GCameraController()
    {
        _dEyePos[0] = _dEyePos[1] = _dEyePos[2] = 0;
		_dX = _dY = _dZ = 0;
		_dPitch = _dRoll = _dYaw = 0;
		var thisCam = this;
        window.addEventListener('keydown',onKeyDown,false);
        window.addEventListener("keyup",onKeyUp,false);
    }
	
	var KEY_CODES = 
	{
		LEFT:65, BACK:83, RIGHT:68, FORWARD:87, YAW_LEFT:74,
		YAW_RIGHT:76, PITCH_UP:73, PITCH_DOWN:75, MOVE_UP:82,
		MOVE_DOWN:70, ROLL_LEFT:85, ROLL_RIGHT:79	
	};
	
	var _keydownMap = {}; var _keyupMap = {};
	_keydownMap[KEY_CODES.LEFT]       = function() { _dX = -1 };
	_keyupMap  [KEY_CODES.LEFT]       = function() { if (_dX == -1) {_dX = 0;} };
	_keydownMap[KEY_CODES.BACK]       = function() { _dZ = -1 };
	_keyupMap  [KEY_CODES.BACK]       = function() { if (_dZ == -1) {_dZ = 0;} };
	_keydownMap[KEY_CODES.RIGHT]      = function() { _dX = 1 };
	_keyupMap  [KEY_CODES.RIGHT]      = function() { if (_dX == 1) {_dX = 0;} };
	_keydownMap[KEY_CODES.FORWARD]    = function() { _dZ = 1 };
	_keyupMap  [KEY_CODES.FORWARD]    = function() { if (_dZ == 1) {_dZ = 0;} };
	_keydownMap[KEY_CODES.YAW_LEFT]   = function() { _dYaw = 1 };
	_keyupMap  [KEY_CODES.YAW_LEFT]   = function() { if (_dYaw == 1) {_dYaw = 0;} };
	_keydownMap[KEY_CODES.YAW_RIGHT]  = function() { _dYaw = -1 };
	_keyupMap  [KEY_CODES.YAW_RIGHT]  = function() { if (_dYaw == -1) {_dYaw = 0;} };
	_keydownMap[KEY_CODES.PITCH_UP]   = function() { _dPitch = 1 };
	_keyupMap  [KEY_CODES.PITCH_UP]   = function() { if (_dPitch == 1) {_dPitch = 0;} };
	_keydownMap[KEY_CODES.PITCH_DOWN] = function() { _dPitch = -1 };
	_keyupMap  [KEY_CODES.PITCH_DOWN] = function() { if (_dPitch == -1) {_dPitch = 0;} };
	_keydownMap[KEY_CODES.MOVE_UP]    = function() { _dY = 1 };
	_keyupMap  [KEY_CODES.MOVE_UP]    = function() { if (_dY == 1) {_dY = 0;} };
	_keydownMap[KEY_CODES.MOVE_DOWN]  = function() { _dY = -1 };
	_keyupMap  [KEY_CODES.MOVE_DOWN]  = function() { if (_dY == -1) {_dY = 0;} };
	_keydownMap[KEY_CODES.ROLL_LEFT]  = function() { _dRoll = -1 };
	_keyupMap  [KEY_CODES.ROLL_LEFT]  = function() { if (_dRoll == -1) {_dRoll = 0;} };
	_keydownMap[KEY_CODES.ROLL_RIGHT] = function() { _dRoll = 1 };
	_keyupMap  [KEY_CODES.ROLL_RIGHT] = function() { if (_dRoll == 1) {_dRoll = 0;} };
    
    function onKeyDown(e)
    {
		var handler = _keydownMap[e.keyCode];
		if (handler) { handler(); }
    }
    
    function onKeyUp(e)
    {
		var handler = _keyupMap[e.keyCode];
		if (handler) { handler(); }
    }
    
    this.bindCamera = function( camera )
    {
		var lookAt = vec3.create();
        _camera = camera;
        _camera.getEye(_eyePos);
		_camera.getLookAt(lookAt);
		_camera.getUp(_eyeUp);
		vec3.subtract( _eyeLookAtDir,
					   lookAt, _eyePos );
    }
    
	var _tempDEyePos = vec3.create();
    this.update = function(elapsedTime)
    {
        if ( _camera == undefined ) return;
		
		vec3.cross(_eyeRight, _eyeLookAtDir, _eyeUp);
		
		var r = _dYaw*_rotSize;
		
		var mvMatrix = mat4.create();
		mat4.identity(mvMatrix);
		mat4.rotate(mvMatrix, mvMatrix, _dYaw*_rotSize,   _eyeUp);
		mat4.rotate(mvMatrix, mvMatrix, _dPitch*_rotSize, _eyeRight);
		mat4.rotate(mvMatrix, mvMatrix, _dRoll*_rotSize,  _eyeLookAtDir);
		
		var tVec = vec4.create();
		vec4.set(tVec, _eyeUp[0], _eyeUp[1], _eyeUp[2], 0);
		vec4.transformMat4(tVec, tVec, mvMatrix);
		vec3.set(_eyeUp, tVec[0], tVec[1], tVec[2]);
		
		vec4.set(tVec, _eyeRight[0], _eyeRight[1], _eyeRight[2], 0);
		vec4.transformMat4(tVec, tVec, mvMatrix);
		vec3.set(_eyeRight, tVec[0], tVec[1], tVec[2]);
		
		vec4.set(tVec, _eyeLookAtDir[0], _eyeLookAtDir[1], _eyeLookAtDir[2], 0);
		vec4.transformMat4(tVec, tVec, mvMatrix);
		vec3.set(_eyeLookAtDir, tVec[0], tVec[1], tVec[2]);
 
		vec3.set(_tempDEyePos, 0,0,0);
		
		if (_dZ == 1)
		{
			vec3.add(_tempDEyePos, _tempDEyePos, _eyeLookAtDir);
		}
		else if (_dZ == -1)
		{
			vec3.subtract(_tempDEyePos, _tempDEyePos, _eyeLookAtDir);
		}
		
		if (_dX == 1)
		{
			vec3.add(_tempDEyePos, _tempDEyePos, _eyeRight);
		}
		else if (_dX == -1)
		{
			vec3.subtract(_tempDEyePos, _tempDEyePos, _eyeRight);
		}
		
		if (_dY == 1)
		{
			vec3.add(_tempDEyePos, _tempDEyePos, _eyeUp);
		}
		else if (_dY == -1)
		{
			vec3.subtract(_tempDEyePos, _tempDEyePos, _eyeUp);
		}
		
		vec3.normalize(_tempDEyePos,_tempDEyePos);
		vec3.scale(_tempDEyePos, _tempDEyePos, _moveSize);
		vec3.add(_eyePos, _eyePos, _tempDEyePos);
		
		vec3.add(_eyeLookAt, _eyePos, _eyeLookAtDir);
        
        camera.setEye(_eyePos[0], _eyePos[1], _eyePos[2]);
		camera.setLookAt(_eyeLookAt[0], _eyeLookAt[1], _eyeLookAt[2]);
		camera.setUp(_eyeUp[0], _eyeUp[1], _eyeUp[2]);
    }
    
    init_GCameraController();
}