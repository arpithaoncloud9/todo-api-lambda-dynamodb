# Fully Serverless Task Management API using AWS Lambda, API Gateway & DynamoDB

This project is a fully serverless backend application built using API Gateway, AWS Lambda, and DynamoDB to manage To‑Do tasks. The system exposes REST APIs for creating, reading, updating, and deleting tasks, with each operation handled by a dedicated Lambda function. DynamoDB stores all task data using a scalable NoSQL design, and IAM roles enforce least‑privilege access. CloudWatch provides logging and monitoring, making the application highly scalable, cost‑efficient, and maintenance‑free.

## Step 1  — Create the DynamoDB table

### 1.1 **Go to DynamoDB**

- Open AWS Console
- Search for **DynamoDB**
- Click **Tables** on the left
- Click **Create table**
### **1.2 Configure the Table**

Fill in the fields exactly like this:
#### **Table name:**

`todos`
#### **Partition key (Primary key):**

`userId` **Type:** String
#### **Sort key:**

`taskId` **Type:** String

This key structure allows:
- Multiple users
- Multiple tasks per user
- Fast queries
- Clean sorting
### **1.3 Table Settings**

Leave everything else as default:
- **Table class:** Standard
- **Capacity mode:** On‑demand (recommended for serverless)
- **Encryption:** Default (AWS owned key)
- **Point‑in‑time recovery:** Optional (you can enable later)
- **TTL:** Leave disabled for now

Click **Create table**.
### **1.4 Verify the Table**

Once created:
- Go to **Tables → todos**
- Check the **Indexes** tab (none needed yet)
- Check the **General Information** tab to confirm PK + SK

Your DynamoDB table is now ready.
This design means:

- Each user can have multiple tasks
- Tasks are grouped by user
- Tasks are uniquely identified by `taskId`
- Querying all tasks for a user is extremely fast
#### **Why you created it**
You needed a place to store todos. DynamoDB is perfect because:

- It’s serverless
- It scales automatically
- It’s fast
- It fits key‑value and document data
#### **How it connects**

Lambda writes items into this table using the AWS SDK.

## STEP 2 — Create Your First Lambda Function
### (`createTodo`)

This function will:
- Accept a request from API Gateway
- Generate a unique task ID
- Save the task into DynamoDB
- Return the created task as JSON

It’s the foundation for the entire CRUD system.
### 2.1 Create the Lambda Function

Go to:
**AWS Console → Lambda → Create function**

Choose:
- **Author from scratch**
- Name: `createTodo`
- Runtime: **Node.js 24.x**
- Execution role: **Create a new role with basic Lambda permissions**

Click **Create function**.
### 2.2 Add the Lambda Code

Replace the default code with this:
```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import crypto from "crypto";

  

const client = new DynamoDBClient({});

const ddb = DynamoDBDocumentClient.from(client);

  

export const handler = async (event) => {

try {

// In your API Gateway setup, event.body is already an object

const body = JSON.parse(event.body);

  

if (!body) {

console.log("Body is missing");

return {

statusCode: 400,

body: JSON.stringify({ message: "Request body is missing" })

};

}

  

const userID = body.userID;

const title = body.title;

const description = body.description;

  

console.log("Parsed fields:", { userID, title, description });

  

if (!userID || !title) {

return {

statusCode: 400,

body: JSON.stringify({ message: "Missing required fields" })

};

}

  

const taskID = crypto.randomUUID();

  

const item = {

userID,

taskID,

title,

description,

status: "pending",

createdAt: new Date().toISOString(),

updatedAt: new Date().toISOString()

};

  

console.log("Item to insert:", JSON.stringify(item, null, 2));

  

await ddb.send(

new PutCommand({

TableName: "todos",

Item: item

})

);

  

console.log("Successfully inserted item");

  

return {

statusCode: 200,

body: JSON.stringify(item)

};

} catch (error) {

console.error("POST Lambda error:", error);

return {

statusCode: 500,

body: JSON.stringify({ message: "Internal server error" + error })

};

}

};
```
Click **Deploy**.
### 2.3 Give Lambda Permission to Write to DynamoDB

