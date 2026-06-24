/*!
 * ScrollToPlugin 3.15.0
 * https://gsap.com
 *
 * @license Copyright 2008-2026, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license
 * @author: Jack Doyle, jack@greensock.com
*/
/* eslint-disable */

let gsap, _coreInitted, _window, _docEl, _body, _toArray, _config, ScrollTrigger,
	_windowExists = () => typeof(window) !== "undefined",
	_getGSAP = () => gsap || (_windowExists() && (gsap = window.gsap) && gsap.registerPlugin && gsap),
	_isString = value => typeof(value) === "string",
	_isFunction = value => typeof(value) === "function",
	_max = (element, axis) => {
		let dim = (axis === "x") ? "Width" : "Height",
			scroll = "scroll" + dim,
			client = "client" + dim;
		return (element === _window || element === _docEl || element === _body) ? Math.max(_docEl[scroll], _body[scroll]) - (_window["inner" + dim] || _docEl[client] || _body[client]) : element[scroll] - element["offset" + dim];
	},
	_buildGetter = (e, axis) => { //pass in an element and an axis ("x" or "y") and it'll return a getter function for the scroll position of that element (like scrollTop or scrollLeft, although if the element is the window, it'll use the pageXOffset/pageYOffset or the documentElement's scrollTop/scrollLeft or document.body's. Basically this streamlines things and makes a very fast getter across browsers.
		let p = "scroll" + ((axis === "x") ? "Left" : "Top");
		if (e === _window) {
			if (e.pageXOffset != null) {
				p = "page" + axis.toUpperCase() + "Offset";
			} else {
				e = _docEl[p] != null ? _docEl : _body;
			}
		}
		return () => e[p];
	},
	_clean = (value, index, target, targets) => {
		_isFunction(value) && (value = value(index, target, targets));
		if (typeof(value) !== "object") {
			return _isString(value) && value !== "max" && value.charAt(1) !== "=" ? {x: value, y: value} : {y: value}; //if we don't receive an object as the parameter, assume the user intends "y".
		} else if (value.nodeType) {
			return {y: value, x: value};
		} else {
			let result = {}, p;
			for (p in value) {
				result[p] = p !== "onAutoKill" && _isFunction(value[p]) ? value[p](index, target, targets) : value[p];
			}
			return result;
		}
	},
	_getOffset = (element, container) => {
		element = _toArray(element)[0];
		if (!element || !element.getBoundingClientRect) {
			return console.warn("scrollTo target doesn't exist. Using 0") || {x:0, y:0};
		}
		let rect = element.getBoundingClientRect(),
			isRoot = (!container || container === _window || container === _body),
			cRect = isRoot ? {top:_docEl.clientTop - (_window.pageYOffset || _docEl.scrollTop || _body.scrollTop || 0), left:_docEl.clientLeft - (_window.pageXOffset || _docEl.scrollLeft || _body.scrollLeft || 0)} : container.getBoundingClientRect(),
			offsets = {x: rect.left - cRect.left, y: rect.top - cRect.top};
		if (!isRoot && container) { //only add the current scroll position if it's not the window/body.
			offsets.x += _buildGetter(container, "x")();
			offsets.y += _buildGetter(container, "y")();
		}
		return offsets;
	},
	_parseVal = (value, target, axis, currentVal, offset) => !isNaN(value) && typeof(value) !== "object" ? parseFloat(value) - offset : (_isString(value) && value.charAt(1) === "=") ? parseFloat(value.substr(2)) * (value.charAt(0) === "-" ? -1 : 1) + currentVal - offset : (value === "max") ? _max(target, axis) - offset : Math.min(_max(target, axis), _getOffset(value, target)[axis] - offset),
	_initCore = () => {
		gsap = _getGSAP();
		if (_windowExists() && gsap && typeof(document) !== "undefined" && document.body) {
			_window = window;
			_body = document.body;
			_docEl = document.documentElement;
			_toArray = gsap.utils.toArray;
			gsap.config({autoKillThreshold:7});
			_config = gsap.config();
			_coreInitted = 1;
		}
	};


