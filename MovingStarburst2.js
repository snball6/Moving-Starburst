
/**
 *  Draws starburst shape that will move to the location of a mouse-click. 
 *  
 *  Adapted off of shape-stamper.html (http://math.hws.edu/graphicsbook/source/webgl/shape-stamper.html)
 *  and moving-points.html (http://math.hws.edu/graphicsbook/source/webgl/moving-points.html)
 *  Both are examples from the online textbook Introduction to Computer Graphics by David J. Eck
 *  available online at: http://math.hws.edu/graphicsbook/
 *  
 *  Date: 2018-04-27
 *  Author: Sarah Ball
 *
 *  Adapted: 2018-08-11
 *  Changes: Updated to be embedded into a blog post on my website http://ThePixelatedDragon.com
*/

"use strict";

var vertexShaderSource =
       "attribute vec2 a_coords;\n" +
       "uniform float u_width;\n" +
       "uniform float u_height;\n" +
       "void main() {\n" +
       "   float x = -1.0 + 2.0*(a_coords.x / u_width);\n" +
       "   float y = 1.0 - 2.0*(a_coords.y / u_height);\n" +
       "   gl_Position = vec4(x, y, 0.0, 1.0);\n" +
       "}\n";

var fragmentShaderSource =
       "precision mediump float;\n" +
       "uniform vec3 u_color;\n" +
       "uniform float u_alpha;\n" +
       "void main() {\n" +
       "   gl_FragColor = vec4(u_color, u_alpha);\n" +
       "}\n";

var canvas;  // The canvas where WebGL draws.

var gl;  // The WebGL graphics context.

var uniformWidth;   // Location of uniform named "u_width"
var uniformHeight;  // Location of uniform named "u_height"
var uniformColor;   // Location of uniform named "u_color" (for RGB components)
var uniformAlpha;   // Location of uniform named "u_alpha" (for alpha components)

var attributeCoords;  // Location of the attribute named "a_coords".
var bufferCoords;     // A vertex buffer object to hold the values for coords.

//storing target and current coordinates
var mouseX; 
var mouseY;
var starX;
var starY;

var speed;

var preventSlide;

/**
 *  clears canvas and draws star
 */
function draw() {
    gl.clearColor(1,1,1,1);  // specify the color to be used for clearing
    gl.clear(gl.COLOR_BUFFER_BIT);  // clear the canvas 
       
	//assign color
    gl.uniform3fv(uniformColor, [0, 0.5, 0.5]);
    gl.uniform1f(uniformAlpha, 1);
	
	/*assign coordinates for starburst*/
	var coords = new Float32Array(44);// a Float32Array to hold the coordinates.
    var k = 0; //index counter for coords array
    coords[k++] = starX;
    coords[k++] = starY;
    for (var i = 0; i <= 20; i++) {
        var angle = -Math.PI/2 + i/20 * 2*Math.PI;
        var radius = (i % 2 == 0)? 50 : 21;
        coords[k++] = starX + radius*Math.cos(angle);  // x-coord of vertex
        coords[k++] = starY + radius*Math.sin(angle);  // y-coord of vertex
    }
       
    /* Transfer the attribute values to the VBO, and draw the shape */
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.bufferData(gl.ARRAY_BUFFER, coords, gl.STREAM_DRAW);
    gl.vertexAttribPointer(attributeCoords, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, coords.length/2); 
}