Your Lambda needs permission to call `PutItem`.

Do this:
1. In the Lambda page → **Configuration → Permissions**
2. Click the **Execution role**
3. In IAM → **Add permissions → Create inline policy**
4. Choose:
    - Service: **DynamoDB**
    - Action: `PutItem`
    - Resource: your `todos` table ARN
5. Save as: `AllowPutItemTodos`

Now your Lambda can write to DynamoDB.

#### **Why you created it**

You needed backend logic to:
- Accept input
- Validate it
- Generate a unique ID
- Insert into DynamoDB
- Return a response

Lambda is perfect because:
- No servers
- You only pay when it runs
- It integrates natively with API Gateway and DynamoDB
#### **How it connects**

- API Gateway triggers Lambda
- Lambda uses IAM permissions to write to DynamoDB
## STEP 3 — Create API Gateway and Connect POST /todo to `createTodo`

- POST creates a new resource
### 3.1 Create a REST API

1. Go to **API Gateway** in AWS Console
2. Click **Create API**
3. Choose **REST API** 
4. Click **Build**

Fill in:
- **API name:** `todo-api`
- Endpoint type: **Regional**

Click **Create API**

### 3.2 Create the `/todo` Resource

1. In the left panel, click **Create Resource**
2. Enter:
    - **Resource Path:** /
    - **Resource Name:** `todo`
3. Click **Create Resource**
You now have:
Code
```
/todo
```
### 3. 3 Create the POST Method

1. Select the `/todo` resource
2. Click **Actions → Create Method**
3. Choose **POST**

Now configure it:
- Integration type: **Lambda Function**
- Region: your Lambda region
- Lambda Function: `createTodo`
Click **Create Method**

Your API Gateway is now connected to your Lambda.

### 3.4 Enable CORS (Optional but recommended)

1. Select `/todo`
2. Click  **Enable CORS**
3. Accept defaults
4. Click **Save**

This helps if you later build a frontend.
### 3.5 Deploy the API

1. Click **Actions → Deploy API**
2. Choose:
    - **Deployment stage:** `prod` (or create a new one)
3. Click **Deploy**

You will now see an **Invoke URL**, something like:

