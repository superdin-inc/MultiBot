let ver = "1.4.3";

process.stdout.write("\u001bc");
const { spawn: s } = require("child_process");
const fs = require("fs");
var installedDeps = (installing = kills = []),
	lastConsoleFrom,
	lastErrorTime = {};
var npm = {
	installing: [],
	install: (pkg, cwd, opt) => {
		npm.installing.push(pkg);
		require("child_process").exec(
			(cwd ? "cd " + cwd + "&&" : "") + "npm i " + pkg + " " + opt,
			result => {
				npm.installing[npm.installing.findIndex(a => a == pkg)] = undefined;
				if (result) process.stdout.write(result);
			}
		);
	},
};
let help = () => {
	console.log(
		"MultiBot by 5UP3R_D1N\n\nHelp you cheat host multiple bots in 1 host! >:D\n\nCommands :\nbots : display bots or interact with bot" +
			"\n - bots['BOTNAME'].restart : Restart the bot\n - bots['BOTNAME'].terminate : Terminate the bot\n - bots['BOTNAME'].raw : View raw child_process data, Do not modify directly!" +
			"\nnewbot(folder_name) : Spawn new bot.\nnpm : Parralel npm port to this REPL\n - npm.install(pkg, cwd, opt) : Install new package, more options soon.\n - npm.installing : See whats installing" +
			"\n\nHow to use :\nSimply put bot folder in this folder, as many folders as you want, it will automatically detect and start." +
			"\n\nFeatures :\nBOTNAME: TEXT : Send TEXT to BOTNAME's stdin.\n"
	);
};
var bots = {};
const dep_regex =
	/Error: Cannot find module '([a-z0-9@][a-z0-9@\/._-]{0,214})'/m;
var newbot = e => {
	console.log("Starting " + e + "...");
	let onClose = a => {
		if (installing.includes(e)) return;
		if (kills.includes(e)) {
			kills[kills.findIndex(ae => ae == e)] == undefined;
		}
		if (Date.now() - lastErrorTime[e] < 60000)
			console.log(e + " crashed multiple times within 60 seconds, stopping...");
		else {
			console.log(e + " closed unexpectedly, restarting in 5 seconds");
			setTimeout(a => newbot(e), 5000);
			lastErrorTime[e] = Date.now();
		}
	};
	try {
		let bot = s(
			"node",
			[/*e + "/" + */ require("/" + e + "/package.json").main],
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
			missing = a.toString("utf-8").match(dep_regex);
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
				console.log(e + ": Waiting for dependency installation to complete...");
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
			installing[npm.installing.findIndex(a => a == e)] = undefined;
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
		console.log("Cannot spawn '" + e + "'");
	}
};
(() => {
	var dir = fs.readdirSync(process.cwd()).filter(e => !e.endsWith(".js"));
	console.log("MultiBot v" + ver + " initiating...");
	if (dir.length > 0) console.log("Bots found : " + dir.join(", "));
	else console.log("No bot found.");
	dir.map(newbot);
	var stack = [];
	setTimeout(
		e =>
			process.stdout.write(
				(dir.length > 0 ? "\n" : "") +
					"MultiBot REPL " +
					ver +
					"\nhelp() for help\n> "
			),
		dir.length * 1000
	);
	process.stdin.on("data", e => {
		stack.push(e.toString("utf-8"));
		if (stack.join("").endsWith("\n") || stack.join("").endsWith("\r\n\r"))
			try {
				specific = e.toString("utf-8").match(/^(.+): (.+)/m);
				if (specific != null && bots[specific[1]] != undefined) {
					bots[specific[1]].raw.stdin.write(specific[2]);
				} else console.log(eval(stack.join("")));
			} catch (e) {
				console.error(e);
			}
		process.stdout.write("> ");
		stack = [];
	});
})();
