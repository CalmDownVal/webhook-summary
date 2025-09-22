# Webhook Summary

A GitHub Action for simple pipeline summaries sent via Discord webhooks.

## Usage

Add a new job to your workflow with this action as its only step:

```yml
  summary:
    runs-on: ubuntu-latest
    if: ${{ always() }}
    needs:
      - job_one
      - job_two
      # ...
    steps:
    - uses: CalmDownVal/webhook-summary@v2
      with:
        token: ${{ github.token }}
        url: ${{ secrets.WEBHOOK_URL }}
        job_id: ${{ job.check_run_id }}
```

Fill in the `needs` array to include all previous jobs. This ensures the summary
job always runs last.

The `token` and `url` parameters are mandatory for this action to work. The
`job_id` parameter is optional and allows the action to identify its own job to
*exclude* it from the summary.