Code
```
https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

Your POST endpoint is:

Code
```
POST https://abc123.execute-api.us-east-1.amazonaws.com/prod/todo
```
###  3.6 Test the Endpoint

Use Postman or API Gateway’s built‑in test tool.

**POST Body:**

json
```
{
  "userId": "maria123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

If everything is correct, you’ll get a response like:

json
```
{
  "userId": "maria123",
  "taskId": "some-uuid",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "pending",
  "createdAt": "...",
  "updatedAt": "..."
}
```
<img width="1211" height="673" alt="Screenshot 2026-02-11 at 2 57 33 PM" src="https://github.com/user-attachments/assets/660de869-67a0-426a-a45f-80efae2ca4aa" />


And you’ll see the item appear in DynamoDB.

<img width="1208" height="665" alt="Screenshot 2026-02-11 at 2 43 08 PM" src="https://github.com/user-attachments/assets/5f65e3c2-a8eb-431a-9663-aa69e1cf6a1e" />



#### **Why you created it**

You needed a public HTTP endpoint so:
- Postman can call your API
- A frontend can call your API
- Mobile apps can call your API

API Gateway is the front door.
#### **How it connects**

- API Gateway receives the HTTP request
- It forwards the request body to Lambda
- Lambda returns a response
- API Gateway sends that response back to the client
## **STEP 4 — Build GET /todos (List all tasks for a user)**

This endpoint will let you retrieve **all tasks for a specific user**, using DynamoDB’s `Query` operation.
This is the first time you’ll use DynamoDB’s real power: **fast, partition‑key–based queries.**

Now you need:

- GET /todos → Retrieve all tasks for a user
### **4.1 — Create the Lambda Function (**`getTodos`**)**

Go to:

**AWS Console → Lambda → Create function**

Choose:

- Author from scratch
- Name: `getTodos`
- Runtime: Node.js 24.x
- Execution role: **Create new role with basic Lambda permissions**

Click **Create function**.

### **4.2 — Add the Lambda Code**

Replace the default code with this:

```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Accept both userId and userID
    const userId =
      event.queryStringParameters?.userId ||
      event.queryStringParameters?.userID;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing userId in query parameters"
        })
      };
    }

    const params = {
      TableName: "todos",
      KeyConditionExpression: "userID = :uid",
      ExpressionAttributeValues: {
        ":uid": userId
      }
    };

    const result = await ddb.send(new QueryCommand(params));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.Items)
    };

  } catch (error) {
    console.error("GET Lambda error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};

```

Click **Deploy**.

### **4.3 — Add IAM Permissions**

Your Lambda needs permission to query DynamoDB.

Go to:

**Lambda → getTodos → Configuration → Permissions → Execution role**

Then:

**Add permissions → Create inline policy**

Choose:
- Service: DynamoDB
- Action: `Query`
- Resource: your `todos` table ARN

Save as:

Code
```
AllowQueryTodos
```
### **4.4 — Create GET /todos in API Gateway**

Go to:

**API Gateway → todo-api**

1. Select the root resource `/`
2. Click **Create Resource**
3. Name: `todos`
4. Path: `/todos`

Now create the GET method:

1. Select `/todos`
2. Click **Create Method**
3. Choose **GET**
4. Integration type: **Lambda Function**
5. Lambda: `getTodos`

Click **Save**.

### 4.5 — Confirm the mapping template

1. Go to **API Gateway**
2. Select your API: **todo-api**
3. In the left panel, click:
  ```
    /todos → GET
  ```
4. Click **Integration Request**
5. Scroll to **Mapping Templates**
6. You should see:

**Content-Type:** `application/json` 
**Template body:**
```json
{
  "queryStringParameters": {
   "userId": "$input.params('userId')"
  }
}
```
### **4.6 — Deploy the API**

Click:

**Actions → Deploy API**

Choose stage: `prod`

Your new endpoint is:

Code
```
GET https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/todos?userId=maria123
```
### **4.7 — Test the Endpoint**

Use Postman or browser:

Code

```
GET /todos?userId=maria123
```

Expected response:

json

```
  {
    "userId": "maria123",
    "taskId": "uuid-1",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "pending",
    "createdAt": "...",
    "updatedAt": "..."
  }
```
<img width="1265" height="676" alt="Screenshot 2026-02-11 at 11 05 36 PM" src="https://github.com/user-attachments/assets/91867e45-2147-4a13-a5c7-458ce7925d08" />


Go to:

**DynamoDB → Tables → todos → Explore table items**

<img width="1106" height="424" alt="Screenshot 2026-02-11 at 11 33 07 PM" src="https://github.com/user-attachments/assets/1d3a1a0b-7ced-4184-a773-1602a3938c73" />


## STEP 5 — Build PUT /todos/{taskID} (Update an existing task)

- PUT updates an existing resource

### 5.1 — Create the PUT Lambda function

Go to **AWS Console → Lambda → Create function**

- Name: `updateTodo`
- Runtime: Node.js 24.x (or whatever you used for GET/POST)
- Create function

Then replace this:
```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

  

const client = new DynamoDBClient({});

const ddb = DynamoDBDocumentClient.from(client);

  

export const handler = async (event) => {

try {

console.log("Received event:", JSON.stringify(event, null, 2));

  

const taskID = event.pathParameters?.taskID;

const userId =

event.queryStringParameters?.userId ||

event.queryStringParameters?.userID;

  

if (!taskID || !userId) {

return {

statusCode: 400,

body: JSON.stringify({

message: "Missing taskID or userId"

})

};

}

  

const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

  

const updateExpressions = [];

const expressionValues = {};

const expressionNames = {};

  

for (const key of ["title", "description", "status"]) {

if (body[key] !== undefined) {

updateExpressions.push(`#${key} = :${key}`);

expressionValues[`:${key}`] = body[key];

expressionNames[`#${key}`] = key;

}

}

  

