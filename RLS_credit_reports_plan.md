# Plan to Address RLS Violation on `credit_reports` Table

## Problem Analysis

An RLS policy violation error ("new row violates row-level security policy for table 'credit_reports'") is encountered when attempting to insert a new row into the `credit_reports` table.

Investigation revealed the following:
- Row-Level Security (RLS) is enabled on the `credit_reports` table.
- There are no explicit RLS policies currently defined for the `credit_reports` table.

When RLS is enabled on a table without any defined policies, PostgreSQL (and thus Supabase) enforces a default-deny rule. This means any operation (INSERT, SELECT, UPDATE, DELETE) attempted by a non-superuser role will be denied. This is the reason for the observed RLS violation during the insert operation.

## Proposed Solution

To resolve this issue and allow authorized users to insert their credit reports, we need to create an RLS policy that specifically permits the `INSERT` operation for authenticated users, while ensuring they can only insert rows associated with their own user ID.

## Detailed Plan

1.  **Create an `INSERT` policy:** Define a new RLS policy for the `credit_reports` table that allows `INSERT` operations for authenticated users.
2.  **Define the `WITH CHECK` expression:** Include a `WITH CHECK` expression in the policy to verify that the `user_id` column of the new row being inserted matches the ID of the currently authenticated user.

## Implementation Steps (for Code Mode)

Execute the following SQL command in your Supabase SQL editor or via a database migration to create the necessary RLS policy:

```sql
CREATE POLICY "Allow authenticated users to insert their own credit reports"
ON credit_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

**Explanation of the SQL:**

*   `CREATE POLICY "Allow authenticated users to insert their own credit reports"`: Creates a new policy with a descriptive name.
*   `ON credit_reports FOR INSERT`: Specifies that this policy applies to the `credit_reports` table and the `INSERT` command.
*   `TO authenticated`: Grants this permission to users with the `authenticated` role (the default role for logged-in users in Supabase).
*   `WITH CHECK (auth.uid() = user_id)`: This condition is evaluated for each row being inserted. `auth.uid()` retrieves the UUID of the currently authenticated user. `user_id` refers to the value in the `user_id` column of the row being inserted. The policy only allows the insert if the authenticated user's ID matches the `user_id` in the row.

## Visual Representation of the Plan

```mermaid
graph TD
    A[RLS Enabled on credit_reports] --> B{Are there INSERT policies?};
    B -- No --> C[Default Deny Rule Applied];
    C --> D[Insert Operation Blocked];
    B -- Yes --> E{Does a policy allow INSERT?};
    E -- Yes --> F{Does the WITH CHECK condition pass?};
    F -- Yes --> G[Insert Allowed];
    F -- No --> D;
    E -- No --> D;
    G --> H[New Row Inserted];

    Subgraph Proposed Solution
        I[Create INSERT Policy] --> J[Policy allows INSERT TO authenticated];
        J --> K[Policy includes WITH CHECK (auth.uid() = user_id)];
        K --> G;
    End
```

This plan provides the necessary steps and the specific SQL command to resolve the RLS violation and allow authenticated users to insert their own credit reports securely.