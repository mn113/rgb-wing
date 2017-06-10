/*global $, tinycolor */

$(function() {

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
			//console.log(tinycolor(ship.colour).toRgbString());
			this.el.css("background-color", tinycolor(this.colour).toRgbString());

			if (this.isCloaked() && !this.cloaked) {
				this.cloaked = true;
				$("#message").html("CLOAKED").show().fadeOut(950);
			}
			else if (!this.isCloaked() && this.cloaked) {
				this.cloaked = false;
				$("#message").html("NOT CLOAKED").show().fadeOut(950);
			}
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
			// Keep within page bounds:
			var x = parseInt(this.el.css("left"));
			var dX;
			if (dir === 'left') {
				dX = (x - 65 < 0) ? "+=0px" : "-=125px";
			}
			else if (dir === 'right') {
				dX = (x + 185 > $(window).width()) ? "+=0px" : "+=125px";
			}
			this.el.addClass("rolling");
			this.el.animate({
				left: dX,
			}, 500, 'swing', function() {
				this.el.removeClass("rolling");
			}.bind(this));
		},

		fireWeapon: function() {
			var origin = this.el.position();
			//console.log("Zap!", origin);
			new Audio("https://marthost.uk/rgbwing/sfx_wpn_laser6.wav").play();
			$("<div>")
				.addClass("blast")
				.appendTo($("#space"))
				.css({
					top: origin.top,
					left: origin.left+23
				})
				.animate({top: 0}, origin.top*2, 'linear', function() {
					this.remove();
				});
		},

		isCloaked: function() {
			// Compare ship's RGB with space's RGB:
			var read = tinycolor.readability(tinycolor(ship.colour), tinycolor($("#space").css("background-color")));
			console.log("Readability:", read);
			return read < 1.2;
		}

	};

	function getRandomColor() {
		var letters = '0369CF';
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
			color += letters[Math.floor(Math.random() * 6)];
		}
		//console.log("Randomly:", color);
		return color;
	}

	// Maybe change space colour every 10s:
	var bgChanger = setInterval(function() {
		if (Math.random() > 0.66) {
			$("#space").css("background-color", getRandomColor());
		}
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

	// Movement loop:
	function gameLoop() {
		// Vertical:
		if (keyState['ArrowUp']) ship.move(0,-10);
		else if (keyState['ArrowDown']) ship.move(0,10);
		// Horizontal:
		if (keyState['ArrowLeft']) ship.move(-10,0);
		else if (keyState['ArrowRight']) ship.move(10,0);

		setTimeout(gameLoop, 20);
	}

	gameLoop();

});