if (updateExpressions.length === 0) {

return {

statusCode: 400,

body: JSON.stringify({

message: "No valid fields to update"

})

};

}

  

const params = {

TableName: "todos",

Key: {

userID: userId,

taskID: taskID

},

UpdateExpression: `SET ${updateExpressions.join(", ")}`,

ExpressionAttributeValues: expressionValues,

ExpressionAttributeNames: expressionNames,

ReturnValues: "ALL_NEW"

};

  

const result = await ddb.send(new UpdateCommand(params));

  

return {

statusCode: 200,

headers: { "Content-Type": "application/json" },

body: JSON.stringify(result.Attributes)

};

  

} catch (error) {

console.error("PUT Lambda error:", error);

return {

statusCode: 500,

body: JSON.stringify({ message: "Internal server error" })

};

}

};
```
- Deploy
### 5.2 — Create the PUT endpoint in API Gateway

Go to **API Gateway → your API → Resources**.

#### 1. Create the path

1. Click `/todos`
2. Click **Create Resource**
3. Resource name: `{taskID}`
4. Resource path: `{taskID}`
5. Create Resource

You now have:
```
/todos/{taskID}
```
#### 2. Add the PUT method

1. Click `/todos/{taskID}`
2. Click **Actions → Create Method**
3. Choose **PUT**
4. Integration type: **Lambda**
5. Select your Lambda: `updateTodo`
6. Save

### 5.3 — Add the mapping template

Go to:

**PUT → Integration Request → Mapping Templates → Add mapping template**

Content-Type: `application/json`

Paste this in Template body:
```json
{
  "pathParameters": {
    "taskID": "$input.params('taskID')"
  },
  "queryStringParameters": {
    "userId": "$input.params('userId')"
  },
  "body": $input.body
}

```
### 5.4 — Deploy the API

Top right:

**Actions → Deploy API → update**

This step is mandatory.

### 5.5 — Go to IAM → Roles

1. Look for **updateTodo-role-ldfa32lc**
2. Click **Add permissions → Attach policies** 
   - AmazonDynamoDBFullAccess
1. Save

### 5.6 — Test in Postman

Use this format:
```
https://<api-id>.execute-api.<region>.amazonaws.com/<stage-name>/<resource-path>{taskID}?userId=maria123

```
Example:
```
PUT https://q4rx6jqxbh.execute-api.us-east-1.amazonaws.com/update/todos/8cf141bd-75c9-47f9-89eb-671f4292b881?userId=maria123

```
In Postman select
Body → raw → JSON:
```json
{
  "status": "completed"
}
```
You should get back the updated item.

<img width="1470" height="956" alt="Screenshot 2026-02-12 at 12 37 13 PM" src="https://github.com/user-attachments/assets/25a6c73e-e6f0-4e27-aa06-377263a8df7c" />



Your DynamoDB item shows:

- status: completed

<img width="1888" height="852" alt="image" src="https://github.com/user-attachments/assets/aad56698-35b9-4dc1-9e3f-8152effb6bcf" />


## STEP 6 — Build DELETE /todos/{userID}/{taskID} (Remove a task)

### **6.1 Confirm your DynamoDB Keys**

Before building the DELETE API, confirm the table structure:

- **Table name:** `todos`
- **Partition key:** `userID` (String)
- **Sort key:** `taskID` (String)

Since this table uses a **composite primary key**, the DELETE operation must include **both** keys.
<img width="936" height="179" alt="DynamoDB_table" src="https://github.com/user-attachments/assets/e6e10539-faa7-409b-94dc-4ac8c278797a" />

### **6.2 Create the Lambda Function for DELETE**

Navigate to **AWS Lambda → Create function**:

- **Function name:** `deleteTodoFunction`
- **Runtime:** Node.js 24.x
- **Execution role:** Use the same role as your other CRUD Lambdas, or create a new one with DynamoDB delete permissions.

After the function is created:

- Go to **Configuration → Environment variables**
- Add:
    - **Key:** `TABLE_NAME`
    - **Value:** `todos`
- Save
### **6.3 Add IAM Permission for DeleteItem**

In the Lambda execution role, ensure the policy includes:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:DeleteItem"
  ],
  "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/todos"
}
```
If your existing CRUD policy already includes `DeleteItem`, you can skip this step.

