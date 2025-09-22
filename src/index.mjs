import * as core from "@actions/core";
import * as github from "@actions/github";
import { HttpClient } from "@actions/http-client";

async function main() {
	// get inputs
	const githubToken = core.getInput("token", { required: true });
	const webhookUrl = core.getInput("url", { required: true });
	const jobId = parseInt(core.getInput("job_id"));

	const api = github.getOctokit(githubToken);

	// get info about the current run
	const workflowResponse = await api.rest.actions.getWorkflowRun({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		run_id: github.context.runId,
	});

	assertStatusCodeOk(workflowResponse.status);
	const run = workflowResponse.data;

	const jobsResponse = await api.rest.actions.listJobsForWorkflowRunAttempt({
		owner: run.repository.owner.login,
		repo: run.repository.name,
		run_id: run.id,
		attempt_number: run.run_attempt,
	});

	assertStatusCodeOk(jobsResponse.status);
	const jobs = jobsResponse.data.jobs;

	// prepare the embed message
	const fields = [];
	let hasPendingJobs = false;
	let hasFailedJobs = false;

	for (const job of jobs) {
		if (job.id === jobId) {
			continue;
		}

		const isPending = job.status !== "completed";
		const isFailed = job.conclusion === "failure";
		hasPendingJobs = hasPendingJobs || isPending;
		hasFailedJobs = hasFailedJobs || isFailed;

		fields.push({
			name: job.name,
			inline: true,
			value: (
				isPending
					? "⌛ pending..."
					: isFailed
						? "🔴 FAILED"
						: "🟢 passing"
			),
		});
	}

	const commitUrl = `${run.repository.html_url}/commit/${run.head_sha}`;
	const pipelineUrl = `${run.repository.html_url}/actions/runs/${run.id}`;
	const detailsEmbed = {
		title: `${run.name} Summary - ${run.repository.name}`,
		description: run.head_commit.message,
		url: commitUrl,
		color: (
			hasFailedJobs
				? 0xc90048
				: hasPendingJobs
					? 0xcc8300
					: 0x00cc7a
		),
		timestamp: run.run_started_at,
		fields,
		author: {
			name: run.actor.login,
			url: run.actor.html_url,
			icon_url: run.actor.avatar_url,
		},
		footer: {
			text: run.head_sha.slice(0, 7),
		},
	};

	const viewCommitButton = {
		type: 2, // button
		style: 5, // link
		label: "Commit",
		url: commitUrl,
		emoji: { name: "📜" },
	};

	const viewPipelineButton = {
		type: 2, // button
		style: 5, // link
		label: "Pipeline",
		url: pipelineUrl,
		emoji: { name: "▶️" },
	};

	// invoke the webhook
	const callUrl = new URL(webhookUrl);
	callUrl.searchParams.set("with_components", "true");

	const client = new HttpClient();
	const response = await client.postJson(callUrl.href, {
		embeds: [ detailsEmbed ],
		components: [
			{
				type: 1, // action row,
				components: [
					viewCommitButton,
					viewPipelineButton,
				],
			},
		],
	});

	assertStatusCodeOk(response.statusCode);
}

function assertStatusCodeOk(statusCode) {
	if (statusCode < 200 || statusCode >= 300) {
		throw new Error(`Unexpected HTTP status code ${statusCode}.`);
	}
}

(async () => {
	try {
		await main();
	}
	catch (ex) {
		core.error("" + ex);
	}
})();
