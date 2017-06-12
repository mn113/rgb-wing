/*global $, tinycolor, SAT */

$(function() {

	var space = $("#space");

	var ship = {
		el: $("#ship"),
		colour: {
			r: 128,
			g: 128,
			b: 128
		},
		health: 100,
		cloaked: false,

		alterColour: function(channel, delta) {
			this.colour[channel] += delta;
			// Keep values within 0-255:
			if (this.colour[channel] > 255) this.colour[channel] = 255;
			if (this.colour[channel] < 0) this.colour[channel] = 0;
			$("#ship-front").css("background-color", tinycolor(this.colour).toRgbString());
			// Adjust sliders:
			$("input[name="+channel+"Slider]").val(this.colour[channel]).change();

			this.checkCloaking();
		},

		checkCloaking: function() {
			if (this.isCloaked() && !this.cloaked) {
				this.cloaked = true;
				$("#message").html("CLOAKED").show().fadeOut(950);
			}
			else if (!this.isCloaked() && this.cloaked) {
				this.cloaked = false;
				$("#message").html("NOT CLOAKED").show().fadeOut(950);
			}
		},

		isCloaked: function() {
			// Compare ship's RGB with space's RGB:
			var read = tinycolor.readability(tinycolor(ship.colour), tinycolor($("#space").css("background-color")));
			console.log("Readability:", read);
			return read < 1.2;
		},

		move: function(dx, dy) {
			// Check against page bounds:
			var x = parseInt(this.el.css("left")),
				y = parseInt(this.el.css("top"));
			if (x + dx < 0 || x + dx + 40 > $(window).width()) dx = 0;
			if (y + dy < 0 || y + dy + 42 > $(window).height()) dy = 0;

			this.el.css({
				left: "+="+dx+"px",
				top: "+="+dy+"px"
			});
		},

		roll: function(dir) {
			var rollAmount = 150;
			// Keep within page bounds:
			var x = parseInt(this.el.css("left"));
			var dX;
			if (dir === 'left') {
				dX = (x + 60 - rollAmount < 0) ? "+=0px" : "-="+rollAmount+"px";
			}
			else if (dir === 'right') {
				dX = (x + 60 + rollAmount > $(window).width()) ? "+=0px" : "+="+rollAmount+"px";
			}
			this.el.addClass("rolling");
			this.el.velocity({
				left: dX,
			},
			{
				duration: 900,
				easing: 'swing',
				complete: function() {	// animation duration must match CSS rotateY animation
					this.el.removeClass("rolling");
				}.bind(this)
			});
		},

		fireWeapon: function() {
			var origin = this.el.position();
			//console.log("Zap!", origin);
			new Audio("https://marthost.uk/rgbwing/sfx/sfx_wpn_laser6.wav").play();
			new Blast(origin);
		},

		takeDamage: function(damage) {
			// Doesn't take damage while taking damage:
			if (!this.el.hasClass('flashing')) {
				this.health -= damage;
				$("input[name=shipHealth]").val(this.health).change();

				this.el.addClass('flashing');
				setTimeout(function() {
					this.el.removeClass('flashing');
				}.bind(this), 1600);
			}
		},

		toSATCircle() {
			var x = this.el.position().left + 30,
				y = this.el.position().top + 32,
				radius = 32;
			return new SAT.Circle(new SAT.Vector(x, y), radius);
		}

	};
	// Initial flash:
	ship.takeDamage(0);


	// Keep track of entities for CD:
	var asteroids = [];
	var astIncrementor = 0;
	var blasts = [];
	var blastIncrementor = 0;


	class Blast {
		constructor(origin, type = '') {
			this.origin = origin;
			this.el = $("<div>")
				.addClass("blast")
				.addClass(type)
				.appendTo($("#space"))
				.css({
					top: origin.top,
					left: origin.left+23
				});
			this.id = 'blast_' + blastIncrementor;
			blastIncrementor++;
			// Register:
			blasts.push(this);

			this.shoot();
		}

		shoot() {
			this.el.velocity({
				top: 0
			},
			{
				duration: this.origin.top*2,
				easing: 'linear',
				complete: function() {
					this.destroy();
				}.bind(this)
			});
		}

		destroy() {
			this.el.remove();
			// Deregister:
			blasts.splice(blasts.indexOf(this), 1);
		}

		toSATCircle() {
			var radius = 8,
				x = this.el.position().left + radius,
				y = this.el.position().top + radius;
			return new SAT.Circle(new SAT.Vector(x, y), radius);
		}
	}


	class Asteroid {
		constructor(size, pos, angle = 0) {
			// Parameters:
			if (typeof size === 'undefined')
				size = (Math.random() > 0.5) ? 'big' : 'small';
			if (typeof pos === 'undefined') {
				pos = {
					x: Math.random() * space.width(),
					y: 0
				};
			}
			var spin = (Math.random() > 0.5) ? 'normal' : 'reverse';

			this.size = size;
			this.angle = angle;
			this.id = 'ast_' + astIncrementor;
			astIncrementor++;

			// Create element:
			this.el = $("<div>")
				.addClass("asteroid")
				.addClass(size)
				.css({
					left: pos.x,
					top: pos.y,
					'animation-direction': spin
				})
				.appendTo(space);
			console.log("Asteroid created:", pos, size, spin, angle+'deg');

			// Register:
			asteroids.push(this);
		}

		drift(speed = 8000) {
			this.el.addClass('spinning');
			this.el.velocity({
				top: '100%'
			},
			{
				duration: speed,
				easing: 'linear',
				complete: function() {
					this.el.remove();
					this.deregister();
				}.bind(this)
			});
		}

		fanOut() {
			this.el.addClass('fanning');
			this.el.velocity({
				translateX: "100px",
				top: "+=100px"
			},
			{
				duration: 3000,
				easing: 'ease-out',		// the bits decelerate
				begin: function() {
					// Set initial values for fan animation:
					$.Velocity.hook(this.el, "rotateZ", this.angle+"deg");
					$.Velocity.hook(this.el, "translateX", "20px");
				}.bind(this),
				complete: function() {
					this.el.remove();
					this.deregister();
				}.bind(this)
			});
		}

		takeDamage(damage) {
			if (this.size === 'big') this.split();
			else this.disintegrate();
			// Later on asteroids can have health...
		}

		split() {
			console.log("Splitting", this.el);
			var pos = {
				x: this.el.position().left + 29,
				y: this.el.position().top + 27
			};
			this.el.remove();
			this.deregister();
			// Create mini-asteroids with different angles:
			for (var i = 0; i < 5; i++) {
				//var randAngle = Math.random() * 360;
				new Asteroid('small', pos, 72*i).fanOut();
				// Need them to fan out, not descend
			}
		}

		disintegrate() {
			// rock shower?
			this.el.remove();
			this.deregister();
		}

		deregister() {
			asteroids.splice(asteroids.indexOf(this), 1);
		}

		toSATCircle() {
			var radius = (this.size === 'big') ? 30 : 15,
				x = this.el.position().left + radius,
				y = this.el.position().top + radius;
			return new SAT.Circle(new SAT.Vector(x, y), radius);
		}
	}


	var utils = {
		getRandomColor: function() {
			var letters = '0369CF';
			var color = '#';
			for (var i = 0; i < 6; i++ ) {
				color += letters[Math.floor(Math.random() * 6)];
			}
			//console.log("Randomly:", color);
			return color;
		}
	};


	var collisionDetector = setInterval(function() {
		// test: asteroids <-> ship
		asteroids.forEach(function(asteroid) {
			var response = new SAT.Response();
			var collided = SAT.testCircleCircle(ship.toSATCircle(), asteroid.toSATCircle(), response);
			console.log(asteroid.id, 'vs ship ?', collided);
			if (collided) ship.takeDamage(10);

			// test: asteroids <-> blasts
			blasts.forEach(function(blast) {
				var response = new SAT.Response();
				var collided = SAT.testCircleCircle(blast.toSATCircle(), asteroid.toSATCircle(), response);
				console.log(asteroid.id, 'vs', blast.id, '?', collided);
				if (collided) {
					asteroid.takeDamage(10);
					blast.destroy();
				}
			});
		});
	}, 100);	// TODO: run faster

	// Maybe change space colour every 10s:
	var bgChanger = setInterval(function() {
		if (Math.random() > 0.66) {
			$("#space").css("background-color", utils.getRandomColor());
		}
		new Asteroid().drift();
	}, 10000);

	// Key listeners:
	var keyState = {};
	$(document).on("keydown", function(e) {
		console.log(e.key);
		if (e.key === 'z') ship.fireWeapon();
		else if (e.key === 'R') ship.alterColour('r',32);
		else if (e.key === 'r') ship.alterColour('r',-32);
		else if (e.key === 'G') ship.alterColour('g',32);
		else if (e.key === 'g') ship.alterColour('g',-32);
		else if (e.key === 'B') ship.alterColour('b',32);
		else if (e.key === 'b') ship.alterColour('b',-32);
		// Rolls:
		if (keyState['Shift'] && e.key === 'ArrowLeft') ship.roll('left');
		else if (keyState['Shift'] && e.key === 'ArrowRight') ship.roll('right');
		// Detect continuous keypresses:
		keyState[e.key] = true;
	}).on("keyup", function(e) {
		keyState[e.key] = false;
	});

	// For debugging:
	function dumpEntityArrays() {
		var string = "Asts:";
		for (var a of asteroids) {
			string += a.id + ',';
		}
		$("#astsArray").html(string);

		string = "Blasts:";
		for (var b of blasts) {
			string += b.id + ',';
		}
		$("#blastsArray").html(string);
	}

	// Movement loop:
	function gameLoop() {
		// Vertical:
		if (keyState['ArrowUp']) {
			ship.el.addClass('boost-on');
			ship.move(0,-10);
		}
		else if (keyState['ArrowDown']) {
			ship.move(0,10);
		}
		else {
			ship.el.removeClass('boost-on');
		}
		// Horizontal:
		if (keyState['ArrowLeft']) {
			ship.el.addClass('tilt-left');
			ship.move(-10,0);
		}
		else if (keyState['ArrowRight']) {
			ship.el.addClass('tilt-right');
			ship.move(10,0);
		}
		else {
			ship.el.removeClass('tilt-left tilt-right');
		}

		dumpEntityArrays();

		setTimeout(gameLoop, 20);
	}

	gameLoop();

});
