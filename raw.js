let ver = "2.2.1",
	news = "Fixed reworked npm spawn glitch on windows\nJust know that calling npm with uppercase is forbidden.";
const {
	Worker: Woorker, //closure compiler will cause error with Worker name
	isMainThread,
	parentPort,
	workerData,
} = require("node:worker_threads");
var wexec = (name = "help", ...args) => {
	return new Promise((resolve, reject) => {
		const worker = new Woorker(require.resolve(process.argv[1]), {
			workerData: [name, args],
		});
		worker.on("message", resolve);
		worker.on("error", reject);
		worker.on("exit", code => {
			if (code !== 0)
				reject(new Error(`${name} stopped with exit code ${code}`));
		});
	});
};
if (isMainThread) {
	process.stdout.write("\u001bc");
	const { spawn: s } = require("child_process");
	const fs = require("fs"),
		REPL = require("repl"),
		path = require("path");
	var installedDeps = [],
		lastConsoleFrom,
		kills = [],
		installing = [],
		lastErrorTime = {},
		npm_cwd,
		npm_paths = [
			"npm",
			...Object.keys(process.env)
				.map(e =>
					process.env[e]
						.split(";")
						.map(e =>
							fs.existsSync(path.join(e, "npm"))
								? fs.existsSync(path.join(e, "npm", "npm"))
									? path.join(e, "npm	", "npm")
									: path.join(e, "npm")
								: undefined
						)
				)
				.flat(Infinity)
				.filter(e => e !== undefined),
		];
	/*var npm = {
		installing: [],
		install: (pkg = "", cwd, opt = "") => {
			npm.installing.push(pkg);
			require("child_process").exec(
				(cwd ? "cd " + cwd + "&&" : "") + "npm i " + pkg + " " + opt,
				result => {
					npm.installing[npm.installing.findIndex(a => a == pkg)] = undefined;
					if (result) process.stdout.write(result);
				}
			);
		},
	};*/
	var npm = new Proxy(
		() => {
			s(/^win/.test(process.platform) ? "npm.cmd" : "npm", [], {
				stdio: "inherit",
			}).on("close", () =>
				console.log(
					'Please note that commands are in javascript form\n  - "npm install <pkg>" will be "npm.install(\'pkg\')"'
				)
			);
		},
		{
			get: (t, p) => {
				switch (p) {
					case "setCwd":
						return cwd => (npm_cwd = path.resolve(cwd));
					case "cwd":
						return () => npm_cwd;
					default:
						if (!npm_cwd)
							throw new Error("npm CWD not set, run npm.setCwd('CWD') to set.");
						return (...pkg) => {
							let i = 0;
							do {
								try {
									if (i == 0) console.log("Using main npm");
									else
										console.log(
											"Using fallbacks from PATH env : " + npm_paths[i]
										);
									require("child_process").execSync(
										"cd " +
											npm_cwd +
											"&&" +
											npm_paths[i] +
											" " +
											p +
											(pkg.length > 0 ? " " : "") +
											pkg.join(" ")
										//npm_paths[i],
										//[p, ...pkg],
										//{ stdio: "inherit", cwd: npm_cwd }
									);
									return (
										"Executed npm " +
										p +
										(pkg.length > 0 ? " " : "") +
										pkg.join(" ")
									);
								} catch (e) {
									i++;
								}
							} while (i < npm_paths.length);
						};
				}
			},
		}
	);
	let help = () => {
		console.log(
			"MultiBot by 5UP3R_D1N\n\nHelp you cheat host multiple bots in 1 host! >:D\n\nCommands :\nbots : display bots or interact with bot" +
				"\n - bots['BOTNAME'].restart() : Restart the bot\n - bots['BOTNAME'].terminate() : Terminate the bot\n - bots['BOTNAME'].raw : View raw child_process data, Do not modify directly!" +
				"\nnewbot(folder_name) : Spawn new bot.\nnpm : Parralel npm port to this REPL\n - npm() : Get help for npm." +
				"\ncheckUpdate() : Check for update, this is automatic, require manual restart.\nwexec('FN_NAME',args...) : Experimental, Execute specific worker." +
				"\n\nHow to use :\nSimply put bot folder in this folder, as many folders as you want, it will automatically detect and start." +
				"\n\nFeatures :\nBOTNAME: TEXT : Send TEXT to BOTNAME's stdin.\n"
		);
	};
	var checkUpdate = (disablemsg = false) => {
		const https = require("https"),
			fs = require("fs"),
			url = require("url"),
			cp = require("child_process");
		if (!disablemsg) console.log("Checking for update...");
		https.get(
			url.parse(
				"https://raw.githubusercontent.com/superdin-inc/MultiBot/main/built.js"
			),
			r => {
				var body = "";
				r.setEncoding("utf8")
					.on("data", d => (body += d))
					.on("end", () => {
						if (
							Buffer.from(body).length !=
							fs.readFileSync(require.resolve(process.argv[1])).length
						) {
							console.log("Updating...");
							try {
								fs.writeFile(
									require.resolve(process.argv[1]),
									Buffer.from(body),
									e =>
										process.stdout.write(
											e
												? "Failed to apply new update : " + e.message
												: "Please restart manually to apply update!"
										)
								);
								Object.keys(bots).forEach(e => bots[e].terminate());
							} catch (e) {
								console.log("Failed to apply new update : " + e);
							}
						} else if (!disablemsg) console.log("No update found!");
					})
					.on("error", e => {
						console.log("Failed to check for update.");
						throw e;
					});
			}
		);
	};
	var bots = {};
	const dep_regex =
		/Error: Cannot find module '([a-z0-9@][a-z0-9@\/._-]{0,214})'/m;
	/**
	 * This is a function where type checking is disabled.
	 * @suppress {suspiciousCode}
	 */
	var newbot = (e, suppressNotAbot = false) => {
		let onClose = a => {
			if (installing.includes(e)) return;
			if (kills.includes(e)) {
				kills[kills.findIndex(ae => ae == e)] = undefined;
			}
			if (Date.now() - lastErrorTime[e] < 60000)
				console.log(
					e + " crashed multiple times within 60 seconds, stopping..."
				);
			else {
				console.log(e + " closed unexpectedly, restarting in 5 seconds");
				setTimeout(a => newbot(e), 5000);
				lastErrorTime[e] = Date.now();
			}
		};
		try {
			if (!fs.existsSync("./" + e + "/package.json")) {
				if (!suppressNotAbot)
					console.log(e + " is not a bot(Cannot find package.json).");
				return undefined;
			} else console.log("Starting " + e + "...");
			let bot = s(
				process.argv[0],
				[
					/*process.cwd() + "/" +*/
					require.resolve(
						"./" +
							(e + "/" + require("./" + e + "/package.json").main).match(
								/\/{0,1}(.+)\/{0,1}/m
							)[1]
					),
				],
				{
					cwd: process.cwd() + "/" + e,
					env: { ...process.env, FORCE_COLOR: true },
				}
			);
			bot.stdout.on("data", b => {
				if (lastConsoleFrom != e) console.log(" <----- " + e + " ----->");
				process.stdout.write(b);
				lastConsoleFrom = e;
			});
			bot.stderr.on("data", a => {
				let missing = a.toString("utf-8").match(dep_regex);
				if (missing != null) {
					console.log(
						'Error: Dependency "' +
							missing[1] +
							'" not found, required by ' +
							e +
							"\n  -- installing in background..."
					);
					if (installedDeps.includes(missing[1]))
						return console.error(
							"Error: Already installed this dependency previously.\n  -- Stopping due to suspected failed install.\n  -- Please check that the bot can work properly"
						);
					installing.push(e);
					console.log(
						e + ": Waiting for dependency installation to complete..."
					);
					require("child_process").exec(
						"cd " + e + "&&npm i --force " + missing[1],
						result => {
							if (!result.stderr)
								console.log(
									'Dependency "' +
										missing[1] +
										'" installing done!\nRestarting ' +
										e +
										"..."
								);
							else
								console.log(
									'Error while installing dependency "' +
										missing[1] +
										'" : ' +
										result.stderr
								);
							installedDeps.push(missing[1]);
							newbot(e);
						}
					);
				} else console.error(a.toString("utf-8"));
				//!installing[npm.installing.findIndex(a => a == e)] = undefined; npm v1 only
			});
			bot.on("close", onClose);
			bots[e] = {
				raw: bot,
				terminate: () => {
					bots[e] = "Terminated";
					console.log(e + " have been terminated by user.");
					kills.push(e);
					bot.kill();
				},
				restart: () => {
					kills.push(e);
					bot.kill();
					newbot(e);
				},
			};
			return bot;
		} catch (a) {
			console.log(
				"Cannot spawn '" +
					e +
					"'" +
					(process.argv.includes("--debug")
						? ": " + a
						: "\n  - Run node with --debug to see the detailed error.")
			);
		}
	};
	(() => {
		/** @noalias */
		let dir = fs
			.readdirSync(process.cwd(), { withFileTypes: true })
			.filter(item => item.isDirectory())
			.map(item => item.name);
		console.log("MultiBot v" + ver + " initiating...");
		if (!process.argv.includes("--no_update")) {
			checkUpdate();
			console.log("  - To disable update check, add --no_update on startup");
		} else console.log("  - Update checker disabled with --no_update tag.");
		console.log("\n\nChangelog in v" + ver + " :\n" + news + "\n\n");
		if (dir.length > 0) console.log("Directories found : " + dir.join(", "));
		else console.log("No bot found.");
		dir.forEach(e => newbot(e, true));
		var stack = [];
		setTimeout(
			e =>
				process.stdout.write(
					(bots.length > 0 ? "\n" : "") +
						"\n> repl\nMultiBot REPL v" +
						ver +
						"\n --help() for help--\n> "
				),
			bots.length * 1000
		);
		console.log(
			process.argv.includes("--no_update")
				? "Auto update check disabled."
				: "Auto update will check for update every 5 minutes."
		);
		process.argv.includes("--no_update") ||
			setInterval(() => checkUpdate(true), 300000);
		let repl = REPL.start("> ");
		let cmds = {
			dir: dir,
			bots: bots,
			npm: npm,
			ver: "MultiBot v" + ver,
			spawn: newbot,
			newbot: newbot,
			help: help,
			checkUpdate: checkUpdate,
			wexec: wexec,
			...Object.keys(bots).map(e => msg => bots[e].raw.stdin.write(msg)),
		};
		Object.keys(cmds).map(e => (repl.context[e] = cmds[e]));
	})();
} else {
	let wname = workerData[0],
		warg = workerData[1],
		arg0 = workerData[1][0];
	/*switch (wname) {
		case "log":
			console.log(...warg);
			break;
		case "newbotvm":
			const vm = require("vm"),
				fs = require("fs");
			if (!warg[0].cwd) throw new Error("CWD not specified");
			vm.runInNewContext(
				fs
					.readFileSync(warg[0].index || "index.js")
					.toString("utf-8")
					.replace(/require\((.*)\)/, "require('" + warg[0].index + "'+$1)"),
				vm.createContext({ require })
			);
			parentPort.postMessage("VM " + warg[0].index + " exited.");
		//Add more here
		case null:
		case "":
			throw new Error("Worker name is not specified.");
		default:
			throw new Error("Worker " + wname + " not found.");
	}*/
	if (!wname) throw new Error("Worker name is not specified.");
	let cmds = {
		newbotvm: {
			desc: "run new bot inside Worker's VM",
			arg_usage: '{[index:"BOT_INDEX",]cwd:"BOT_FOLDER"}',
			run: () => {
				const vm = require("vm"),
					fs = require("fs");
				if (!warg[0].cwd) throw new Error("CWD not specified");
				vm.runInNewContext(
					fs
						.readFileSync(warg[0].index || "index.js")
						.toString("utf-8")
						.replace(/require\((.*)\)/, "require('" + warg[0].index + "'+$1)"),
					vm.createContext({ require })
				);
				parentPort.postMessage("VM " + warg[0].index + " exited.");
			},
		},
		help: {
			desc: "display this help",
			arg_usage: "[cmdname]",
			run: () => {
				if (!arg0 || Object.keys(cmds).includes(arg0)) {
					console.log(
						"MultiBot::v" +
							ver +
							"::Worker." +
							(arg0 ? arg0 + ".help" : "help") +
							"\n" +
							(arg0
								? ` - ${arg0}\n  - Description :\n${cmds[arg0].desc
										.split("\n")
										.map(e => ">   " + e)
										.join("\n")}\n  - Usage : wexec('${arg0}')(${
										cmds[arg0].arg_usage
								  })`
								: Object.keys(cmds)
										.map(
											e =>
												` - ${e}\n  - Description :\n${cmds[e].desc
													.split("\n")
													.map(e => "    | " + e)
													.join("\n")}\n  - Usage : wexec('${e}')(${
													cmds[e].arg_usage
												})`
										)
										.join("\n"))
					);
				} else
					console.log("MultiBot::v" + ver + "::Worker." + arg0 + ": Not found");
				parentPort.postMessage(undefined);
			},
		},
		//add more here!
	};
	if (!Object.keys(cmds).includes(wname))
		throw new Error("Worker " + wname + " not found.");
	cmds[wname].run(...warg);
	parentPort.postMessage(
		"Worker " + wname + " exited with no error or result."
	);
}
