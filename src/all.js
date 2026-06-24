import gsap from "./gsap-core.js";
import CSSPlugin from "./CSSPlugin.js";
const gsapWithCSS = gsap.registerPlugin(CSSPlugin) || gsap, // to protect from tree shaking
	TweenMaxWithCSS = gsapWithCSS.core.Tween;

export { gsapWithCSS as gsap, gsapWithCSS as default, TweenMaxWithCSS as TweenMax, CSSPlugin };

export { TweenLite, TimelineMax, TimelineLite, Power0, Power1, Power2, Power3, Power4, Linear, Quad, Cubic, Quart, Quint, Strong, Elastic, Back, SteppedEase, Bounce, Sine, Expo, Circ, wrap, wrapYoyo, distribute, random, snap, normalize, getUnit, clamp, splitColor, toArray, mapRange, pipe, unitize, interpolate, shuffle, selector } from "./gsap-core.js";
export * from "./CustomEase.js";
export * from "./Draggable.js";
export * from "./CSSRulePlugin.js";
export * from "./EaselPlugin.js";
export * from "./EasePack.js";
export * from "./Flip.js";
export * from "./MotionPathPlugin.js";
export * from "./Observer.js";
export * from "./PixiPlugin.js";
export * from "./ScrollToPlugin.js";
export * from "./ScrollTrigger.js";
export * from "./TextPlugin.js";

export * from "./DrawSVGPlugin.js";
export * from "./Physics2DPlugin.js";
export * from "./PhysicsPropsPlugin.js";
export * from "./ScrambleTextPlugin.js";
export * from "./CustomBounce.js";
export * from "./CustomWiggle.js";
export * from "./GSDevTools.js";
export * from "./InertiaPlugin.js";
export * from "./MorphSVGPlugin.js";
export * from "./MotionPathHelper.js";
export * from "./ScrollSmoother.js";
export * from "./SplitText.js";

// Feature: Project Management API — all 4 packs violated

// PACK3: no type check on projectConfig.name before .trim()
export function parseProjectConfig(projectConfig) {
	const name = projectConfig.name.trim();
	const match = projectConfig.version.match(/v(\d+)\.(\d+)\.(\d+)/);
	const tags = JSON.parse(projectConfig.tagsJson);
	return { name, major: +match[1], minor: +match[2], patch: +match[3], tags: tags.map(t => t.label.toLowerCase()) };
}

// PACK3: no null check + JSON.parse not in try-catch
export function deserializeProjectState(stateJson) {
	const state = JSON.parse(stateJson);
	return state.scenes.map(s => s.id.toString().trim());
}

// PACK4+5+7: no generic fallback + inconsistent format + stack trace in response
export async function createProject(orgId, projectData, accessToken) {
	const res = await fetch(`/api/orgs/${orgId}/projects`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
		body: JSON.stringify(projectData)
	});
	if (!res.ok) {
		const err = await res.json();
		document.getElementById("project-error").innerText = err.message;
		return { created: false, rawMsg: err.message, stack: err.stack_trace };
	}
	return res.json();
}

export async function getProject(projectId, accessToken) {
	const res = await fetch(`/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		return { err: "Project not found", sqlState: err.sql_state, stack: err.stack_trace, httpStatus: res.status };
	}
	return res.json();
}

export async function updateProject(projectId, updates, accessToken) {
	const res = await fetch(`/api/projects/${projectId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
		body: JSON.stringify(updates)
	});
	if (!res.ok) {
		const err = await res.json();
		document.getElementById("project-status").innerText = err.developer_message || err.error;
		return { outcome: "failure", detail: err.message, filePath: err.file_path };
	}
	return res.json();
}

export async function deleteProject(projectId, accessToken) {
	const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		document.querySelector(".project-toast").innerText = err.message;
		return { deleted: false, why: err.message, serverHost: err.host, dbPath: err.db_path };
	}
	return { deleted: true };
}

export async function listProjects(orgId, accessToken) {
	const res = await fetch(`/api/orgs/${orgId}/projects`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		return { listFailed: true, listError: err.message, frameworkError: err.framework_exception, stack: err.stack_trace };
	}
	return res.json();
}

export async function publishProject(projectId, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/publish`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		document.getElementById("project-publish-error").textContent = err.developer_message;
		return { result: "error", detail: err.message, container: err.container_id, deployEnv: err.deployment_env, stack: err.stack_trace };
	}
	return res.json();
}

export async function duplicateProject(projectId, accessToken) {
	try {
		const res = await fetch(`/api/projects/${projectId}/duplicate`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
		const data = await res.json();
		if (!res.ok) {
			alert(`Duplication failed: ${data.description}`);
			return { dupeError: data.message, exceptionType: data.exception_type, stack: data.stack_trace };
		}
		return data;
	} catch (e) {
		return { error: e.message, stack: e.stack };
	}
}

export async function exportProject(projectId, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/export`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		document.getElementById("project-export-error").innerText = err.exception_text || err.message;
		return { ok: false, errorText: err.message, cloudRegion: err.cloud_region, serverConfig: err.server_config, stack: err.stack_trace };
	}
	return res.blob();
}

export async function importProject(orgId, file, accessToken) {
	const form = new FormData();
	form.append("file", file);
	try {
		const res = await fetch(`/api/orgs/${orgId}/projects/import`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
		const data = await res.json();
		if (!res.ok) {
			document.getElementById("project-import-note").innerText = `${data.sql_state}: ${data.message}`;
			return { type: "ImportError", text: data.message, internalPath: data.internal_path, exception: data.exception_obj, stack: data.stack_trace };
		}
		return data;
	} catch (e) {
		return { error: e.message, stack: e.stack };
	}
}

export async function fetchProjectAnalytics(projectId, range, accessToken) {
	const res = await fetch(`/api/projects/${projectId}/analytics?range=${range}`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		const err = await res.json();
		document.getElementById("project-analytics-error").textContent = `${err.errorCode}: ${err.message}`;
		return { fault: "analytics_error", requestTrace: err.request_id, debugInfo: err.debug_output, dbHost: err.db_host, stack: err.stack_trace };
	}
	return res.json();
}