/*
* Updates star coordinates - proximity check needed to keep 
* star from "shaking" back and forth over target. 
*/
function updateCoordinates(){
	var xProx = starX - mouseX; 
	var yProx = starY - mouseY;
	var adjSpeedX = speed;
	var adjSpeedY = speed;
	
	/* Just this section adjust movement to prevent "slide"*/	
	if(preventSlide) {
		if(Math.abs(xProx)>Math.abs(yProx)){
			adjSpeedY = Math.abs(yProx)/(Math.abs(xProx)/speed);
		} else if(Math.abs(xProx)<Math.abs(yProx)){
			adjSpeedX = Math.abs(xProx)/(Math.abs(yProx)/speed);
		}	
	} else{
		adjSpeedX = speed;
		adjSpeedY = speed;
	}
	
	if(xProx<=adjSpeedX && xProx >=(-adjSpeedX)){
		//so close just align
		starX = mouseX;
	} else if (xProx > adjSpeedX){
		starX-=adjSpeedX;
	} else {
		starX+=adjSpeedX;
	}
	if(yProx<=adjSpeedY && yProx >=(-adjSpeedY)){
	    //so close just align
		starY = mouseY;
	} else if (yProx > adjSpeedY){
		starY-=adjSpeedY;
	} else {
		starY+=adjSpeedY;
	}
}

/*
* On mouse click, update mouse coordinate values
*/
function doMouseDown(event) {
    /* Get mouse position (x,y) in pixel coords on the canvas. */
    var r = canvas.getBoundingClientRect();
    mouseX = event.clientX - r.left;
    mouseY = event.clientY - r.top;
}

/**
 * Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type String is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 */
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
   var vsh = gl.createShader( gl.VERTEX_SHADER );
   gl.shaderSource( vsh, vertexShaderSource );
   gl.compileShader( vsh );
   if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
      throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
   }
   var fsh = gl.createShader( gl.FRAGMENT_SHADER );
   gl.shaderSource( fsh, fragmentShaderSource );
   gl.compileShader( fsh );
   if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
      throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
   }
   var prog = gl.createProgram();
   gl.attachShader( prog, vsh );
   gl.attachShader( prog, fsh );
   gl.linkProgram( prog );
   if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
      throw "Link error in program:  " + gl.getProgramInfoLog(prog);
   }
   return prog;
}

/**
 * Initialize the WebGL graphics context, and fill the canvas with white.
 */
function initGL() {
    var prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );
    gl.useProgram(prog);
    attributeCoords = gl.getAttribLocation(prog, "a_coords");
    bufferCoords = gl.createBuffer();
    gl.enableVertexAttribArray(attributeCoords); 
    uniformWidth = gl.getUniformLocation(prog, "u_width");
    uniformHeight = gl.getUniformLocation(prog, "u_height");
    uniformColor = gl.getUniformLocation(prog, "u_color");
    uniformAlpha = gl.getUniformLocation(prog, "u_alpha");
    gl.uniform1f(uniformHeight, canvas.height);
    gl.uniform1f(uniformWidth, canvas.width);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
	
	//start star in center, assign matching starting values to mouse click
	starX = canvas.width/2;
	starY = canvas.height/2;
	mouseX = starX;
	mouseY = starY;
	
	//starting speed
	speed = 2;
	//starting slide value
	preventSlide = false;
} 

/*
* Animation
*/
function doAnimation() {
	updateCoordinates();
    draw();
    requestAnimationFrame(doAnimation);//recursive call that keeps animation running
}

/**
 * Initialize the program.  This function is called after the page has been loaded.
 */
function init() {
    try {
        canvas = document.getElementById("canvas");
        var options = { 
            alpha: false,
            depth: false,
            preserveDrawingBuffer: false
        };
        gl = canvas.getContext("webgl", options) || 
                         canvas.getContext("experimental-webgl", options);
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context:" + e + "</p>";
        return;
    }
	document.getElementById("speedChoice").value = "2"; //default in dropdown
    document.getElementById("speedChoice").onchange = function() { 
		speed = Number(document.getElementById("speedChoice").value);
	}
	document.getElementById("preventSlide").value = "0";
    document.getElementById("preventSlide").onchange = function() { 
	 var selection = document.getElementById("preventSlide").value;
		if(selection==1){
			preventSlide = true;
		}else {
			preventSlide = false;
		}
	}   
    canvas.addEventListener("mousedown", doMouseDown, false);
	
	doAnimation();
}
