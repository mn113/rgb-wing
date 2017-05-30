$(function() {
	
	var ship = {
		el: $("#ship"),
		colour: {
			r: 128,
			g: 128,
			b: 128
		},
		cloaked: false
	}
	
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
		if (e.key === 'z') fireWeapon();
		else if (e.key === 'R') alterShipColour('r',32);
		else if (e.key === 'r') alterShipColour('r',-32);
		else if (e.key === 'G') alterShipColour('g',32);
		else if (e.key === 'g') alterShipColour('g',-32);
		else if (e.key === 'B') alterShipColour('b',32);
		else if (e.key === 'b') alterShipColour('b',-32);
		// Movement:
    keyState[e.key] = true;
	}).on("keyup", function(e) {
    keyState[e.key] = false;
	});

	function gameLoop() {
		if (keyState['ArrowUp']) moveShip(0,-10);
		else if (keyState['ArrowDown']) moveShip(0,10);
		else if (keyState['ArrowLeft']) moveShip(-10,0);
		else if (keyState['ArrowRight']) moveShip(10,0);
    
		setTimeout(gameLoop, 20);
	}
	
	gameLoop();
	
	function alterShipColour(channel, delta) {
		ship.colour[channel] += delta;
		// Keep values within 0-255:
		if (ship.colour[channel] > 255) ship.colour[channel] = 255;
		if (ship.colour[channel] < 0) ship.colour[channel] = 0;
		//console.log(tinycolor(ship.colour).toRgbString());
		ship.el.css("background-color", tinycolor(ship.colour).toRgbString());
		
		if (isCloaked() && !ship.cloaked) {
			ship.cloaked = true;
			$("#message").html("CLOAKED").show().fadeOut(950);
		}
		else if (!isCloaked() && ship.cloaked) {
			ship.cloaked = false;
			$("#message").html("NOT CLOAKED").show().fadeOut(950);
		}
	}
	
	function moveShip(dx, dy) {
		ship.el.css({
			left: "+="+dx+"px",
			top: "+="+dy+"px"
		});
	}
	
	function fireWeapon() {
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
	}
	
	function isCloaked() {
		// Compare ship's RGB with space's RGB:
		var read = tinycolor.readability(tinycolor(ship.colour), tinycolor($("#space").css("background-color")));
		console.log("Readability:", read);
		return read < 1.2;
	}
	
});

