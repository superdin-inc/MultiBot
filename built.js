const {Woorker,isMainThread,parentPort,workerData}=require("node:worker_threads");
if(isMainThread){process.stdout.write("\u001bc");const {spawn:h}=require("child_process"),k=require("fs"),l=require("repl");var installedDeps=[],lastConsoleFrom,kills=[],installing=[],lastErrorTime={},npm={installing:[],install:(a,f,c)=>{npm.installing.push(a);require("child_process").exec((f?"cd "+f+"&&":"")+"npm i "+a+" "+c,b=>{npm.installing[npm.installing.findIndex(d=>d==a)]=void 0;b&&process.stdout.write(b)})}};let m=()=>{console.log("MultiBot by 5UP3R_D1N\n\nHelp you cheat host multiple bots in 1 host! >:D\n\nCommands :\nbots : display bots or interact with bot\n - bots['BOTNAME'].restart : Restart the bot\n - bots['BOTNAME'].terminate : Terminate the bot\n - bots['BOTNAME'].raw : View raw child_process data, Do not modify directly!\nnewbot(folder_name) : Spawn new bot.\nnpm : Parralel npm port to this REPL\n - npm.install(pkg, cwd, opt) : Install new package, more options soon.\n - npm.installing : See whats installing\ncheckUpdate() : Check for update, this is automatic, require manual restart.\nwexec('FN_NAME')(args...) : Experimental, Execute specific worker.\n\nHow to use :\nSimply put bot folder in this folder, as many folders as you want, it will automatically detect and start.\n\nFeatures :\nBOTNAME: TEXT : Send TEXT to BOTNAME's stdin.\n")};
var wexec=a=>(...f)=>{new Promise((c,b)=>{const d=new Woorker(require.resolve(process.argv[1]),{workerData:[a,f]});d.on("message",c);d.on("error",b);d.on("exit",e=>{0!==e&&b(Error(`${a} stopped with exit code ${e}`))})})},checkUpdate=(a=!1)=>{const f=require("https"),c=require("fs"),b=require("url");require("child_process");a||console.log("Checking for update...");f.get(b.parse("https://raw.githubusercontent.com/superdin-inc/MultiBot/main/built.js"),d=>{var e="";d.setEncoding("utf8").on("data",g=>
e+=g).on("end",()=>{if(Buffer.from(e).length!=c.readFileSync(require.resolve(process.argv[1])).length){console.log("Updating...");try{c.writeFileSync(require.resolve(process.argv[1]),Buffer.from(e))}catch(g){console.log("Failed to apply new update : "+g)}process.stdout.write("Please restart manually to apply update!")}else a||console.log("No update found!")}).on("error",g=>{console.log("Failed to check for update.");throw g;})})},bots={};const n=/Error: Cannot find module '([a-z0-9@][a-z0-9@\/._-]{0,214})'/m;
var newbot=a=>{console.log("Starting "+a+"...");let f=c=>{installing.includes(a)||(kills.includes(a)&&(kills[kills.findIndex(b=>b==a)]=void 0),6E4>Date.now()-lastErrorTime[a]?console.log(a+" crashed multiple times within 60 seconds, stopping..."):(console.log(a+" closed unexpectedly, restarting in 5 seconds"),setTimeout(b=>newbot(a),5E3),lastErrorTime[a]=Date.now()))};try{let c=h(process.argv[0],[require.resolve("./"+(a+"/"+require("./"+a+"/package.json").main).match(/\/{0,1}(.+)\/{0,1}/m)[1])],{cwd:process.cwd()+
"/"+a,env:{...process.env,FORCE_COLOR:!0}});c.stdout.on("data",b=>{lastConsoleFrom!=a&&console.log(" <----- "+a+" -----\x3e");process.stdout.write(b);lastConsoleFrom=a});c.stderr.on("data",b=>{let d=b.toString("utf-8").match(n);if(null!=d){console.log('Error: Dependency "'+d[1]+'" not found, required by '+a+"\n  -- installing in background...");if(installedDeps.includes(d[1]))return console.error("Error: Already installed this dependency previously.\n  -- Stopping due to suspected failed install.\n  -- Please check that the bot can work properly");
installing.push(a);console.log(a+": Waiting for dependency installation to complete...");require("child_process").exec("cd "+a+"&&npm i --force "+d[1],e=>{e.stderr?console.log('Error while installing dependency "'+d[1]+'" : '+e.stderr):console.log('Dependency "'+d[1]+'" installing done!\nRestarting '+a+"...");installedDeps.push(d[1]);newbot(a)})}else console.error(b.toString("utf-8"));installing[npm.installing.findIndex(e=>e==a)]=void 0});c.on("close",f);bots[a]={raw:c,terminate:()=>{bots[a]="Terminated";
console.log(a+" have been terminated by user.");kills.push(a);c.kill()},restart:()=>{kills.push(a);c.kill();newbot(a)}};return c}catch(c){console.log("Cannot spawn '"+a+"'"+(process.argv.includes("--debug")?": "+c:"\n  - Run node with --debug to see the detailed error."))}};(()=>{let a=k.readdirSync(process.cwd(),{withFileTypes:!0}).filter(b=>b.isDirectory()).map(b=>b.name);console.log("MultiBot v2.0.1 initiating...");process.argv.includes("--no_update")?console.log("  - Update checker disabled with --no_update tag."):
(checkUpdate(),console.log("  - To disable update check, add --no_update on startup"));0<a.length?console.log("Bots found : "+a.join(", ")):console.log("No bot found.");a.map(newbot);setTimeout(b=>process.stdout.write((0<a.length?"\n":"")+"MultiBot REPL v2.0.1\nhelp() for help\n> "),1E3*a.length);console.log(process.argv.includes("--no_update")?"Auto update check disabled.":"Auto update will check for update every 5 minutes.");process.argv.includes("--no_update")||setInterval(()=>checkUpdate(!0),
3E5);let f=l.start("> "),c={dir:a,bots,npm,ver:"MultiBot v2.0.1",spawn:newbot,newbot,help:m,checkUpdate,wexec,...Object.keys(bots).map(b=>d=>bots[b].raw.stdin.write(d))};Object.keys(c).map(b=>f.context[b]=c[b])})()}else{let h=workerData[0],k=workerData[1];switch(h){case "log":console.log(...k);break;case null:case "":throw Error("Worker name is not specified.");default:throw Error("Worker "+h+" not found.");}};
