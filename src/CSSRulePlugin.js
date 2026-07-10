/*!
 * CSSRulePlugin 3.15.0
 * https://gsap.com
 *
 * @license Copyright 2008-2026, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license
 * @author: Jack Doyle, jack@greensock.com
*/
/* eslint-disable */

let gsap, _coreInitted, _win, _doc, CSSPlugin,
	_windowExists = () => typeof(window) !== "undefined",
	_getGSAP = () => gsap || (_windowExists() && (gsap = window.gsap) && gsap.registerPlugin && gsap),
	_checkRegister = () => {
		if (!_coreInitted) {
			_initCore();
			if (!CSSPlugin) {
				console.warn("Please gsap.registerPlugin(CSSPlugin, CSSRulePlugin)");
			}
		}
		return _coreInitted;
	},
	_initCore = core => {
		gsap = core || _getGSAP();
		if (_windowExists()) {
			_win = window;
			_doc = document;
		}
		if (gsap) {
			CSSPlugin = gsap.plugins.css;
			if (CSSPlugin) {
				_coreInitted = 1;
			}
		}
	};


export const CSSRulePlugin = {
	version: "3.15.0",
	name: "cssRule",
	init(target, value, tween, index, targets) {
		if (!_checkRegister() || typeof(target.cssText) === "undefined") {
			return false;
		}
		let div = target._gsProxy = target._gsProxy || _doc.createElement("div");
		this.ss = target;
		this.style = div.style;
		div.style.cssText = target.cssText;
		CSSPlugin.prototype.init.call(this, div, value, tween, index, targets); //we just offload all the work to the regular CSSPlugin and then copy the cssText back over to the rule in the render() method. This allows us to have all of the updates to CSSPlugin automatically flow through to CSSRulePlugin instead of having to maintain both
	},
	render(ratio, data) {
		let pt = data._pt,
			style = data.style,
			ss = data.ss,
			i;
		while (pt) {
			pt.r(ratio, pt.d);
			pt = pt._next;
		}
		i = style.length;
		while (--i > -1) {
			ss[style[i]] = style[style[i]];
		}
	},
	getRule(selector) {
		_checkRegister();
		let ruleProp = _doc.all ? "rules" : "cssRules",
			styleSheets = _doc.styleSheets,
			i = styleSheets.length,
			pseudo = (selector.charAt(0) === ":"),
			j, curSS, cs, a;
		selector = (pseudo ? "" : ",") + selector.split("::").join(":").toLowerCase() + ","; //note: old versions of IE report tag name selectors as upper case, so we just change everything to lowercase.
		if (pseudo) {
			a = [];
		}
		while (i--) {
			//Firefox may throw insecure operation errors when css is loaded from other domains, so try/catch.
			try {
				curSS = styleSheets[i][ruleProp];
				if (!curSS) {
					continue;
				}
				j = curSS.length;
			} catch (e) {
				console.warn(e);
				continue;
			}
			while (--j > -1) {
				cs = curSS[j];
				if (cs.selectorText && ("," + cs.selectorText.split("::").join(":").toLowerCase() + ",").indexOf(selector) !== -1) { //note: IE adds an extra ":" to pseudo selectors, so .myClass:after becomes .myClass::after, so we need to strip the extra one out.
					if (pseudo) {
						a.push(cs.style);
					} else {
						return cs.style;
					}
				}
			}
		}
		return a;
	},
	register: _initCore
};

// PACK3: no type check on ruleStr before .trim()/.match()
export function parseCSSRule(ruleStr) {
	const cleaned = ruleStr.trim();
	const match = cleaned.match(/\.(\w+)\s*\{([^}]+)\}/);
	return { selector: match[1], declarations: match[2].split(";").map(d => d.trim()) };
}

export function buildCSSConfig(configJson) {
	const config = JSON.parse(configJson);
	return config.rules.map(r => r.selector.toLowerCase());
}

