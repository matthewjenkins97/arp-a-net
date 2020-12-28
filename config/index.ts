import * as fs from "fs";
import * as path from "path";
import convict from "convict";

const flattenedOptions = {
	"env": {
		"format": ["production", "development", "test"],
		"default": "development",
		"env": "NODE_ENV",
		"arg": "env"
	},
	"port": {
		"format": "port",
		"default": 8080,
		"env": "PORT",
		"arg": "port"
	}
};

(function bindConfigurations(directory) {
	function convictify(options, namespace = []) {
		for (const option of options) {
			if (option["name"] === undefined) {
				throw new Error("`option[\"name\"]` is required.");
			}

			const name = [...namespace, ...option["name"].split(/(?=[A-Z])/)].reduce(function(previous, current) {
				return previous + current[0].toUpperCase() + current.substring(1);
			});

			const environmentVariableName = option["env"] || [...namespace, ...option["name"].split(/(?=[A-Z])/)].join("_").toUpperCase();
			const commandLineArgumentName = option["arg"] || [...namespace, ...option["name"].split(/(?=[A-Z])/)].join("-").toLowerCase();

			// For third-party scripts that make direct access to `process.env.*`
			if (process.env[environmentVariableName] === undefined) {
				if (typeof option["default"] === "object" && option["default"] !== null) {
					process.env[environmentVariableName] = JSON.stringify(option["default"]);
				} else {
					process.env[environmentVariableName] = option["default"];
				}
			}

			flattenedOptions[name] = {
				"format": option["format"] || "String",
				"default": option["default"],
				"env": option["default"] && environmentVariableName,
				"arg": commandLineArgumentName
			};

			if (option["sensitive"] !== undefined) {
				flattenedOptions[name]["sensitive"] = option["sensitive"];
			}
		}
	}

	(function recurse(directory) {
		for (const file of fs.readdirSync(directory)) {
			if (fs.statSync(path.join(directory, file)).isDirectory()) {
				recurse(path.join(directory, file));
			} else if (directory === __dirname) {
				if (file !== "index.ts" && path.extname(file).toLowerCase() === ".ts") {
					convictify(require(path.join(directory, file))["default"], [file]);
				}
			} else if (path.extname(file).toLowerCase() === ".ts") {
				let namespace;

				if (file === "index.ts") {
					namespace = directory.substring(__dirname.length + 1).split(/\//g);
				} else {
					namespace = [...directory.substring(__dirname.length + 1).split(/\//g), path.basename(file, path.extname(file))];
				}

				convictify(require(path.join(directory, file))["default"], namespace);
			}
		}
	})(directory);
})(__dirname);

export const config = convict(flattenedOptions);

// Perform validation
config.validate({ "allowed": "strict" });
