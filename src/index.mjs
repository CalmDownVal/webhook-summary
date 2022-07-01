import * as core from '@actions/core';
import * as github from '@actions/github';
import { HttpClient } from '@actions/http-client';

async function main() {
	// get inputs
	const token = core.getInput('token', { required: true });
	const url = core.getInput('url', { required: true });

	const api = github.getOctokit(token);

	// get necessary info about the current run
	const workflowResponse = await api.rest.actions.getWorkflowRun({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		run_id: github.context.runId
	});

	assertStatusCodeOk(workflowResponse.status);
	const run = workflowResponse.data;

	const jobsResponse = await api.rest.actions.listJobsForWorkflowRunAttempt({
		owner: run.repository.owner.login,
		repo: run.repository.name,
		run_id: run.id,
		attempt_number: run.run_attempt
	});

	assertStatusCodeOk(jobsResponse.status);
	const jobs = jobsResponse.data.jobs;

	// prepare the embed message
	const fields = [];
	let hasPendingJobs = false;
	let hasFailedJobs = false;

	for (const job of jobs) {
		// FUTURE: `github.context.job` is really the job's key, not its name. There's currently no way to get the key from the REST API...
		if (job.name === github.context.job) {
			continue;
		}

		const isPending = job.status !== 'completed';
		const isFailed = job.conclusion !== 'success';
		hasPendingJobs = hasPendingJobs || isPending;
		hasFailedJobs = hasFailedJobs || isFailed;

		fields.push({
			name: job.name,
			inline: true,
			value: (
				isPending
					? '⌛ pending...'
					: isFailed
						? '🔴 FAILED'
						: '🟢 passing'
			)
		});
	}

	const embed = {
		title: `${run.name} Summary - ${run.repository.name}`,
		description: run.head_commit.message,
		url: `${run.repository.html_url}/actions/runs/${run.id}`,
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
			icon_url: run.actor.avatar_url
		},
		footer: {
			text: run.head_sha.slice(0, 7)
		}
	};

	// invoke the webhook
	const client = new HttpClient();
	const response = await client.postJson(url, {
		embeds: [
			embed
		]
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
		core.error('' + ex);
	}
})();
