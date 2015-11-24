var state;

function initState() {

	state = {
		active:		false,
		dirty:		false,
		n:		0,
		path:		null,
		paths:		[],
		sp:		null,
		width:		400,
		height:		300,
		precision:	4,
		normal:		64,
		step:		1,
		debug:		false,
		grid:		true,
		gap:		17
	};

	bs.disabled = true;
	br.disabled = true;

	s.style.border = "1px solid black";

	con.innerHTML = "";
	dbg.innerHTML = "";
	s.innerHTML = "";

	s.appendChild(createGrid('grid', state.width, state.height, state.gap));

	bgl.style.backgroundColor = state.grid ? "black" : "white";
	bdl.style.backgroundColor = state.debug ? "black" : "white";
};

function hypot() {
	var x = 0;
	for(var n = 0; n < arguments.length; n++)
		x += Math.pow(arguments[n], 2);
	return Math.sqrt(x);
}

function Path(dim) {
	this.vector = [];
	for(var n = 0; n < dim; n++)
		this.vector.push([]);
}

Path.prototype.dimensions = function() {
	return this.vector.length;
};

Path.prototype.toString = function(type) {

		var s = "";

		if(type === "d") {

				for(var n = 0; n < this.length(); n++) {
						for(var m = 0; m < this.dimensions(); m++) {
								s += m ? "," : (n ? "l" : "M");
								s += this.vector[m][n];
						}
						s += (n + 1 == this.length()) ? "" : " ";
				}

		} else {


				s += this.dimensions().toString() + 'x' + this.length().toString();
				s += ' |' + this.arcLength().toPrecision(state.precision)  + '| = ';

				for(var n = 0; n < this.length(); n++) {

						for(m = 0; m < this.dimensions(); m++) {
								s += this.vector[m][n].toPrecision(state.precision);
								if(m < this.dimensions() - 1)
										s += " ";
						}

						if(n < this.length() - 1)
								s += " / ";
				}

		}

		return s;
};

Path.prototype.normalize = function(norm) {
	var coef = norm / this.arcLength();
	for(var n = 0; n < this.length(); n++)
		for(m = 0; m < this.dimensions(); m++)
			this.vector[m][n] *= coef;
};

Path.prototype.arcLength = function() {
	var x = 0;
	var args = [];
	for(var n = 0; n < this.length(); n++) {
		for(var m = 0; m < this.dimensions(); m++)
			args[m] = this.vector[m][n];
		x += hypot.apply(null, args);
	}
	return x;
};

Path.prototype.length = function() {
	return this.vector[0].length;
};

Path.prototype.push = function() {
	for(var m = 0; m < this.dimensions(); m++)
		this.vector[m].push(arguments[m]);
};

Path.prototype.dx = function() {

	for(var n = 1; n < this.length(); n++)
		for(var m = 0; m < this.dimensions(); m++)
			this.vector[m][n - 1] = this.vector[m][n] - this.vector[m][n - 1];

	for(var m = 0; m < this.dimensions(); m++)
		this.vector[m].pop();
};

Path.prototype.column = function(n) {
	var v = [];
	for(var m = 0; m < this.dimensions(); m++)
		v.push(this.vector[m][n]);
	return v;
};

Path.prototype.zero = function() {
	var v = [];
	for(var m = 0; m < this.dimensions(); m++)
		v.push(0);
	return v;
}

Path.prototype.step = function(n,x,r) {

	if(n == this.length())
		return { n: n, x: 0, v: this.zero() };

	var v = this.column(n);
	var h = hypot.apply(null, v);
	var dh = (1 - x) * h;

	if(r < dh) {

		var coef = r / h;

		for(var i = 0; i < v.length; i++)
			v[i] *= coef;

		return { n: n, x: x + coef, v: v };

	}

	var w = this.step(n + 1, 0, r - dh);

	for(var i = 0; i < v.length; i++)
		w.v[i] += (1 - x) * v[i];

	return w;
};

Path.prototype.resample = function(step) {

	var path = new Path(this.dimensions());
	var n = 0;
	var x = 0;

	var samples = Math.round(this.arcLength() / step);

	while(n < this.length() && path.length() < samples) {
		var w = this.step(n, x, step);
		n = w.n;
		x = w.x;
		this.push.apply(path, w.v);
	}

	return path;
};

Path.prototype.createElement = function() {

		var e = document.createElementNS("http://www.w3.org/2000/svg", "path");

		e.setAttribute("stroke","green");
		e.setAttribute("stroke-width","2px");
		e.setAttribute("fill", "none");

		e.setAttribute("d", this.toString("d"));

		return e;
};

