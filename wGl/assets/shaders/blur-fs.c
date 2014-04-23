precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;

const float numSamples = 4.0;

float pw = 1.0/256.0*0.5; 
float ph = 1.0/256.0*0.5;

vec3 colAtOffset(vec3 defColor, vec2 offset)
{
    vec2 newTc = vTexCoordinate + offset;
    
    return texture2D(uMapKd,       newTc).xyz;
}



void main(void)
{
	vec3 tv3Color    = texture2D(uMapKd,       vTexCoordinate).xyz;

	
    
	vec3 newC = tv3Color;
    
    newC += colAtOffset(tv3Color, vec2(pw, 0));
    newC += colAtOffset(tv3Color, vec2(-pw, 0));
    newC += colAtOffset(tv3Color, vec2(0, ph));
    newC += colAtOffset(tv3Color, vec2(0, -ph));
    
    newC += colAtOffset(tv3Color, vec2(pw, ph));
    newC += colAtOffset(tv3Color, vec2(pw,-ph));
    newC += colAtOffset(tv3Color, vec2(-pw, ph));
    newC += colAtOffset(tv3Color, vec2(-pw, -ph));
         
        
    newC /= 9.0;
    
    gl_FragColor = vec4(newC, 1);
} 



