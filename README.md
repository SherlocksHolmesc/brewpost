# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/dfe7e6e0-086f-42db-bbe8-d8c47267c0ed

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/dfe7e6e0-086f-42db-bbe8-d8c47267c0ed) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/dfe7e6e0-086f-42db-bbe8-d8c47267c0ed) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Troubleshooting: DynamoDB authorization error

If you see an error like:

```
User: arn:aws:iam::ACCOUNT_ID:user/uploader is not authorized to perform: dynamodb:PutItem on resource: arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Schedules
```

It means the AWS identity running your server (IAM user or role) is missing permissions to write to the DynamoDB table. To fix:

1. Add a minimal IAM policy that grants PutItem (and common read/write actions) to the Schedules table.
2. Attach the policy to the IAM user/role used by your server (for local dev this may be the IAM user whose AWS keys are in your .env; for deployed servers attach to the EC2/Task/Lambda role).

Example (policy file is included at `aws/schedules-putitem-policy.json`):

- Attach to an IAM user (example):

  ```sh
  aws iam put-user-policy --user-name uploader --policy-name AllowSchedulesPutItem --policy-document file://aws/schedules-putitem-policy.json
  ```

- Attach to a role (example):

  ```sh
  aws iam put-role-policy --role-name MyServerRole --policy-name AllowSchedulesPutItem --policy-document file://aws/schedules-putitem-policy.json
  ```

Alternatively use the AWS Console:

- Go to IAM → Users (or Roles) → choose the identity → "Add inline policy" → JSON → paste the file contents and Review/Save.

After attaching, restart your server and retry the scheduling operation.

Security note: in production prefer a least-privilege role attached to the compute environment (EC2 / ECS task role / Lambda role) instead of embedding long-lived IAM user keys in .env.

## Troubleshooting: Lambda responded "success" but nothing was written to DynamoDB

If your server falls back to the Lambda Function URL and you see a response like:

```
{ "success": true }
```

but no items appear in the Schedules table, this usually means the Lambda executed but did not persist items (or returned a different response shape than the server expects).

What to check in the Lambda:

- Logs: open CloudWatch Logs for the function (ScheduleDispatcherFn) and inspect the invocation for validation errors, missing environment variables, or unhandled exceptions.
- Environment variables: ensure the Lambda has the correct SCHEDULES_TABLE
- IAM role: Lambda's execution role must have dynamodb:PutItem on the table and sns:Publish on the topic.
- Return shape: The server expects the Lambda to return JSON like:

  ```
  { "ok": true, "scheduled": [ { "scheduleId": "...", "status": "scheduled", "scheduledDate": "..." }, ... ] }
  ```

  If the Lambda returns only { "success": true } the server treats that as suspicious and will return an error to the client (see server logs).

How to proceed:

1. Check CloudWatch logs for the specific invocation (search by timestamp).
2. Confirm the Lambda wrote to DynamoDB (CloudWatch or DynamoDB metrics) or why it skipped writes.
3. Update the Lambda to return the structured object above when scheduling succeeds.
4. Restart your calls from the frontend; the server will log and return the full Lambda response to help debugging.