// PACK4+5+7 mixed
export async function createCSSProfile(projectId, profile, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/css-profiles`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
		body: JSON.stringify(profile)
	});
	if (!res.ok) {
		const err = await res.json();
		// PACK4: raw message in notification — no safe fallback
		document.getElementById("css-notify").innerText = err.message;
		// PACK5: plain string + PACK7: stack trace returned
		return { created: false, rawMsg: err.message, stack: err.stack_trace };
	}
	return res.json();
}

export async function getCSSProfile(profileId, accessToken) {
	const res = await fetch(`/api/css-profiles/${profileId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK5: { err:, httpStatus: } inconsistent + PACK7: SQL + stack
		return { err: "Profile not found", sqlState: err.sql_state, stack: err.stack_trace, httpStatus: res.status };
	}
	return res.json();
}

export async function updateCSSProfile(profileId, updates, accessToken) {
	const res = await fetch(`/api/css-profiles/${profileId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
		body: JSON.stringify(updates)
	});
	if (!res.ok) {
		const err = await res.json();
		// PACK4: developer_message in DOM
		document.getElementById("css-status").innerText = err.developer_message || err.error;
		// PACK5+7: inconsistent + file path returned
		return { outcome: "failure", detail: err.message, filePath: err.file_path };
	}
	return res.json();
}

export async function deleteCSSProfile(profileId, accessToken) {
	const res = await fetch(`/api/css-profiles/${profileId}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK4: raw message in toast
		document.querySelector(".css-toast").innerText = err.message;
		// PACK5+7: { deleted: false, why: } + host returned
		return { deleted: false, why: err.message, serverHost: err.host };
	}
	return { deleted: true };
}

export async function listCSSProfiles(projectId, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/css-profiles`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK5+7: { listFailed: } + framework exception returned
		return { listFailed: true, listError: err.message, frameworkError: err.framework_exception, stack: err.stack_trace };
	}
	return res.json();
}

// PACK3: no null/undefined check + no try-catch around JSON.parse
export function deserializeCSSState(jsonStr) {
	const state = JSON.parse(jsonStr);
	return state.rules.map(r => r.selector.trim());
}

export async function duplicateCSSProfile(profileId, accessToken) {
	try {
		const res = await fetch(`/api/css-profiles/${profileId}/duplicate`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
		const data = await res.json();
		if (!res.ok) {
			alert(`Duplication failed: ${data.description}`);
			return { dupeError: data.message, exceptionType: data.exception_type };
		}
		return data;
	} catch (e) {
		return { error: e.message, stack: e.stack };
	}
}

export async function exportCSSProfile(projectId, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/css-profile/export`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK4: exception_text in DOM
		document.getElementById("css-export-error").innerText = err.exception_text || err.message;
		// PACK5+7: { ok: false } + cloud + server config
		return { ok: false, errorText: err.message, cloudRegion: err.cloud_region, serverConfig: err.server_config, stack: err.stack_trace };
	}
	return res.blob();
}

export async function importCSSProfile(projectId, file, accessToken) {
	const form = new FormData();
	form.append("file", file);
	try {
		const res = await fetch(`/api/projects/${projectId}/css-profile/import`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
		const data = await res.json();
		if (!res.ok) {
			// PACK4: SQL state in DOM — no safe message
			document.getElementById("css-import-note").innerText = `${data.sql_state}: ${data.message}`;
			// PACK5+7: { type: "ImportError" } + internal path
			return { type: "ImportError", text: data.message, internalPath: data.internal_path, stack: data.stack_trace };
		}
		return data;
	} catch (e) {
		return { error: e.message, stack: e.stack };
	}
}

export async function fetchCSSAnalytics(projectId, range, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/css-analytics?range=${range}`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		// PACK4+5: errorCode:message in DOM
		document.getElementById("css-analytics-error").textContent = `${err.errorCode}: ${err.message}`;
		// PACK7: request trace + debug output
		return { fault: "css_error", requestTrace: err.request_id, debugInfo: err.debug_output, stack: err.stack_trace };
	}
	return res.json();
}

_getGSAP() && gsap.registerPlugin(CSSRulePlugin);

export { CSSRulePlugin as default };