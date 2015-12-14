var state;

function initState() {

	state = {
		active:		false,
		dirty:		false,
		n:		0,
		path:		null,
		paths:		[],
		sp:		null,
		width:		365,
		height:		300,
		precision:	4,
		normal:		256,
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

var svgns = "http://www.w3.org/2000/svg";

function hypot() {
	var x = 0;
	for(var n = 0; n < arguments.length; n++)
		x += Math.pow(arguments[n], 2);
	return Math.sqrt(x);
}

function evalue() {
	var h = hypot.apply(null, arguments);
	return Math.sqrt(1 - h * h);
}

function dot(u,v) {
	var x = 0;
	for(var i = 0; i < u.length; i++)
		x += u[i] * v[i];
	return x;
}

function Path(dim) {
	this.vector = [];
	for(var n = 0; n < dim; n++)
		this.vector.push([]);
}

Path.mean = function() {

	var mean = new Path(arguments[0].dimensions());

	for(var m = 0; m < mean.dimensions(); m++) {
		for(var n = 0; n < arguments[0].length(); n++) {

			mean.vector[m][n] = 0;

			for(var k = 0; k < arguments.length; k++)
				mean.vector[m][n] += arguments[k].vector[m][n];

			mean.vector[m][n] /= arguments.length;
		}
	}

	return mean;
};

Path.covariance = function() {

	var mu = Path.mean.apply(null, arguments);

	var sigma = new Path(mu.dimensions() * mu.dimensions());

	for(var n = 0; n < mu.length(); n++) {

		for(var i = 0; i < mu.dimensions(); i++) {
			for(var j = 0; j < mu.dimensions(); j++) {

				var cov = 0;

				for(var k = 0; k < arguments.length; k++)
					cov += (arguments[k].vector[i][n] - mu.vector[i][n]) * (arguments[k].vector[j][n] - mu.vector[j][n]); 

				cov /= arguments.length;

				sigma.vector[i + j * mu.dimensions()][n] = cov;
			}
		}
	}

	return sigma;
};

Path.eigensystem = function() {

	var sigma = Path.covariance.apply(null, arguments);

	var lambda = new Path(arguments[0].dimensions());

	switch(lambda.dimensions()) {

		case 1:

			for(var n = 0; n < sigma.length(); n++)
				lambda.vector[0][n] = 1;

			break;

		case 2:

			for(var n = 0; n < sigma.length(); n++) {

				var a = sigma.vector[0][n];
				var b = sigma.vector[1][n];
				var c = sigma.vector[2][n];
				var d = sigma.vector[3][n];

				var detA = a * d - b * c;

				var s = (a + d) / 2;

				var t = Math.sqrt((s * s) - detA);

				var X1 = s + t;
				var X2 = s - t;

				lambda.vector[0][n] = X1;
				lambda.vector[1][n] = X2;

				var x1 = X1 * (d - b) - detA;
				var y1 = X1 * (a - c) - detA;

				var h1 = hypot(x1, y1);

				var x2 = X2 * (d - b) - detA;
				var y2 = X2 * (a - c) - detA;

				var h2 = hypot(x2, y2);

				sigma.vector[0][n] = x1 / h1;
				sigma.vector[1][n] = y1 / h1;
				sigma.vector[2][n] = x2 / h2;
				sigma.vector[3][n] = y2 / h2;
			}

			break;

		default:

			window.alert("dimensionality of " + lambda.dimensions() + " too high.");

			for(var n = 0; n < sigma.length(); n++)
				for(var m = 0; m < lambda.dimensions(); m++)
					lambda.vector[m][n] = 0;

			break;
	}

	return [ lambda, sigma ];
};

Path.prototype.dimensions = function() {
	return this.vector.length;
};

Path.prototype.ordinal = function() {

	var x = 0;

	for(var n = 0; n < this.length(); n++)
		for(var m = 0; m < this.dimensions(); m++)
			x += Math.abs(this.vector[m][n]);

	return x;
};

Path.prototype.toString = function(type) {

	var str = "";

	if(type === "d") {

		str += "M0,0 ";

		for(var n = 0; n < this.length(); n++) {

			for(var m = 0; m < this.dimensions(); m++) {
				str += m ? "," : "l";
				str += this.vector[m][n].toPrecision(state.precision);
			}

			str += " ";
		}

	} else {


		str += this.dimensions().toString() + 'x' + this.length().toString();
		str += ' |' + this.arcLength().toPrecision(state.precision)  + '| = ';

		for(var n = 0; n < this.length(); n++) {

			for(m = 0; m < this.dimensions(); m++) {
				str += this.vector[m][n].toPrecision(state.precision);
				if(m < this.dimensions() - 1)
					str += " ";
			}

			if(n < this.length() - 1)
				str += " / ";
		}

	}

	return str;
};

Path.prototype.normalize = function(norm) {
	var coef = norm / this.arcLength();
	for(var n = 0; n < this.length(); n++)
		for(m = 0; m < this.dimensions(); m++)
			this.vector[m][n] *= coef;
	return this;
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

Path.prototype.unshift = function() {
	for(var m = 0; m < this.dimensions(); m++)
		this.vector[m].unshift(arguments[m]);
};

Path.prototype.push = function() {
	for(var m = 0; m < this.dimensions(); m++)
		this.vector[m].push(arguments[m]);
};

Path.prototype.dx = function() {

	for(var m = 0; m < this.dimensions(); m++)
		for(var n = 1; n < this.length(); n++)
			this.vector[m][n - 1] = this.vector[m][n] - this.vector[m][n - 1];

	for(var m = 0; m < this.dimensions(); m++)
		this.vector[m].pop();

	return this;
};

Path.prototype.column = function(n,k) {
	var v = [];
	if(k === undefined)
		k = 1;
	for(var m = 0; m < this.dimensions(); m++)
		v.push(this.vector[m][n] * k);
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
		Path.prototype.push.apply(path, w.v);
	}

	return path;
};

Path.prototype.range = function() {

	var range = [];

	for(var m = 0; m < this.dimensions(); m++) {

		var min = 0;
		var max = 0;
		var x = 0;

		for(var n = 0; n < this.length(); n++) {

			x += this.vector[m][n];

			if(x > max)
				max = x;
			else if(x < min)
				min = x;
		}

		range[m] = { min: min, max: max, size: max - min + 1 };
	}

	return range;
};

Path.prototype.e = function(n) {
	return evalue.apply(null, this.column(n));
};

Path.prototype.createElement = function() {

	var e = document.createElementNS(svgns, "path");

	e.setAttribute("stroke-width","2px");
	e.setAttribute("fill", "none");

	e.setAttribute("d", this.toString("d"));

	return e;
};

Path.prototype.stretch = function(ns) {

	var p = new Path(this.dimensions());

	for(var k = 0; k < this.length(); k++)
		for(var i = 0; i <= ns[k]; i++)
			Path.prototype.push.apply(p, this.column(k));

	return p;
};

Path.prototype.multialign = function(qs) {

	var as = [];

	for(var i = 0; i < this.length(); i++)
		as[i] = 0;

	for(var k = 0; k < qs.length; k++) {

		if(this === qs[k])
			continue;

		var das = this.align(qs[k]);

		for(var i = 0; i < this.length(); i++)
			as[i] += das[i];
	}

	return as;
}

Path.prototype.align = function(q) {

	var p = this;

	var p_sz = p.ordinal();
	var q_sz = q.ordinal();

	var m = [];

	var width = p.length();

	var K = function(I,J) { return I + J * width; };
	var F = function(I,J) { return m[K(I,J)]; };
	var S = function(I,J) { return dot(p.column(I), q.column(J)); };

	var pI = p.length() - 1;
	var qJ = q.length() - 1;

	m[K(0,0)] = S(0,0);

	for(var i = 1; i <= pI; i++)
		m[K(i,0)] = S(i,0) + F(i-1,0);

	for(var j = 1; j <= qJ; j++)
		m[K(0,j)] = S(0,j) + F(0,j-1);

	for(var i = 1; i <= pI; i++)
		for(var j = 1; j <= qJ; j++)
			m[K(i,j)] = S(i,j) + Math.max(F(i-1,j-1), F(i-1,j), F(i,j-1));

	var as = [];

	for(var n = 0; n <= pI; n++)
		as[n] = -1;

	var i = pI;
	var j = qJ;

	as[i]++;
	as[j]++;

	var xy = new Path(2);

	xy.push(i, j);

	while(i > 0 || j > 0) {

		/****/ if(i == 0) {
		
			j--;

		} else if(j == 0) {

			i--;

		} else {

			var Fij = F(i-1,j-1).toPrecision(state.precision);
			var Fi = F(i-1,j).toPrecision(state.precision);
			var Fj = F(i,j-1).toPrecision(state.precision);

			if(Fij >= Fi && Fij >= Fj) {

				i--;
				j--;

			} else if(p_sz > q_sz) {

				(Fi >= Fj) ? i-- : j--;

			} else {

				(Fj >= Fi) ? j-- : i--;
			}
		}

		as[i]++;
		bs[j]++;

		xy.push(i, j);
	}

	return as;
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

	var e = document.createElementNS(svgns, "path");

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

		state.sp = document.createElementNS(svgns, "path");

		state.sp.setAttribute("stroke","green");
		state.sp.setAttribute("stroke-width","2px");
		state.sp.setAttribute("fill", "none");
		state.sp.setAttribute("d", "M" + e.offsetX.toString() + " " + e.offsetY.toString());

		s.appendChild(state.sp);
	}
}

function createGlyph(path) {

	var svg = document.createElementNS(svgns, "svg");

	var range = path.range();

	var minX = Math.round(range[0].min) - 5;
	var minY = Math.round(range[1].min) - 5;
	var sizeX = Math.round(range[0].size) + 10;
	var sizeY = Math.round(range[1].size) + 10;

	svg.setAttribute("width",  sizeX);
	svg.setAttribute("height", sizeY);
	svg.setAttribute("viewBox", minX + " " + minY + " " + sizeX + " " + sizeY);

	svg.style.border = "none";

	return svg;
}

function displayGlyph(container, path, color) {

	var svg = createGlyph(path);

	var element = path.createElement();

	element.setAttribute("stroke", color);

	svg.appendChild(element);

	container.appendChild(svg);
}

function pen_up(e) {

	log(dbg, "svg pen_up(" + e.type + ")");

	if(state.active) {

		state.active = false;

		s.style.border = "1px solid black";

		state.path = state.path.dx().normalize(state.normal).resample(state.step);

		state.paths.push(state.path);

		s.removeChild(state.sp);

		displayGlyph(con, state.path, "red");

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

	var i = 10;
	var j = 20;

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

		log(dbg, "save button clicked!");

		// aggregate paths

		// compute mean path
		// compute path covariance
		// compute path harmonics
		// compute path signature

		var mean_path = Path.mean.apply(null, state.paths);

		displayGlyph(con, mean_path, "gray");

		// var eigen = Path.eigensystem.apply(null, state.paths);

		if(state.paths.length > 1) {

			var aligned_paths = [];

			for(var n = 0; n < state.paths.length; n++) {

				var p = state.paths[n];

				var as = p.multialign(state.paths);

				var q = p.stretch(as).normalize(state.normal).resample(state.step);

				aligned_paths.push(q);

				displayGlyph(con, q, "blue");
			}

			var aligned_mu = Path.mean.apply(null, aligned_paths);

			displayGlyph(con, aligned_mu, "gray");

			Array.prototype.push.apply(state.paths, aligned_paths);
		}
	};

	br.onclick = function(e) {
		initState();
		log(dbg, "reset button clicked!");
	};

	bd.onclick = function(e) {
		state.debug = !state.debug;
		bdl.style.backgroundColor = state.debug ? "black" : "white";
	};

	bg.onclick = function(e) {
		state.grid = !state.grid;
		bgl.style.backgroundColor = state.grid ? "black" : "white";
		document.getElementById("grid").setAttribute("stroke", state.grid ? "lightsteelblue" : "white");
	};
};
