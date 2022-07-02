# Webhook Summary

A GitHub Action for simple pipeline summaries sent via Discord webhooks.

## Usage

Add a new job to your workflow with this action as its only step:

```yml
  send-summary:
    runs-on: ubuntu-latest
    if: ${{ always() }}
    needs:
      - job_one
      - job_two
      # ...
    steps:
    - uses: CalmDownVal/webhook-summary@v1
      with:
        token: ${{ github.token }}
        url: ${{ secrets.WEBHOOK_URL }}
```

Fill in the `needs` array to include all previous jobs. This ensures the summary
job always runs last.

## Naming

It is important *not* to name the job with a custom name. This ensures GitHub
Actions will assign the name to the same string as its key (in the above example
name will be set to `send-summary`).

If you rename the action to anything else, the script will fail to identify its
job and include it in the summary.

This awkward requirement is due to a missing feature in GitHub's APIs that makes
reliably identifying jobs impossible:

- https://github.community/t/job-id-is-string-in-github-job-but-integer-in-actions-api/139060
- https://github.com/github/feedback/discussions/8945

Hopefully this gets patched in the future.