### **6.4 Add the Lambda Code (Node.js 24.x, AWS SDK v3)**

This version is updated for your **userID + taskID** key structure:

```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  const tableName = process.env.TABLE_NAME;

  try {
    const userID = event.pathParameters?.userID;
    const taskID = event.pathParameters?.taskID;

    if (!userID || !taskID) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing 'userID' or 'taskID' in path parameters"
        }),
      };
    }

    const params = {
      TableName: tableName,
      Key: {
        userID: { S: userID },
        taskID: { S: taskID }
      },
      ReturnValues: "ALL_OLD"
    };

    const result = await client.send(new DeleteItemCommand(params));

    if (!result.Attributes) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `Todo with userID '${userID}' and taskID '${taskID}' not found`
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Todo '${taskID}' deleted successfully for user '${userID}'`
      }),
    };

  } catch (error) {
    console.error("Error deleting todo:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error while deleting todo",
        error: error.message,
      }),
    };
  }
};
```
### **6.5 Wire the DELETE Method in API Gateway**

In **API Gateway → your REST API**:

1. Select the `/todos` **resource**.
2. Click **Actions → Create Resource**:
    - **Resource name:** `{userID}`
    - **Resource path:** '/todos/{userID}/'
3.  Create `{taskID}` under `{userID}`
     - Click on **/{userID}**
     - Actions → **Create Resource**
     Enter:
    - **Resource name:** `{taskID}`
    - **Resource path:** `{taskID}`
4. Click **Create Resource**
    - You will see 
    - /todos/{userID}/{taskID}
5. Select the new `/{userID}/{taskID}` resource.
6. Click **Actions → Create Method** → choose **DELETE**.
7. Configure the method:
    - **Integration type:** Lambda Function
    - **Use Lambda Proxy integration:** enabled
    - **Lambda function:** `deleteTodoFunction`
8. Save 

### **6.6: Enable CORS (if needed)**

For the `/{userID}/{taskID}` resource:

- Select the **DELETE** method
- Click **Actions → Enable CORS**
- Confirm and apply the changes

(If CORS was already enabled at the parent resource, this may not be required.)

### **6.7: Deploy the API**

- Click **Actions → Deploy API**
- Choose your stage (e.g., `prod`)

Your base invoke URL will look like:
```
https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

Your DELETE endpoint will be:
-  Replace userID and taskID from the table
```
DELETE https://abc123.execute-api.us-east-1.amazonaws.com/prod/todos/{userID}/{taskID}
```
### **6.8: Test in Postman**

1. Open **Postman**.
2. Set the method to **DELETE**.
3. Use a URL like:
```
https://abc123.execute-api.us-east-1.amazonaws.com/prod/todos/maria123/task-001
```
4. Click **Send**.

If the item exists, you should see:
```json
{
  "message": "Todo 'task-001' deleted successfully for user 'maria123'"
}
```

If the item does not exist:
```json
{
  "message": "Todo with userID 'maria123' and taskID 'task-001' not found"
}
```
<img width="1076" height="405" alt="DELETE" src="https://github.com/user-attachments/assets/91ba07d0-eaac-4bad-9af8-92476b5e7315" />

After a successful delete, check DynamoDB — the item should be removed.