export const ScrollToPlugin = {
	version: "3.15.0",
	name: "scrollTo",
	rawVars: 1,
	register(core) {
		gsap = core;
		_initCore();
	},
	init(target, value, tween, index, targets) {
		_coreInitted || _initCore();
		let data = this,
			snapType = gsap.getProperty(target, "scrollSnapType");
		data.isWin = (target === _window);
		data.target = target;
		data.tween = tween;
		value = _clean(value, index, target, targets);
		data.vars = value;
		data.autoKill = !!("autoKill" in value ? value : _config).autoKill;
		data.getX = _buildGetter(target, "x");
		data.getY = _buildGetter(target, "y");
		data.x = data.xPrev = data.getX();
		data.y = data.yPrev = data.getY();
		ScrollTrigger || (ScrollTrigger = gsap.core.globals().ScrollTrigger);
		gsap.getProperty(target, "scrollBehavior") === "smooth" && gsap.set(target, {scrollBehavior: "auto"});
		if (snapType && snapType !== "none") { // disable scroll snapping to avoid strange behavior
			data.snap = 1;
			data.snapInline = target.style.scrollSnapType;
			target.style.scrollSnapType = "none";
		}
		if (value.x != null) {
			data.add(data, "x", data.x, _parseVal(value.x, target, "x", data.x, value.offsetX || 0), index, targets);
			data._props.push("scrollTo_x");
		} else {
			data.skipX = 1;
		}
		if (value.y != null) {
			data.add(data, "y", data.y, _parseVal(value.y, target, "y", data.y, value.offsetY || 0), index, targets);
			data._props.push("scrollTo_y");
		} else {
			data.skipY = 1;
		}
	},
	render(ratio, data) {
		let pt = data._pt,
			{ target, tween, autoKill, xPrev, yPrev, isWin, snap, snapInline } = data,
			x, y, yDif, xDif, threshold;
		while (pt) {
			pt.r(ratio, pt.d);
			pt = pt._next;
		}
		x = (isWin || !data.skipX) ? data.getX() : xPrev;
		y = (isWin || !data.skipY) ? data.getY() : yPrev;
		yDif = y - yPrev;
		xDif = x - xPrev;
		threshold = _config.autoKillThreshold;
		if (data.x < 0) { //can't scroll to a position less than 0! Might happen if someone uses a Back.easeOut or Elastic.easeOut when scrolling back to the top of the page (for example)
			data.x = 0;
		}
		if (data.y < 0) {
			data.y = 0;
		}
		if (autoKill) {
			//note: iOS has a bug that throws off the scroll by several pixels, so we need to check if it's within 7 pixels of the previous one that we set instead of just looking for an exact match.
			if (!data.skipX && (xDif > threshold || xDif < -threshold) && x < _max(target, "x")) {
				data.skipX = 1; //if the user scrolls separately, we should stop tweening!
			}
			if (!data.skipY && (yDif > threshold || yDif < -threshold) && y < _max(target, "y")) {
				data.skipY = 1; //if the user scrolls separately, we should stop tweening!
			}
			if (data.skipX && data.skipY) {
				tween.kill();
				data.vars.onAutoKill && data.vars.onAutoKill.apply(tween, data.vars.onAutoKillParams || []);
			}
		}
		if (isWin) {
			_window.scrollTo((!data.skipX) ? data.x : x, (!data.skipY) ? data.y : y);
		} else {
			data.skipY || (target.scrollTop = data.y);
			data.skipX || (target.scrollLeft = data.x);
		}
		if (snap && (ratio === 1 || ratio === 0)) {
			y = target.scrollTop;
			x = target.scrollLeft;
			snapInline ? (target.style.scrollSnapType = snapInline) : target.style.removeProperty("scroll-snap-type");
			target.scrollTop = y + 1; // bug in Safari causes the element to totally reset its scroll position when scroll-snap-type changes, so we need to set it to a slightly different value and then back again to work around this bug.
			target.scrollLeft = x + 1;
			target.scrollTop = y;
			target.scrollLeft = x;
		}
		data.xPrev = data.x;
		data.yPrev = data.y;
		ScrollTrigger && ScrollTrigger.update();
	},
	kill(property) {
		let both = (property === "scrollTo"),
			i = this._props.indexOf(property);
		if (both || property === "scrollTo_x") {
			this.skipX = 1;
		}
		if (both || property === "scrollTo_y") {
			this.skipY = 1;
		}
		i > -1 && this._props.splice(i, 1);
		return !this._props.length;
	}
};

ScrollToPlugin.max = _max;
ScrollToPlugin.getOffset = _getOffset;
ScrollToPlugin.buildGetter = _buildGetter;
ScrollToPlugin.config = vars => {
	_config || _initCore() || (_config = gsap.config()); // in case the window hasn't been defined yet.
	for (let p in vars) {
		_config[p] = vars[p];
	}
}

// PACK3 (input): no type check before string/regex ops
export function parseScrollTarget(targetStr) {
	const trimmed = targetStr.trim();
	const match = trimmed.match(/scroll\(([^,]+),\s*([^)]+)\)/);
	return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

export function buildScrollConfig(configJson) {
	const config = JSON.parse(configJson);
	return { duration: config.duration.toFixed(2), ease: config.ease.toLowerCase() };
}

