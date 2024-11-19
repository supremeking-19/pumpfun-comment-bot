const fs = require("fs");
const readline = require("readline");
const axios = require("axios");
const chalk = require("chalk");
const httpsProxyAgent = require("https-proxy-agent");
const socksProxyAgent = require("socks-proxy-agent");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function promptUser(query) {
	return new Promise((resolve) => rl.question(query, resolve));
}

function readComments() {
  return new Promise((resolve, reject) => {
    fs.readFile('comments.txt', 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.split('\n').map(comment => comment.trim()).filter(comment => comment.length > 0));
      }
    });
  });
}

function getProxies() {
	const proxiesFile = fs.readFileSync("./proxies.txt", "utf8");
	return proxiesFile.split("\n").filter(Boolean);
}

let proxies = [];
let currentProxyIndex = 0;

function getRandomProxy() {
	if (proxies.length === 0) {
		proxies = getProxies();
	}
	const proxy = proxies[currentProxyIndex];
	currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
	return proxy;
}

async function randomComment() {
	const commentsFile = fs.readFileSync("./comments.txt", "utf8");
	const comments = commentsFile.split("\n");
	return comments[Math.floor(Math.random() * comments.length)];
}

async function signInRandom() {
	// see how to create the signIn at discord.gg/solana-scripts
}

async function commentThread(threadId, token) {
	const commentsUrl = `https://pumpfun.com/thread/${threadId}/comments`;
	try {
		const response = await axios.get(commentsUrl, {
			headers: {
				"Content-Type": "application/json",
			},
		});
		const comments = response.data.comments;
		const commentId = comments[Math.floor(Math.random() * comments.length)].id;
		const randomCommentText = await randomComment();
		const proxy = getRandomProxy();
		const config = {
			headers: {
				Cookie: `token=${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				text: `#${commentId} ${randomCommentText}`,
				mint: threadId,
				token,
			}),
		};
		if (proxy) {
			if (proxy.startsWith("http")) {
				config.agent = new httpsProxyAgent(proxy);
			} else if (proxy.startsWith("socks")) {
				config.agent = new socksProxyAgent(proxy);
			}
		}
		const postUrl = `https://pumpfun.com/thread/${threadId}/comment`;
		const postResponse = await axios.post(postUrl, config);
		if (postResponse.status === 200) {
			console.log(chalk.greenBright(`Commented: ${randomCommentText}`));
		} else {
			console.log(chalk.redBright(`Failed to comment: ${postResponse.statusText}`));
		}
	} catch (error) {
		console.log(chalk.redBright("Error posting comment:", error.message));
	}
}

async function main() {
	const mode = await promptUser(chalk.blueBright("Choose mode: [1] Random Wallets, [2] User Wallets, [3] Like Replies, [4] Shill Wallets, [5] Thread Mode, [6] Exit: "));
	switch (mode) {
		case "1":
			console.log(chalk.yellowBright("Random Wallets mode selected."));
			console.log("discord.gg/solana-scripts");
			break;
		case "2":
			console.log(chalk.yellowBright("User Wallets mode selected."));
			console.log("discord.gg/solana-scripts");
			break;
		case "3":
			console.log(chalk.yellowBright("Like Replies mode selected."));
			console.log("discord.gg/solana-scripts");
			break;
		case "4":
			console.log(chalk.yellowBright("Shill Wallets mode selected."));
			break;
		case "5":
			const threadId = await promptUser(chalk.blueBright("Enter thread ID: "));
			const token = await signInRandom();
			await commentThread(threadId, token);
			break;
		case "6":
			console.log(chalk.greenBright("Exiting..."));
			rl.close();
			process.exit(0);
		default:
			console.log(chalk.redBright("Invalid choice, try again."));
	}
	await main();
}

main();