function log(o,str) {
	if(state.debug) {
		state.n++;
		o.innerHTML += "[" + state.n.toString() + "] " + str + "<br>";
		o.scrollTop = o.scrollHeight;
	}
}

function toString(n) {
	return n.toPrecision(state.precision);
}

function setDim(o,x,y) {
	o.style.width = x.toString() + "px";
	o.style.height = y.toString() + "px";
}

function createGrid(id, width, height, gap) {

	var e = document.createElementNS("http://www.w3.org/2000/svg", "path");

	e.setAttribute("id", id);

	e.setAttribute("stroke","lightsteelblue");
	e.setAttribute("stroke-width","1px");
	e.setAttribute("fill", "none");

	var path = "";

	for(var y = gap - 0.5; y < height; y += gap)
		path += "M 0 " + y.toString() + " l " + width.toString() + " 0 ";

	for(var x = gap - 0.5; x < width; x += gap)
		path += "M " + x.toString() + " 0 l 0 " + height.toString() + " ";

	e.setAttribute("d", path);

	return e;
}

function pen_down(e) {

	log(dbg, "svg pen_down(" + e.type + ")");

	if(!state.active) {

		state.active = true;

		s.style.border = "1px dashed black";

		if(!state.dirty) {

			state.dirty = true;

			br.disabled = false;
			bs.disabled = false;

			log(dbg, "buttons enabled!");
		}

		if(e.type == "touchstart") {
			e.offsetX = e.touches[0].pageX;
			e.offsetY = e.touches[0].pageY;
		}

		state.path = new Path(2);

		state.path.push(e.offsetX, e.offsetY);

		state.sp = document.createElementNS("http://www.w3.org/2000/svg", "path");

		state.sp.setAttribute("stroke","green");
		state.sp.setAttribute("stroke-width","2px");
		state.sp.setAttribute("fill", "none");
		state.sp.setAttribute("d", "M" + e.offsetX.toString() + " " + e.offsetY.toString());

		s.appendChild(state.sp);
	}
}

function pen_up(e) {

	log(dbg, "svg pen_up(" + e.type + ")");

	if(state.active) {

		state.active = false;

		s.style.border = "1px solid black";

		state.path.dx();
		state.path.normalize(state.normal);
		state.path = state.path.resample(state.step);
		state.path.normalize(state.normal);

		var str = "path #" + state.paths.length.toString() + ' ' + state.path.toString("d");

		var p_element = document.createElement("p");

		p_element.appendChild(document.createTextNode(str));

		con.appendChild(p_element);

		state.paths.push(state.path);

		log(dbg, "paths=" + state.paths.length.toString() + " path=" + state.path.length().toString());
	}
}

function pen_move(e) {

	if(state.active) {

		if(e.type == "touchmove") { 
			e.offsetX = e.touches[0].pageX;
			e.offsetY = e.touches[0].pageY;
		}

		state.path.push(e.offsetX, e.offsetY);

		log(dbg, "svg pen_move(" + e.type + "): #" + state.path.length() + " <" + toString(e.offsetX) + "," + toString(e.offsetY) + ">");

		state.sp.setAttribute("d", state.sp.getAttribute("d") + " L" + e.offsetX.toString() + " " + e.offsetY.toString());
	}
}

window.onload = function(e) {

	initState();

	s.setAttribute("width", state.width);
	s.setAttribute("height", state.height);

	setDim(dbg, state.width, state.height);
	setDim(con, dbg.offsetWidth + dash.offsetWidth + s.offsetWidth + 12, state.height);

	log(dbg, "Hello there, mother fucker!");

	s.onmouseleave = pen_up;
	s.onmouseup = pen_up;
	s.onmousedown = pen_down;

	s.ontouchstart = pen_down;
	s.ontouchend = pen_up;

	s.onmousemove = pen_move;
	s.ontouchmove = pen_move;

	bs.onclick = function(e) {
		initState();
		log(dbg, "save button clicked!");
	};

	br.onclick = function(e) {
		initState();
		log(dbg, "reset button clicked!");
	};

	bd.onclick = function(e) {
		state.debug = !state.debug;
		bdl.style.backgroundColor = state.debug ? "black" : "white";
	}

	bg.onclick = function(e) {
		state.grid = !state.grid;
		bgl.style.backgroundColor = state.grid ? "black" : "white";
		document.getElementById("grid").setAttribute("stroke", state.grid ? "lightsteelblue" : "white");
	}
};
