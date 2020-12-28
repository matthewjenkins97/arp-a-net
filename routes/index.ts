import { execSync } from "child_process";

export function get(request, response) {
	// @ts-expect-error
	let arpOutput = execSync("arp -a", { shell: true }).toString();
	arpOutput = arpOutput.trim()
	let arpArray = arpOutput.split(/(?: at | on |\n)/g);
	response.render("pages/index", { lines: arpArray });
}

// Example route with a URL parameter and middleware:
//import { json } from "express";
//
//export function post(path) {
//	return {
//		"path": path + "/:parameter",
//		"middleware": [
//			require("express").json()
//		],
//		"callback": function(request, response) {
//			response.json({
//				"parameter": request.params["parameter"],
//				...request.body
//			});
//		}
//	};
//}