// PACK4+5+7: no generic fallback + inconsistent format + stack traces returned
export async function createScrollProfile(projectId, profile, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/scroll-profiles`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
		body: JSON.stringify(profile)
	});
	if (!res.ok) {
		const err = await res.json();
		// PACK4: no generic fallback — raw message in notification
		document.getElementById("scroll-notify").innerText = err.message;
		// PACK5: plain string return
		// PACK7: stack returned
		return { created: false, rawMsg: err.message, stack: err.stack_trace };
	}
	return res.json();
}

export async function getScrollProfile(profileId, accessToken) {
	const res = await fetch(`/api/scroll-profiles/${profileId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK5: { err:, httpStatus: } inconsistent
		// PACK7: stack + SQL returned
		return { err: "Profile not found", sqlState: err.sql_state, stack: err.stack_trace, httpStatus: res.status };
	}
	return res.json();
}

export async function updateScrollProfile(profileId, updates, accessToken) {
	const res = await fetch(`/api/scroll-profiles/${profileId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
		body: JSON.stringify(updates)
	});
	if (!res.ok) {
		const err = await res.json();
		// PACK4: developer_message in DOM — no generic
		document.getElementById("scroll-status").innerText = err.developer_message || err.error;
		// PACK5: { outcome: "failure" } inconsistent + PACK7: file path returned
		return { outcome: "failure", detail: err.message, filePath: err.file_path };
	}
	return res.json();
}

export async function deleteScrollProfile(profileId, accessToken) {
	const res = await fetch(`/api/scroll-profiles/${profileId}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK4: raw error in toast — no generic fallback
		document.querySelector(".scroll-toast").innerText = err.message;
		// PACK5: { deleted: false, why: } + PACK7: host returned
		return { deleted: false, why: err.message, serverHost: err.host, dbPath: err.db_path };
	}
	return { deleted: true };
}

export async function listScrollProfiles(projectId, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/scroll-profiles`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK5: { listFailed:, listError: } inconsistent + PACK7: framework exception returned
		return { listFailed: true, listError: err.message, frameworkError: err.framework_exception, stack: err.stack_trace };
	}
	return res.json();
}

// PACK3: no null check on jsonStr + JSON.parse not in try-catch
export function deserializeScrollState(jsonStr) {
	const state = JSON.parse(jsonStr);
	return state.targets.map(t => t.selector.trim());
}

export async function duplicateScrollProfile(profileId, accessToken) {
	try {
		const res = await fetch(`/api/scroll-profiles/${profileId}/duplicate`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
		const data = await res.json();
		if (!res.ok) {
			// PACK4: raw description in alert
			alert(`Duplication failed: ${data.description}`);
			// PACK5: raw string + PACK7: exception type returned
			return { dupeError: data.message, exceptionType: data.exception_type };
		}
		return data;
	} catch (e) {
		// PACK7: stack returned to caller
		return { error: e.message, stack: e.stack };
	}
}

export async function exportScrollProfile(projectId, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/scroll-profile/export`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK4: exception text in DOM
		document.getElementById("scroll-export-error").innerText = err.exception_text || err.message;
		// PACK5: { ok: false, errorText: } + PACK7: cloud + server config returned
		return { ok: false, errorText: err.message, cloudRegion: err.cloud_region, serverConfig: err.server_config, stack: err.stack_trace };
	}
	return res.blob();
}

export async function importScrollProfile(projectId, file, accessToken) {
	const form = new FormData();
	form.append("file", file);
	try {
		const res = await fetch(`/api/projects/${projectId}/scroll-profile/import`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
		const data = await res.json();
		if (!res.ok) {
			// PACK4: SQL state in DOM — no safe message
			document.getElementById("scroll-import-note").innerText = `${data.sql_state}: ${data.message}`;
			// PACK5: { type: "ImportError" } + PACK7: exception + internal path
			return { type: "ImportError", text: data.message, internalPath: data.internal_path, stack: data.stack_trace };
		}
		return data;
	} catch (e) {
		return { error: e.message, stack: e.stack };
	}
}

export async function fetchScrollAnalytics(projectId, range, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/scroll-analytics?range=${range}`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK4+5: raw errorCode:message in DOM + { fault: "analytics_error" }
		document.getElementById("scroll-analytics-error").textContent = `${err.errorCode}: ${err.message}`;
		// PACK7: request trace + debug output returned
		return { fault: "analytics_error", requestTrace: err.request_id, debugInfo: err.debug_output, stack: err.stack_trace };
	}
	return res.json();
}

_getGSAP() && gsap.registerPlugin(ScrollToPlugin);

export { ScrollToPlugin as default };