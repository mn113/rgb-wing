/*global $, tinycolor */

$(function() {

	var ship = {
		el: $("#ship"),
		colour: {
			r: 128,
			g: 128,
			b: 128
		},
		cloaked: false,

		alterColour: function(channel, delta) {
			ship.colour[channel] += delta;
			// Keep values within 0-255:
			if (ship.colour[channel] > 255) ship.colour[channel] = 255;
			if (ship.colour[channel] < 0) ship.colour[channel] = 0;
			//console.log(tinycolor(ship.colour).toRgbString());
			ship.el.css("background-color", tinycolor(ship.colour).toRgbString());

			if (ship.isCloaked() && !ship.cloaked) {
				ship.cloaked = true;
				$("#message").html("CLOAKED").show().fadeOut(950);
			}
			else if (!ship.isCloaked() && ship.cloaked) {
				ship.cloaked = false;
				$("#message").html("NOT CLOAKED").show().fadeOut(950);
			}
		},

		move: function(dx, dy) {
			ship.el.css({
				left: "+="+dx+"px",
				top: "+="+dy+"px"
			});
		},

		fireWeapon: function() {
			var origin = ship.el.position();
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
		// Detect continuous keypresses:
		keyState[e.key] = true;
	}).on("keyup", function(e) {
		keyState[e.key] = false;
	});

	function gameLoop() {
		if (keyState['ArrowUp']) ship.move(0,-10);
		else if (keyState['ArrowDown']) ship.move(0,10);
		if (keyState['ArrowLeft']) ship.move(-10,0);
		else if (keyState['ArrowRight']) ship.move(10,0);

		setTimeout(gameLoop, 20);
	}

	gameLoop();

});
