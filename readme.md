# Webhook Summary

A GitHub Action for simple pipeline summaries sent via webhooks.

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
    - uses: CalmDownVal/webhook-summary@master
      with:
        token: ${{ github.token }}
        url: ${{ secrets.WEBHOOK_URL }}
```

Fill in its `needs` array to include all the previous step. This way the summary
job will always run last.

## Naming

It is important not to name the job with a custom name. GitHub Actions will then
automatically assign the key as its name (i.e. name will be `send-summary`).

If you rename the action to anything else, the script will fail to identify the
job and it will be included in the summary.

This awkward requirement is due to a missing feature in GitHub's APIs that makes
reliably identifying jobs by their key almost impossible:

- https://github.community/t/job-id-is-string-in-github-job-but-integer-in-actions-api/139060
- https://github.com/github/feedback/discussions/8945

Hopefully this gets patched in the future.
