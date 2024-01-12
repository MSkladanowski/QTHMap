/*
 * L.Maidenhead displays a Maidenhead Locator of lines on the map.
 */

L.Maidenhead = L.LayerGroup.extend({


	options: {
		// Line and label color
		color: 'rgba(255, 0, 0, 0.4)',
		// Redraw on move or moveend
		redraw: 'move',
		onClick: function () { },
	},

	initialize: function (options) {
		L.LayerGroup.prototype.initialize.call(this);
		L.Util.setOptions(this, options);

	},

	onAdd: function (map) {
		this._map = map;
		var grid = this.redraw();
		this._map.on('viewreset ' + this.options.redraw, function () {
			grid.redraw();
		});

		this.eachLayer(map.addLayer, map);
	},

	onRemove: function (map) {
		// remove layer listeners and elements
		map.off('viewreset ' + this.options.redraw, this.map);
		this.eachLayer(this.removeLayer, this);
	},

	redraw: function () {
		var d3 = new Array(20, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1 / 24, 1 / 24, 1 / 24, 1 / 24, 1 / 24, 1 / 240, 1 / 240, 1 / 240, 1 / 240 / 24, 1 / 240 / 24, 1 / 240 / 24);
		var lat_cor = new Array(0, 8, 8, 8, 10, 14, 6, 8, 8, 8, 1.4, 2.5, 3, 3.5, 4, 4, 3.5, 3.5, 1.47, 1.8, 1.6);
		var bounds = this._map.getBounds();
		var zoom = this._map.getZoom();
		var unit = d3[zoom];
		var lcor = lat_cor[zoom];
		var w = Math.max(bounds.getWest(), -180);
		var e = Math.min(bounds.getEast(), 180);
		var n = Math.min(bounds.getNorth(), 90);
		var s = Math.max(bounds.getSouth(), -90);
		if (zoom == 1) { var c = 2; } else { var c = 0.1; }
		if (n > 85) n = 85;
		if (s < -85) s = -85;
		var left = Math.floor(w / (unit * 2)) * (unit * 2);
		var right = Math.ceil(e / (unit * 2)) * (unit * 2);
		var top = Math.ceil(n / unit) * unit;
		var bottom = Math.floor(s / unit) * unit;
		this.eachLayer(this.removeLayer, this);
		for (var lon = left; lon < right; lon += (unit * 2)) {
			for (var lat = bottom; lat < top; lat += unit) {
				var bounds = [[lat, lon], [lat + unit, lon + (unit * 2)]];
				let rec = L.rectangle(bounds, { color: this.options.color, weight: 1, fill: true, interactive: false })
				this.addLayer(rec);
				// rec.on('click', this.options.onClick(rec));
				//var pont = map.latLngToLayerPoint([lat,lon]);
				//console.log(pont.x);
				this.addLayer(this._getLabel(lon + unit - (unit / lcor), lat + (unit / 2) + (unit / lcor * c)));
			}
		}
		return this;
	},

	_getLabel: function (lon, lat) {
		var title_size = new Array(0, 10, 12, 16, 20, 26, 12, 16, 24, 36, 12, 14, 20, 36, 60, 12, 20, 36, 8, 12, 24);
		var zoom = this._map.getZoom();
		var size = title_size[zoom] + 'px';
		var title = '<span style="cursor: default;"><font style="color:' + this.options.color + '; font-size:' + size + '; font-weight: 900; ">' + this.latLngToMaidenheadIndex(lon, lat) + '</font></span>';
		var myIcon = L.divIcon({ className: 'my-div-icon', html: title });
		var marker = L.marker([lat, lon], { icon: myIcon });
		return marker;
	},

	latLngToMaidenheadIndex: function (lon, lat) {
		var ydiv_arr = new Array(10, 1, 1 / 24, 1 / 240, 1 / 240 / 24);
		var d1 = "ABCDEFGHIJKLMNOPQR".split("");
		var d2 = "ABCDEFGHIJKLMNOPQRSTUVWX".split("");
		var d4 = new Array(0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5);
		var locator = "";
		var x = lon;
		var y = lat;
		var precision = d4[this._map.getZoom()];
		while (x < -180) { x += 360; }
		while (x > 180) { x -= 360; }
		x = x + 180;
		y = y + 90;
		locator = locator + d1[Math.floor(x / 20)] + d1[Math.floor(y / 10)];
		for (var i = 0; i < 4; i = i + 1) {
			if (precision > i + 1) {
				let rlon = x % (ydiv_arr[i] * 2);
				let rlat = y % (ydiv_arr[i]);
				if ((i % 2) == 0) {
					locator += Math.floor(rlon / (ydiv_arr[i + 1] * 2)) + "" + Math.floor(rlat / (ydiv_arr[i + 1]));
				} else {
					locator += d2[Math.floor(rlon / (ydiv_arr[i + 1] * 2))] + "" + d2[Math.floor(rlat / (ydiv_arr[i + 1]))];
				}
			}
		}
		return locator;
	},



	// Given a latin letter A to Z, return its 0-to-24 index
	_letterIndex: function (letter) {
		return "ABCDEFGHIJKLMNOPQRSTUVWX".indexOf(letter.toUpperCase());
	},

	// Given a 0-to-24 numeric index, return the corresponding *uppercase* latin letter A to Z
	_indexLetter: function (idx) {
		return "ABCDEFGHIJKLMNOPQRSTUVWX".charAt(idx);
	},

	// Given a maidenhead index (as a string), return its bounding box
	// (as a [lat, lng, lat, lng] or [y1, x1, y2, x2] array).
	maidehneadIndexToBBox: function (str) {
		const strLen = str.length;
		let minLat = -90;
		let minLng = -180;

		// Fields, 18x18 in total, each 20deg lng and 10deg lat
		minLng += 20 * this._letterIndex(str.substring(0, 1));
		minLat += 10 * this._letterIndex(str.substring(1, 2));

		if (str.length === 2) {
			return [minLat, minLng, minLat + 10, minLng + 20];
		}

		// Squares, 10x10 per field, each 2deg lng and 1deg lat
		minLng += 2 * Number(str.substring(2, 3));
		minLat += 1 * Number(str.substring(3, 4));

		if (str.length === 4) {
			return [minLat, minLng, minLat + 1, minLng + 2];
		}

		// Subsquares, 24x24 per square, each 5min lng and 2.5min lat
		minLng += (5 / 60) * this._letterIndex(str.substring(4, 5));
		minLat += (2.5 / 60) * this._letterIndex(str.substring(5, 6));

		if (str.length === 6) {
			return [minLat, minLng, minLat + (2.5 / 60), minLng + (5 / 60)];
		}

		// Extended subsquares, 10x10 per subsquare, each 0.5min lng and 0.25min lat
		minLng += (0.5 / 60) * Number(str.substring(6, 7));
		minLat += (0.25 / 60) * Number(str.substring(7, 8));

		if (str.length === 8) {
			return [minLat, minLng, minLat + (0.25 / 60), minLng + (0.5 / 60)];
		}

		throw new Error("String passed to maidenhead indexToBBox has invalid length: " + str + " end" + strLen);
	},
});




L.maidenhead = function (options) {
	return new L.Maidenhead(options);
};
